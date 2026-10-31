import React from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { ChatBar } from '../components/ChatBar';
import { LeafletMapView } from '../components/LeafletMapView';
import { ModeChipsRow } from '../components/ModeChipsRow';
import { MyLocationButton } from '../components/MyLocationButton';
import { NavigationBanner } from '../components/NavigationBanner';
import { SearchBar } from '../components/SearchBar';
import { DelhiPlacesData } from '../data/places';
import { useTripContext } from '../lib/TripContext';
import { SheetSnapPoint } from '../lib/types';
import { useNavigation } from '../lib/useNavigation';
import { SavedScreen } from './SavedScreen';

export const MapScreen: React.FC = () => {
  const trip = useTripContext();

  const nav = useNavigation({
    endPlace: trip.endPlace,
    reachByTime: trip.reachByTime,
    onRerouted: (newRoute) => {
      trip.setSelectedRoute(newRoute);
    },
  });

  if (trip.isSavedScreenOpen) {
    return <SavedScreen />;
  }

  const isNavigating = nav.status !== 'idle';

  const handleLocateMe = async () => {
    let lat = 28.6139;
    let lng = 77.209;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
            maximumAge: 60000,
          })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Fallback to default Delhi center if geolocation permission denied or unavailable
      }
    }

    const nearestPlace = await DelhiPlacesData.reverseGeocodeFromBackend(
      lat,
      lng
    );
    trip.setStartPlace(nearestPlace);
  };

  return (
    <div
      data-testid="map_screen_root"
      className="relative w-full h-full bg-[#f1f3f4] overflow-hidden"
    >
      {/* 1. Full-screen interactive map canvas */}
      <LeafletMapView
        startPlace={trip.startPlace}
        endPlace={trip.endPlace}
        routes={trip.routes}
        selectedRoute={trip.selectedRoute}
        isLiveRideActive={trip.isLiveRideActive}
        onToggleLiveRide={(active) => {
          trip.setIsLiveRideActive(active);
          if (active && trip.isRoutesSheetOpen) {
            trip.setSheetSnapPoint(SheetSnapPoint.PEEK);
          }
        }}
        isNavigating={isNavigating}
        navUserLocation={nav.userLocation}
        navSnappedIndex={nav.snappedIndex}
        className="w-full h-full"
      />

      {/* 2. Top floating NavigationBanner (while navigating) OR Search Bar + Mode Chips */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
        {isNavigating ? (
          <div className="pointer-events-auto">
            <NavigationBanner
              status={nav.status}
              errorMessage={nav.errorMessage}
              currentStep={nav.currentStep}
              nextStep={nav.nextStep}
              metersToNextTurn={nav.metersToNextTurn}
              isMuted={nav.isMuted}
              onToggleMute={nav.toggleMute}
              onEndNavigation={() => {
                nav.stop();
                trip.setSheetSnapPoint(SheetSnapPoint.HALF);
              }}
            />
          </div>
        ) : (
          <>
            <div className="pointer-events-auto">
              <SearchBar />
            </div>
            <div className="pointer-events-auto">
              <ModeChipsRow />
            </div>
          </>
        )}
      </div>

      {/* 3. Bottom-right MyLocation GPS Button + BottomSheet + Fixed Bottom ChatBar */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
        <div className="w-full px-[16px] pb-[12px] flex justify-end">
          <div className="pointer-events-auto">
            <MyLocationButton onLocateMe={handleLocateMe} />
          </div>
        </div>

        {!trip.isChatExpanded && (
          <div className="w-full pointer-events-auto contents">
            <BottomSheet
              onStartNavigation={(route) => {
                nav.startNavigation(route);
                trip.setSheetSnapPoint(SheetSnapPoint.PEEK);
              }}
            />
          </div>
        )}

        <div className="w-full pointer-events-auto contents">
          <ChatBar />
        </div>
      </div>
    </div>
  );
};
