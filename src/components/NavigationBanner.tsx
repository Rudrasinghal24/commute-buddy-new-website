import React from 'react';
import { formatDistanceMeters } from '../lib/commuteFormatters';
import { ManeuverType, RouteStep } from '../lib/types';
import { NavigationStatus } from '../lib/useNavigation';

interface NavigationBannerProps {
  status: NavigationStatus;
  errorMessage: string | null;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  metersToNextTurn: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndNavigation: () => void;
}

export const ManeuverArrowIcon: React.FC<{
  maneuver?: ManeuverType;
  color?: string;
  size?: number;
}> = ({ maneuver = 'straight', color = '#ffffff', size = 24 }) => {
  switch (maneuver) {
    case 'left':
    case 'sharp_left':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 14l-5-5 5-5" />
          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
      );
    case 'right':
    case 'sharp_right':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 14l5-5-5-5" />
          <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
        </svg>
      );
    case 'slight_left':
    case 'keep_left':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 20v-7l-9-9" />
          <path d="M8 10V4h6" />
        </svg>
      );
    case 'slight_right':
    case 'keep_right':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 20v-7l9-9" />
          <path d="M16 10V4h-6" />
        </svg>
      );
    case 'uturn':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
      );
    case 'roundabout':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 16v5" />
          <path d="M12 8V3" />
          <path d="M9 6l3-3 3 3" />
        </svg>
      );
    case 'arrive':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'depart':
    case 'straight':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      );
  }
};

export const VolumeIcon: React.FC<{ muted: boolean; color?: string }> = ({
  muted,
  color = '#202124',
}) => {
  if (muted) {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M23 9l-6 6" />
        <path d="M17 9l6 6" />
      </svg>
    );
  }
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
};

function formatManeuverHeadline(step: RouteStep | null): string {
  if (!step) return 'Proceed on route';
  if (step.streetName) {
    switch (step.maneuver) {
      case 'left':
        return `Turn left onto ${step.streetName}`;
      case 'right':
        return `Turn right onto ${step.streetName}`;
      case 'slight_left':
        return `Slight left onto ${step.streetName}`;
      case 'slight_right':
        return `Slight right onto ${step.streetName}`;
      case 'sharp_left':
        return `Sharp left onto ${step.streetName}`;
      case 'sharp_right':
        return `Sharp right onto ${step.streetName}`;
      case 'keep_left':
        return `Keep left onto ${step.streetName}`;
      case 'keep_right':
        return `Keep right onto ${step.streetName}`;
      case 'uturn':
        return `U-turn onto ${step.streetName}`;
      case 'roundabout':
        return `Roundabout onto ${step.streetName}`;
      case 'depart':
        return `Head on ${step.streetName}`;
      case 'arrive':
        return 'Arrive at destination';
      default:
        return `Continue on ${step.streetName}`;
    }
  }
  return step.instruction;
}

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
  status,
  errorMessage,
  currentStep,
  nextStep,
  metersToNextTurn,
  isMuted,
  onToggleMute,
  onEndNavigation,
}) => {
  if (status === 'idle') return null;

  const displayStep = nextStep ?? currentStep;

  return (
    <div
      data-testid="navigation_banner"
      className="w-full px-[16px] pt-[12px]"
    >
      <div className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow p-[12px] flex items-center gap-[12px]">
        {/* Maneuver icon box */}
        <div className="w-[48px] h-[48px] rounded-[12px] bg-[#1a73e8] flex items-center justify-center shrink-0">
          <ManeuverArrowIcon
            maneuver={
              status === 'arrived' ? 'arrive' : displayStep?.maneuver ?? 'straight'
            }
            color="#ffffff"
            size={24}
          />
        </div>

        {/* Turn distance, streetName, landmark, or GPS status message */}
        <div className="flex-1 min-w-0">
          {errorMessage ? (
            <>
              <div className="text-[14px] leading-[20px] font-medium text-[#d93025]">
                {status === 'permission_denied'
                  ? 'Location permission denied'
                  : 'GPS signal unavailable'}
              </div>
              <div className="mt-[2px] text-[12px] leading-[16px] text-[#5f6368] truncate">
                {errorMessage}
              </div>
            </>
          ) : status === 'arrived' ? (
            <>
              <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
                You have arrived
              </div>
              <div className="mt-[2px] text-[12px] leading-[16px] text-[#5f6368] truncate">
                Destination reached
              </div>
            </>
          ) : status === 'rerouting' ? (
            <>
              <div className="text-[16px] leading-[24px] font-medium text-[#1a73e8]">
                Rerouting...
              </div>
              <div className="mt-[2px] text-[12px] leading-[16px] text-[#5f6368] truncate">
                Updating path from your current GPS position
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-[8px]">
                <span
                  data-testid="nav_banner_distance"
                  className="text-[18px] leading-[24px] font-bold text-[#1a73e8]"
                >
                  {formatDistanceMeters(metersToNextTurn)}
                </span>
                <span
                  data-testid="nav_banner_street"
                  className="text-[16px] leading-[24px] font-medium text-[#202124] truncate"
                >
                  {formatManeuverHeadline(displayStep)}
                </span>
              </div>
              {displayStep?.landmark && (
                <div
                  data-testid="nav_banner_landmark"
                  className="mt-[2px] text-[12px] leading-[16px] text-[#5f6368] truncate"
                >
                  Near {displayStep.landmark}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mute / Unmute toggle (48px touch target) */}
        <button
          type="button"
          data-testid="nav_mute_toggle_button"
          onClick={onToggleMute}
          className="w-[48px] h-[48px] rounded-full bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center hover:bg-[#e8f0fe] cursor-pointer shrink-0"
          aria-label={isMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
        >
          <VolumeIcon muted={isMuted} color={isMuted ? '#5f6368' : '#1a73e8'} />
        </button>

        {/* End navigation button (48px touch target) */}
        <button
          type="button"
          data-testid="nav_end_button"
          onClick={onEndNavigation}
          className="h-[48px] px-[16px] rounded-full bg-[#d93025] text-[#ffffff] text-[14px] leading-[20px] font-medium flex items-center justify-center cursor-pointer shrink-0"
        >
          End
        </button>
      </div>
    </div>
  );
};
