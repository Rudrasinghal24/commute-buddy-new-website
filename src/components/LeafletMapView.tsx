import React, { useEffect, useRef, useState } from 'react';
import { DelhiPlace, DelhiPlacesData } from '../data/places';
import { Route } from '../lib/types';

interface LeafletMapViewProps {
  startPlace: DelhiPlace | null;
  endPlace: DelhiPlace | null;
  routes: Route[];
  selectedRoute: Route | null;
  isLiveRideActive: boolean;
  onToggleLiveRide: (active: boolean) => void;
  isNavigating?: boolean;
  navUserLocation?: { lat: number; lng: number; heading: number | null } | null;
  navSnappedIndex?: number;
  className?: string;
}

const TILE_SIZE_PX = 256;
const tileBitmapCache = new Map<string, HTMLImageElement>();
const tileLoadingSet = new Set<string>();

function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180.0) / 360.0) * (1 << zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180.0;
  return (
    ((1.0 - Math.log(Math.tan(rad) + 1.0 / Math.cos(rad)) / Math.PI) / 2.0) *
    (1 << zoom)
  );
}

function tileXToLon(tileX: number, zoom: number): number {
  return (tileX / (1 << zoom)) * 360.0 - 180.0;
}

function tileYToLat(tileY: number, zoom: number): number {
  const n = Math.PI - (2.0 * Math.PI * tileY) / (1 << zoom);
  return (180.0 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function densifyRoutePath(
  rawPoints: Array<[number, number]>,
  segmentsPerLeg: number = 14
): Array<[number, number]> {
  if (rawPoints.length < 2) return rawPoints;
  const dense: Array<[number, number]> = [];
  for (let i = 0; i < rawPoints.length - 1; i++) {
    const [lat1, lng1] = rawPoints[i];
    const [lat2, lng2] = rawPoints[i + 1];
    for (let s = 0; s < segmentsPerLeg; s++) {
      const t = s / segmentsPerLeg;
      dense.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
    }
  }
  dense.push(rawPoints[rawPoints.length - 1]);
  return dense;
}

function interpolateAlongPath(
  points: Array<[number, number]>,
  fraction: number
): [number, number, number] {
  if (points.length === 0) return [28.6139, 77.209, 0];
  if (points.length === 1) return [points[0][0], points[0][1], 0];

  const clamped = Math.max(0, Math.min(1, fraction));
  const scaled = clamped * (points.length - 1);
  const idx = Math.min(points.length - 2, Math.floor(scaled));
  const localT = scaled - idx;

  const [lat1, lng1] = points[idx];
  const [lat2, lng2] = points[idx + 1];
  const curLat = lat1 + (lat2 - lat1) * localT;
  const curLng = lng1 + (lng2 - lng1) * localT;

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const angleDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return [curLat, curLng, angleDeg];
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  startPlace,
  endPlace,
  routes,
  selectedRoute,
  isLiveRideActive,
  onToggleLiveRide,
  isNavigating = false,
  navUserLocation = null,
  navSnappedIndex = 0,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: 1280,
    h: 800,
  });
  const [viewportLat, setViewportLat] = useState(28.6139);
  const [viewportLng, setViewportLng] = useState(77.209);
  const [viewportZoom, setViewportZoom] = useState(12);
  const [hasMapboxServerKey, setHasMapboxServerKey] = useState(false);
  const [tileTick, setTileTick] = useState(0);

  const [rideProgress, setRideProgress] = useState(0.08);
  const [isRidePaused, setIsRidePaused] = useState(false);
  const [followCarCamera, setFollowCarCamera] = useState(true);

  const dragRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, lastX: 0, lastY: 0 });

  // Check if server has MAPBOX_ACCESS_TOKEN configured
  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.providers?.mapbox) {
          setHasMapboxServerKey(true);
        }
      })
      .catch(() => {});
  }, []);

  // Track full-screen website viewport size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({
          w: Math.floor(rect.width),
          h: Math.floor(rect.height),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeRoute = selectedRoute ?? routes[0] ?? null;
  const activeRoadPoints = React.useMemo(() => {
    const raw = activeRoute?.corridorPath ?? [];
    if (activeRoute?.stepsSource && activeRoute.stepsSource !== 'template') {
      return raw;
    }
    return raw.length >= 20 ? raw : densifyRoutePath(raw, 16);
  }, [activeRoute]);

  const [carLat, carLng, carBearingDeg] = interpolateAlongPath(
    activeRoadPoints,
    rideProgress
  );

  // Fit bounds when start/end places change
  useEffect(() => {
    if (isNavigating) return;
    setRideProgress(0.05);
    if (startPlace && endPlace) {
      setViewportLat((startPlace.lat + endPlace.lat) / 2.0);
      setViewportLng((startPlace.lng + endPlace.lng) / 2.0);
      const distMeters = DelhiPlacesData.haversineMeters(
        startPlace.lat,
        startPlace.lng,
        endPlace.lat,
        endPlace.lng
      );
      const targetZoom =
        distMeters > 800000
          ? 5
          : distMeters > 350000
          ? 6
          : distMeters > 150000
          ? 8
          : distMeters > 60000
          ? 9
          : distMeters > 25000
          ? 11
          : distMeters > 10000
          ? 12
          : distMeters > 4000
          ? 13
          : 14;
      setViewportZoom(targetZoom);
    } else if (startPlace) {
      setViewportLat(startPlace.lat);
      setViewportLng(startPlace.lng);
      setViewportZoom(13);
    } else if (endPlace) {
      setViewportLat(endPlace.lat);
      setViewportLng(endPlace.lng);
      setViewportZoom(13);
    }
  }, [
    isNavigating,
    startPlace?.id,
    startPlace?.lat,
    startPlace?.lng,
    endPlace?.id,
    endPlace?.lat,
    endPlace?.lng,
  ]);

  // Center map on user while turn-by-turn navigation is active
  useEffect(() => {
    if (isNavigating && navUserLocation) {
      setViewportLat(navUserLocation.lat);
      setViewportLng(navUserLocation.lng);
      setViewportZoom((z) => (z < 15 ? 16 : z));
    }
  }, [isNavigating, navUserLocation]);

  // Continuous live car movement along road
  useEffect(() => {
    if (isNavigating || activeRoadPoints.length < 2) return;
    const step = isLiveRideActive ? 0.0045 : 0.0022;
    const interval = setInterval(() => {
      if (!isRidePaused) {
        setRideProgress((prev) => {
          const next = prev + step;
          return next >= 1.0 ? 0.02 : next;
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isNavigating, activeRoadPoints.length, isLiveRideActive, isRidePaused]);

  // Follow car camera when Live Car Road View is active
  useEffect(() => {
    if (
      !isNavigating &&
      isLiveRideActive &&
      followCarCamera &&
      activeRoadPoints.length >= 2
    ) {
      setViewportLat(carLat);
      setViewportLng(carLng);
      if (viewportZoom < 14) {
        setViewportZoom(14);
      }
    }
  }, [
    isNavigating,
    rideProgress,
    isLiveRideActive,
    followCarCamera,
    activeRoadPoints.length,
    carLat,
    carLng,
    viewportZoom,
  ]);

  const discreteZoom = Math.max(4, Math.min(17, Math.round(viewportZoom)));

  const latLngToScreen = (
    lat: number,
    lng: number,
    width: number,
    height: number
  ): [number, number] => {
    const centerTx = lonToTileX(viewportLng, discreteZoom);
    const centerTy = latToTileY(viewportLat, discreteZoom);
    const ptTx = lonToTileX(lng, discreteZoom);
    const ptTy = latToTileY(lat, discreteZoom);
    const sx = width / 2 + (ptTx - centerTx) * TILE_SIZE_PX;
    const sy = height / 2 + (ptTy - centerTy) * TILE_SIZE_PX;
    return [sx, sy];
  };

  // Draw map canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, viewportSize.w);
    const height = Math.max(1, viewportSize.h);

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Land background (#f1f3f4)
    ctx.fillStyle = '#f1f3f4';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle vector grid
    const gridSpacing = 64;
    const [originX, originY] = latLngToScreen(28.6139, 77.209, width, height);
    const startX = ((originX % gridSpacing) + gridSpacing) % gridSpacing;
    const startY = ((originY % gridSpacing) + gridSpacing) % gridSpacing;
    ctx.strokeStyle = '#e2e5e8';
    ctx.lineWidth = 1;
    for (let x = startX; x <= width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = startY; y <= height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Green parks & forest zones
    const zoomScale = Math.max(0.6, Math.min(1.8, discreteZoom / 12));
    const parkZones: Array<[number, number, number]> = [
      [28.6129, 77.2295, 34],
      [28.545, 77.192, 42],
      [28.685, 77.21, 30],
      [28.59, 77.175, 38],
      [28.5245, 77.1855, 36],
      [27.5048, 77.6696, 30],
      [27.5806, 77.6997, 34],
    ];
    ctx.fillStyle = '#ceead6';
    for (const [pLat, pLng, rBase] of parkZones) {
      const [px, py] = latLngToScreen(pLat, pLng, width, height);
      if (px >= -120 && px <= width + 120 && py >= -120 && py <= height + 120) {
        ctx.beginPath();
        ctx.arc(px, py, rBase * zoomScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Yamuna & Hindon rivers
    const yamunaPoints: Array<[number, number]> = [
      [28.76, 77.225],
      [28.7, 77.232],
      [28.665, 77.242],
      [28.63, 77.255],
      [28.6, 77.265],
      [28.56, 77.295],
      [28.52, 77.33],
      [27.51, 77.688],
      [27.47, 77.695],
    ];
    ctx.strokeStyle = '#aadaff';
    ctx.lineWidth = 14 * zoomScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    yamunaPoints.forEach(([lat, lng], idx) => {
      const [rx, ry] = latLngToScreen(lat, lng, width, height);
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // 5. Major Expressways & Ring Roads
    const majorHighways: Array<Array<[number, number]>> = [
      [
        [28.695, 77.16],
        [28.668, 77.228],
        [28.615, 77.255],
        [28.568, 77.245],
        [28.568, 77.21],
        [28.595, 77.165],
        [28.65, 77.145],
        [28.695, 77.16],
      ],
      [
        [28.6328, 77.2197],
        [28.58, 77.16],
        [28.5562, 77.1],
        [28.495, 77.0895],
        [28.4593, 77.0724],
      ],
      [
        [28.6328, 77.2197],
        [28.6127, 77.2773],
        [28.6277, 77.3649],
        [28.6512, 77.4165],
      ],
      [
        [27.6057, 77.5933],
        [27.572, 77.6718],
        [27.5048, 77.6696],
        [27.4795, 77.6736],
        [27.4112, 77.7195],
      ],
    ];
    for (const road of majorHighways) {
      ctx.beginPath();
      road.forEach(([lat, lng], idx) => {
        const [hx, hy] = latLngToScreen(lat, lng, width, height);
        if (idx === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      });
      ctx.strokeStyle = '#e5c158';
      ctx.lineWidth = 6 * zoomScale;
      ctx.stroke();
      ctx.strokeStyle = '#fde293';
      ctx.lineWidth = 4 * zoomScale;
      ctx.stroke();
    }

    // 6. Full-screen Web Mercator Slippy Map Tiles (Mapbox proxy -> CARTO Voyager @2x -> OSM)
    const centerTx = lonToTileX(viewportLng, discreteZoom);
    const centerTy = latToTileY(viewportLat, discreteZoom);
    const baseTileX = Math.floor(centerTx);
    const baseTileY = Math.floor(centerTy);
    const maxTileIdx = (1 << discreteZoom) - 1;
    const halfTilesX = Math.ceil(width / (2 * TILE_SIZE_PX)) + 1;
    const halfTilesY = Math.ceil(height / (2 * TILE_SIZE_PX)) + 1;

    for (let dx = -halfTilesX; dx <= halfTilesX; dx++) {
      for (let dy = -halfTilesY; dy <= halfTilesY; dy++) {
        const tx = Math.max(0, Math.min(maxTileIdx, baseTileX + dx));
        const ty = Math.max(0, Math.min(maxTileIdx, baseTileY + dy));
        const key = `${hasMapboxServerKey ? 'mb' : 'carto'}/${discreteZoom}/${tx}/${ty}`;
        const cachedImg = tileBitmapCache.get(key);
        const leftPx = width / 2 + (tx - centerTx) * TILE_SIZE_PX;
        const topPx = height / 2 + (ty - centerTy) * TILE_SIZE_PX;

        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.drawImage(
            cachedImg,
            Math.floor(leftPx),
            Math.floor(topPx),
            TILE_SIZE_PX + 1,
            TILE_SIZE_PX + 1
          );
        } else if (!tileLoadingSet.has(key)) {
          tileLoadingSet.add(key);
          const sub = ['a', 'b', 'c', 'd'][Math.abs(tx + ty) % 4];
          const primaryUrl = hasMapboxServerKey
            ? `/api/tiles/${discreteZoom}/${tx}/${ty}`
            : `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${discreteZoom}/${tx}/${ty}@2x.png`;
          const fallbackUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${discreteZoom}/${tx}/${ty}.png`;

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            tileBitmapCache.set(key, img);
            tileLoadingSet.delete(key);
            setTileTick((t) => t + 1);
          };
          img.onerror = () => {
            if (img.src !== fallbackUrl) {
              img.src = fallbackUrl;
            } else {
              tileLoadingSet.delete(key);
            }
          };
          img.src = primaryUrl;
        }
      }
    }

    // 7. Landmark / Transit Hub Dots
    for (const place of DelhiPlacesData.places) {
      const [px, py] = latLngToScreen(place.lat, place.lng, width, height);
      if (px >= -20 && px <= width + 20 && py >= -20 && py <= height + 20) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = place.metroAccess ? '#1a73e8' : '#5f6368';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Alternate routes (#8ab4f8)
    if (!isNavigating) {
      for (const route of routes) {
        if (route.id !== activeRoute?.id && route.corridorPath.length >= 2) {
          ctx.beginPath();
          route.corridorPath.forEach(([lat, lng], idx) => {
            const [rx, ry] = latLngToScreen(lat, lng, width, height);
            if (idx === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          });
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.strokeStyle = '#8ab4f8';
          ctx.lineWidth = 5;
          ctx.stroke();
        }
      }
    }

    // 9. Active route corridor (#1a73e8 with remaining-path highlight when navigating)
    if (activeRoadPoints.length >= 2) {
      const rawCorridor = activeRoute?.corridorPath ?? activeRoadPoints;
      const splitIdx =
        isNavigating && typeof navSnappedIndex === 'number'
          ? Math.max(0, Math.min(rawCorridor.length - 1, navSnappedIndex))
          : 0;

      if (isNavigating && splitIdx > 0 && rawCorridor.length >= 2) {
        // Already traversed portion (muted gray)
        ctx.beginPath();
        for (let i = 0; i <= splitIdx; i++) {
          const [rx, ry] = latLngToScreen(
            rawCorridor[i][0],
            rawCorridor[i][1],
            width,
            height
          );
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.strokeStyle = '#9aa0a6';
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      const remainingPts =
        isNavigating && rawCorridor.length >= 2
          ? rawCorridor.slice(splitIdx)
          : activeRoadPoints;

      if (remainingPts.length >= 2) {
        ctx.beginPath();
        remainingPts.forEach(([lat, lng], idx) => {
          const [rx, ry] = latLngToScreen(lat, lng, width, height);
          if (idx === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        });
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isLiveRideActive || isNavigating ? 16 : 12;
        ctx.stroke();

        ctx.strokeStyle = '#174ea6';
        ctx.lineWidth = isLiveRideActive || isNavigating ? 13 : 9.5;
        ctx.stroke();

        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = isLiveRideActive || isNavigating ? 10 : 7;
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 10. Start marker (Blue circle)
    if (startPlace) {
      const [sx, sy] = latLngToScreen(
        startPlace.lat,
        startPlace.lng,
        width,
        height
      );
      ctx.fillStyle = 'rgba(26, 115, 232, 0.18)';
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a73e8';
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 11. End marker (Red destination pin)
    if (endPlace) {
      const [ex, ey] = latLngToScreen(
        endPlace.lat,
        endPlace.lng,
        width,
        height
      );
      ctx.fillStyle = 'rgba(217, 48, 37, 0.18)';
      ctx.beginPath();
      ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d93025';
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 12. Live GPS User-Location Dot (when navigating) OR Simulated Moving Car
    if (isNavigating && navUserLocation) {
      const [ux, uy] = latLngToScreen(
        navUserLocation.lat,
        navUserLocation.lng,
        width,
        height
      );

      // Accuracy halo
      ctx.fillStyle = 'rgba(26, 115, 232, 0.22)';
      ctx.beginPath();
      ctx.arc(ux, uy, 24, 0, Math.PI * 2);
      ctx.fill();

      // Heading cone if available
      if (
        typeof navUserLocation.heading === 'number' &&
        Number.isFinite(navUserLocation.heading)
      ) {
        ctx.save();
        ctx.translate(ux, uy);
        ctx.rotate(((navUserLocation.heading - 90) * Math.PI) / 180);
        ctx.fillStyle = 'rgba(26, 115, 232, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 32, -0.45, 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // White outer ring + Blue GPS dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ux, uy, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a73e8';
      ctx.beginPath();
      ctx.arc(ux, uy, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeRoadPoints.length >= 2) {
      const [cx, cy] = latLngToScreen(carLat, carLng, width, height);

      ctx.fillStyle = 'rgba(26, 115, 232, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, isLiveRideActive ? 26 : 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((carBearingDeg * Math.PI) / 180);

      // Shadow
      ctx.fillStyle = 'rgba(32, 33, 36, 0.28)';
      ctx.beginPath();
      ctx.roundRect(-9, -15, 22, 34, 6);
      ctx.fill();

      // White car body
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-10, -17, 20, 34, 6);
      ctx.fill();
      ctx.stroke();

      // Blue windshield & roof
      ctx.fillStyle = '#1a73e8';
      ctx.beginPath();
      ctx.roundRect(-7, -9, 14, 16, 3);
      ctx.fill();

      // Headlights
      ctx.fillStyle = '#fde293';
      ctx.beginPath();
      ctx.arc(-6, -15, 2, 0, Math.PI * 2);
      ctx.arc(6, -15, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }, [
    viewportSize,
    viewportLat,
    viewportLng,
    discreteZoom,
    hasMapboxServerKey,
    tileTick,
    startPlace,
    endPlace,
    routes,
    activeRoute,
    activeRoadPoints,
    carLat,
    carLng,
    carBearingDeg,
    isLiveRideActive,
    isNavigating,
    navUserLocation,
    navSnappedIndex,
  ]);

  const getOverlayPos = (lat: number, lng: number) => {
    const [x, y] = latLngToScreen(lat, lng, viewportSize.w, viewportSize.h);
    return { x, y };
  };

  const remainingMins = activeRoute
    ? Math.max(1, Math.round(activeRoute.durationMinutes * (1.0 - rideProgress)))
    : 0;
  const speedKmh =
    activeRoute?.mode === 'METRO'
      ? 46
      : activeRoute?.mode === 'TRAIN'
      ? 78
      : 34;

  return (
    <div
      ref={containerRef}
      data-testid="interactive_map_canvas"
      className={`relative w-full h-full bg-[#f1f3f4] overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          dragRef.current = {
            active: true,
            lastX: e.clientX,
            lastY: e.clientY,
          };
          if (isLiveRideActive) {
            setFollowCarCamera(false);
          }
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.active) return;
          const dx = e.clientX - dragRef.current.lastX;
          const dy = e.clientY - dragRef.current.lastY;
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;

          const curTx = lonToTileX(viewportLng, discreteZoom) - dx / TILE_SIZE_PX;
          const curTy = latToTileY(viewportLat, discreteZoom) - dy / TILE_SIZE_PX;
          setViewportLng(Math.max(68.0, Math.min(97.5, tileXToLon(curTx, discreteZoom))));
          setViewportLat(Math.max(6.5, Math.min(37.2, tileYToLat(curTy, discreteZoom))));
        }}
        onPointerUp={() => {
          dragRef.current.active = false;
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 1 : -1;
          setViewportZoom((z) => Math.max(4, Math.min(17, z + delta)));
        }}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Start label pill */}
      {startPlace && !isLiveRideActive && (() => {
        const pos = getOverlayPos(startPlace.lat, startPlace.lng);
        return (
          <div
            style={{
              transform: `translate(${Math.round(pos.x + 12)}px, ${Math.round(pos.y - 14)}px)`,
            }}
            className="pointer-events-none absolute top-0 left-0 px-[8px] py-[4px] rounded-[8px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow text-[12px] leading-[16px] font-medium text-[#202124] whitespace-nowrap"
          >
            {startPlace.name.split('(')[0].trim()}
          </div>
        );
      })()}

      {/* End label pill */}
      {endPlace && (() => {
        const pos = getOverlayPos(endPlace.lat, endPlace.lng);
        return (
          <div
            style={{
              transform: `translate(${Math.round(pos.x + 12)}px, ${Math.round(pos.y - 14)}px)`,
            }}
            className="pointer-events-none absolute top-0 left-0 px-[8px] py-[4px] rounded-[8px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow text-[12px] leading-[16px] font-medium text-[#202124] whitespace-nowrap"
          >
            {endPlace.name.split('(')[0].trim()}
          </div>
        );
      })()}

      {/* Live Car Speed Badge */}
      {activeRoadPoints.length >= 2 && (() => {
        const pos = getOverlayPos(carLat, carLng);
        return (
          <div
            style={{
              transform: `translate(${Math.round(pos.x - 44)}px, ${Math.round(pos.y - 42)}px)`,
            }}
            className="pointer-events-none absolute top-0 left-0 px-[8px] py-[3px] rounded-full bg-[#1a73e8] text-[#ffffff] text-[11px] leading-[14px] font-medium gmaps-shadow whitespace-nowrap"
          >
            Live Car • {speedKmh} km/h
          </div>
        );
      })()}

      {/* Live Car Road View Toggle Pill + HUD */}
      {activeRoadPoints.length >= 2 && (
        <div className="absolute top-[132px] left-[16px] flex flex-col gap-[8px] z-10">
          <button
            type="button"
            data-testid="toggle_live_car_view_button"
            onClick={() => {
              const nextState = !isLiveRideActive;
              onToggleLiveRide(nextState);
              if (nextState) {
                setFollowCarCamera(true);
                setIsRidePaused(false);
              }
            }}
            className={`h-[48px] px-[12px] rounded-full border gmaps-shadow flex items-center gap-[8px] cursor-pointer ${
              isLiveRideActive
                ? 'bg-[#1a73e8] border-[#1a73e8] text-[#ffffff]'
                : 'bg-[#ffffff] border-[#dadce0] text-[#202124]'
            }`}
          >
            <span
              className={`w-[8px] h-[8px] rounded-full ${
                isLiveRideActive ? 'bg-[#ffffff]' : 'bg-[#1a73e8]'
              }`}
            />
            <span className="text-[12px] leading-[16px] font-medium">
              {isLiveRideActive ? 'Exit Live Road View' : 'Live Car Road View'}
            </span>
          </button>

          {isLiveRideActive && activeRoute && (
            <div
              data-testid="live_ride_hud_card"
              className="w-[236px] rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow p-[12px]"
            >
              <div className="text-[12px] leading-[16px] font-medium text-[#1a73e8]">
                LIVE CAR ON ROAD • {Math.round(rideProgress * 100)}%
              </div>
              <div className="mt-[2px] text-[14px] leading-[20px] font-medium text-[#202124] truncate">
                {remainingMins} min remaining • ₹{activeRoute.fareInr}
              </div>
              <div className="mt-[2px] text-[12px] leading-[16px] text-[#5f6368] truncate">
                {activeRoute.summary}
              </div>
              <div className="mt-[8px] flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setIsRidePaused(!isRidePaused)}
                  className="px-[10px] py-[6px] rounded-full bg-[#f1f3f4] text-[12px] leading-[16px] font-medium text-[#202124] cursor-pointer"
                >
                  {isRidePaused ? 'Resume Car' : 'Pause Car'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowCarCamera(true);
                    setViewportLat(carLat);
                    setViewportLng(carLng);
                  }}
                  className="px-[10px] py-[6px] rounded-full bg-[#e8f0fe] text-[12px] leading-[16px] font-medium text-[#1a73e8] cursor-pointer"
                >
                  {followCarCamera ? 'Following Car' : 'Follow Car'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map zoom controls (+ / -) with 48px touch targets */}
      <div className="absolute right-[16px] top-[50%] -translate-y-1/2 rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow flex flex-col overflow-hidden z-10">
        <button
          type="button"
          data-testid="map_zoom_in"
          onClick={() => setViewportZoom((z) => Math.min(17, z + 1))}
          className="w-[48px] h-[48px] flex items-center justify-center text-[18px] font-medium text-[#202124] hover:bg-[#f1f3f4] cursor-pointer"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-[48px] h-[1px] bg-[#dadce0]" />
        <button
          type="button"
          data-testid="map_zoom_out"
          onClick={() => setViewportZoom((z) => Math.max(4, z - 1))}
          className="w-[48px] h-[48px] flex items-center justify-center text-[18px] font-medium text-[#202124] hover:bg-[#f1f3f4] cursor-pointer"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
};
