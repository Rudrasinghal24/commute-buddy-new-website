import { RouteStep } from './types';

export interface NavigationUpdate {
  stepIndex: number;
  metersToNextTurn: number;
  offRouteMeters: number;
  arrived: boolean;
  snappedIndex: number;
  snappedPoint: [number, number];
  consecutiveOffRouteCount: number;
  shouldReroute: boolean;
}

const EARTH_RADIUS_M = 6371000.0;
const FORWARD_WINDOW_VERTICES = 80;
const SNAP_MAX_DISTANCE_M = 50.0;
const ARRIVAL_THRESHOLD_M = 25.0;
const OFF_ROUTE_CONSECUTIVE_LIMIT = 3;
const REROUTE_COOLDOWN_MS = 15000;

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

interface SegmentProjection {
  segmentIndex: number;
  t: number;
  projectedLat: number;
  projectedLng: number;
  distanceMeters: number;
}

function projectOntoSegmentEquirectangular(
  lat: number,
  lng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  segmentIndex: number
): SegmentProjection {
  const midLatRad = (((lat1 + lat2) * 0.5) * Math.PI) / 180.0;
  const cosLat = Math.cos(midLatRad);
  const metersPerDegLat = (Math.PI / 180.0) * EARTH_RADIUS_M;
  const metersPerDegLng = metersPerDegLat * cosLat;

  const dx = (lng2 - lng1) * metersPerDegLng;
  const dy = (lat2 - lat1) * metersPerDegLat;
  const lenSq = dx * dx + dy * dy;

  const px = (lng - lng1) * metersPerDegLng;
  const py = (lat - lat1) * metersPerDegLat;

  let t = 0;
  if (lenSq > 1e-6) {
    t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  }

  const projLat = lat1 + (lat2 - lat1) * t;
  const projLng = lng1 + (lng2 - lng1) * t;
  const distMeters = haversineMeters(lat, lng, projLat, projLng);

  return {
    segmentIndex,
    t,
    projectedLat: projLat,
    projectedLng: projLng,
    distanceMeters: distMeters,
  };
}

export class NavigationEngine {
  private readonly path: Array<[number, number]>;
  private readonly steps: RouteStep[];
  private readonly cumulativeMeters: number[];
  private lastSnappedIndex: number = 0;
  private lastSnappedT: number = 0;
  private consecutiveOffRouteCount: number = 0;
  private lastRerouteAtMs: number = 0;

  constructor(path: Array<[number, number]>, steps: RouteStep[]) {
    this.path = path.length > 0 ? path : [[0, 0]];
    this.steps = steps;
    this.cumulativeMeters = new Array(this.path.length).fill(0);
    for (let i = 1; i < this.path.length; i++) {
      const [lat1, lng1] = this.path[i - 1];
      const [lat2, lng2] = this.path[i];
      this.cumulativeMeters[i] =
        this.cumulativeMeters[i - 1] + haversineMeters(lat1, lng1, lat2, lng2);
    }
  }

  public update(lat: number, lng: number, nowMs: number = Date.now()): NavigationUpdate {
    if (this.path.length === 1) {
      const [onlyLat, onlyLng] = this.path[0];
      const dist = haversineMeters(lat, lng, onlyLat, onlyLng);
      return {
        stepIndex: 0,
        metersToNextTurn: 0,
        offRouteMeters: dist,
        arrived: dist <= ARRIVAL_THRESHOLD_M,
        snappedIndex: 0,
        snappedPoint: [onlyLat, onlyLng],
        consecutiveOffRouteCount: dist > SNAP_MAX_DISTANCE_M ? 1 : 0,
        shouldReroute: false,
      };
    }

    const maxSegmentIdx = this.path.length - 2;
    const searchStart = Math.max(0, Math.min(maxSegmentIdx, this.lastSnappedIndex));
    const searchEnd = Math.min(maxSegmentIdx, searchStart + FORWARD_WINDOW_VERTICES);

    let bestProj: SegmentProjection | null = null;
    for (let i = searchStart; i <= searchEnd; i++) {
      const [lat1, lng1] = this.path[i];
      const [lat2, lng2] = this.path[i + 1];
      const proj = projectOntoSegmentEquirectangular(
        lat,
        lng,
        lat1,
        lng1,
        lat2,
        lng2,
        i
      );
      if (!bestProj || proj.distanceMeters < bestProj.distanceMeters) {
        bestProj = proj;
      }
    }

    const chosen = bestProj!;
    const offRouteMeters = chosen.distanceMeters;
    const isOffRoute = offRouteMeters > SNAP_MAX_DISTANCE_M;

    if (!isOffRoute) {
      // Never move backwards along the route
      if (chosen.segmentIndex > this.lastSnappedIndex) {
        this.lastSnappedIndex = chosen.segmentIndex;
        this.lastSnappedT = chosen.t;
      } else if (
        chosen.segmentIndex === this.lastSnappedIndex &&
        chosen.t > this.lastSnappedT
      ) {
        this.lastSnappedT = chosen.t;
      }
      this.consecutiveOffRouteCount = 0;
    } else {
      this.consecutiveOffRouteCount += 1;
    }

    let shouldReroute = false;
    if (
      this.consecutiveOffRouteCount >= OFF_ROUTE_CONSECUTIVE_LIMIT &&
      nowMs - this.lastRerouteAtMs >= REROUTE_COOLDOWN_MS
    ) {
      shouldReroute = true;
      this.lastRerouteAtMs = nowMs;
      this.consecutiveOffRouteCount = 0;
    }

    // Current position along cumulative path
    const segStartDist = this.cumulativeMeters[this.lastSnappedIndex] ?? 0;
    const segEndDist =
      this.cumulativeMeters[Math.min(this.path.length - 1, this.lastSnappedIndex + 1)] ??
      segStartDist;
    const currentAlongMeters =
      segStartDist + (segEndDist - segStartDist) * this.lastSnappedT;

    const [sLat1, sLng1] = this.path[this.lastSnappedIndex];
    const [sLat2, sLng2] =
      this.path[Math.min(this.path.length - 1, this.lastSnappedIndex + 1)];
    const snappedPoint: [number, number] = [
      sLat1 + (sLat2 - sLat1) * this.lastSnappedT,
      sLng1 + (sLng2 - sLng1) * this.lastSnappedT,
    ];

    // Check arrival: within 25m of the final path point
    const [destLat, destLng] = this.path[this.path.length - 1];
    const distToDestMeters = haversineMeters(lat, lng, destLat, destLng);
    const arrived = distToDestMeters <= ARRIVAL_THRESHOLD_M;

    // Determine current step: last step whose startIndex <= snapped index
    let stepIndex = 0;
    for (let i = 0; i < this.steps.length; i++) {
      const stIdx = this.steps[i].startIndex ?? 0;
      if (stIdx <= this.lastSnappedIndex) {
        stepIndex = i;
      }
    }

    // Distance along path to next step's startIndex (or end of route)
    let nextTargetVertexIdx = this.path.length - 1;
    for (let i = stepIndex + 1; i < this.steps.length; i++) {
      const candidateIdx = this.steps[i].startIndex;
      if (typeof candidateIdx === 'number' && candidateIdx > this.lastSnappedIndex) {
        nextTargetVertexIdx = Math.min(this.path.length - 1, candidateIdx);
        break;
      }
    }

    const targetAlongMeters =
      this.cumulativeMeters[nextTargetVertexIdx] ??
      this.cumulativeMeters[this.path.length - 1];
    const metersToNextTurn = Math.max(0, Math.round(targetAlongMeters - currentAlongMeters));

    return {
      stepIndex,
      metersToNextTurn: arrived ? 0 : metersToNextTurn,
      offRouteMeters: Math.round(offRouteMeters),
      arrived,
      snappedIndex: this.lastSnappedIndex,
      snappedPoint,
      consecutiveOffRouteCount: this.consecutiveOffRouteCount,
      shouldReroute,
    };
  }
}

export function createNavigationEngine(
  path: Array<[number, number]>,
  steps: RouteStep[]
): NavigationEngine {
  return new NavigationEngine(path, steps);
}
