import { Route, RouteLabel } from './types';

export function recommendBestRoute(routes: Route[]): Route | null {
  if (routes.length === 0) return null;
  let best = routes[0];
  let bestScore = best.durationMinutes * 2 + best.fareInr;
  for (const r of routes) {
    const score = r.durationMinutes * 2 + r.fareInr;
    if (score < bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

export function labelRoutes(routes: Route[]): Route[] {
  if (routes.length === 0) return [];

  const recommended = recommendBestRoute(routes);
  let fastest = routes[0];
  for (const r of routes) {
    if (r.durationMinutes < fastest.durationMinutes) {
      fastest = r;
    }
  }

  const nonWalkRoutes = routes.filter((r) => r.fareInr > 0);
  let cheapest: Route | null = nonWalkRoutes.length > 0 ? nonWalkRoutes[0] : null;
  for (const r of nonWalkRoutes) {
    if (cheapest && r.fareInr < cheapest.fareInr) {
      cheapest = r;
    }
  }

  return routes.map((route) => {
    let assignedLabel = RouteLabel.None;
    if (recommended && route.id === recommended.id) {
      assignedLabel = RouteLabel.Recommended;
    } else if (route.id === fastest.id) {
      assignedLabel = RouteLabel.Fastest;
    } else if (cheapest && route.id === cheapest.id) {
      assignedLabel = RouteLabel.Cheapest;
    }
    return {
      ...route,
      label: assignedLabel,
    };
  });
}
