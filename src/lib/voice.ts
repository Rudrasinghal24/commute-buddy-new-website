import { ManeuverType, RouteStep } from './types';

let mutedState = false;

export type DistanceBucket = '500m' | '200m' | '50m' | 'now';

function maneuverToSpokenAction(maneuver?: ManeuverType): string {
  switch (maneuver) {
    case 'depart':
      return 'head straight';
    case 'left':
      return 'turn left';
    case 'right':
      return 'turn right';
    case 'slight_left':
      return 'bear slightly left';
    case 'slight_right':
      return 'bear slightly right';
    case 'sharp_left':
      return 'turn sharply left';
    case 'sharp_right':
      return 'turn sharply right';
    case 'keep_left':
      return 'keep left';
    case 'keep_right':
      return 'keep right';
    case 'uturn':
      return 'make a U-turn';
    case 'roundabout':
      return 'take the roundabout';
    case 'arrive':
      return 'you will arrive at your destination';
    case 'straight':
    default:
      return 'continue straight';
  }
}

export function buildTurnAnnouncement(
  step: RouteStep,
  bucket: DistanceBucket
): string {
  if (step.maneuver === 'arrive') {
    if (bucket === 'now') {
      return 'You have arrived.';
    }
    const distMeters = bucket === '500m' ? 500 : bucket === '200m' ? 200 : 50;
    return `In ${distMeters} meters, you will arrive at your destination.`;
  }

  const action = maneuverToSpokenAction(step.maneuver);
  const landmarkClause = step.landmark ? ` near ${step.landmark}` : '';
  const streetClause = step.streetName
    ? step.maneuver === 'straight' || step.maneuver === 'depart'
      ? ` on ${step.streetName}`
      : ` onto ${step.streetName}`
    : '';

  if (bucket === 'now') {
    const capitalized = action.charAt(0).toUpperCase() + action.slice(1);
    return `${capitalized}${landmarkClause}${streetClause}.`;
  }

  const distMeters = bucket === '500m' ? 500 : bucket === '200m' ? 200 : 50;
  return `In ${distMeters} meters, ${action}${landmarkClause}${streetClause}.`;
}

export const NavigationVoice = {
  isMuted(): boolean {
    return mutedState;
  },

  setMuted(muted: boolean): void {
    mutedState = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech cancel errors
      }
    }
  },

  toggleMute(): boolean {
    this.setMuted(!mutedState);
    return mutedState;
  },

  speak(text: string): void {
    if (mutedState) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = text.trim();
    if (!clean) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore browser speech synthesis failures
    }
  },

  stopSpeaking(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  },
};
