import { DataSourceLabel, Route, RouteStep, TravelMode } from '../lib/types';

export enum DataLoadState {
  LOADING = 'LOADING',
  READY = 'READY',
  EMPTY = 'EMPTY',
  ERROR = 'ERROR',
}

export interface TransitRouteSummary {
  id: string;
  lineCode: string;
  origin: string;
  destination: string;
  nextDeparture: string;
  durationMins: number;
  fareDisplay: string;
  lineColorHex: number;
  status: string;
}

export interface NearbyStopSummary {
  id: string;
  name: string;
  distanceMeters: number;
  lines: string[];
  nextArrivalMins: number;
}

export interface SavedPlaceItem {
  id: string;
  label: string;
  address: string;
  defaultLine: string;
  typicalMins: number;
}

export interface ServiceAlertItem {
  id: string;
  lineCode: string;
  title: string;
  description: string;
  updatedAgo: string;
  isDisruption: boolean;
}

export const CommuteDummyData = {
  filterAndRankRoutes(routes: Route[], query: string, modeFilter: TravelMode | null): Route[] {
    const trimmed = query.trim().toLowerCase();
    return routes
      .filter((route) => {
        const matchesMode = modeFilter === null || route.mode === modeFilter;
        const matchesQuery =
          trimmed.length === 0 ||
          route.summary.toLowerCase().includes(trimmed) ||
          route.mode.toLowerCase().includes(trimmed) ||
          route.steps.some((step: RouteStep) => step.instruction.toLowerCase().includes(trimmed));
        return matchesMode && matchesQuery;
      })
      .sort((a, b) => a.durationMinutes * 2 + a.fareInr - (b.durationMinutes * 2 + b.fareInr));
  },

  calculateBestCompareMetrics(routes: Route[]): [number | null, number | null] {
    if (routes.length === 0) return [null, null];
    const fastest = Math.min(...routes.map((r) => r.durationMinutes));
    const cheapest = Math.min(...routes.map((r) => r.fareInr));
    return [fastest, cheapest];
  },

  formatTransferSummary(steps: RouteStep[]): string {
    if (steps.length === 0) return 'Direct route';
    if (steps.length === 1) return `Direct via ${steps[0].mode}`;
    const transfers = steps.length - 1;
    return `${transfers} ${transfers === 1 ? 'transfer' : 'transfers'} • ${steps.map((s) => s.mode).join(' → ')}`;
  },

  formatTrustBadge(source: DataSourceLabel, reliabilityScore: number): string {
    return `${source} • ${reliabilityScore}/10 reliable`;
  },

  commuteGoRoutes: [
    {
      id: 'r1',
      lineCode: 'Blue Line',
      origin: 'Rajiv Chowk',
      destination: 'Noida Electronic City',
      nextDeparture: 'Every 4 min',
      durationMins: 38,
      fareDisplay: '₹40',
      lineColorHex: 0x1a73e8,
      status: 'On time',
    },
    {
      id: 'r2',
      lineCode: 'Yellow Line',
      origin: 'Kashmere Gate',
      destination: 'MILLENNIUM CITY CENTRE GURUGRAM',
      nextDeparture: 'Every 3 min',
      durationMins: 52,
      fareDisplay: '₹50',
      lineColorHex: 0xfbbc04,
      status: 'On time',
    },
    {
      id: 'r3',
      lineCode: 'Magenta Line',
      origin: 'Hauz Khas',
      destination: 'Botanical Garden',
      nextDeparture: 'Every 5 min',
      durationMins: 26,
      fareDisplay: '₹30',
      lineColorHex: 0xd93025,
      status: 'Minor delay (3m)',
    },
    {
      id: 'r4',
      lineCode: 'Airport Express',
      origin: 'New Delhi',
      destination: 'IGI Airport T3',
      nextDeparture: 'Every 10 min',
      durationMins: 19,
      fareDisplay: '₹60',
      lineColorHex: 0xe37400,
      status: 'On time',
    },
    {
      id: 'r5',
      lineCode: 'DTC 534',
      origin: 'Anand Vihar ISBT',
      destination: 'Mehrauli Terminal',
      nextDeparture: 'In 6 min',
      durationMins: 64,
      fareDisplay: '₹25',
      lineColorHex: 0x1e8e3e,
      status: 'Live GPS',
    },
  ] as TransitRouteSummary[],

  nearbyStops: [
    {
      id: 's1',
      name: 'Rajiv Chowk Metro Gate 6',
      distanceMeters: 180,
      lines: ['Blue Line', 'Yellow Line'],
      nextArrivalMins: 2,
    },
    {
      id: 's2',
      name: 'Connaught Place Outer Circle Bus Stop',
      distanceMeters: 290,
      lines: ['DTC 522', 'DTC 440', 'AC-715'],
      nextArrivalMins: 5,
    },
    {
      id: 's3',
      name: 'Shivaji Stadium Airport Express Station',
      distanceMeters: 650,
      lines: ['Airport Express'],
      nextArrivalMins: 7,
    },
    {
      id: 's4',
      name: 'Mandi House Interchange',
      distanceMeters: 1200,
      lines: ['Blue Line', 'Violet Line'],
      nextArrivalMins: 3,
    },
  ] as NearbyStopSummary[],

  savedPlaces: [
    {
      id: 'p1',
      label: 'Home',
      address: 'Block C, Hauz Khas Enclave, New Delhi',
      defaultLine: 'Yellow Line to Rajiv Chowk',
      typicalMins: 22,
    },
    {
      id: 'p2',
      label: 'Work',
      address: 'DLF CyberHub, Phase 2, Gurugram',
      defaultLine: 'Yellow Line + Rapid Metro',
      typicalMins: 46,
    },
    {
      id: 'p3',
      label: 'New Delhi Railway Station',
      address: 'Ajmeri Gate Side, Paharganj, New Delhi',
      defaultLine: 'Yellow Line (Direct)',
      typicalMins: 28,
    },
    {
      id: 'p4',
      label: 'IGI Airport Terminal 3',
      address: 'Indira Gandhi International Airport, New Delhi',
      defaultLine: 'Airport Express Line',
      typicalMins: 34,
    },
  ] as SavedPlaceItem[],

  serviceAlerts: [
    {
      id: 'a1',
      lineCode: 'Magenta Line',
      title: 'Signaling maintenance near Kalkaji Mandir',
      description: 'Trains are operating at reduced speed between Kalkaji Mandir and Nehru Enclave. Expect 3–5 min additional travel time.',
      updatedAgo: '12 min ago',
      isDisruption: true,
    },
    {
      id: 'a2',
      lineCode: 'Yellow Line',
      title: 'Normal service resumed across all stations',
      description: 'Peak frequency of 2 min 45 sec is active between Samaypur Badli and Millennium City Centre.',
      updatedAgo: '28 min ago',
      isDisruption: false,
    },
    {
      id: 'a3',
      lineCode: 'DTC Bus Network',
      title: 'Diversion near India Gate C-Hexagon',
      description: 'Routes 505, 522, and 615 are diverted via Windsor Place until 20:00 today.',
      updatedAgo: '1 hr ago',
      isDisruption: true,
    },
    {
      id: 'a4',
      lineCode: 'Airport Express',
      title: 'Check-in baggage facility open at New Delhi Station',
      description: 'Passengers flying out of T3 can check in baggage 2 to 12 hours prior to departure.',
      updatedAgo: '3 hr ago',
      isDisruption: false,
    },
  ] as ServiceAlertItem[],
};
