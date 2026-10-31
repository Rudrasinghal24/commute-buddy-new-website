import React from 'react';
import { DelhiPlace } from '../data/places';
import { MapPinIcon } from './Icons';

interface AutocompleteDropdownProps {
  query: string;
  suggestions: DelhiPlace[];
  onSelectPlace: (place: DelhiPlace) => void;
}

function renderHighlightedText(fullText: string, query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return <span>{fullText}</span>;
  const idx = fullText.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (idx < 0) return <span>{fullText}</span>;
  return (
    <span>
      {fullText.slice(0, idx)}
      <strong className="font-bold text-[#202124]">
        {fullText.slice(idx, idx + cleanQuery.length)}
      </strong>
      {fullText.slice(idx + cleanQuery.length)}
    </span>
  );
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  query,
  suggestions,
  onSelectPlace,
}) => {
  if (suggestions.length === 0) return null;
  const items = suggestions.slice(0, 5);

  return (
    <div
      data-testid="autocomplete_dropdown"
      className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] gmaps-shadow overflow-hidden"
    >
      {items.map((place, index) => (
        <React.Fragment key={place.id}>
          <button
            type="button"
            data-testid={`autocomplete_item_${place.id}`}
            onClick={() => onSelectPlace(place)}
            className="w-full min-h-[48px] px-[12px] py-[8px] flex items-center gap-[12px] text-left hover:bg-[#f1f3f4] active:bg-[#e8f0fe] transition-colors cursor-pointer"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0">
              <MapPinIcon color="#5f6368" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] leading-[20px] text-[#202124] truncate">
                {renderHighlightedText(place.name, query)}
              </div>
              <div className="text-[12px] leading-[16px] text-[#5f6368] truncate">
                {place.area}
              </div>
            </div>
          </button>
          {index < items.length - 1 && (
            <div className="h-[1px] bg-[#dadce0] mx-[12px]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
