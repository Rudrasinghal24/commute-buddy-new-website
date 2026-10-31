import React, { useState } from 'react';
import { useTripContext } from '../lib/TripContext';
import {
  ModeAvailabilityStatus,
  TravelMode,
  TravelModeLabels,
} from '../lib/types';
import { ClockIcon, TravelModeIcon } from './Icons';

const ALL_MODES: TravelMode[] = [
  TravelMode.MIX,
  TravelMode.METRO,
  TravelMode.BUS,
  TravelMode.TRAIN,
  TravelMode.FLIGHT,
  TravelMode.CAR,
  TravelMode.BIKE,
  TravelMode.WALK,
];

const REACH_BY_OPTIONS = [
  'Depart now (Anytime)',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '12:30 PM',
  '06:00 PM',
  '08:00 PM',
];

export const ModeChipsRow: React.FC = () => {
  const trip = useTripContext();
  const [showReachByDialog, setShowReachByDialog] = useState(false);

  if (!trip.startPlace || !trip.endPlace) return null;

  const availableModes =
    trip.modeAvailability.length === 0
      ? ALL_MODES
      : ALL_MODES.filter((mode) => {
          const entry = trip.modeAvailability.find((a) => a.mode === mode);
          return !entry || entry.status === ModeAvailabilityStatus.AVAILABLE;
        });

  const hasReachBy =
    trip.reachByTime !== null && trip.reachByTime.trim() !== '';

  return (
    <>
      <div
        data-testid="mode_chips_row"
        className="w-full pt-[8px] px-[16px] flex items-center gap-[8px] overflow-x-auto no-scrollbar"
      >
        {availableModes.map((mode) => {
          const isSelected = trip.selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              data-testid={`mode_chip_${mode.toLowerCase()}`}
              onClick={() => trip.setSelectedMode(mode)}
              className={`h-[48px] px-[12px] rounded-full border gmaps-shadow flex items-center gap-[8px] shrink-0 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]'
                  : 'bg-[#ffffff] border-[#dadce0] text-[#202124]'
              }`}
            >
              <TravelModeIcon
                mode={mode}
                color={isSelected ? '#1a73e8' : '#5f6368'}
                size={18}
              />
              <span className="text-[14px] leading-[20px] font-medium">
                {TravelModeLabels[mode]}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          data-testid="reach_by_chip"
          onClick={() => setShowReachByDialog(true)}
          className={`h-[48px] px-[12px] rounded-full border gmaps-shadow flex items-center gap-[8px] shrink-0 cursor-pointer transition-colors ${
            hasReachBy
              ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]'
              : 'bg-[#ffffff] border-[#dadce0] text-[#202124]'
          }`}
        >
          <ClockIcon
            color={hasReachBy ? '#1a73e8' : '#5f6368'}
            size={16}
          />
          <span className="text-[14px] leading-[20px] font-medium">
            {hasReachBy ? `Reach ${trip.reachByTime}` : 'Reach by'}
          </span>
        </button>
      </div>

      {showReachByDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[16px]"
          onClick={() => setShowReachByDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] rounded-[12px] bg-[#ffffff] p-[16px] gmaps-shadow border border-[#dadce0]"
          >
            <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
              Reach destination by
            </div>
            <div className="mt-[4px] text-[12px] leading-[16px] text-[#5f6368]">
              Calculates recommended departure time for each route
            </div>
            <div className="mt-[12px] flex flex-col">
              {REACH_BY_OPTIONS.map((opt) => {
                const isSelected =
                  (opt.startsWith('Depart now') && !trip.reachByTime) ||
                  trip.reachByTime === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      trip.setReachByTime(
                        opt.startsWith('Depart now') ? null : opt
                      );
                      setShowReachByDialog(false);
                    }}
                    className={`w-full min-h-[48px] px-[12px] rounded-[8px] flex items-center justify-between text-left cursor-pointer ${
                      isSelected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f1f3f4]'
                    }`}
                  >
                    <span
                      className={`text-[14px] leading-[20px] ${
                        isSelected
                          ? 'font-medium text-[#1a73e8]'
                          : 'text-[#202124]'
                      }`}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-[8px] flex justify-end">
              <button
                type="button"
                onClick={() => setShowReachByDialog(false)}
                className="min-h-[48px] px-[16px] text-[14px] font-medium text-[#5f6368] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
