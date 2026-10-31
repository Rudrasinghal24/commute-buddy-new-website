import React from 'react';
import { formatDuration, formatVsFastest } from '../lib/commuteFormatters';
import { Route, RouteLabel } from '../lib/types';
import { BookmarkIcon, TravelModeIcon } from './Icons';

interface RouteCardProps {
  route: Route;
  fastestRoute: Route | null;
  isSelected: boolean;
  isBookmarked: boolean;
  isLiveRideActive?: boolean;
  onSelect: () => void;
  onStartStepByStep: () => void;
  onToggleLiveRide?: () => void;
  onBookmark: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  fastestRoute,
  isSelected,
  isBookmarked,
  isLiveRideActive = false,
  onSelect,
  onStartStepByStep,
  onToggleLiveRide,
  onBookmark,
}) => {
  return (
    <div
      data-testid={`route_card_${route.id}`}
      onClick={onSelect}
      className={`w-full rounded-[12px] bg-[#ffffff] p-[16px] cursor-pointer transition-colors ${
        isSelected
          ? 'border-2 border-[#1a73e8] gmaps-shadow'
          : 'border border-[#dadce0]'
      }`}
    >
      {/* Top row: Mode icon + Duration (left) and Fare (right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <div
            className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center ${
              isSelected ? 'bg-[#e8f0fe]' : 'bg-[#f1f3f4]'
            }`}
          >
            <TravelModeIcon
              mode={route.mode}
              color={isSelected ? '#1a73e8' : '#202124'}
              size={18}
            />
          </div>
          <span className="text-[16px] leading-[24px] font-medium text-[#202124]">
            {formatDuration(route.durationMinutes)}
          </span>
        </div>

        <span className="text-[16px] leading-[24px] font-medium text-[#202124]">
          {route.fareInr === 0 ? 'Free' : `₹${route.fareInr}`}
        </span>
      </div>

      {/* Second row: Route summary */}
      <div className="mt-[8px] text-[14px] leading-[20px] text-[#5f6368]">
        {route.summary}
      </div>

      {/* Third row: Optional single badge chip */}
      {route.label !== RouteLabel.None && (
        <div className="mt-[8px]">
          <span className="inline-block px-[8px] py-[4px] rounded-full bg-[#e8f0fe] text-[12px] leading-[16px] font-medium text-[#1a73e8]">
            {route.label}
          </span>
        </div>
      )}

      {/* Expanded details box when selected */}
      {isSelected && (
        <div className="mt-[12px] rounded-[8px] bg-[#f1f3f4] p-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] leading-[16px] font-medium text-[#202124]">
              {formatVsFastest(route, fastestRoute)}
            </span>
            <span className="text-[12px] leading-[16px] text-[#5f6368]">
              Reliable {route.reliabilityScore}/10
            </span>
          </div>

          {route.trafficStatus && (
            <div className="mt-[4px] text-[12px] leading-[16px] text-[#5f6368]">
              {route.trafficStatus}
            </div>
          )}

          {route.recommendationReason && (
            <div className="mt-[4px] text-[12px] leading-[16px] font-medium text-[#1a73e8]">
              {route.recommendationReason}
            </div>
          )}

          {route.leaveByLabel && (
            <div className="mt-[4px] text-[12px] leading-[16px] font-medium text-[#1a73e8]">
              {route.leaveByLabel}
            </div>
          )}

          <div className="mt-[12px] flex items-center gap-[8px]">
            <button
              type="button"
              data-testid={`start_route_button_${route.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onStartStepByStep();
              }}
              className="flex-1 h-[48px] rounded-full bg-[#1a73e8] text-[#ffffff] text-[14px] leading-[20px] font-medium flex items-center justify-center cursor-pointer"
            >
              Start
            </button>

            <button
              type="button"
              data-testid={`live_ride_button_${route.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLiveRide?.();
              }}
              className={`h-[48px] px-[12px] rounded-full border text-[12px] leading-[16px] font-medium flex items-center justify-center cursor-pointer ${
                isLiveRideActive
                  ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]'
                  : 'bg-[#ffffff] border-[#dadce0] text-[#202124]'
              }`}
            >
              {isLiveRideActive ? 'Live Active' : 'Live Road'}
            </button>

            <button
              type="button"
              data-testid={`bookmark_route_button_${route.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
              className="w-[48px] h-[48px] rounded-full bg-[#ffffff] border border-[#dadce0] flex items-center justify-center hover:bg-[#e8f0fe] cursor-pointer shrink-0"
              aria-label="Bookmark route"
            >
              <BookmarkIcon
                color={isBookmarked ? '#1a73e8' : '#5f6368'}
                size={18}
                filled={isBookmarked}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
