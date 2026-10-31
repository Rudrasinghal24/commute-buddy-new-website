/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { TripContextProvider } from './lib/TripContext';
import { MapScreen } from './screens/MapScreen';
import { SplashScreen } from './screens/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      const fadeTimer = setTimeout(() => {
        setSplashVisible(false);
      }, 200);
      return () => clearTimeout(fadeTimer);
    }
  }, [showSplash]);

  return (
    <TripContextProvider>
      <div className="relative w-full h-[100dvh] bg-[#f1f3f4] overflow-hidden">
        <MapScreen />
        {splashVisible && (
          <div
            className={`absolute inset-0 z-50 transition-opacity duration-200 ease-in-out ${
              showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <SplashScreen />
          </div>
        )}
      </div>
    </TripContextProvider>
  );
}
