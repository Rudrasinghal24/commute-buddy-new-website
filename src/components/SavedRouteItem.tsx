import React from 'react';
import { SavedRouteEntry } from '../lib/types';
import { TrashDeleteIcon, TravelModeIcon } from './Icons';

interface SavedRouteItemProps {
  entry: SavedRouteEntry;
  onCheckNow: () => void;
  onDelete: () => void;
}

export const SavedRouteItem: React.FC<SavedRouteItemProps> = ({
  entry,
  onCheckNow,
  onDelete,
}) => {
  const vehicleLabel =
    entry.summary.trim() !== '' ? entry.summary : entry.mode;

  return (
    <div
      data-testid={`saved_route_${entry.id}`}
      className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow p-[16px] flex items-center gap-[12px]"
    >
      <div className="w-[40px] h-[40px] rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0">
        <TravelModeIcon mode={entry.mode} color="#1a73e8" size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[16px] leading-[24px] font-medium text-[#202124] truncate">
          {entry.startName} to {entry.endName}
        </div>
        <div className="mt-[4px] text-[14px] leading-[20px] text-[#5f6368] truncate">
          {vehicleLabel}
        </div>
      </div>

      <div className="flex items-center gap-[8px] shrink-0">
        <button
          type="button"
          data-testid={`check_now_${entry.id}`}
          onClick={onCheckNow}
          className="h-[48px] px-[12px] rounded-full bg-[#e8f0fe] border border-[#1a73e8] text-[#1a73e8] text-[14px] leading-[20px] font-medium flex items-center justify-center cursor-pointer"
        >
          Check now
        </button>

        <button
          type="button"
          data-testid={`delete_saved_${entry.id}`}
          onClick={onDelete}
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-[#f1f3f4] cursor-pointer"
          aria-label="Delete saved route"
        >
          <TrashDeleteIcon color="#5f6368" size={20} />
        </button>
      </div>
    </div>
  );
};
