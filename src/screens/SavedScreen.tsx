import React, { useEffect, useState } from 'react';
import { BackArrowIcon } from '../components/Icons';
import { SavedRouteItem } from '../components/SavedRouteItem';
import { useTripContext } from '../lib/TripContext';
import { SavedRouteEntry } from '../lib/types';

export const SavedScreen: React.FC = () => {
  const trip = useTripContext();
  const [recentlyDeleted, setRecentlyDeleted] = useState<{
    entry: SavedRouteEntry;
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!recentlyDeleted) return;
    const timer = setTimeout(() => {
      setRecentlyDeleted(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [recentlyDeleted]);

  return (
    <div
      data-testid="saved_screen"
      className="relative w-full h-full bg-[#f1f3f4] flex flex-col overflow-hidden"
    >
      {/* Top app bar */}
      <div className="w-full bg-[#ffffff] border-b border-[#dadce0] px-[8px] py-[8px] flex items-center shrink-0">
        <button
          type="button"
          data-testid="saved_back_button"
          onClick={() => trip.setIsSavedScreenOpen(false)}
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-[#f1f3f4] cursor-pointer shrink-0"
          aria-label="Back to map"
        >
          <BackArrowIcon color="#202124" size={20} />
        </button>

        <div className="ml-[8px] text-[22px] leading-[28px] font-medium text-[#202124]">
          Saved
        </div>
      </div>

      {trip.savedRoutes.length === 0 ? (
        <div
          data-testid="saved_empty_state"
          className="w-full flex-1 p-[24px] flex items-center justify-center"
        >
          <div className="text-[16px] leading-[24px] text-[#5f6368] text-center">
            No saved routes yet
          </div>
        </div>
      ) : (
        <div
          data-testid="saved_routes_list"
          className="w-full flex-1 overflow-y-auto p-[16px] flex flex-col gap-[8px]"
        >
          {trip.savedRoutes.map((entry, index) => (
            <SavedRouteItem
              key={entry.id}
              entry={entry}
              onCheckNow={() => trip.applySavedRoute(entry)}
              onDelete={() => {
                setRecentlyDeleted({ entry, index });
                trip.deleteSavedRoute(entry.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Undo Snackbar */}
      {recentlyDeleted && (
        <div
          data-testid="undo_snackbar"
          className="absolute bottom-[16px] left-[16px] right-[16px] rounded-[12px] bg-[#202124] px-[16px] py-[8px] gmaps-shadow flex items-center justify-between z-20"
        >
          <span className="text-[14px] leading-[20px] text-[#ffffff]">
            Removed
          </span>
          <button
            type="button"
            data-testid="undo_delete_button"
            onClick={() => {
              trip.restoreSavedRoute(
                recentlyDeleted.entry,
                recentlyDeleted.index
              );
              setRecentlyDeleted(null);
            }}
            className="h-[48px] px-[12px] text-[14px] leading-[20px] font-medium text-[#8ab4f8] flex items-center justify-center cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};
