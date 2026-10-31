import { Route, TravelMode } from './types';

export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, minutes);
  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

export function formatEtaMinutes(minutes: number): string {
  const safe = Math.max(0, minutes);
  if (safe === 0) return 'Due now';
  if (safe < 60) return `In ${safe} min`;
  return `In ${formatDuration(safe)}`;
}

export function formatDistanceMeters(meters: number): string {
  const safe = Math.max(0, meters);
  if (safe < 1000) return `${safe} m`;
  const km = safe / 1000.0;
  return `${km.toFixed(1)} km`;
}

export function formatVsFastest(route: Route, fastestRoute: Route | null): string {
  if (!fastestRoute) return 'Optimal route';
  if (route.id === fastestRoute.id) return 'Fastest option for this trip';

  const timeDiff = route.durationMinutes - fastestRoute.durationMinutes;
  const fareSavings = fastestRoute.fareInr - route.fareInr;

  if (fareSavings > 0 && timeDiff > 0) {
    return `Saves ₹${fareSavings}, adds ${formatDuration(timeDiff)} vs fastest`;
  } else if (fareSavings > 0 && timeDiff <= 0) {
    return `Saves ₹${fareSavings} and matches fastest time`;
  } else if (timeDiff > 0) {
    return `+${formatDuration(timeDiff)} slower than fastest`;
  } else {
    return 'Comparable to fastest route';
  }
}

export function formatLeaveBy(reachByStr: string | null, durationMinutes: number): string {
  if (!reachByStr || reachByStr.trim() === '' || reachByStr.toLowerCase().includes('anytime')) {
    return '';
  }
  try {
    const clean = reachByStr.trim().toUpperCase();
    const isPm = clean.includes('PM');
    const isAm = clean.includes('AM');
    const timePart = clean.replace('AM', '').replace('PM', '').trim();
    const parts = timePart.split(':');
    if (parts.length < 2) return '';

    let hours = parseInt(parts[0].trim(), 10) || 9;
    const mins = parseInt(parts[1].trim(), 10) || 0;
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    let totalTargetMins = hours * 60 + mins - durationMinutes;
    while (totalTargetMins < 0) totalTargetMins += 24 * 60;
    totalTargetMins %= 24 * 60;

    const leaveHr24 = Math.floor(totalTargetMins / 60);
    const leaveMin = totalTargetMins % 60;
    const suffix = leaveHr24 >= 12 ? 'PM' : 'AM';
    const leaveHr12 = leaveHr24 === 0 ? 12 : leaveHr24 > 12 ? leaveHr24 - 12 : leaveHr24;

    return `Leave by ${String(leaveHr12).padStart(2, '0')}:${String(leaveMin).padStart(2, '0')} ${suffix}`;
  } catch {
    return '';
  }
}

export function filterRoutesByModeAndQuery(
  routes: Route[],
  selectedMode: TravelMode,
  query: string = ''
): Route[] {
  const modeFiltered =
    selectedMode === TravelMode.MIX
      ? routes
      : routes.filter((r) => r.mode === selectedMode);

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return modeFiltered;

  return modeFiltered.filter(
    (route) =>
      route.summary.toLowerCase().includes(trimmed) ||
      route.mode.toLowerCase().includes(trimmed) ||
      route.steps.some((step) => step.instruction.toLowerCase().includes(trimmed))
  );
}
