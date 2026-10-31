export function calculateMetroFare(distanceKm: number): number {
  if (distanceKm <= 2.0) return 10;
  if (distanceKm <= 5.0) return 20;
  if (distanceKm <= 12.0) return 30;
  if (distanceKm <= 21.0) return 40;
  if (distanceKm <= 32.0) return 50;
  return 60;
}

export function calculateDtcBusFare(distanceKm: number, isAc: boolean = false): number {
  if (isAc) {
    if (distanceKm <= 4.0) return 10;
    if (distanceKm <= 10.0) return 20;
    return 25;
  } else {
    if (distanceKm <= 4.0) return 5;
    if (distanceKm <= 10.0) return 10;
    return 15;
  }
}

export function calculateStateBusFare(
  distanceKm: number,
  isInterstateVolvo: boolean = false
): number {
  if (distanceKm <= 30.0) {
    return Math.max(15, Math.min(60, Math.round(distanceKm * 1.4)));
  }
  const perKm = isInterstateVolvo ? 2.45 : 1.38;
  return Math.round((Math.round(distanceKm * perKm) + 5) / 10) * 10;
}

export function calculateIndianRailwaysFare(
  distanceKm: number,
  tier: string = 'CHAIR_CAR'
): number {
  switch (tier) {
    case 'LOCAL_MEMU':
      if (distanceKm <= 20) return 10;
      if (distanceKm <= 45) return 15;
      if (distanceKm <= 80) return 25;
      if (distanceKm <= 150) return 40;
      return Math.round(distanceKm * 0.35);
    case 'VANDE_BHARAT':
      return Math.round((Math.round(280 + distanceKm * 1.95) + 5) / 10) * 10;
    case 'SLEEPER':
      return Math.round((Math.round(125 + distanceKm * 0.68) + 5) / 10) * 10;
    case 'AC_3_TIER':
      return Math.round((Math.round(320 + distanceKm * 1.48) + 5) / 10) * 10;
    default:
      return Math.round((Math.round(180 + distanceKm * 1.15) + 5) / 10) * 10;
  }
}

export function calculateFlightFareInr(distanceKm: number): number {
  const baseFare = 2450;
  const distanceCharge = Math.round(distanceKm * 3.15);
  return Math.round((baseFare + distanceCharge) / 50) * 50;
}

export function calculateCabFare(distanceKm: number): number {
  if (distanceKm <= 40.0) {
    return Math.round(50.0 + distanceKm * 14.0);
  }
  return Math.round((Math.round(150.0 + distanceKm * 12.5) + 5) / 10) * 10;
}

export function calculateAutoFare(distanceKm: number): number {
  if (distanceKm <= 2.0) return 30;
  return Math.round(30.0 + (distanceKm - 2.0) * 11.0);
}

export function calculateBikeTaxiFare(distanceKm: number): number {
  return Math.round(20.0 + distanceKm * 7.0);
}
