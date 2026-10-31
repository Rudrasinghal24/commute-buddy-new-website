import { useCallback, useEffect, useRef, useState } from 'react';
import { DelhiPlace } from '../data/places';
import { GetRoutesApi } from './getRoutes';
import { createNavigationEngine, NavigationEngine } from './navigationEngine';
import { TransitAvailabilityApi } from './transitAvailabilityApi';
import { Route, RouteStep, TravelMode } from './types';
import { buildTurnAnnouncement, DistanceBucket, NavigationVoice } from './voice';

export type NavigationStatus =
  | 'idle'
  | 'navigating'
  | 'rerouting'
  | 'arrived'
  | 'permission_denied'
  | 'no_gps';

export interface NavUserLocation {
  lat: number;
  lng: number;
  heading: number | null;
}

export interface UseNavigationResult {
  status: NavigationStatus;
  errorMessage: string | null;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  stepIndex: number;
  metersToNextTurn: number;
  offRouteMeters: number;
  snappedIndex: number;
  userLocation: NavUserLocation | null;
  isMuted: boolean;
  startNavigation: (route: Route) => void;
  stop: () => void;
  toggleMute: () => void;
}

export function routeSupportsTurnByTurn(route: Route | null): boolean {
  if (!route) return false;
  if (
    route.mode === TravelMode.BUS ||
    route.mode === TravelMode.METRO ||
    route.mode === TravelMode.TRAIN ||
    route.mode === TravelMode.FLIGHT
  ) {
    return false;
  }
  if (!route.stepsSource || route.stepsSource === 'template') {
    return false;
  }
  if (!Array.isArray(route.corridorPath) || route.corridorPath.length < 2) {
    return false;
  }
  return route.steps.some(
    (s) =>
      (s.mode === TravelMode.CAR ||
        s.mode === TravelMode.BIKE ||
        s.mode === TravelMode.WALK) &&
      Boolean(s.maneuver)
  );
}

export function useNavigation(options: {
  endPlace: DelhiPlace | null;
  reachByTime: string | null;
  onRerouted?: (newRoute: Route, allNewRoutes: Route[]) => void;
}): UseNavigationResult {
  const { endPlace, reachByTime, onRerouted } = options;

  const [status, setStatus] = useState<NavigationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [metersToNextTurn, setMetersToNextTurn] = useState<number>(0);
  const [offRouteMeters, setOffRouteMeters] = useState<number>(0);
  const [snappedIndex, setSnappedIndex] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<NavUserLocation | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => NavigationVoice.isMuted());

  const engineRef = useRef<NavigationEngine | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const announcedSetRef = useRef<Set<string>>(new Set());
  const arrivedAnnouncedRef = useRef<boolean>(false);
  const isReroutingRef = useRef<boolean>(false);
  const activeRouteRef = useRef<Route | null>(null);

  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore wakeLock release errors
      }
      wakeLockRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
        wakeLockRef.current = await nav.wakeLock.request('screen');
      }
    } catch {
      // Ignore if wakeLock is unsupported or blocked
    }
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // Ignore
      }
      watchIdRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearWatch();
    releaseWakeLock();
    NavigationVoice.stopSpeaking();
    engineRef.current = null;
    announcedSetRef.current.clear();
    arrivedAnnouncedRef.current = false;
    isReroutingRef.current = false;
    setStatus('idle');
    setErrorMessage(null);
    setActiveRoute(null);
    setUserLocation(null);
    setStepIndex(0);
    setMetersToNextTurn(0);
    setOffRouteMeters(0);
    setSnappedIndex(0);
  }, [clearWatch, releaseWakeLock]);

  const handleRerouteFromPosition = useCallback(
    async (lat: number, lng: number) => {
      if (isReroutingRef.current || !endPlace) return;
      const currentRoute = activeRouteRef.current;
      if (!currentRoute) return;

      isReroutingRef.current = true;
      setStatus('rerouting');
      NavigationVoice.speak('Rerouting.');

      const currentPosPlace: DelhiPlace = {
        id: `gps_live_${Date.now()}`,
        name: 'Current Location',
        area: 'Live GPS Position',
        lat,
        lng,
      };

      try {
        const livePricing =
          await TransitAvailabilityApi.fetchLiveTransitAndPricingFromApis(
            currentPosPlace,
            endPlace
          );
        const recomputed = GetRoutesApi.getRoutes(
          currentPosPlace,
          endPlace,
          reachByTime,
          livePricing
        );
        const matchingModeRoute =
          recomputed.find((r) => r.mode === currentRoute.mode) ?? recomputed[0];

        if (matchingModeRoute) {
          setActiveRoute(matchingModeRoute);
          activeRouteRef.current = matchingModeRoute;
          engineRef.current = createNavigationEngine(
            matchingModeRoute.corridorPath,
            matchingModeRoute.steps
          );
          announcedSetRef.current.clear();
          arrivedAnnouncedRef.current = false;
          setStepIndex(0);
          setSnappedIndex(0);
          onRerouted?.(matchingModeRoute, recomputed);
        }
        setStatus('navigating');
      } catch {
        setStatus('navigating');
      } finally {
        isReroutingRef.current = false;
      }
    },
    [endPlace, reachByTime, onRerouted]
  );

  const startNavigation = useCallback(
    (route: Route) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setStatus('no_gps');
        setErrorMessage('GPS geolocation is not available in this browser.');
        return;
      }

      clearWatch();
      announcedSetRef.current.clear();
      arrivedAnnouncedRef.current = false;
      isReroutingRef.current = false;

      setActiveRoute(route);
      activeRouteRef.current = route;
      const engine = createNavigationEngine(route.corridorPath, route.steps);
      engineRef.current = engine;
      setStepIndex(0);
      setSnappedIndex(0);
      setErrorMessage(null);
      setStatus('navigating');

      requestWakeLock();

      // Speak initial step if available
      const firstStep = route.steps[0];
      if (firstStep && firstStep.maneuver) {
        const initialSentence = buildTurnAnnouncement(firstStep, 'now');
        NavigationVoice.speak(initialSentence);
        announcedSetRef.current.add('0:depart');
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const heading =
            typeof pos.coords.heading === 'number' &&
            Number.isFinite(pos.coords.heading)
              ? pos.coords.heading
              : null;

          setUserLocation({ lat, lng, heading });
          setErrorMessage(null);

          const activeEng = engineRef.current;
          const curRoute = activeRouteRef.current;
          if (!activeEng || !curRoute) return;

          const update = activeEng.update(lat, lng, Date.now());
          setStepIndex(update.stepIndex);
          setMetersToNextTurn(update.metersToNextTurn);
          setOffRouteMeters(update.offRouteMeters);
          setSnappedIndex(update.snappedIndex);

          if (update.arrived) {
            setStatus('arrived');
            if (!arrivedAnnouncedRef.current) {
              arrivedAnnouncedRef.current = true;
              NavigationVoice.speak('You have arrived.');
            }
            return;
          }

          if (update.shouldReroute) {
            handleRerouteFromPosition(lat, lng);
            return;
          }

          setStatus((prev) => (prev === 'rerouting' ? prev : 'navigating'));

          // Voice threshold checks for the upcoming turn step
          const targetStepIdx = Math.min(
            curRoute.steps.length - 1,
            update.stepIndex + 1
          );
          const upcomingStep = curRoute.steps[targetStepIdx] ?? curRoute.steps[update.stepIndex];
          if (!upcomingStep || !upcomingStep.maneuver) return;

          const isWalk =
            curRoute.mode === TravelMode.WALK ||
            upcomingStep.mode === TravelMode.WALK;
          const dist = update.metersToNextTurn;

          let bucketToAnnounce: DistanceBucket | null = null;
          if (isWalk) {
            if (dist <= 18) {
              bucketToAnnounce = 'now';
            } else if (dist <= 65 && dist >= 30) {
              bucketToAnnounce = '50m';
            }
          } else {
            if (dist <= 35) {
              bucketToAnnounce = 'now';
            } else if (dist <= 240 && dist >= 140) {
              bucketToAnnounce = '200m';
            } else if (dist <= 550 && dist >= 420) {
              bucketToAnnounce = '500m';
            }
          }

          if (bucketToAnnounce) {
            const key = `${targetStepIdx}:${bucketToAnnounce}`;
            if (!announcedSetRef.current.has(key)) {
              announcedSetRef.current.add(key);
              const sentence = buildTurnAnnouncement(
                upcomingStep,
                bucketToAnnounce
              );
              NavigationVoice.speak(sentence);
            }
          }
        },
        (err) => {
          if (err.code === 1) {
            setStatus('permission_denied');
            setErrorMessage(
              'Location permission denied. Enable browser location access to use live navigation.'
            );
          } else {
            setStatus('no_gps');
            setErrorMessage(
              'Unable to acquire live GPS signal. Check device location settings.'
            );
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );

      watchIdRef.current = watchId;
    },
    [clearWatch, requestWakeLock, handleRerouteFromPosition]
  );

  const toggleMute = useCallback(() => {
    const next = NavigationVoice.toggleMute();
    setIsMuted(next);
  }, []);

  useEffect(() => {
    return () => {
      clearWatch();
      releaseWakeLock();
      NavigationVoice.stopSpeaking();
    };
  }, [clearWatch, releaseWakeLock]);

  const steps = activeRoute?.steps ?? [];
  const currentStep = steps[stepIndex] ?? null;
  const nextStep =
    steps[Math.min(steps.length - 1, stepIndex + 1)] ?? currentStep;

  return {
    status,
    errorMessage,
    currentStep,
    nextStep,
    stepIndex,
    metersToNextTurn,
    offRouteMeters,
    snappedIndex,
    userLocation,
    isMuted,
    startNavigation,
    stop,
    toggleMute,
  };
}
