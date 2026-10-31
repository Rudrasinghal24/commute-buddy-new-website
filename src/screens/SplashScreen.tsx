import React from 'react';
import { MapPinIcon } from '../components/Icons';

export const SplashScreen: React.FC = () => {
  return (
    <div
      data-testid="splash_screen"
      className="w-full h-full bg-[#ffffff] flex items-center justify-center"
    >
      <div className="flex flex-col items-center justify-center">
        <MapPinIcon color="#1a73e8" size={24} />
        <div className="mt-[8px] text-[22px] leading-[28px] font-medium text-[#202124]">
          CommuteBuddy
        </div>
      </div>
    </div>
  );
};
