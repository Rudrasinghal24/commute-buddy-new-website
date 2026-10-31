import React, { useRef } from 'react';
import { DataLoadState } from '../data/commuteData';
import { useTripContext } from '../lib/TripContext';
import {
  filterRoutesByModeAndQuery,
  formatDuration,
} from '../lib/commuteFormatters';
import {
  ModeAvailabilityStatus,
  Route,
  RouteLabel,
  SheetSnapPoint,
  TravelMode,
  TravelModeLabels,
} from '../lib/types';
import { CloseXIcon } from './Icons';
import { RouteCardSkeleton, RoutesEmptyOrErrorBox } from './ListStateView';
import { RouteCard } from './RouteCard';
import { StepByStepView } from './StepByStepView';

export const BottomSheet: React.FC<{
  onStartNavigation?: (route: Route) => void;
}> = ({ onStartNavigation }) => {
  const trip = useTripContext();
  const dragStartYRef = useRef<number | null>(null);
  const dragDeltaYRef = useRef<number>(0);

  if (!trip.isRoutesSheetOpen) return null;

  const filteredRoutes = filterRoutesByModeAndQuery(
    trip.routes,
    trip.selectedMode
  );
  const orderedRoutes = [...filteredRoutes].sort((a, b) => {
    const aRec = a.label === RouteLabel.Recommended ? 0 : 1;
    const bRec = b.label === RouteLabel.Recommended ? 0 : 1;
    return aRec - bRec;
  });

  const fastestRoute =
    trip.routes.length > 0
      ? trip.routes.reduce((min, r) =>
          r.durationMinutes < min.durationMinutes ? r : min
        )
      : null;

  const nonZeroRoutes = trip.routes.filter((r) => r.fareInr > 0);
  const cheapestRoute =
    nonZeroRoutes.length > 0
      ? nonZeroRoutes.reduce((min, r) => (r.fareInr < min.fareInr ? r : min))
      : fastestRoute;

  const unavailableModes = trip.modeAvailability
    .filter((a) => a.status === ModeAvailabilityStatus.NOT_AVAILABLE)
    .map((a) => TravelModeLabels[a.mode]);
  const availableModes = trip.modeAvailability
    .filter((a) => a.status === ModeAvailabilityStatus.AVAILABLE)
    .map((a) => TravelModeLabels[a.mode]);

  const cycleSnapPoint = () => {
    const next =
      trip.sheetSnapPoint === SheetSnapPoint.PEEK
        ? SheetSnapPoint.HALF
        : trip.sheetSnapPoint === SheetSnapPoint.HALF
        ? SheetSnapPoint.FULL
        : SheetSnapPoint.PEEK;
    trip.setSheetSnapPoint(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    dragDeltaYRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    dragDeltaYRef.current = e.clientY - dragStartYRef.current;
  };

  const handlePointerUp = () => {
    if (dragStartYRef.current === null) return;
    const delta = dragDeltaYRef.current;
    dragStartYRef.current = null;
    dragDeltaYRef.current = 0;

    if (delta < -36) {
      const nextUp =
        trip.sheetSnapPoint === SheetSnapPoint.PEEK
          ? SheetSnapPoint.HALF
          : SheetSnapPoint.FULL;
      trip.setSheetSnapPoint(nextUp);
    } else if (delta > 36) {
      const nextDown =
        trip.sheetSnapPoint === SheetSnapPoint.FULL
          ? SheetSnapPoint.HALF
          : SheetSnapPoint.PEEK;
      trip.setSheetSnapPoint(nextDown);
    } else if (Math.abs(delta) < 8) {
      cycleSnapPoint();
    }
  };

  const sheetHeightClass =
    trip.sheetSnapPoint === SheetSnapPoint.PEEK
      ? 'h-[96px]'
      : trip.sheetSnapPoint === SheetSnapPoint.HALF
      ? 'h-[50%]'
      : 'h-[92%]';

  return (
    <div
      data-testid="routes_bottom_sheet"
      className={`w-full ${sheetHeightClass} rounded-t-[16px] bg-[#ffffff] border-t border-[#dadce0] gmaps-shadow flex flex-col transition-[height] duration-200 ease-out overflow-hidden`}
    >
      {/* Drag handle area (48px minimum touch target) */}
      <div
        data-testid="bottom_sheet_handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[48px] flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <div className="w-[36px] h-[4px] rounded-full bg-[#dadce0]" />
      </div>

      {trip.isStepByStepOpen && trip.selectedRoute ? (
        <StepByStepView
          route={trip.selectedRoute}
          onBack={() => trip.setIsStepByStepOpen(false)}
          onStartNavigation={
            onStartNavigation
              ? () => onStartNavigation(trip.selectedRoute!)
              : undefined
          }
        />
      ) : (
        <div className="w-full flex-1 flex flex-col px-[16px] overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex-1 min-w-0">
              <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
                {TravelModeLabels[trip.selectedMode]} routes
              </div>
              <div className="text-[12px] leading-[16px] text-[#5f6368] truncate">
                {trip.reachByTime === null
                  ? 'Departing now'
                  : `Reach by ${trip.reachByTime}`}
                {fastestRoute?.trafficStatus
                  ? ` • ${fastestRoute.trafficStatus}`
                  : ''}
              </div>
              {availableModes.length > 0 && (
                <div className="mt-[4px] text-[12px] leading-[16px] font-medium text-[#1a73e8] truncate">
                  Available: {availableModes.join(', ')}
                  {unavailableModes.length > 0
                    ? ` • Not in this city: ${unavailableModes.join(', ')}`
                    : ''}
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="close_routes_sheet_button"
              onClick={() => trip.setIsRoutesSheetOpen(false)}
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-[#f1f3f4] cursor-pointer shrink-0"
              aria-label="Close routes sheet"
            >
              <CloseXIcon color="#5f6368" size={20} />
            </button>
          </div>

          <div className="mt-[8px] flex-1 overflow-y-auto pb-[24px]">
            {trip.routesLoadState === DataLoadState.LOADING && (
              <RouteCardSkeleton count={3} />
            )}

            {trip.routesLoadState === DataLoadState.ERROR && (
              <RoutesEmptyOrErrorBox
                title="Unable to load routes"
                subtitle="Check your connection and try again."
                actionLabel="Retry"
                onAction={() => trip.retryRouteSearch()}
              />
            )}

            {trip.routesLoadState === DataLoadState.EMPTY && (
              <RoutesEmptyOrErrorBox
                title="No direct routes found"
                subtitle={
                  trip.emptyRoutesMessage ||
                  'Try switching travel mode or selecting another station.'
                }
                actionLabel={
                  trip.selectedMode !== TravelMode.MIX
                    ? 'Show Mix routes'
                    : undefined
                }
                onAction={
                  trip.selectedMode !== TravelMode.MIX
                    ? () => trip.setSelectedMode(TravelMode.MIX)
                    : undefined
                }
              />
            )}

            {trip.routesLoadState === DataLoadState.READY &&
              (orderedRoutes.length === 0 ? (
                <RoutesEmptyOrErrorBox
                  title={`No ${TravelModeLabels[trip.selectedMode]} routes`}
                  subtitle="Switch to Mix to see all transit options."
                  actionLabel="Show Mix routes"
                  onAction={() => trip.setSelectedMode(TravelMode.MIX)}
                />
              ) : (
                <div
                  data-testid="routes_list"
                  className="flex flex-col gap-[8px]"
                >
                  {orderedRoutes.map((route) => {
                    const isSelected = trip.selectedRoute?.id === route.id;
                    const bookmarkId = `${trip.startPlace?.id}_${trip.endPlace?.id}_${route.mode}`;
                    const isBookmarked = trip.savedRoutes.some(
                      (s) => s.id === bookmarkId
                    );

                    return (
                      <RouteCard
                        key={route.id}
                        route={route}
                        fastestRoute={fastestRoute}
                        isSelected={isSelected}
                        isBookmarked={isBookmarked}
                        isLiveRideActive={trip.isLiveRideActive && isSelected}
                        onSelect={() => trip.setSelectedRoute(route)}
                        onStartStepByStep={() => {
                          trip.setSelectedRoute(route);
                          trip.setIsStepByStepOpen(true);
                          trip.setSheetSnapPoint(SheetSnapPoint.FULL);
                        }}
                        onToggleLiveRide={() => {
                          trip.setSelectedRoute(route);
                          trip.setIsLiveRideActive(!trip.isLiveRideActive);
                          trip.setSheetSnapPoint(SheetSnapPoint.PEEK);
                        }}
                        onBookmark={() => trip.saveRouteToBookmarks(route)}
                      />
                    );
                  })}

                  <FastestAndCheapestSummaryCard
                    recommendedRoute={trip.recommendedRoute}
                    fastestRoute={fastestRoute}
                    cheapestRoute={cheapestRoute}
                    onSelectRoute={(route) => trip.setSelectedRoute(route)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  recommendedRoute: Route | null;
  fastestRoute: Route | null;
  cheapestRoute: Route | null;
  onSelectRoute: (route: Route) => void;
}

const FastestAndCheapestSummaryCard: React.FC<SummaryCardProps> = ({
  recommendedRoute,
  fastestRoute,
  cheapestRoute,
  onSelectRoute,
}) => {
  if (!fastestRoute && !cheapestRoute) return null;

  return (
    <div
      data-testid="fastest_cheapest_summary_card"
      className="w-full rounded-[12px] bg-[#f1f3f4] border border-[#dadce0] p-[12px]"
    >
      <div className="text-[12px] leading-[16px] font-medium text-[#202124]">
        Trip comparison summary (Time & Money)
      </div>

      {recommendedRoute && (
        <button
          type="button"
          onClick={() => onSelectRoute(recommendedRoute)}
          className="mt-[8px] w-full flex items-center justify-between text-left cursor-pointer"
        >
          <span className="text-[12px] leading-[16px] font-medium text-[#1a73e8] truncate pr-[8px]">
            Recommended: {recommendedRoute.summary}
          </span>
          <span className="text-[12px] leading-[16px] font-medium text-[#202124] shrink-0">
            {formatDuration(recommendedRoute.durationMinutes)} •{' '}
            {recommendedRoute.fareInr === 0
              ? 'Free'
              : `₹${recommendedRoute.fareInr}`}
          </span>
        </button>
      )}

      {fastestRoute && (
        <button
          type="button"
          onClick={() => onSelectRoute(fastestRoute)}
          className="mt-[6px] w-full flex items-center justify-between text-left cursor-pointer"
        >
          <span className="text-[12px] leading-[16px] text-[#5f6368] truncate pr-[8px]">
            Fastest: {fastestRoute.summary}
          </span>
          <span className="text-[12px] leading-[16px] font-medium text-[#202124] shrink-0">
            {formatDuration(fastestRoute.durationMinutes)} •{' '}
            {fastestRoute.fareInr === 0 ? 'Free' : `₹${fastestRoute.fareInr}`}
          </span>
        </button>
      )}

      {cheapestRoute && (
        <button
          type="button"
          onClick={() => onSelectRoute(cheapestRoute)}
          className="mt-[6px] w-full flex items-center justify-between text-left cursor-pointer"
        >
          <span className="text-[12px] leading-[16px] text-[#5f6368] truncate pr-[8px]">
            Cheapest: {cheapestRoute.summary}
          </span>
          <span className="text-[12px] leading-[16px] font-medium text-[#202124] shrink-0">
            {formatDuration(cheapestRoute.durationMinutes)} •{' '}
            {cheapestRoute.fareInr === 0 ? 'Free' : `₹${cheapestRoute.fareInr}`}
          </span>
        </button>
      )}
    </div>
  );
};
