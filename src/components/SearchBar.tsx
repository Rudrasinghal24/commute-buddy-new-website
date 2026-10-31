import React, { useEffect, useState } from 'react';
import { DelhiPlace, DelhiPlacesData } from '../data/places';
import { useTripContext } from '../lib/TripContext';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import {
  BackArrowIcon,
  BookmarkIcon,
  CloseXIcon,
  SearchIcon,
  SwapArrowsIcon,
} from './Icons';

type ActiveField = 'NONE' | 'START' | 'END';

export const SearchBar: React.FC = () => {
  const trip = useTripContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>('NONE');
  const [startQuery, setStartQuery] = useState(trip.startPlace?.name ?? '');
  const [endQuery, setEndQuery] = useState(trip.endPlace?.name ?? '');
  const [suggestions, setSuggestions] = useState<DelhiPlace[]>([]);

  useEffect(() => {
    setStartQuery(trip.startPlace?.name ?? '');
  }, [trip.startPlace]);

  useEffect(() => {
    setEndQuery(trip.endPlace?.name ?? '');
  }, [trip.endPlace]);

  const activeQuery =
    activeField === 'START'
      ? startQuery
      : activeField === 'END'
      ? endQuery
      : '';

  useEffect(() => {
    if (activeField === 'NONE') {
      setSuggestions([]);
      return;
    }

    setSuggestions(DelhiPlacesData.searchPlaces(activeQuery));
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (activeQuery.trim().length >= 2) {
        const remote = await DelhiPlacesData.fetchPlacesFromBackend(activeQuery);
        if (!cancelled) {
          setSuggestions(remote);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeField, activeQuery]);

  const summaryText =
    trip.startPlace && trip.endPlace
      ? `${trip.startPlace.name} → ${trip.endPlace.name}`
      : trip.endPlace
      ? `To: ${trip.endPlace.name}`
      : trip.startPlace
      ? `From: ${trip.startPlace.name}`
      : 'Where to?';

  const commitPlaceInput = (field: ActiveField, rawText: string) => {
    const matches = DelhiPlacesData.searchPlaces(rawText);
    const chosen = matches[0] ?? null;
    if (field === 'START') {
      trip.setStartPlace(chosen);
      setStartQuery(chosen?.name ?? rawText);
    } else if (field === 'END') {
      trip.setEndPlace(chosen);
      setEndQuery(chosen?.name ?? rawText);
    }
    setActiveField('NONE');
  };

  return (
    <div className="w-full px-[16px] pt-[12px]">
      {!isExpanded ? (
        <div
          data-testid="search_bar_collapsed"
          onClick={() => {
            setIsExpanded(true);
            setActiveField(trip.endPlace === null ? 'END' : 'START');
          }}
          className="w-full h-[48px] rounded-full bg-[#ffffff] border border-[#dadce0] gmaps-shadow pl-[16px] pr-[4px] flex items-center cursor-pointer"
        >
          <SearchIcon color="#5f6368" size={20} />
          <div className="ml-[12px] flex-1 truncate text-[16px] leading-[24px] text-[#202124]">
            {summaryText}
          </div>
          <button
            type="button"
            data-testid="open_saved_routes_button"
            onClick={(e) => {
              e.stopPropagation();
              trip.setIsSavedScreenOpen(true);
            }}
            className="w-[48px] h-[48px] flex items-center justify-center rounded-full hover:bg-[#f1f3f4] cursor-pointer shrink-0"
            aria-label="Open saved routes"
          >
            <BookmarkIcon
              color="#1a73e8"
              size={20}
              filled={trip.savedRoutes.length > 0}
            />
          </button>
        </div>
      ) : (
        <div
          data-testid="search_bar_expanded"
          className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow p-[8px]"
        >
          <div className="flex items-center">
            <button
              type="button"
              data-testid="search_back_button"
              onClick={() => {
                setIsExpanded(false);
                setActiveField('NONE');
              }}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full hover:bg-[#f1f3f4] cursor-pointer shrink-0"
              aria-label="Collapse search"
            >
              <BackArrowIcon color="#5f6368" size={20} />
            </button>

            <div className="w-[20px] flex flex-col items-center justify-center shrink-0">
              <div className="w-[8px] h-[8px] rounded-full bg-[#1a73e8]" />
              <div className="w-[2px] h-[24px] my-[4px] bg-[#dadce0]" />
              <div className="w-[8px] h-[8px] rounded-full bg-[#d93025]" />
            </div>

            <div className="flex-1 min-w-0 px-[4px] flex flex-col gap-[8px]">
              {/* Start field */}
              <div
                onClick={() => setActiveField('START')}
                className={`w-full h-[48px] rounded-[8px] bg-[#f1f3f4] px-[12px] flex items-center border ${
                  activeField === 'START'
                    ? 'border-[#1a73e8]'
                    : 'border-transparent'
                }`}
              >
                <input
                  type="text"
                  data-testid="start_location_input"
                  value={startQuery}
                  onFocus={() => setActiveField('START')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartQuery(val);
                    setActiveField('START');
                    if (!val) trip.setStartPlace(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && startQuery.trim()) {
                      commitPlaceInput('START', startQuery);
                    }
                  }}
                  placeholder="Your location / Trip start"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[14px] leading-[20px] text-[#202124] placeholder-[#5f6368]"
                />
                {startQuery.length > 0 && (
                  <button
                    type="button"
                    data-testid="clear_start_button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartQuery('');
                      trip.setStartPlace(null);
                      setActiveField('START');
                    }}
                    className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-[#dadce0]/40 cursor-pointer shrink-0"
                    aria-label="Clear start location"
                  >
                    <CloseXIcon color="#5f6368" size={16} />
                  </button>
                )}
              </div>

              {/* End field */}
              <div
                onClick={() => setActiveField('END')}
                className={`w-full h-[48px] rounded-[8px] bg-[#f1f3f4] px-[12px] flex items-center border ${
                  activeField === 'END'
                    ? 'border-[#1a73e8]'
                    : 'border-transparent'
                }`}
              >
                <input
                  type="text"
                  data-testid="end_location_input"
                  value={endQuery}
                  onFocus={() => setActiveField('END')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndQuery(val);
                    setActiveField('END');
                    if (!val) trip.setEndPlace(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && endQuery.trim()) {
                      commitPlaceInput('END', endQuery);
                      if (trip.startPlace) setIsExpanded(false);
                    }
                  }}
                  placeholder="Trip end"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[14px] leading-[20px] text-[#202124] placeholder-[#5f6368]"
                />
                {endQuery.length > 0 && (
                  <button
                    type="button"
                    data-testid="clear_end_button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndQuery('');
                      trip.setEndPlace(null);
                      setActiveField('END');
                    }}
                    className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-[#dadce0]/40 cursor-pointer shrink-0"
                    aria-label="Clear destination"
                  >
                    <CloseXIcon color="#5f6368" size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <button
                type="button"
                data-testid="expanded_saved_routes_button"
                onClick={() => trip.setIsSavedScreenOpen(true)}
                className="w-[48px] h-[48px] flex items-center justify-center rounded-full hover:bg-[#f1f3f4] cursor-pointer"
                aria-label="Saved routes"
              >
                <BookmarkIcon
                  color="#1a73e8"
                  size={20}
                  filled={trip.savedRoutes.length > 0}
                />
              </button>
              <button
                type="button"
                data-testid="swap_locations_button"
                onClick={() => trip.swapPlaces()}
                className="w-[48px] h-[48px] flex items-center justify-center rounded-full hover:bg-[#f1f3f4] cursor-pointer"
                aria-label="Swap locations"
              >
                <SwapArrowsIcon color="#5f6368" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpanded && activeField !== 'NONE' && (
        <div className="mt-[8px]">
          <AutocompleteDropdown
            query={activeQuery}
            suggestions={suggestions}
            onSelectPlace={(selectedPlace) => {
              if (activeField === 'START') {
                trip.setStartPlace(selectedPlace);
                setStartQuery(selectedPlace.name);
                if (!trip.endPlace) {
                  setActiveField('END');
                } else {
                  setActiveField('NONE');
                  setIsExpanded(false);
                }
              } else if (activeField === 'END') {
                trip.setEndPlace(selectedPlace);
                setEndQuery(selectedPlace.name);
                if (!trip.startPlace) {
                  setActiveField('START');
                } else {
                  setActiveField('NONE');
                  setIsExpanded(false);
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
