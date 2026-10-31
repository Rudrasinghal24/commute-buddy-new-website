export enum TravelMode {
  MIX = 'MIX',
  METRO = 'METRO',
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  FLIGHT = 'FLIGHT',
  CAR = 'CAR',
  BIKE = 'BIKE',
  WALK = 'WALK',
}

export const TravelModeLabels: Record<TravelMode, string> = {
  [TravelMode.MIX]: 'Mix',
  [TravelMode.METRO]: 'Metro',
  [TravelMode.BUS]: 'Bus',
  [TravelMode.TRAIN]: 'Train',
  [TravelMode.FLIGHT]: 'Flight',
  [TravelMode.CAR]: 'Car',
  [TravelMode.BIKE]: 'Bike',
  [TravelMode.WALK]: 'Walk',
};

export enum RouteLabel {
  Fastest = 'Fastest',
  Cheapest = 'Cheapest',
  Recommended = 'Recommended',
  None = '',
}

export enum CrowdLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

export enum DataSourceLabel {
  LIVE = 'Live',
  SCHEDULED = 'Scheduled',
}

export enum ModeAvailabilityStatus {
  AVAILABLE = 'Available',
  NOT_AVAILABLE = 'Not Available',
}

export type ManeuverType =
  | 'depart'
  | 'straight'
  | 'left'
  | 'right'
  | 'slight_left'
  | 'slight_right'
  | 'sharp_left'
  | 'sharp_right'
  | 'keep_left'
  | 'keep_right'
  | 'uturn'
  | 'roundabout'
  | 'arrive';

export type StepsSource = 'ors' | 'osrm' | 'google' | 'template';

export interface RouteStep {
  mode: TravelMode;
  instruction: string;
  durationMinutes: number;
  distanceMeters?: number;
  maneuver?: ManeuverType;
  streetName?: string;
  startIndex?: number;
  landmark?: string;
}

export interface Route {
  id: string;
  mode: TravelMode;
  durationMinutes: number;
  fareInr: number;
  summary: string;
  steps: RouteStep[];
  label: RouteLabel;
  corridorPath: Array<[number, number]>;
  reliabilityScore: number; // 1 to 10
  crowdLevel: CrowdLevel;
  dataSource: DataSourceLabel;
  leaveByLabel: string;
  trafficStatus: string;
  recommendationReason: string;
  transfersCount: number;
  stepsSource?: StepsSource;
}

export enum SheetSnapPoint {
  PEEK = 'PEEK',
  HALF = 'HALF',
  FULL = 'FULL',
}

export interface SavedRouteEntry {
  id: string;
  startName: string;
  endName: string;
  mode: TravelMode;
  durationMinutes: number;
  fareInr: number;
  summary: string;
}

export interface CityModeAvailability {
  mode: TravelMode;
  status: ModeAvailabilityStatus;
  operatorOrNote: string;
}
