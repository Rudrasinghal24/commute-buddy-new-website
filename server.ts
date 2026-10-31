import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isConfiguredKey(val: string | undefined, placeholder: string): val is string {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== placeholder &&
    !trimmed.startsWith('YOUR_') &&
    !trimmed.startsWith('MY_')
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      providers: {
        gemini: isConfiguredKey(process.env.GEMINI_API_KEY, 'MY_GEMINI_API_KEY'),
        mapbox: isConfiguredKey(process.env.MAPBOX_ACCESS_TOKEN, 'YOUR_MAPBOX_ACCESS_TOKEN'),
        googleRoutes: isConfiguredKey(process.env.GOOGLE_ROUTES_API_KEY, 'YOUR_GOOGLE_ROUTES_API_KEY'),
        ors: isConfiguredKey(process.env.ORS_API_KEY, 'YOUR_ORS_API_KEY'),
        tomtom: isConfiguredKey(process.env.TOMTOM_API_KEY, 'YOUR_TOMTOM_API_KEY'),
        here: isConfiguredKey(process.env.HERE_API_KEY, 'YOUR_HERE_API_KEY'),
        otdDelhi: isConfiguredKey(process.env.OTD_DELHI_API_KEY, 'YOUR_OTD_DELHI_API_KEY'),
        trainPrimary: isConfiguredKey(process.env.TRAIN_PRIMARY_API_KEY, 'YOUR_TRAIN_PRIMARY_API_KEY'),
      },
    });
  });

  // Server-side Mapbox tile proxy when MAPBOX_ACCESS_TOKEN is configured
  app.get('/api/tiles/:z/:x/:y', async (req, res) => {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!isConfiguredKey(token, 'YOUR_MAPBOX_ACCESS_TOKEN')) {
      res.status(404).end();
      return;
    }
    try {
      const { z, x, y } = req.params;
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/${z}/${x}/${y}@2x?access_token=${encodeURIComponent(token.trim())}`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        res.status(upstream.status).end();
        return;
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch {
      res.status(502).end();
    }
  });

  type ServerManeuver =
    | 'depart'
    | 'straight'
    | 'left'
    | 'right'
    | 'slight_left'
    | 'slight_right'
    | 'sharp_left'
    | 'sharp_right'
    | 'keep_left'
    | 'keep_right'
    | 'uturn'
    | 'roundabout'
    | 'arrive';

  interface ServerRoadStep {
    instruction: string;
    durationMinutes: number;
    distanceMeters?: number;
    maneuver?: ServerManeuver;
    streetName?: string;
    startIndex?: number;
  }

  function mapOrsStepType(typeCode: number): ServerManeuver {
    switch (typeCode) {
      case 0:
        return 'left';
      case 1:
        return 'right';
      case 2:
        return 'sharp_left';
      case 3:
        return 'sharp_right';
      case 4:
        return 'slight_left';
      case 5:
        return 'slight_right';
      case 6:
        return 'straight';
      case 7:
      case 8:
        return 'roundabout';
      case 9:
        return 'uturn';
      case 10:
        return 'arrive';
      case 11:
        return 'depart';
      case 12:
        return 'keep_left';
      case 13:
        return 'keep_right';
      default:
        return 'straight';
    }
  }

  function mapOsrmManeuver(type?: string, modifier?: string): ServerManeuver {
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
  }

  function buildStepInstructionText(maneuver: ServerManeuver, streetName?: string): string {
    const onStreet = streetName ? ` onto ${streetName}` : '';
    switch (maneuver) {
      case 'depart':
        return streetName ? `Head on ${streetName}` : 'Depart';
      case 'left':
        return `Turn left${onStreet}`;
      case 'right':
        return `Turn right${onStreet}`;
      case 'slight_left':
        return `Slight left${onStreet}`;
      case 'slight_right':
        return `Slight right${onStreet}`;
      case 'sharp_left':
        return `Sharp left${onStreet}`;
      case 'sharp_right':
        return `Sharp right${onStreet}`;
      case 'keep_left':
        return `Keep left${onStreet}`;
      case 'keep_right':
        return `Keep right${onStreet}`;
      case 'uturn':
        return `Make a U-turn${onStreet}`;
      case 'roundabout':
        return `Take the roundabout${onStreet}`;
      case 'arrive':
        return 'Arrive at destination';
      case 'straight':
      default:
        return streetName ? `Continue on ${streetName}` : 'Continue straight';
    }
  }

  // Server-side live routing & traffic proxy (TomTom + Google Routes + OpenRouteService + OSRM fallback)
  app.post('/api/live-route', async (req, res) => {
    const { start, end } = req.body ?? {};
    if (
      !start ||
      !end ||
      typeof start.lat !== 'number' ||
      typeof start.lng !== 'number' ||
      typeof end.lat !== 'number' ||
      typeof end.lng !== 'number'
    ) {
      res.status(400).json({ error: 'Invalid start/end coordinates' });
      return;
    }

    let tomtomMultiplier: number | null = null;
    let roadKm: number | null = null;
    let durationMins: number | null = null;
    let geometry: Array<[number, number]> = [];
    let steps: ServerRoadStep[] = [];
    let source = 'osrm';

    // 1. Live TomTom Traffic Flow Segment API
    const tomtomKey = process.env.TOMTOM_API_KEY;
    if (isConfiguredKey(tomtomKey, 'YOUR_TOMTOM_API_KEY')) {
      try {
        const midLat = (start.lat + end.lat) / 2.0;
        const midLng = (start.lng + end.lng) / 2.0;
        const ttUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${midLat},${midLng}&key=${encodeURIComponent(tomtomKey.trim())}`;
        const ttRes = await fetch(ttUrl);
        if (ttRes.ok) {
          const ttJson = await ttRes.json();
          const flow = ttJson?.flowSegmentData;
          if (flow) {
            const currentSpeed = Math.max(5, Number(flow.currentSpeed || 30));
            const freeFlowSpeed = Math.max(currentSpeed, Number(flow.freeFlowSpeed || 45));
            tomtomMultiplier = Math.max(1.0, Math.min(2.0, freeFlowSpeed / currentSpeed));
          }
        }
      } catch {
        // Ignore TomTom error and continue
      }
    }

    // 2. Try OpenRouteService v2 if ORS_API_KEY is configured
    const orsKey = process.env.ORS_API_KEY;
    if (isConfiguredKey(orsKey, 'YOUR_ORS_API_KEY')) {
      try {
        const orsRes = await fetch(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          {
            method: 'POST',
            headers: {
              Authorization: orsKey.trim(),
              'Content-Type': 'application/json',
              Accept: 'application/geo+json, application/json',
            },
            body: JSON.stringify({
              coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat],
              ],
              instructions: true,
            }),
          }
        );
        if (orsRes.ok) {
          const orsJson = await orsRes.json();
          const feat = orsJson?.features?.[0];
          const summary = feat?.properties?.summary;
          if (summary) {
            const distM = Number(summary.distance || 0);
            const durSec = Number(summary.duration || 0);
            if (distM > 0 && durSec > 0) {
              roadKm = distM / 1000.0;
              const mult = tomtomMultiplier ?? 1.25;
              durationMins = Math.max(3, Math.round((durSec / 60.0) * mult));
              source = 'ors';
              const coords = feat?.geometry?.coordinates;
              if (Array.isArray(coords)) {
                geometry = coords
                  .filter((c: unknown) => Array.isArray(c) && c.length >= 2)
                  .map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number]);
              }
              const rawSteps = feat?.properties?.segments?.[0]?.steps;
              if (Array.isArray(rawSteps)) {
                steps = rawSteps.map((st: Record<string, unknown>) => {
                  const maneuver = mapOrsStepType(Number(st.type ?? 6));
                  const rawName = typeof st.name === 'string' ? st.name.trim() : '';
                  const streetName = rawName && rawName !== '-' ? rawName : undefined;
                  const wayPoints = Array.isArray(st.way_points) ? st.way_points : [];
                  const startIndex =
                    typeof wayPoints[0] === 'number'
                      ? Math.max(0, Math.min(Math.max(0, geometry.length - 1), wayPoints[0]))
                      : undefined;
                  const stepDurSec = Number(st.duration ?? 0);
                  const stepDistM = Number(st.distance ?? 0);
                  const instruction =
                    typeof st.instruction === 'string' && st.instruction.trim()
                      ? st.instruction.trim()
                      : buildStepInstructionText(maneuver, streetName);
                  return {
                    instruction,
                    durationMinutes: Math.max(1, Math.round(stepDurSec / 60)),
                    distanceMeters: Number.isFinite(stepDistM) ? Math.round(stepDistM) : undefined,
                    maneuver,
                    ...(streetName ? { streetName } : {}),
                    ...(startIndex !== undefined ? { startIndex } : {}),
                  };
                });
              }
            }
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 3. OSRM with steps=true&overview=full&geometries=geojson when ORS did not provide steps
    if (steps.length === 0 || geometry.length < 2) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl);
        if (osrmRes.ok) {
          const osrmJson = await osrmRes.json();
          const first = osrmJson?.routes?.[0];
          if (first) {
            const distM = Number(first.distance || 0);
            const durSec = Number(first.duration || 0);
            const coords = first.geometry?.coordinates;
            const osrmGeometry: Array<[number, number]> = [];
            if (Array.isArray(coords)) {
              for (const pt of coords) {
                if (Array.isArray(pt) && pt.length >= 2) {
                  const lon = Number(pt[0]);
                  const lat = Number(pt[1]);
                  if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    osrmGeometry.push([lat, lon]);
                  }
                }
              }
            }
            if (distM > 0 && durSec > 0 && osrmGeometry.length >= 2) {
              roadKm = distM / 1000.0;
              const mult = tomtomMultiplier ?? 1.28;
              durationMins = Math.max(4, Math.round((durSec / 60.0) * mult));
              geometry = osrmGeometry;
              source = 'osrm';
            }

            const rawLegSteps = first.legs?.[0]?.steps;
            if (Array.isArray(rawLegSteps) && osrmGeometry.length >= 2) {
              let searchFromIdx = 0;
              steps = rawLegSteps.map((st: Record<string, unknown>) => {
                const manObj = (st.maneuver ?? {}) as Record<string, unknown>;
                const maneuver = mapOsrmManeuver(
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
                    for (let i = searchFromIdx; i < osrmGeometry.length; i++) {
                      const dLat = osrmGeometry[i][0] - mLat;
                      const dLng = osrmGeometry[i][1] - mLng;
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
                  instruction: buildStepInstructionText(maneuver, streetName),
                  durationMinutes: Math.max(1, Math.round(stepDurSec / 60)),
                  distanceMeters: Number.isFinite(stepDistM) ? Math.round(stepDistM) : undefined,
                  maneuver,
                  ...(streetName ? { streetName } : {}),
                  startIndex,
                };
              });
            }
          }
        }
      } catch {
        // Ignore OSRM error
      }
    }

    res.json({
      source,
      tomtomMultiplier,
      roadKm,
      durationMins,
      geometry,
      steps,
    });
  });

  // Additive Landmarks endpoint (OpenStreetMap Overpass, cached, 8s timeout, never blocks)
  const landmarkCache = new Map<string, { value: string | null; expiresAt: number }>();
  const LANDMARK_TTL_MS = 60 * 60 * 1000;
  let lastOverpassCallMs = 0;

  function haversineMetersServer(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const r = 6371000.0;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  app.post('/api/landmarks', async (req, res) => {
    try {
      const rawPoints = Array.isArray(req.body) ? req.body : req.body?.points;
      if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
        res.json({ landmarks: [] });
        return;
      }

      const points = rawPoints
        .slice(0, 25)
        .map((p: Record<string, unknown>) => ({
          lat: Number(p?.lat),
          lng: Number(p?.lng),
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

      if (points.length === 0) {
        res.json({ landmarks: [] });
        return;
      }

      const now = Date.now();
      const results: Array<string | null> = new Array(points.length).fill(null);
      const uncachedIndices: number[] = [];

      points.forEach((pt, idx) => {
        const key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`;
        const cached = landmarkCache.get(key);
        if (cached && cached.expiresAt > now) {
          results[idx] = cached.value;
        } else {
          uncachedIndices.push(idx);
        }
      });

      if (uncachedIndices.length === 0) {
        res.json({ landmarks: results });
        return;
      }

      // Rate-limit guard
      if (now - lastOverpassCallMs < 1200) {
        res.json({ landmarks: results });
        return;
      }
      lastOverpassCallMs = now;

      const clauses = uncachedIndices
        .map((idx) => {
          const { lat, lng } = points[idx];
          return (
            `node(around:60,${lat},${lng})["name"]["amenity"~"^(fuel|bank|place_of_worship|school|hospital|pharmacy)$"];` +
            `node(around:60,${lat},${lng})["name"]["shop"~"^(mall|supermarket)$"];`
          );
        })
        .join('');

      const query = `[out:json][timeout:8];(${clauses});out body;`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!ovRes.ok) {
          res.json({ landmarks: results });
          return;
        }

        const ovJson = await ovRes.json();
        const elements = Array.isArray(ovJson?.elements) ? ovJson.elements : [];

        const priorityOrder = (tags: Record<string, string>): number => {
          const amenity = tags.amenity || '';
          if (
            amenity === 'fuel' ||
            amenity === 'place_of_worship' ||
            amenity === 'bank' ||
            amenity === 'hospital'
          ) {
            return 1;
          }
          if (amenity === 'school' || amenity === 'pharmacy') {
            return 2;
          }
          if (tags.shop === 'mall' || tags.shop === 'supermarket') {
            return 3;
          }
          return 4;
        };

        for (const idx of uncachedIndices) {
          const pt = points[idx];
          let bestName: string | null = null;
          let bestPriority = 99;
          let bestDist = Number.POSITIVE_INFINITY;

          for (const el of elements) {
            const elLat = Number(el?.lat);
            const elLng = Number(el?.lon);
            const tags = (el?.tags ?? {}) as Record<string, string>;
            const name = typeof tags.name === 'string' ? tags.name.trim() : '';
            if (!name || !Number.isFinite(elLat) || !Number.isFinite(elLng)) continue;

            const dist = haversineMetersServer(pt.lat, pt.lng, elLat, elLng);
            if (dist > 60) continue;

            const prio = priorityOrder(tags);
            if (prio < bestPriority || (prio === bestPriority && dist < bestDist)) {
              bestPriority = prio;
              bestDist = dist;
              bestName = name;
            }
          }

          results[idx] = bestName;
          const key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`;
          landmarkCache.set(key, { value: bestName, expiresAt: now + LANDMARK_TTL_MS });
        }

        res.json({ landmarks: results });
      } catch {
        clearTimeout(timeoutId);
        res.json({ landmarks: results });
      }
    } catch {
      res.json({ landmarks: [] });
    }
  });

  // Server-side Gemini API proxy for CommuteBuddy AI Assistant & Live Transit Verification
  app.post('/api/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!isConfiguredKey(apiKey, 'MY_GEMINI_API_KEY')) {
        res.status(503).json({ error: 'GEMINI_API_KEY not configured on server' });
        return;
      }

      const { systemInstruction, contents, responseMimeType } = req.body ?? {};
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: Array.isArray(contents) ? contents : String(contents ?? ''),
        config: {
          systemInstruction:
            typeof systemInstruction === 'string'
              ? systemInstruction
              : 'You are CommuteBuddy AI, an Indian transit and multimodal route assistant. Never use emojis.',
          temperature: 0.25,
          maxOutputTokens: 450,
          ...(responseMimeType ? { responseMimeType } : {}),
        },
      });

      const text = (response.text ?? '').trim();
      res.json({ text });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gemini request failed';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CommuteBuddy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
