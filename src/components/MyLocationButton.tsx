import React, { useState } from 'react';
import { LocateIcon } from './Icons';

interface MyLocationButtonProps {
  onLocateMe: () => Promise<void> | void;
  className?: string;
}

export const MyLocationButton: React.FC<MyLocationButtonProps> = ({
  onLocateMe,
  className = '',
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleClick = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      await onLocateMe();
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="my_location_button"
      onClick={handleClick}
      className={`w-[48px] h-[48px] rounded-full bg-[#ffffff] border border-[#dadce0] gmaps-shadow flex items-center justify-center hover:bg-[#f1f3f4] active:bg-[#e8f0fe] cursor-pointer ${className}`}
      aria-label="Center on my location"
    >
      {isLocating ? (
        <div className="w-[20px] h-[20px] rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
      ) : (
        <LocateIcon color="#1a73e8" size={22} />
      )}
    </button>
  );
};
