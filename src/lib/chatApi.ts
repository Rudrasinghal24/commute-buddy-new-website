import { DelhiPlace, DelhiPlacesData } from '../data/places';
import { formatDuration } from './commuteFormatters';
import { GetRoutesApi } from './getRoutes';
import { TransitAvailabilityApi } from './transitAvailabilityApi';
import { ModeAvailabilityStatus, Route, RouteLabel } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

export const ChatApi = {
  extractPlacesFromQuestion(
    message: string,
    currentStart: DelhiPlace | null,
    currentEnd: DelhiPlace | null
  ): [DelhiPlace | null, DelhiPlace | null] {
    const lower = message.toLowerCase();

    const matchedPlaces = DelhiPlacesData.places
      .filter((place) => {
        const nameLower = place.name.toLowerCase();
        const shortName = nameLower.split('(')[0].split(',')[0].trim();
        const keywordHit = (place.keywords ?? []).some(
          (kw) => kw.length >= 4 && lower.includes(kw.toLowerCase())
        );
        return (
          (shortName.length >= 4 && lower.includes(shortName)) || keywordHit
        );
      })
      .sort((a, b) => {
        const idxA = lower.indexOf(
          a.name.split('(')[0].split(',')[0].trim().toLowerCase()
        );
        const idxB = lower.indexOf(
          b.name.split('(')[0].split(',')[0].trim().toLowerCase()
        );
        return (idxA >= 0 ? idxA : 9999) - (idxB >= 0 ? idxB : 9999);
      });

    if (matchedPlaces.length >= 2) {
      return [matchedPlaces[0], matchedPlaces[1]];
    }

    const fromToRegex = /(?:from|between)\s+([a-z0-9\s,.-]{3,35}?)\s+(?:to|and)\s+([a-z0-9\s,.-]{3,35})(?:\?|$|\.|!)/i;
    const match = fromToRegex.exec(message);
    if (match) {
      const rawOrigin = match[1].trim();
      const rawDest = match[2].trim();
      const p1 = DelhiPlacesData.searchPlaces(rawOrigin)[0] ?? null;
      const p2 = DelhiPlacesData.searchPlaces(rawDest)[0] ?? null;
      if (p1 && p2) return [p1, p2];
    }

    if (matchedPlaces.length === 1) {
      const mentioned = matchedPlaces[0];
      if (currentStart && currentStart.id !== mentioned.id) {
        return [currentStart, mentioned];
      }
    }

    return [currentStart, currentEnd];
  },

  async streamChatMessage(
    userMessage: string,
    startPlace: DelhiPlace | null,
    endPlace: DelhiPlace | null,
    activeRoutes: Route[],
    reachByTime: string | null = null,
    onChunk: (partialText: string) => void
  ): Promise<string> {
    const [resolvedStart, resolvedEnd] = this.extractPlacesFromQuestion(
      userMessage,
      startPlace,
      endPlace
    );

    const routesForContext =
      resolvedStart &&
      resolvedEnd &&
      (activeRoutes.length === 0 ||
        resolvedStart.id !== startPlace?.id ||
        resolvedEnd.id !== endPlace?.id)
        ? GetRoutesApi.planRoutesOnDevice(
            resolvedStart,
            resolvedEnd,
            reachByTime
          )
        : activeRoutes;

    const liveAnswer = await this.callGeminiLiveTransitAssistant(
      userMessage,
      resolvedStart,
      resolvedEnd,
      routesForContext,
      reachByTime
    );

    const reply =
      liveAnswer && liveAnswer.trim().length > 0
        ? liveAnswer
        : this.buildDeterministicTransitReply(
            userMessage,
            resolvedStart,
            resolvedEnd,
            routesForContext,
            reachByTime
          );

    const words = reply.split(' ');
    let accumulated = '';
    const stepSize = 6;
    for (let i = 0; i < words.length; i += stepSize) {
      const endIdx = Math.min(i + stepSize, words.length);
      const chunk = words.slice(i, endIdx).join(' ');
      accumulated = accumulated ? `${accumulated} ${chunk}` : chunk;
      onChunk(accumulated);
      await new Promise((r) => setTimeout(r, 14));
    }
    return reply;
  },

  async callGeminiLiveTransitAssistant(
    userMessage: string,
    startPlace: DelhiPlace | null,
    endPlace: DelhiPlace | null,
    routes: Route[],
    reachByTime: string | null
  ): Promise<string | null> {
    try {
      const availabilitySummary =
        startPlace && endPlace
          ? TransitAvailabilityApi.evaluateInstantModeAvailability(
              startPlace,
              endPlace
            )
              .availabilities.map(
                (a) => `${a.mode}: ${a.status} (${a.operatorOrNote})`
              )
              .join('; ')
          : 'No trip selected yet';

      const routesSummary =
        routes.length === 0
          ? 'No active routes computed yet.'
          : routes
              .slice(0, 6)
              .map(
                (r) =>
                  `- [${r.mode}] ${r.summary}: ${r.durationMinutes} min, ₹${r.fareInr}, Label=${r.label || 'Standard'}, Traffic=${r.trafficStatus}, Steps=${r.steps
                    .map((s) => `${s.mode}:${s.instruction}(${s.durationMinutes}m)`)
                    .join(' -> ')}`
              )
              .join('\n');

      const tripHeader =
        startPlace && endPlace
          ? `Active Trip: ${startPlace.name} (${startPlace.area}) to ${endPlace.name} (${endPlace.area}), ReachBy=${reachByTime ?? 'Depart now'}`
          : 'No active origin/destination selected.';

      const systemInstruction = `You are CommuteBuddy AI, an Indian real-time transit and multimodal route assistant.
CRITICAL RULES:
1. NEVER claim Metro is available in cities that do not have an operational Metro network (e.g., Mathura, Vrindavan, Haridwar, Varanasi, Dehradun, Chandigarh, Amritsar, Patna, etc.).
2. Always state clearly which modes are AVAILABLE and which are NOT AVAILABLE for the user's city/route.
3. Give exact Indian Rupees (₹) fares and realistic travel durations in minutes/hours for Local Shared Auto/E-Rickshaw, City Bus, Metro (only if available), Train (only if >=16 km), Ola/Uber Cab, and Bike Taxi.
4. Keep responses concise (4 to 7 short lines), practical, and structured. NEVER use emojis.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          contents: `${tripHeader}\nVerified Mode Availability: ${availabilitySummary}\nComputed Routes:\n${routesSummary}\n\nUser Question: ${userMessage}`,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data?.text ? String(data.text).trim() : null;
    } catch {
      return null;
    }
  },

  buildDeterministicTransitReply(
    userMessage: string,
    startPlace: DelhiPlace | null,
    endPlace: DelhiPlace | null,
    routes: Route[],
    _reachByTime: string | null
  ): string {
    const q = userMessage.toLowerCase();

    if (startPlace && endPlace && routes.length > 0) {
      const availability =
        TransitAvailabilityApi.evaluateInstantModeAvailability(
          startPlace,
          endPlace
        );
      const availText = availability.availabilities
        .filter((a) => a.status === ModeAvailabilityStatus.AVAILABLE)
        .map((a) => `${a.mode} (${a.operatorOrNote})`)
        .join(', ');
      const unavailText = availability.availabilities
        .filter((a) => a.status === ModeAvailabilityStatus.NOT_AVAILABLE)
        .map((a) => a.mode)
        .join(', ');

      const recommended =
        routes.find((r) => r.label === RouteLabel.Recommended) ?? routes[0];
      let fastest = routes[0];
      for (const r of routes) {
        if (r.durationMinutes < fastest.durationMinutes) fastest = r;
      }
      const nonWalk = routes.filter((r) => r.fareInr > 0);
      let cheapest = nonWalk.length > 0 ? nonWalk[0] : routes[0];
      for (const r of nonWalk) {
        if (r.fareInr < cheapest.fareInr) cheapest = r;
      }

      if (q.includes('metro') && !availability.metroAvailable) {
        return (
          `Metro Availability for ${startPlace.name} to ${endPlace.name}:\n` +
          `• Metro Status: NOT AVAILABLE (Neither ${startPlace.name} nor this corridor has an operational Metro network).\n` +
          `• Available Local Modes: ${availText}.\n` +
          `• Best Alternative: ${recommended.summary} (${formatDuration(recommended.durationMinutes)}, ₹${recommended.fareInr}).\n` +
          `• Steps: ${recommended.steps.map((s) => s.instruction).join(' -> ')}.`
        );
      }

      const leaveNote = recommended.leaveByLabel
        ? `\n• Schedule: ${recommended.leaveByLabel}.`
        : '';

      return (
        `Live Transit Plan: ${startPlace.name} to ${endPlace.name} (${availability.roadDistanceKm.toFixed(1)} km road)\n` +
        `• Available Modes: ${availText}${unavailText ? `\n• Not Available Here: ${unavailText}` : ''}\n` +
        `• Recommended (${recommended.mode}): ${recommended.summary} — ${formatDuration(recommended.durationMinutes)}, ₹${recommended.fareInr}\n` +
        `• Fastest (${fastest.mode}): ${fastest.summary} — ${formatDuration(fastest.durationMinutes)}, ₹${fastest.fareInr}\n` +
        `• Cheapest (${cheapest.mode}): ${cheapest.summary} — ${formatDuration(cheapest.durationMinutes)}, ₹${cheapest.fareInr}${leaveNote}`
      );
    }

    return (
      'Select any Origin and Destination across India (for example: Mathura Junction to Vrindavan, Prateek Grand City to Rajiv Chowk, or Delhi to Agra) or ask me directly like "Best route from Mathura Junction to Prem Mandir".\n' +
      'I verify which transport modes actually operate in that city and compare Local Auto, Bus, Metro, Train, Flight, and Ola/Uber fares.'
    );
  },
};
