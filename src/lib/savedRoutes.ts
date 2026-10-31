import { SavedRouteEntry, TravelMode } from './types';

const STORAGE_KEY = 'commute_buddy_saved_routes:saved_routes_v1';

const defaultSavedRoutes: SavedRouteEntry[] = [
  {
    id: 'saved_default_1',
    startName: 'Prateek Grand City, Siddharth Vihar',
    endName: 'Rajiv Chowk (Connaught Place)',
    mode: TravelMode.MIX,
    durationMinutes: 46,
    fareInr: 65,
    summary: 'Shared Auto + Red Line Metro + Blue Line',
  },
  {
    id: 'saved_default_2',
    startName: 'Mathura Junction',
    endName: 'Vrindavan Banke Bihari Temple',
    mode: TravelMode.BUS,
    durationMinutes: 28,
    fareInr: 25,
    summary: 'Mathura–Vrindavan Local AC e-Bus / Shared Tempo',
  },
  {
    id: 'saved_default_3',
    startName: 'New Delhi Railway Station',
    endName: 'IGI Airport (Terminal 3)',
    mode: TravelMode.METRO,
    durationMinutes: 22,
    fareInr: 60,
    summary: 'Airport Express Line (Orange Line)',
  },
];

export const SavedRoutesManager = {
  loadSavedRoutes(): SavedRouteEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.persistRoutes(defaultSavedRoutes);
        return defaultSavedRoutes;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultSavedRoutes;
      return parsed;
    } catch {
      return defaultSavedRoutes;
    }
  },

  saveRoute(entry: SavedRouteEntry): SavedRouteEntry[] {
    const current = this.loadSavedRoutes().filter((item) => item.id !== entry.id);
    const updated = [entry, ...current];
    this.persistRoutes(updated);
    return updated;
  },

  deleteRoute(id: string): SavedRouteEntry[] {
    const updated = this.loadSavedRoutes().filter((item) => item.id !== id);
    this.persistRoutes(updated);
    return updated;
  },

  restoreRoute(entry: SavedRouteEntry, index: number): SavedRouteEntry[] {
    const current = this.loadSavedRoutes().filter((item) => item.id !== entry.id);
    const safeIndex = Math.max(0, Math.min(index, current.length));
    const updated = [...current];
    updated.splice(safeIndex, 0, entry);
    this.persistRoutes(updated);
    return updated;
  },

  persistRoutes(routes: SavedRouteEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch {
      // Ignore storage quota errors
    }
  },
};
