import { DelhiPlace, DelhiPlacesData } from '../data/places';
import {
  CityModeAvailability,
  ManeuverType,
  ModeAvailabilityStatus,
  RouteStep,
  StepsSource,
  TravelMode,
} from './types';

export interface LivePricingAndAvailability {
  distanceKm: number;
  roadDistanceKm: number;
  osrmRoadDurationMins: number | null;
  osrmGeometry: Array<[number, number]>;
  roadSteps?: RouteStep[];
  stepsSource?: StepsSource;
  metroAvailable: boolean;
  metroSystemName: string;
  busAvailable: boolean;
  busOperatorName: string;
  trainAvailable: boolean;
  trainCorridorNote: string;
  flightAvailable: boolean;
  flightNote: string;
  autoBaseFareInr: number;
  autoPerKmInr: number;
  cabBaseFareInr: number;
  cabPerKmInr: number;
  bikeBaseFareInr: number;
  bikePerKmInr: number;
  localBusMinFareInr: number;
  localBusMaxFareInr: number;
  availabilities: CityModeAvailability[];
}

export const TransitAvailabilityApi = {
  resolveMetroNetworkRegion(place: DelhiPlace): string | null {
    const text = `${place.name} ${place.area}`.toLowerCase();
    const lat = place.lat;
    const lng = place.lng;

    if (
      text.includes('mathura') ||
      text.includes('vrindavan') ||
      text.includes('govardhan') ||
      text.includes('barsana') ||
      text.includes('chaumuhan') ||
      text.includes('haridwar') ||
      text.includes('rishikesh') ||
      text.includes('dehradun') ||
      text.includes('varanasi') ||
      text.includes('prayagraj') ||
      text.includes('allahabad') ||
      text.includes('amritsar') ||
      text.includes('chandigarh') ||
      text.includes('patna')
    ) {
      return null;
    }

    if (
      lat >= 28.38 &&
      lat <= 28.88 &&
      lng >= 76.88 &&
      lng <= 77.62
    ) {
      return 'DELHI_NCR';
    }
    if (
      text.includes('delhi') ||
      text.includes('noida') ||
      text.includes('gurugram') ||
      text.includes('gurgaon') ||
      text.includes('ghaziabad') ||
      text.includes('faridabad') ||
      text.includes('siddharth vihar') ||
      text.includes('indirapuram')
    ) {
      return 'DELHI_NCR';
    }

    if (
      text.includes('mumbai') ||
      text.includes('andheri') ||
      text.includes('bandra') ||
      text.includes('csmt') ||
      (lat >= 18.88 && lat <= 19.3 && lng >= 72.75 && lng <= 73.05)
    )
      return 'MUMBAI';
    if (
      text.includes('bengaluru') ||
      text.includes('bangalore') ||
      text.includes('whitefield') ||
      text.includes('majestic') ||
      (lat >= 12.82 && lat <= 13.15 && lng >= 77.45 && lng <= 77.78)
    )
      return 'BENGALURU';
    if (
      text.includes('hyderabad') ||
      text.includes('secunderabad') ||
      text.includes('hitec') ||
      (lat >= 17.3 && lat <= 17.55 && lng >= 78.3 && lng <= 78.6)
    )
      return 'HYDERABAD';
    if (
      text.includes('chennai') ||
      (lat >= 12.9 && lat <= 13.2 && lng >= 80.15 && lng <= 80.35)
    )
      return 'CHENNAI';
    if (
      text.includes('kolkata') ||
      text.includes('howrah') ||
      (lat >= 22.45 && lat <= 22.68 && lng >= 88.25 && lng <= 88.48)
    )
      return 'KOLKATA';
    if (
      text.includes('jaipur') ||
      (lat >= 26.82 && lat <= 27.0 && lng >= 75.7 && lng <= 75.9)
    )
      return 'JAIPUR';
    if (
      text.includes('lucknow') ||
      (lat >= 26.75 && lat <= 26.95 && lng >= 80.85 && lng <= 81.05)
    )
      return 'LUCKNOW';
    if (
      text.includes('kanpur') ||
      (lat >= 26.4 && lat <= 26.55 && lng >= 80.25 && lng <= 80.45)
    )
      return 'KANPUR';
    if (
      text.includes('agra') ||
      (lat >= 27.12 && lat <= 27.25 && lng >= 77.92 && lng <= 78.08)
    )
      return 'AGRA';
    if (
      text.includes('pune') ||
      (lat >= 18.45 && lat <= 18.65 && lng >= 73.72 && lng <= 73.98)
    )
      return 'PUNE';
    if (
      text.includes('ahmedabad') ||
      (lat >= 22.95 && lat <= 23.15 && lng >= 72.5 && lng <= 72.7)
    )
      return 'AHMEDABAD';
    if (
      text.includes('kochi') ||
      text.includes('ernakulam') ||
      (lat >= 9.9 && lat <= 10.1 && lng >= 76.22 && lng <= 76.38)
    )
      return 'KOCHI';
    if (
      text.includes('bhopal') ||
      (lat >= 23.18 && lat <= 23.32 && lng >= 77.35 && lng <= 77.5)
    )
      return 'BHOPAL';
    if (
      text.includes('indore') ||
      (lat >= 22.65 && lat <= 22.8 && lng >= 75.8 && lng <= 75.95)
    )
      return 'INDORE';

    return null;
  },

  resolveLocalBusOperator(start: DelhiPlace, end: DelhiPlace): string {
    const combined = `${start.name} ${start.area} ${end.name} ${end.area}`.toLowerCase();
    if (
      combined.includes('mathura') ||
      combined.includes('vrindavan') ||
      combined.includes('govardhan') ||
      combined.includes('barsana')
    ) {
      return 'Mathura–Vrindavan Nagar Nigam AC e-Bus / UPSRTC';
    }
    if (
      combined.includes('ghaziabad') ||
      combined.includes('noida') ||
      combined.includes('lucknow') ||
      combined.includes('kanpur') ||
      combined.includes('varanasi') ||
      combined.includes('agra') ||
      combined.includes('prayagraj')
    ) {
      return 'UPSRTC City Bus / Shared Auto';
    }
    if (combined.includes('delhi')) {
      return 'DTC / Cluster AC Bus';
    }
    if (combined.includes('gurugram') || combined.includes('faridabad')) {
      return 'GMCBL / Haryana Roadways Bus';
    }
    if (combined.includes('mumbai')) return 'BEST Bus';
    if (combined.includes('bengaluru') || combined.includes('bangalore')) return 'BMTC Bus';
    if (combined.includes('hyderabad')) return 'TGSRTC City Bus';
    if (combined.includes('chennai')) return 'MTC Bus';
    if (combined.includes('kolkata')) return 'WBTC Bus';
    if (combined.includes('jaipur')) return 'JCTSL / RSRTC Bus';
    if (combined.includes('pune')) return 'PMPML Bus';
    if (combined.includes('ahmedabad')) return 'AMTS / Janmarg BRTS';
    return 'State Roadways / City Bus';
  },

  evaluateInstantModeAvailability(
    start: DelhiPlace,
    end: DelhiPlace
  ): LivePricingAndAvailability {
    const straightKm = Math.max(
      0.8,
      DelhiPlacesData.haversineMeters(start.lat, start.lng, end.lat, end.lng) / 1000.0
    );
    const roadFactor = straightKm > 80 ? 1.24 : 1.32;
    const roadKm = straightKm * roadFactor;

    const startMetroRegion = this.resolveMetroNetworkRegion(start);
    const endMetroRegion = this.resolveMetroNetworkRegion(end);

    const metroAvailable =
      startMetroRegion !== null &&
      startMetroRegion === endMetroRegion &&
      straightKm <= 65.0;

    const metroSystemName: Record<string, string> = {
      DELHI_NCR: 'DMRC / Noida Metro',
      MUMBAI: 'Mumbai Metro',
      BENGALURU: 'Namma Metro (BMRCL)',
      HYDERABAD: 'Hyderabad Metro (L&T)',
      CHENNAI: 'Chennai Metro (CMRL)',
      KOLKATA: 'Kolkata Metro',
      JAIPUR: 'Jaipur Metro (JMRC)',
      LUCKNOW: 'Lucknow Metro (UPMRC)',
      KANPUR: 'Kanpur Metro (UPMRC)',
      AGRA: 'Agra Metro (UPMRC)',
      PUNE: 'Pune Metro (MahaMetro)',
      AHMEDABAD: 'Gujarat Metro (GMRC)',
      KOCHI: 'Kochi Metro (KMRL)',
      BHOPAL: 'Bhopal Metro',
      INDORE: 'Indore Metro',
    };

    const busOperator = this.resolveLocalBusOperator(start, end);
    const busAvailable = straightKm <= 900.0;

    const trainAvailable =
      straightKm >= 16.0 ||
      (startMetroRegion === 'MUMBAI' && endMetroRegion === 'MUMBAI' && straightKm >= 4.0) ||
      (startMetroRegion === 'CHENNAI' && endMetroRegion === 'CHENNAI' && straightKm >= 5.0) ||
      (startMetroRegion === 'KOLKATA' && endMetroRegion === 'KOLKATA' && straightKm >= 5.0);

    const flightAvailable = straightKm >= 220.0;

    const isSmallTierCity = startMetroRegion === null && endMetroRegion === null;
    const autoBase = isSmallTierCity ? 25 : 30;
    const autoPerKm = isSmallTierCity ? 9.5 : 11.0;
    const cabBase = isSmallTierCity ? 45 : 55;
    const cabPerKm = isSmallTierCity ? 12.0 : 14.0;
    const bikeBase = isSmallTierCity ? 15 : 20;
    const bikePerKm = isSmallTierCity ? 5.5 : 7.0;

    const availabilities: CityModeAvailability[] = [
      {
        mode: TravelMode.MIX,
        status: ModeAvailabilityStatus.AVAILABLE,
        operatorOrNote: metroAvailable
          ? 'Auto/Walk + Metro + Last-mile'
          : straightKm <= 45.0
          ? 'Shared Tempo / E-Rickshaw + Local Bus / Auto'
          : 'Auto + Express Train / Highway Bus + Last-mile',
      },
      {
        mode: TravelMode.METRO,
        status: metroAvailable
          ? ModeAvailabilityStatus.AVAILABLE
          : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote: metroAvailable
          ? metroSystemName[startMetroRegion!] ?? 'City Metro Network'
          : 'No Metro network on this route',
      },
      {
        mode: TravelMode.BUS,
        status: busAvailable
          ? ModeAvailabilityStatus.AVAILABLE
          : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote: busOperator,
      },
      {
        mode: TravelMode.TRAIN,
        status: trainAvailable
          ? ModeAvailabilityStatus.AVAILABLE
          : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote: trainAvailable
          ? straightKm < 60
            ? 'MEMU / Suburban Passenger Rail'
            : 'Indian Railways (IRCTC Express / Vande Bharat)'
          : 'Not applicable for short intra-city hops (<16 km)',
      },
      {
        mode: TravelMode.FLIGHT,
        status: flightAvailable
          ? ModeAvailabilityStatus.AVAILABLE
          : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote: flightAvailable
          ? 'IndiGo / Air India Express'
          : 'Only available for intercity trips >220 km',
      },
      {
        mode: TravelMode.CAR,
        status: ModeAvailabilityStatus.AVAILABLE,
        operatorOrNote:
          straightKm <= 45.0
            ? 'Local Auto / Shared Tempo / Ola / Uber Cab'
            : 'Intercity Outstation Cab / Self-Drive',
      },
      {
        mode: TravelMode.BIKE,
        status:
          straightKm <= 120.0
            ? ModeAvailabilityStatus.AVAILABLE
            : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote:
          straightKm <= 35.0
            ? 'Rapido / Ola Bike / Two-Wheeler'
            : 'Two-Wheeler Highway Ride',
      },
      {
        mode: TravelMode.WALK,
        status:
          straightKm <= 8.0
            ? ModeAvailabilityStatus.AVAILABLE
            : ModeAvailabilityStatus.NOT_AVAILABLE,
        operatorOrNote:
          straightKm <= 8.0
            ? 'Pedestrian footpath'
            : 'Distance exceeds walking range (>8 km)',
      },
    ];

    return {
      distanceKm: straightKm,
      roadDistanceKm: roadKm,
      osrmRoadDurationMins: null,
      osrmGeometry: [],
      roadSteps: [],
      stepsSource: 'template',
      metroAvailable,
      metroSystemName:
        (startMetroRegion ? metroSystemName[startMetroRegion] : null) ?? 'No Metro Network',
      busAvailable,
      busOperatorName: busOperator,
      trainAvailable,
      trainCorridorNote: trainAvailable
        ? 'Indian Railways / Suburban Rail'
        : 'No Train for short local hop',
      flightAvailable,
      flightNote: flightAvailable ? 'Domestic Flight' : 'No Flight for this distance',
      autoBaseFareInr: autoBase,
      autoPerKmInr: autoPerKm,
      cabBaseFareInr: cabBase,
      cabPerKmInr: cabPerKm,
      bikeBaseFareInr: bikeBase,
      bikePerKmInr: bikePerKm,
      localBusMinFareInr: isSmallTierCity ? 10 : 10,
      localBusMaxFareInr: isSmallTierCity ? 35 : 50,
      availabilities,
    };
  },

  mapClientOsrmManeuver(type?: string, modifier?: string): ManeuverType {
    const t = (type || '').toLowerCase();
    const m = (modifier || '').toLowerCase();
    if (t === 'depart') return 'depart';
    if (t === 'arrive') return 'arrive';
    if (t === 'roundabout' || t === 'rotary') return 'roundabout';
    switch (m) {
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      case 'slight left':
        return 'slight_left';
      case 'slight right':
        return 'slight_right';
      case 'sharp left':
        return 'sharp_left';
      case 'sharp right':
        return 'sharp_right';
      case 'uturn':
        return 'uturn';
      case 'straight':
        return 'straight';
      default:
        return 'straight';
    }
  },

  buildStepInstruction(
    maneuver: ManeuverType,
    streetName?: string,
    landmark?: string
  ): string {
    const nearPart = landmark ? ` near ${landmark}` : '';
    const onStreet = streetName ? ` onto ${streetName}` : '';
    switch (maneuver) {
      case 'depart':
        return streetName ? `Head on ${streetName}${nearPart}` : `Depart${nearPart}`;
      case 'left':
        return `Turn left${nearPart}${onStreet}`;
      case 'right':
        return `Turn right${nearPart}${onStreet}`;
      case 'slight_left':
        return `Slight left${nearPart}${onStreet}`;
      case 'slight_right':
        return `Slight right${nearPart}${onStreet}`;
      case 'sharp_left':
        return `Sharp left${nearPart}${onStreet}`;
      case 'sharp_right':
        return `Sharp right${nearPart}${onStreet}`;
      case 'keep_left':
        return `Keep left${nearPart}${onStreet}`;
      case 'keep_right':
        return `Keep right${nearPart}${onStreet}`;
      case 'uturn':
        return `Make a U-turn${nearPart}${onStreet}`;
      case 'roundabout':
        return `Take the roundabout${nearPart}${onStreet}`;
      case 'arrive':
        return 'Arrive at destination';
      case 'straight':
      default:
        return streetName ? `Continue on ${streetName}` : 'Continue straight';
    }
  },

  async enrichStepsWithLandmarks(
    steps: RouteStep[],
    pathPoints: Array<[number, number]>
  ): Promise<RouteStep[]> {
    if (steps.length === 0 || pathPoints.length === 0) return steps;

    const turnStepIndices: number[] = [];
    const pointsToQuery: Array<{ lat: number; lng: number }> = [];

    steps.forEach((step, idx) => {
      const m = step.maneuver;
      if (
        m &&
        m !== 'straight' &&
        m !== 'depart' &&
        m !== 'arrive' &&
        typeof step.startIndex === 'number'
      ) {
        const ptIdx = Math.max(0, Math.min(pathPoints.length - 1, step.startIndex));
        const [lat, lng] = pathPoints[ptIdx];
        turnStepIndices.push(idx);
        pointsToQuery.push({ lat, lng });
      }
    });

    if (pointsToQuery.length === 0) return steps;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch('/api/landmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsToQuery }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return steps;
      const data = await res.json();
      const landmarks = Array.isArray(data?.landmarks) ? data.landmarks : [];

      const updated = [...steps];
      turnStepIndices.forEach((stepIdx, i) => {
        const lm = typeof landmarks[i] === 'string' && landmarks[i].trim() ? landmarks[i].trim() : undefined;
        if (lm) {
          const cur = updated[stepIdx];
          updated[stepIdx] = {
            ...cur,
            landmark: lm,
            instruction: cur.maneuver
              ? this.buildStepInstruction(cur.maneuver, cur.streetName, lm)
              : cur.instruction,
          };
        }
      });
      return updated;
    } catch {
      clearTimeout(timer);
      return steps;
    }
  },

  async fetchLiveOsrmRoadRoute(
    start: DelhiPlace,
    end: DelhiPlace
  ): Promise<[number, number, Array<[number, number]>, RouteStep[], StepsSource] | null> {
    try {
      const backendRes = await fetch('/api/live-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (
          typeof data?.roadKm === 'number' &&
          data.roadKm > 0 &&
          typeof data?.durationMins === 'number' &&
          data.durationMins > 0 &&
          Array.isArray(data?.geometry) &&
          data.geometry.length >= 2 &&
          Array.isArray(data?.steps) &&
          data.steps.length > 0
        ) {
          const rawSteps: RouteStep[] = data.steps.map((st: Record<string, unknown>) => ({
            mode: TravelMode.CAR,
            instruction: String(st.instruction || 'Continue'),
            durationMinutes: Math.max(1, Number(st.durationMinutes || 1)),
            ...(typeof st.distanceMeters === 'number' && Number.isFinite(st.distanceMeters)
              ? { distanceMeters: Math.round(st.distanceMeters) }
              : {}),
            ...(typeof st.maneuver === 'string'
              ? { maneuver: st.maneuver as ManeuverType }
              : {}),
            ...(typeof st.streetName === 'string' && st.streetName.trim()
              ? { streetName: st.streetName.trim() }
              : {}),
            ...(typeof st.startIndex === 'number'
              ? { startIndex: st.startIndex }
              : {}),
          }));
          const enrichedSteps = await this.enrichStepsWithLandmarks(
            rawSteps,
            data.geometry
          );
          const rawSrc = String(data?.source || 'osrm').toLowerCase();
          const stepsSource: StepsSource =
            rawSrc.includes('ors') || rawSrc.includes('openrouteservice')
              ? 'ors'
              : rawSrc.includes('google')
              ? 'google'
              : 'osrm';
          return [data.roadKm, data.durationMins, data.geometry, enrichedSteps, stepsSource];
        }
      }
    } catch {
      // Fallback to public OSRM below
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const root = await res.json();
      const routes = root.routes;
      if (!Array.isArray(routes) || routes.length === 0) return null;
      const first = routes[0];
      const distMeters = Number(first.distance || 0);
      const durSeconds = Number(first.duration || 0);
      if (distMeters <= 0 || durSeconds <= 0) return null;

      const coordsArray = first.geometry?.coordinates;
      const pathPoints: Array<[number, number]> = [];
      if (Array.isArray(coordsArray)) {
        for (const pt of coordsArray) {
          if (Array.isArray(pt) && pt.length >= 2) {
            const lon = Number(pt[0]);
            const lat = Number(pt[1]);
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              pathPoints.push([lat, lon]);
            }
          }
        }
      }

      const rawLegSteps = first.legs?.[0]?.steps;
      let parsedSteps: RouteStep[] = [];
      if (Array.isArray(rawLegSteps) && pathPoints.length >= 2) {
        let searchFromIdx = 0;
        parsedSteps = rawLegSteps.map((st: Record<string, unknown>) => {
          const manObj = (st.maneuver ?? {}) as Record<string, unknown>;
          const maneuver = this.mapClientOsrmManeuver(
            typeof manObj.type === 'string' ? manObj.type : undefined,
            typeof manObj.modifier === 'string' ? manObj.modifier : undefined
          );
          const rawName = typeof st.name === 'string' ? st.name.trim() : '';
          const streetName = rawName && rawName !== '-' ? rawName : undefined;

          let startIndex = searchFromIdx;
          const loc = manObj.location;
          if (Array.isArray(loc) && loc.length >= 2) {
            const mLng = Number(loc[0]);
            const mLat = Number(loc[1]);
            if (Number.isFinite(mLat) && Number.isFinite(mLng)) {
              let bestIdx = searchFromIdx;
              let bestDistSq = Number.POSITIVE_INFINITY;
              for (let i = searchFromIdx; i < pathPoints.length; i++) {
                const dLat = pathPoints[i][0] - mLat;
                const dLng = pathPoints[i][1] - mLng;
                const dSq = dLat * dLat + dLng * dLng;
                if (dSq < bestDistSq) {
                  bestDistSq = dSq;
                  bestIdx = i;
                }
              }
              startIndex = bestIdx;
              searchFromIdx = bestIdx;
            }
          }

          const stepDurSec = Number(st.duration ?? 0);
          const stepDistM = Number(st.distance ?? 0);
          return {
            mode: TravelMode.CAR,
            instruction: this.buildStepInstruction(maneuver, streetName),
            durationMinutes: Math.max(1, Math.round(stepDurSec / 60)),
            ...(Number.isFinite(stepDistM) ? { distanceMeters: Math.round(stepDistM) } : {}),
            maneuver,
            ...(streetName ? { streetName } : {}),
            startIndex,
          };
        });
      }

      if (parsedSteps.length === 0 || pathPoints.length < 2) {
        return null;
      }

      const enrichedSteps = await this.enrichStepsWithLandmarks(
        parsedSteps,
        pathPoints
      );
      const roadKm = distMeters / 1000.0;
      const indianTrafficDurationMins = Math.max(
        4,
        Math.round((durSeconds / 60.0) * 1.28)
      );
      return [roadKm, indianTrafficDurationMins, pathPoints, enrichedSteps, 'osrm'];
    } catch {
      return null;
    }
  },

  async queryOverpassMetroNear(lat: number, lng: number): Promise<boolean | null> {
    try {
      const query = `[out:json][timeout:4];(node["station"="subway"](around:6000,${lat},${lng});node["railway"="subway_entrance"](around:6000,${lat},${lng}););out count;`;
      const encoded = encodeURIComponent(query);
      const url = `https://overpass-api.de/api/interpreter?data=${encoded}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const root = await res.json();
      const elements = root.elements;
      if (!Array.isArray(elements) || elements.length === 0) return false;
      const total = parseInt(elements[0]?.tags?.total ?? '0', 10) || 0;
      return total > 0;
    } catch {
      return null;
    }
  },

  async queryGeminiTransitVerification(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number
  ): Promise<Partial<{
    metroAvailable: boolean;
    metroSystemName: string;
    busOperatorName: string;
    trainAvailable: boolean;
    flightAvailable: boolean;
    autoBaseFareInr: number;
    autoPerKmInr: number;
    cabBaseFareInr: number;
    cabPerKmInr: number;
  }> | null> {
    try {
      const prompt = `Verify real-world public transport availability in India for a trip from "${start.name} (${start.area})" to "${end.name} (${end.area})", straight-line distance ${distanceKm.toFixed(1)} km.
Return ONLY valid JSON with these exact keys:
{
  "metroAvailable": boolean (true ONLY if BOTH origin and destination are served by the same operational urban Metro rail system AND the trip is within that metro network; false for cities without metro like Mathura, Vrindavan, Haridwar, Varanasi, Dehradun, Chandigarh, Amritsar, etc.),
  "metroSystemName": string,
  "busOperatorName": string (actual local bus/shared-tempo agency name in that city/state),
  "trainAvailable": boolean (true ONLY if Indian Railways / suburban rail connects these points and distance >= 15 km or Mumbai/Chennai/Kolkata suburban),
  "flightAvailable": boolean (true ONLY if distance >= 220 km),
  "autoBaseFareInr": number,
  "autoPerKmInr": number,
  "cabBaseFareInr": number,
  "cabPerKmInr": number
}`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: prompt,
          responseMimeType: 'application/json',
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.text) return null;
      return JSON.parse(data.text);
    } catch {
      return null;
    }
  },

  async fetchLiveTransitAndPricingFromApis(
    start: DelhiPlace,
    end: DelhiPlace
  ): Promise<LivePricingAndAvailability> {
    const baseline = this.evaluateInstantModeAvailability(start, end);

    const [osrmResult, overpassMetro, geminiVerify] = await Promise.all([
      this.fetchLiveOsrmRoadRoute(start, end),
      Promise.all([
        this.queryOverpassMetroNear(start.lat, start.lng),
        this.queryOverpassMetroNear(end.lat, end.lng),
      ]),
      this.queryGeminiTransitVerification(start, end, baseline.distanceKm),
    ]);

    const roadKm = osrmResult?.[0] ?? baseline.roadDistanceKm;
    const osrmDuration = osrmResult?.[1] ?? null;
    const osrmPath = osrmResult?.[2] ?? [];
    const roadSteps = osrmResult?.[3] ?? [];
    const stepsSource: StepsSource =
      roadSteps.length > 0 && osrmPath.length >= 2
        ? osrmResult?.[4] ?? 'osrm'
        : 'template';

    console.info(`[nav] steps source = ${stepsSource}`);

    const [startHasSubwayNode, endHasSubwayNode] = overpassMetro;
    const verifiedMetro =
      startHasSubwayNode !== null && endHasSubwayNode !== null
        ? baseline.metroAvailable && startHasSubwayNode && endHasSubwayNode
        : geminiVerify?.metroAvailable ?? baseline.metroAvailable;

    const updatedAvailabilities = baseline.availabilities.map((item) => {
      if (item.mode === TravelMode.METRO) {
        return {
          ...item,
          status: verifiedMetro
            ? ModeAvailabilityStatus.AVAILABLE
            : ModeAvailabilityStatus.NOT_AVAILABLE,
          operatorOrNote: verifiedMetro
            ? geminiVerify?.metroSystemName || baseline.metroSystemName
            : 'No Metro network in this city/route',
        };
      }
      if (item.mode === TravelMode.BUS && geminiVerify?.busOperatorName) {
        return {
          ...item,
          operatorOrNote: geminiVerify.busOperatorName,
        };
      }
      return item;
    });

    return {
      ...baseline,
      roadDistanceKm: roadKm,
      osrmRoadDurationMins: osrmDuration,
      osrmGeometry: osrmPath,
      roadSteps,
      stepsSource,
      metroAvailable: verifiedMetro,
      metroSystemName: geminiVerify?.metroSystemName || baseline.metroSystemName,
      busOperatorName: geminiVerify?.busOperatorName || baseline.busOperatorName,
      autoBaseFareInr: geminiVerify?.autoBaseFareInr ?? baseline.autoBaseFareInr,
      autoPerKmInr: geminiVerify?.autoPerKmInr ?? baseline.autoPerKmInr,
      cabBaseFareInr: geminiVerify?.cabBaseFareInr ?? baseline.cabBaseFareInr,
      cabPerKmInr: geminiVerify?.cabPerKmInr ?? baseline.cabPerKmInr,
      availabilities: updatedAvailabilities,
    };
  },
};
