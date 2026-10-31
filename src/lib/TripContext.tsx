import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DataLoadState } from '../data/commuteData';
import { DelhiPlace, DelhiPlacesData } from '../data/places';
import { GetRoutesApi } from './getRoutes';
import { recommendBestRoute } from './recommend';
import { SavedRoutesManager } from './savedRoutes';
import {
  LivePricingAndAvailability,
  TransitAvailabilityApi,
} from './transitAvailabilityApi';
import {
  CityModeAvailability,
  Route,
  SavedRouteEntry,
  SheetSnapPoint,
  TravelMode,
} from './types';

interface TripContextValue {
  startPlace: DelhiPlace | null;
  setStartPlace: (place: DelhiPlace | null) => void;
  endPlace: DelhiPlace | null;
  setEndPlace: (place: DelhiPlace | null) => void;
  selectedMode: TravelMode;
  setSelectedMode: (mode: TravelMode) => void;
  reachByTime: string | null;
  setReachByTime: (time: string | null) => void;
  isRoutesSheetOpen: boolean;
  setIsRoutesSheetOpen: (open: boolean) => void;
  sheetSnapPoint: SheetSnapPoint;
  setSheetSnapPoint: (snap: SheetSnapPoint) => void;
  routes: Route[];
  recommendedRoute: Route | null;
  selectedRoute: Route | null;
  setSelectedRoute: (route: Route | null) => void;
  isStepByStepOpen: boolean;
  setIsStepByStepOpen: (open: boolean) => void;
  isLiveRideActive: boolean;
  setIsLiveRideActive: (active: boolean) => void;
  isSavedScreenOpen: boolean;
  setIsSavedScreenOpen: (open: boolean) => void;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  savedRoutes: SavedRouteEntry[];
  routesLoadState: DataLoadState;
  emptyRoutesMessage: string;
  modeAvailability: CityModeAvailability[];
  triggerRouteSearch: () => void;
  retryRouteSearch: () => void;
  swapPlaces: () => void;
  saveRouteToBookmarks: (route: Route) => void;
  deleteSavedRoute: (id: string) => void;
  restoreSavedRoute: (entry: SavedRouteEntry, index: number) => void;
  applySavedRoute: (entry: SavedRouteEntry) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export const TripContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [startPlace, setStartPlace] = useState<DelhiPlace | null>(
    DelhiPlacesData.places.find((p) => p.id === 'rajiv_chowk') ??
      DelhiPlacesData.places[0] ??
      null
  );
  const [endPlace, setEndPlace] = useState<DelhiPlace | null>(
    DelhiPlacesData.places.find((p) => p.id === 'hauz_khas') ??
      DelhiPlacesData.places[2] ??
      null
  );
  const [selectedMode, setSelectedMode] = useState<TravelMode>(TravelMode.MIX);
  const [reachByTime, setReachByTime] = useState<string | null>(null);

  const [isRoutesSheetOpen, setIsRoutesSheetOpen] = useState<boolean>(true);
  const [sheetSnapPoint, setSheetSnapPoint] = useState<SheetSnapPoint>(
    SheetSnapPoint.HALF
  );

  const [routes, setRoutes] = useState<Route[]>([]);
  const [recommendedRoute, setRecommendedRoute] = useState<Route | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isStepByStepOpen, setIsStepByStepOpen] = useState<boolean>(false);
  const [isLiveRideActive, setIsLiveRideActive] = useState<boolean>(false);
  const [isSavedScreenOpen, setIsSavedScreenOpen] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);

  const [savedRoutes, setSavedRoutes] = useState<SavedRouteEntry[]>(() =>
    SavedRoutesManager.loadSavedRoutes()
  );

  const [routesLoadState, setRoutesLoadState] = useState<DataLoadState>(
    DataLoadState.READY
  );
  const [emptyRoutesMessage, setEmptyRoutesMessage] = useState<string>('');
  const [modeAvailability, setModeAvailability] = useState<
    CityModeAvailability[]
  >([]);

  const [searchNonce, setSearchNonce] = useState<number>(0);

  const applyComputedRoutes = useCallback(
    (
      computed: Route[],
      s: DelhiPlace,
      e: DelhiPlace,
      pricing: LivePricingAndAvailability,
      preserveStepByStep: boolean = false
    ) => {
      setModeAvailability(pricing.availabilities);
      setRoutes(computed);
      const best = recommendBestRoute(computed);
      setRecommendedRoute(best);

      setSelectedMode((currentMode) => {
        const modeFiltered =
          currentMode === TravelMode.MIX
            ? computed
            : computed.filter((r) => r.mode === currentMode);

        if (modeFiltered.length === 0 && currentMode !== TravelMode.MIX) {
          setSelectedRoute((prev) =>
            (prev ? computed.find((r) => r.id === prev.id) : null) ??
            best ??
            computed[0] ??
            null
          );
          setRoutesLoadState(
            computed.length === 0 ? DataLoadState.EMPTY : DataLoadState.READY
          );
          return TravelMode.MIX;
        } else if (modeFiltered.length === 0) {
          const distKm = Math.round(
            DelhiPlacesData.haversineMeters(s.lat, s.lng, e.lat, e.lng) / 1000.0
          );
          setEmptyRoutesMessage(
            `${currentMode} is not available for a ${distKm} km trip between ${s.name} and ${e.name}. Switch to Mix, Train, Bus, or Car.`
          );
          setSelectedRoute(null);
          setRoutesLoadState(DataLoadState.EMPTY);
          return currentMode;
        } else {
          setEmptyRoutesMessage('');
          setSelectedRoute(
            (prev) =>
              (prev ? modeFiltered.find((r) => r.id === prev.id) : null) ??
              modeFiltered.find((r) => r.id === best?.id) ??
              modeFiltered[0] ??
              best
          );
          setRoutesLoadState(DataLoadState.READY);
          return currentMode;
        }
      });

      setIsRoutesSheetOpen(true);
      setSheetSnapPoint((prevSnap) =>
        prevSnap === SheetSnapPoint.PEEK ? SheetSnapPoint.HALF : prevSnap
      );
      if (!preserveStepByStep) {
        setIsStepByStepOpen(false);
      }
    },
    []
  );

  // When selectedMode changes, update selectedRoute from already-loaded routes without wiping live data
  useEffect(() => {
    if (!startPlace || !endPlace || routes.length === 0) return;
    const best = recommendBestRoute(routes);
    const modeFiltered =
      selectedMode === TravelMode.MIX
        ? routes
        : routes.filter((r) => r.mode === selectedMode);

    if (modeFiltered.length === 0) {
      const distKm = Math.round(
        DelhiPlacesData.haversineMeters(
          startPlace.lat,
          startPlace.lng,
          endPlace.lat,
          endPlace.lng
        ) / 1000.0
      );
      setEmptyRoutesMessage(
        `${selectedMode} is not available for a ${distKm} km trip between ${startPlace.name} and ${endPlace.name}. Switch to Mix, Train, Bus, or Car.`
      );
      setSelectedRoute(null);
      setRoutesLoadState(DataLoadState.EMPTY);
    } else {
      setEmptyRoutesMessage('');
      setSelectedRoute(
        (prev) =>
          (prev ? modeFiltered.find((r) => r.id === prev.id) : null) ??
          modeFiltered.find((r) => r.id === best?.id) ??
          modeFiltered[0] ??
          best
      );
      setRoutesLoadState(DataLoadState.READY);
    }
  }, [selectedMode]);

  const triggerRouteSearch = useCallback(() => {
    if (!startPlace || !endPlace) {
      setRoutes([]);
      setRecommendedRoute(null);
      setSelectedRoute(null);
      setModeAvailability([]);
      setIsRoutesSheetOpen(false);
      setIsStepByStepOpen(false);
      setRoutesLoadState(DataLoadState.EMPTY);
      return;
    }

    if (
      startPlace.id === endPlace.id ||
      startPlace.name.trim().toLowerCase() ===
        endPlace.name.trim().toLowerCase()
    ) {
      setRoutes([]);
      setRecommendedRoute(null);
      setSelectedRoute(null);
      setEmptyRoutesMessage(
        'Start and destination are the same location. Please choose two different places.'
      );
      setIsRoutesSheetOpen(true);
      setRoutesLoadState(DataLoadState.EMPTY);
      return;
    }

    setSearchNonce((n) => n + 1);
  }, [startPlace, endPlace]);

  useEffect(() => {
    let cancelled = false;

    if (!startPlace || !endPlace) {
      setRoutes([]);
      setRecommendedRoute(null);
      setSelectedRoute(null);
      setModeAvailability([]);
      setIsRoutesSheetOpen(false);
      setIsStepByStepOpen(false);
      setRoutesLoadState(DataLoadState.EMPTY);
      return;
    }
    if (
      startPlace.id === endPlace.id ||
      startPlace.name.trim().toLowerCase() ===
        endPlace.name.trim().toLowerCase()
    ) {
      setRoutes([]);
      setRecommendedRoute(null);
      setSelectedRoute(null);
      setEmptyRoutesMessage(
        'Start and destination are the same location. Please choose two different places.'
      );
      setIsRoutesSheetOpen(true);
      setRoutesLoadState(DataLoadState.EMPTY);
      return;
    }

    // 1. Instant local computation for zero-latency responsiveness
    const instantPricing =
      TransitAvailabilityApi.evaluateInstantModeAvailability(
        startPlace,
        endPlace
      );
    const instantComputed = GetRoutesApi.planRoutesOnDevice(
      startPlace,
      endPlace,
      reachByTime,
      instantPricing
    );
    applyComputedRoutes(
      instantComputed,
      startPlace,
      endPlace,
      instantPricing,
      false
    );

    // 2. Live API refinement (accurate geocoding + OSRM/ORS road geometry & steps + Overpass/Gemini verification)
    (async () => {
      const [accurateStart, accurateEnd] = await Promise.all([
        DelhiPlacesData.resolveAccuratePlace(startPlace),
        DelhiPlacesData.resolveAccuratePlace(endPlace),
      ]);
      if (cancelled) return;

      const livePricing =
        await TransitAvailabilityApi.fetchLiveTransitAndPricingFromApis(
          accurateStart,
          accurateEnd
        );
      if (cancelled) return;

      const liveComputed = GetRoutesApi.planRoutesOnDevice(
        accurateStart,
        accurateEnd,
        reachByTime,
        livePricing
      );
      if (!cancelled) {
        applyComputedRoutes(
          liveComputed,
          accurateStart,
          accurateEnd,
          livePricing,
          true
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startPlace, endPlace, reachByTime, searchNonce, applyComputedRoutes]);

  const retryRouteSearch = useCallback(() => {
    triggerRouteSearch();
  }, [triggerRouteSearch]);

  const swapPlaces = useCallback(() => {
    setStartPlace((prevStart) => {
      const prevEnd = endPlace;
      setEndPlace(prevStart);
      return prevEnd;
    });
  }, [endPlace]);

  const saveRouteToBookmarks = useCallback(
    (route: Route) => {
      if (!startPlace || !endPlace) return;
      const entry: SavedRouteEntry = {
        id: `${startPlace.id}_${endPlace.id}_${route.mode}`,
        startName: startPlace.name,
        endName: endPlace.name,
        mode: route.mode,
        durationMinutes: route.durationMinutes,
        fareInr: route.fareInr,
        summary: route.summary,
      };
      setSavedRoutes(SavedRoutesManager.saveRoute(entry));
    },
    [startPlace, endPlace]
  );

  const deleteSavedRoute = useCallback((id: string) => {
    setSavedRoutes(SavedRoutesManager.deleteRoute(id));
  }, []);

  const restoreSavedRoute = useCallback(
    (entry: SavedRouteEntry, index: number) => {
      setSavedRoutes(SavedRoutesManager.restoreRoute(entry, index));
    },
    []
  );

  const applySavedRoute = useCallback((entry: SavedRouteEntry) => {
    const startMatch =
      DelhiPlacesData.places.find((p) => p.name === entry.startName) ??
      DelhiPlacesData.searchPlaces(entry.startName)[0] ??
      null;
    const endMatch =
      DelhiPlacesData.places.find((p) => p.name === entry.endName) ??
      DelhiPlacesData.searchPlaces(entry.endName)[0] ??
      null;
    setStartPlace(startMatch);
    setEndPlace(endMatch);
    setSelectedMode(entry.mode);
    setIsSavedScreenOpen(false);
    setIsRoutesSheetOpen(true);
    setSheetSnapPoint(SheetSnapPoint.HALF);
  }, []);

  const value = useMemo<TripContextValue>(
    () => ({
      startPlace,
      setStartPlace,
      endPlace,
      setEndPlace,
      selectedMode,
      setSelectedMode,
      reachByTime,
      setReachByTime,
      isRoutesSheetOpen,
      setIsRoutesSheetOpen,
      sheetSnapPoint,
      setSheetSnapPoint,
      routes,
      recommendedRoute,
      selectedRoute,
      setSelectedRoute,
      isStepByStepOpen,
      setIsStepByStepOpen,
      isLiveRideActive,
      setIsLiveRideActive,
      isSavedScreenOpen,
      setIsSavedScreenOpen,
      isChatExpanded,
      setIsChatExpanded,
      savedRoutes,
      routesLoadState,
      emptyRoutesMessage,
      modeAvailability,
      triggerRouteSearch,
      retryRouteSearch,
      swapPlaces,
      saveRouteToBookmarks,
      deleteSavedRoute,
      restoreSavedRoute,
      applySavedRoute,
    }),
    [
      startPlace,
      endPlace,
      selectedMode,
      reachByTime,
      isRoutesSheetOpen,
      sheetSnapPoint,
      routes,
      recommendedRoute,
      selectedRoute,
      isStepByStepOpen,
      isLiveRideActive,
      isSavedScreenOpen,
      isChatExpanded,
      savedRoutes,
      routesLoadState,
      emptyRoutesMessage,
      modeAvailability,
      triggerRouteSearch,
      retryRouteSearch,
      swapPlaces,
      saveRouteToBookmarks,
      deleteSavedRoute,
      restoreSavedRoute,
      applySavedRoute,
    ]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error('useTripContext must be used inside TripContextProvider');
  }
  return ctx;
}
