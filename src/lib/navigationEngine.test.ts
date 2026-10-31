import assert from 'node:assert/strict';
import test from 'node:test';
import { createNavigationEngine } from './navigationEngine';
import { RouteStep, TravelMode } from './types';

// Straight north-bound path (~111m per 0.001 deg lat)
const samplePath: Array<[number, number]> = [
  [28.6300, 77.2200], // index 0 (0m)
  [28.6310, 77.2200], // index 1 (~111m)
  [28.6320, 77.2200], // index 2 (~222m) - turn right
  [28.6320, 77.2210], // index 3 (~320m)
  [28.6320, 77.2220], // index 4 (~418m) - arrive
];

const sampleSteps: RouteStep[] = [
  {
    mode: TravelMode.CAR,
    instruction: 'Head north on Janpath',
    durationMinutes: 2,
    maneuver: 'depart',
    streetName: 'Janpath',
    startIndex: 0,
  },
  {
    mode: TravelMode.CAR,
    instruction: 'Turn right onto Connaught Outer Circle',
    durationMinutes: 2,
    maneuver: 'right',
    streetName: 'Connaught Outer Circle',
    startIndex: 2,
  },
  {
    mode: TravelMode.CAR,
    instruction: 'Arrive at destination',
    durationMinutes: 1,
    maneuver: 'arrive',
    startIndex: 4,
  },
];

test('NavigationEngine snaps to path, computes distance to next turn, and never moves backwards', () => {
  const engine = createNavigationEngine(samplePath, sampleSteps);

  // Near vertex 0
  const u1 = engine.update(28.6301, 77.2200, 1000);
  assert.equal(u1.stepIndex, 0);
  assert.equal(u1.snappedIndex, 0);
  assert.equal(u1.arrived, false);
  assert.ok(u1.metersToNextTurn > 180 && u1.metersToNextTurn < 230);

  // Move past vertex 1 (onto segment 1->2)
  const u2 = engine.update(28.6315, 77.2200, 2000);
  assert.equal(u2.snappedIndex, 1);
  assert.equal(u2.stepIndex, 0);
  assert.ok(u2.metersToNextTurn > 40 && u2.metersToNextTurn < 75);

  // Simulate a noisy GPS fix behind vertex 1 -> should NOT move snappedIndex backwards
  const uBack = engine.update(28.6302, 77.2200, 3000);
  assert.equal(uBack.snappedIndex, 1);
});

test('NavigationEngine advances stepIndex when reaching turn startIndex', () => {
  const engine = createNavigationEngine(samplePath, sampleSteps);

  engine.update(28.6305, 77.2200, 1000);
  // Move onto segment 2->3 (past turn at index 2)
  const uTurn = engine.update(28.6320, 77.2204, 2000);
  assert.equal(uTurn.snappedIndex, 2);
  assert.equal(uTurn.stepIndex, 1);
  assert.ok(uTurn.metersToNextTurn > 120 && uTurn.metersToNextTurn < 190);
});

test('NavigationEngine triggers reroute only after 3 consecutive off-route fixes (>50m) and respects 15s cooldown', () => {
  const engine = createNavigationEngine(samplePath, sampleSteps);

  // 100m off route (approx 0.0012 deg lng east of segment 0->1)
  const f1 = engine.update(28.6305, 77.2215, 20000);
  assert.ok(f1.offRouteMeters > 50);
  assert.equal(f1.consecutiveOffRouteCount, 1);
  assert.equal(f1.shouldReroute, false);

  const f2 = engine.update(28.6306, 77.2215, 21000);
  assert.equal(f2.consecutiveOffRouteCount, 2);
  assert.equal(f2.shouldReroute, false);

  const f3 = engine.update(28.6307, 77.2215, 22000);
  assert.equal(f3.shouldReroute, true);

  // Subsequent 3 off-route fixes within 15s cooldown should NOT trigger reroute
  engine.update(28.6308, 77.2215, 25000);
  engine.update(28.6309, 77.2215, 26000);
  const fCooldown = engine.update(28.6310, 77.2215, 27000);
  assert.equal(fCooldown.shouldReroute, false);

  // After 15s cooldown has elapsed (t = 38000 > 22000 + 15000), shouldReroute triggers again
  const fAfterCooldown = engine.update(28.6310, 77.2215, 38000);
  assert.equal(fAfterCooldown.shouldReroute, true);
});

test('NavigationEngine detects arrival within 25m of destination', () => {
  const engine = createNavigationEngine(samplePath, sampleSteps);

  // Within ~10m of final point [28.6320, 77.2220]
  const finalFix = engine.update(28.6320, 77.22195, 5000);
  assert.equal(finalFix.arrived, true);
  assert.equal(finalFix.metersToNextTurn, 0);
});
