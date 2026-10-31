import React from 'react';
import { formatDuration } from '../lib/commuteFormatters';
import { Route, RouteLabel, RouteStep, TravelMode } from '../lib/types';
import { routeSupportsTurnByTurn } from '../lib/useNavigation';
import { BackArrowIcon, TravelModeIcon } from './Icons';
import { ManeuverArrowIcon } from './NavigationBanner';

interface StepByStepViewProps {
  route: Route;
  onBack: () => void;
  onStartNavigation?: () => void;
}

function extractTransitStationHint(step: RouteStep): string | null {
  if (
    step.mode !== TravelMode.METRO &&
    step.mode !== TravelMode.TRAIN &&
    step.mode !== TravelMode.BUS
  ) {
    return null;
  }
  const match = /towards\s+([^()•]+)/i.exec(step.instruction);
  if (!match) return null;
  const station = match[1].replace(/corridor$/i, '').trim();
  return station ? `Next station: ${station}` : null;
}

function formatStepDistance(distanceMeters?: number): string | null {
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return null;
  }
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

export const StepByStepView: React.FC<StepByStepViewProps> = ({
  route,
  onBack,
  onStartNavigation,
}) => {
  const canNavigate = routeSupportsTurnByTurn(route);
  const isRoadOrMixMode =
    route.mode === TravelMode.CAR ||
    route.mode === TravelMode.BIKE ||
    route.mode === TravelMode.WALK ||
    route.mode === TravelMode.MIX;
  const turnByTurnUnavailable =
    isRoadOrMixMode &&
    (!route.stepsSource ||
      route.stepsSource === 'template' ||
      route.steps.length === 0);

  return (
    <div
      data-testid="step_by_step_view"
      className="w-full h-full flex flex-col px-[16px] py-[8px] overflow-hidden"
    >
      <div className="flex items-center">
        <button
          type="button"
          data-testid="step_by_step_back_button"
          onClick={onBack}
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-[#f1f3f4] cursor-pointer shrink-0"
          aria-label="Back to routes"
        >
          <BackArrowIcon color="#202124" size={20} />
        </button>

        <div className="ml-[8px] flex-1 min-w-0">
          <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
            {formatDuration(route.durationMinutes)} •{' '}
            {route.fareInr === 0 ? 'Free' : `₹${route.fareInr}`}
          </div>
          <div className="text-[12px] leading-[16px] text-[#5f6368] truncate">
            {route.summary} • Reliable {route.reliabilityScore}/10
          </div>
        </div>

        {route.label !== RouteLabel.None && (
          <div className="px-[8px] py-[4px] rounded-full bg-[#e8f0fe] text-[12px] leading-[16px] font-medium text-[#1a73e8] shrink-0">
            {route.label}
          </div>
        )}
      </div>

      {canNavigate && !turnByTurnUnavailable && onStartNavigation && (
        <div className="mt-[12px]">
          <button
            type="button"
            data-testid="start_turn_by_turn_navigation_button"
            onClick={onStartNavigation}
            className="w-full h-[48px] rounded-full bg-[#1a73e8] text-[#ffffff] text-[14px] leading-[20px] font-medium flex items-center justify-center gap-[8px] cursor-pointer"
          >
            <ManeuverArrowIcon maneuver="depart" color="#ffffff" size={18} />
            <span>Start navigation</span>
          </button>
        </div>
      )}

      <div className="h-[1px] bg-[#dadce0] my-[12px]" />

      <div className="flex-1 overflow-y-auto pb-[24px]">
        {turnByTurnUnavailable ? (
          <div
            data-testid="turn_by_turn_unavailable_message"
            className="py-[16px] text-[14px] leading-[20px] text-[#5f6368]"
          >
            Turn-by-turn unavailable for this route
          </div>
        ) : (
          route.steps.map((step, index) => {
            const isRoadManeuver =
              (step.mode === TravelMode.CAR ||
                step.mode === TravelMode.BIKE ||
                step.mode === TravelMode.WALK) &&
              Boolean(step.maneuver);
            const transitStationHint = !isRoadManeuver
              ? extractTransitStationHint(step)
              : null;
            const distLabel = formatStepDistance(step.distanceMeters);

            return (
              <div key={index} className="w-full flex items-start">
                <div className="w-[32px] flex flex-col items-center shrink-0">
                  <div className="w-[32px] h-[32px] rounded-full bg-[#e8f0fe] flex items-center justify-center">
                    {isRoadManeuver ? (
                      <ManeuverArrowIcon
                        maneuver={step.maneuver}
                        color="#1a73e8"
                        size={16}
                      />
                    ) : (
                      <TravelModeIcon
                        mode={step.mode}
                        color="#1a73e8"
                        size={16}
                      />
                    )}
                  </div>
                  {index < route.steps.length - 1 && (
                    <div className="w-[2px] h-[32px] my-[4px] bg-[#dadce0]" />
                  )}
                </div>

                <div className="ml-[12px] pb-[16px] flex-1 min-w-0">
                  <div className="text-[14px] leading-[20px] font-medium text-[#202124]">
                    {step.instruction}
                  </div>
                  <div className="mt-[4px] text-[12px] leading-[16px] text-[#5f6368]">
                    {distLabel ? `${distLabel} • ` : ''}
                    {formatDuration(step.durationMinutes)} • {step.mode}
                    {step.streetName ? ` • ${step.streetName}` : ''}
                    {step.landmark ? ` • Near ${step.landmark}` : ''}
                    {transitStationHint ? ` • ${transitStationHint}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
