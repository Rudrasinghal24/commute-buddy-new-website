import { DelhiPlace, DelhiPlacesData } from '../data/places';
import { formatLeaveBy } from './commuteFormatters';
import {
  calculateAutoFare,
  calculateBikeTaxiFare,
  calculateCabFare,
  calculateDtcBusFare,
  calculateFlightFareInr,
  calculateIndianRailwaysFare,
  calculateMetroFare,
  calculateStateBusFare,
} from './fares';
import { labelRoutes } from './recommend';
import {
  LivePricingAndAvailability,
  TransitAvailabilityApi,
} from './transitAvailabilityApi';
import {
  CrowdLevel,
  DataSourceLabel,
  Route,
  RouteLabel,
  RouteStep,
  StepsSource,
  TravelMode,
} from './types';

interface TrafficAndTransitAnalysis {
  roadTrafficMultiplier: number;
  trafficStatusLabel: string;
  roadCrowd: CrowdLevel;
  metroCrowd: CrowdLevel;
  busWaitMins: number;
  metroWaitMins: number;
  isIntercity: boolean;
  isLongDistance: boolean;
}

export const GetRoutesApi = {
  getRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    reachByTime: string | null = null,
    liveData: LivePricingAndAvailability | null = null
  ): Route[] {
    return this.planRoutesOnDevice(start, end, reachByTime, liveData);
  },

  planRoutesOnDevice(
    start: DelhiPlace,
    end: DelhiPlace,
    reachByTime: string | null = null,
    liveData: LivePricingAndAvailability | null = null
  ): Route[] {
    const pricing =
      liveData ?? TransitAvailabilityApi.evaluateInstantModeAvailability(start, end);
    const distanceKm = pricing.distanceKm;
    const roadKm = pricing.roadDistanceKm;

    const analysis = this.analyzeRealLifeTrafficAndAvailability(
      start,
      end,
      distanceKm,
      reachByTime
    );
    const allGenerated: Route[] = [];

    if (!pricing.metroAvailable && !analysis.isIntercity) {
      allGenerated.push(
        ...this.buildNonMetroLocalMultiModalMixJourneys(
          start,
          end,
          distanceKm,
          roadKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    } else if (analysis.isIntercity) {
      allGenerated.push(
        ...this.buildIntercityMultiModalMixJourneys(
          start,
          end,
          distanceKm,
          roadKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    } else {
      allGenerated.push(
        ...this.buildUrbanMultiModalMixJourneys(
          start,
          end,
          distanceKm,
          roadKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    }

    if (pricing.metroAvailable) {
      allGenerated.push(
        ...this.buildMetroOnlyRoutes(
          start,
          end,
          distanceKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    }

    if (pricing.busAvailable) {
      allGenerated.push(
        ...this.buildBusRoutes(
          start,
          end,
          distanceKm,
          roadKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    }

    if (pricing.trainAvailable) {
      allGenerated.push(
        ...this.buildTrainAndRrtsRoutes(
          start,
          end,
          distanceKm,
          analysis,
          reachByTime,
          pricing
        )
      );
    }

    if (pricing.flightAvailable) {
      allGenerated.push(
        ...this.buildFlightRoutes(start, end, distanceKm, analysis, reachByTime)
      );
    }

    allGenerated.push(
      ...this.buildRoadRoutes(
        start,
        end,
        distanceKm,
        roadKm,
        analysis,
        reachByTime,
        pricing
      )
    );

    const labeled = labelRoutes(allGenerated);
    return this.attachRecommendationReasons(labeled, analysis);
  },

  analyzeRealLifeTrafficAndAvailability(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    reachByTime: string | null
  ): TrafficAndTransitAnalysis {
    const isIntercity = distanceKm > 42.0;
    const isLongDistance = distanceKm >= 220.0;

    let hour24 = 9;
    if (
      reachByTime &&
      reachByTime.trim() !== '' &&
      !reachByTime.toLowerCase().includes('anytime')
    ) {
      const clean = reachByTime.trim().toUpperCase();
      const isPm = clean.includes('PM');
      const isAm = clean.includes('AM');
      const parts = clean.replace('AM', '').replace('PM', '').trim().split(':');
      let h = parseInt(parts[0]?.trim() || '9', 10) || 9;
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      hour24 = h;
    }

    const isMorningPeak = hour24 >= 8 && hour24 <= 11;
    const isEveningPeak = hour24 >= 17 && hour24 <= 20;
    const isPeak = isMorningPeak || isEveningPeak;

    const startMetroRegion = TransitAvailabilityApi.resolveMetroNetworkRegion(start);
    const isSmallCity = startMetroRegion === null && !isIntercity;

    let roadMultiplier = 1.1;
    if (isSmallCity && isPeak) roadMultiplier = 1.25;
    else if (isSmallCity) roadMultiplier = 1.08;
    else if (isMorningPeak) roadMultiplier = 1.42;
    else if (isEveningPeak) roadMultiplier = 1.5;
    else if (isIntercity) roadMultiplier = 1.2;

    let trafficStatus = 'Normal traffic flow';
    if (isSmallCity && isPeak) {
      trafficStatus = 'Moderate local bazaar & chowk congestion';
    } else if (isSmallCity) {
      trafficStatus = 'Smooth local road flow';
    } else if (isMorningPeak) {
      trafficStatus = 'Heavy morning peak traffic (+40% road delay)';
    } else if (isEveningPeak) {
      trafficStatus = 'Severe evening rush hour (+50% road delay)';
    } else if (isIntercity) {
      trafficStatus = 'Moderate highway toll & city-exit traffic';
    }

    return {
      roadTrafficMultiplier: roadMultiplier,
      trafficStatusLabel: trafficStatus,
      roadCrowd: isPeak ? CrowdLevel.HIGH : CrowdLevel.MODERATE,
      metroCrowd: isPeak ? CrowdLevel.HIGH : CrowdLevel.MODERATE,
      busWaitMins: isPeak ? 8 : 6,
      metroWaitMins: isPeak ? 3 : 5,
      isIntercity,
      isLongDistance,
    };
  },

  buildNonMetroLocalMultiModalMixJourneys(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    roadKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const hasRealRoad =
      Boolean(pricing.stepsSource && pricing.stepsSource !== 'template') &&
      Array.isArray(pricing.roadSteps) &&
      pricing.roadSteps.length > 0 &&
      pricing.osrmGeometry.length >= 2;
    const activeStepsSource: StepsSource = hasRealRoad
      ? pricing.stepsSource!
      : 'template';
    const baseCorridor: Array<[number, number]> = hasRealRoad
      ? pricing.osrmGeometry
      : [];

    const walkFirstMins = 5;
    const sharedTempoMins = Math.max(
      8,
      Math.round((roadKm / 24.0) * 60.0 * analysis.roadTrafficMultiplier)
    );
    const eRickshawLastMins = 6;
    const totalMix1Duration = walkFirstMins + sharedTempoMins + eRickshawLastMins;
    const sharedTempoFare = Math.max(
      10,
      Math.min(40, Math.round((roadKm * 2.2) / 5) * 5)
    );
    const eRickshawFare = 15;
    const totalMix1Fare = sharedTempoFare + eRickshawFare;

    const mix1Steps: RouteStep[] =
      hasRealRoad && pricing.roadSteps
        ? pricing.roadSteps.map((st, idx) => ({
            ...st,
            mode: idx === 0 ? TravelMode.WALK : TravelMode.CAR,
          }))
        : [];

    routes.push({
      id: `mix_local_shared_${start.id}_${end.id}`,
      mode: TravelMode.MIX,
      durationMinutes: totalMix1Duration,
      fareInr: totalMix1Fare,
      summary: `Walk + Shared Auto/Tempo + E-Rickshaw (${roadKm.toFixed(1)} km)`,
      steps: mix1Steps,
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: 9,
      crowdLevel: CrowdLevel.MODERATE,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, totalMix1Duration),
      trafficStatus: `${analysis.trafficStatusLabel} • Verified local transit (No Metro in this city)`,
      recommendationReason:
        'Most popular & budget-friendly local commute using shared tempo + e-rickshaw',
      transfersCount: 1,
      stepsSource: activeStepsSource,
    });

    const feederAutoMins = 6;
    const busRideMins = Math.max(
      10,
      Math.round((roadKm / 22.0) * 60.0 * analysis.roadTrafficMultiplier) +
        analysis.busWaitMins
    );
    const walkEndMins = 5;
    const totalMix2Duration = feederAutoMins + busRideMins + walkEndMins;
    const busFare = Math.max(
      pricing.localBusMinFareInr,
      Math.min(pricing.localBusMaxFareInr, Math.round((roadKm * 1.6) / 5) * 5)
    );
    const totalMix2Fare = 15 + busFare;

    const firstHalfSteps =
      hasRealRoad && pricing.roadSteps
        ? pricing.roadSteps
            .slice(0, Math.max(1, Math.ceil(pricing.roadSteps.length / 2)))
            .map((st) => ({ ...st, mode: TravelMode.CAR }))
        : [];
    const secondHalfSteps =
      hasRealRoad && pricing.roadSteps && pricing.roadSteps.length > 1
        ? pricing.roadSteps
            .slice(Math.max(1, Math.ceil(pricing.roadSteps.length / 2)))
            .map((st) => ({ ...st, mode: TravelMode.WALK }))
        : [];

    routes.push({
      id: `mix_local_bus_${start.id}_${end.id}`,
      mode: TravelMode.MIX,
      durationMinutes: totalMix2Duration,
      fareInr: totalMix2Fare,
      summary: `E-Rickshaw + ${pricing.busOperatorName} + Walk`,
      steps: hasRealRoad
        ? [
            ...firstHalfSteps,
            {
              mode: TravelMode.BUS,
              instruction: `Board ${pricing.busOperatorName} towards ${end.name} (₹${busFare})`,
              durationMinutes: busRideMins,
            },
            ...secondHalfSteps,
          ]
        : [],
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: 8,
      crowdLevel: analysis.roadCrowd,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, totalMix2Duration),
      trafficStatus: analysis.trafficStatusLabel,
      recommendationReason: 'Comfortable AC e-Bus + E-Rickshaw combination',
      transfersCount: 1,
      stepsSource: activeStepsSource,
    });

    return routes;
  },

  buildUrbanMultiModalMixJourneys(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    _roadKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const hasRealRoad =
      Boolean(pricing.stepsSource && pricing.stepsSource !== 'template') &&
      Array.isArray(pricing.roadSteps) &&
      pricing.roadSteps.length > 0 &&
      pricing.osrmGeometry.length >= 2;
    const activeStepsSource: StepsSource = hasRealRoad
      ? pricing.stepsSource!
      : 'template';
    const baseCorridor: Array<[number, number]> = hasRealRoad
      ? pricing.osrmGeometry
      : [];

    const firstMileKm =
      start.metroAccess === false
        ? Math.min(4.8, Math.max(1.8, distanceKm * 0.22))
        : 0.6;
    const lastMileKm =
      end.metroAccess === false
        ? Math.min(4.2, Math.max(1.5, distanceKm * 0.18))
        : 0.5;
    const metroTrunkKm = Math.max(2.5, distanceKm * 1.18 - firstMileKm - lastMileKm);

    const firstMileAutoMins =
      start.metroAccess === false
        ? Math.max(
            6,
            Math.round(
              (firstMileKm / 20.0) * 60.0 * analysis.roadTrafficMultiplier
            )
          )
        : 5;
    const firstMileFare =
      start.metroAccess === false ? Math.max(20, Math.round(firstMileKm * 9.0)) : 0;

    const metroMins =
      Math.max(8, Math.round((metroTrunkKm / 34.0) * 60.0)) +
      analysis.metroWaitMins +
      (metroTrunkKm > 14 ? 5 : 0);
    const metroFare = calculateMetroFare(metroTrunkKm);

    const lastMileMins =
      end.metroAccess === false
        ? Math.max(
            6,
            Math.round(
              (lastMileKm / 20.0) * 60.0 * analysis.roadTrafficMultiplier
            )
          )
        : 5;
    const lastMileFare =
      end.metroAccess === false ? Math.max(20, Math.round(lastMileKm * 9.0)) : 0;

    const totalMixDuration = firstMileAutoMins + metroMins + lastMileMins;
    const totalMixFare = firstMileFare + metroFare + lastMileFare;

    const firstLegMode =
      start.metroAccess === false ? TravelMode.CAR : TravelMode.WALK;
    const lastLegMode =
      end.metroAccess === false ? TravelMode.CAR : TravelMode.WALK;

    const mixSteps: RouteStep[] =
      hasRealRoad && pricing.roadSteps
        ? [
            {
              ...pricing.roadSteps[0],
              mode: firstLegMode,
            },
            {
              mode: TravelMode.METRO,
              instruction: `Board ${pricing.metroSystemName} towards ${end.name} corridor (₹${metroFare})`,
              durationMinutes: metroMins,
            },
            ...(pricing.roadSteps.length > 1
              ? [
                  {
                    ...pricing.roadSteps[pricing.roadSteps.length - 1],
                    mode: lastLegMode,
                  },
                ]
              : []),
          ]
        : [];

    routes.push({
      id: `mix_auto_metro_${start.id}_${end.id}`,
      mode: TravelMode.MIX,
      durationMinutes: totalMixDuration,
      fareInr: totalMixFare,
      summary:
        start.metroAccess === false || end.metroAccess === false
          ? `Shared Auto + ${pricing.metroSystemName} + Last-Mile`
          : `Walk + ${pricing.metroSystemName} Express`,
      steps: mixSteps,
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: 9,
      crowdLevel: analysis.metroCrowd,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, totalMixDuration),
      trafficStatus: 'Bypasses road traffic via grade-separated Metro rail',
      recommendationReason: 'Best balance of speed, low fare & high reliability',
      transfersCount: 2,
      stepsSource: activeStepsSource,
    });

    if (distanceKm >= 5.0) {
      const bikeFirstMins = Math.max(5, Math.round((firstMileKm / 26.0) * 60.0));
      const bikeFare = calculateBikeTaxiFare(firstMileKm);
      const fastMixDuration = bikeFirstMins + metroMins + 4;
      const fastMixFare = bikeFare + metroFare;

      const fastMixSteps: RouteStep[] =
        hasRealRoad && pricing.roadSteps
          ? [
              {
                ...pricing.roadSteps[0],
                mode: TravelMode.BIKE,
              },
              {
                mode: TravelMode.METRO,
                instruction: `Fast ${pricing.metroSystemName} transit towards ${end.name} (₹${metroFare})`,
                durationMinutes: metroMins,
              },
              ...(pricing.roadSteps.length > 1
                ? [
                    {
                      ...pricing.roadSteps[pricing.roadSteps.length - 1],
                      mode: TravelMode.WALK,
                    },
                  ]
                : []),
            ]
          : [];

      routes.push({
        id: `mix_bike_metro_${start.id}_${end.id}`,
        mode: TravelMode.MIX,
        durationMinutes: fastMixDuration,
        fareInr: fastMixFare,
        summary: `Bike Taxi + ${pricing.metroSystemName} + Walk`,
        steps: fastMixSteps,
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 9,
        crowdLevel: analysis.metroCrowd,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, fastMixDuration),
        trafficStatus: 'Fast two-wheeler feeder + congestion-free Metro',
        recommendationReason: 'Fastest door-to-door hybrid commute during peak hours',
        transfersCount: 2,
        stepsSource: activeStepsSource,
      });
    }

    return routes;
  },

  buildIntercityMultiModalMixJourneys(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    roadKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const hasRealRoad =
      Boolean(pricing.stepsSource && pricing.stepsSource !== 'template') &&
      Array.isArray(pricing.roadSteps) &&
      pricing.roadSteps.length > 0 &&
      pricing.osrmGeometry.length >= 2;
    const activeStepsSource: StepsSource = hasRealRoad
      ? pricing.stepsSource!
      : 'template';
    const baseCorridor: Array<[number, number]> = hasRealRoad
      ? pricing.osrmGeometry
      : [];

    const firstMileMins = 18;
    const firstMileFare = 60;
    const railDistanceKm = distanceKm * 1.15;
    const railDurationMins = Math.max(
      45,
      Math.round((railDistanceKm / 78.0) * 60.0) + 15
    );
    const railFare = calculateIndianRailwaysFare(railDistanceKm, 'CHAIR_CAR');
    const lastMileMins = 16;
    const lastMileFare = 50;

    const totalTrainMixMins = firstMileMins + railDurationMins + lastMileMins;
    const totalTrainMixFare = firstMileFare + railFare + lastMileFare;

    routes.push({
      id: `mix_intercity_rail_${start.id}_${end.id}`,
      mode: TravelMode.MIX,
      durationMinutes: totalTrainMixMins,
      fareInr: totalTrainMixFare,
      summary: 'Auto/Metro to Station + Superfast Train + Local Auto',
      steps:
        hasRealRoad && pricing.roadSteps
          ? [
              {
                ...pricing.roadSteps[0],
                mode: TravelMode.CAR,
              },
              {
                mode: TravelMode.TRAIN,
                instruction: `Indian Railways Express / Intercity (${Math.round(railDistanceKm)} km, ₹${railFare})`,
                durationMinutes: railDurationMins,
              },
              ...(pricing.roadSteps.length > 1
                ? [
                    {
                      ...pricing.roadSteps[pricing.roadSteps.length - 1],
                      mode: TravelMode.CAR,
                    },
                  ]
                : []),
            ]
          : [],
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: 9,
      crowdLevel: CrowdLevel.MODERATE,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, totalTrainMixMins),
      trafficStatus: 'Immune to highway traffic jams; reserved railway seating',
      recommendationReason:
        'Best end-to-end intercity journey combining station feeder + Express Rail',
      transfersCount: 2,
      stepsSource: activeStepsSource,
    });

    const busDistanceKm = roadKm;
    const busRideMins = Math.max(
      55,
      Math.round((busDistanceKm / 54.0) * 60.0 * analysis.roadTrafficMultiplier)
    );
    const busFare = calculateStateBusFare(busDistanceKm, false);
    const totalBusMixMins = 15 + busRideMins + 15;
    const totalBusMixFare = 40 + busFare + 40;

    routes.push({
      id: `mix_intercity_bus_${start.id}_${end.id}`,
      mode: TravelMode.MIX,
      durationMinutes: totalBusMixMins,
      fareInr: totalBusMixFare,
      summary: `Shared Auto + ${pricing.busOperatorName} + E-Rickshaw`,
      steps:
        hasRealRoad && pricing.roadSteps
          ? [
              {
                ...pricing.roadSteps[0],
                mode: TravelMode.CAR,
              },
              {
                mode: TravelMode.BUS,
                instruction: `State Roadways Express Bus (${Math.round(busDistanceKm)} km, ₹${busFare})`,
                durationMinutes: busRideMins,
              },
              ...(pricing.roadSteps.length > 1
                ? [
                    {
                      ...pricing.roadSteps[pricing.roadSteps.length - 1],
                      mode: TravelMode.CAR,
                    },
                  ]
                : []),
            ]
          : [],
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: 8,
      crowdLevel: CrowdLevel.HIGH,
      dataSource: DataSourceLabel.SCHEDULED,
      leaveByLabel: formatLeaveBy(reachByTime, totalBusMixMins),
      trafficStatus: analysis.trafficStatusLabel,
      recommendationReason: 'Most economical door-to-door intercity option without prior booking',
      transfersCount: 2,
      stepsSource: activeStepsSource,
    });

    return routes;
  },

  buildMetroOnlyRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const metroTrackKm = distanceKm * 1.22;
    const metroDuration = Math.max(
      14,
      Math.round((metroTrackKm / 33.0) * 60.0) + analysis.metroWaitMins + 10
    );
    const metroFare = calculateMetroFare(metroTrackKm);

    routes.push({
      id: `metro_direct_${start.id}_${end.id}`,
      mode: TravelMode.METRO,
      durationMinutes: metroDuration,
      fareInr: metroFare,
      summary: `${pricing.metroSystemName} Rapid Transit`,
      steps: [
        {
          mode: TravelMode.WALK,
          instruction: `Walk to nearest Metro Station from ${start.name}`,
          durationMinutes: 6,
        },
        {
          mode: TravelMode.METRO,
          instruction: `Board ${pricing.metroSystemName} towards ${end.name} (${Math.round(metroTrackKm)} km)`,
          durationMinutes: Math.max(6, metroDuration - 12),
        },
        {
          mode: TravelMode.WALK,
          instruction: `Walk from Metro Exit Gate to ${end.name}`,
          durationMinutes: 6,
        },
      ],
      label: RouteLabel.None,
      corridorPath: this.buildCorridorPath(start, end, 0.008),
      reliabilityScore: 9,
      crowdLevel: analysis.metroCrowd,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, metroDuration),
      trafficStatus: 'Zero road traffic • AC coaches every 3–5 mins',
      recommendationReason: 'Consistent travel time unaffected by road congestion',
      transfersCount: distanceKm > 14 ? 1 : 0,
    });

    return routes;
  },

  buildBusRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    roadKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const baseCorridor =
      pricing.osrmGeometry.length >= 2
        ? pricing.osrmGeometry
        : this.buildCorridorPath(start, end, -0.006);

    if (!analysis.isIntercity) {
      const busDuration = Math.max(
        14,
        Math.round((roadKm / 21.0) * 60.0 * analysis.roadTrafficMultiplier) +
          analysis.busWaitMins +
          8
      );
      const busFare = pricing.metroAvailable
        ? calculateDtcBusFare(roadKm, true)
        : Math.max(
            pricing.localBusMinFareInr,
            Math.min(
              pricing.localBusMaxFareInr,
              Math.round((roadKm * 1.6) / 5) * 5
            )
          );

      routes.push({
        id: `bus_city_ac_${start.id}_${end.id}`,
        mode: TravelMode.BUS,
        durationMinutes: busDuration,
        fareInr: busFare,
        summary: `${pricing.busOperatorName} (${roadKm.toFixed(1)} km)`,
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Walk 350m to ${start.name} Bus Stop`,
            durationMinutes: 5,
          },
          {
            mode: TravelMode.BUS,
            instruction: `Board ${pricing.busOperatorName} towards ${end.name} (₹${busFare})`,
            durationMinutes: Math.max(8, busDuration - 9),
          },
          {
            mode: TravelMode.WALK,
            instruction: `Alight and walk 300m to ${end.name}`,
            durationMinutes: 4,
          },
        ],
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 7,
        crowdLevel: analysis.roadCrowd,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, busDuration),
        trafficStatus: analysis.trafficStatusLabel,
        recommendationReason: 'Lowest-cost public bus option for this corridor',
        transfersCount: 0,
      });
    } else {
      const volvoDuration = Math.max(
        50,
        Math.round((roadKm / 58.0) * 60.0 * analysis.roadTrafficMultiplier) + 15
      );
      const volvoFare = calculateStateBusFare(roadKm, true);
      const ordinaryDuration = Math.max(
        60,
        Math.round((roadKm / 48.0) * 60.0 * analysis.roadTrafficMultiplier) + 20
      );
      const ordinaryFare = calculateStateBusFare(roadKm, false);

      routes.push({
        id: `bus_intercity_volvo_${start.id}_${end.id}`,
        mode: TravelMode.BUS,
        durationMinutes: volvoDuration,
        fareInr: volvoFare,
        summary: `${pricing.busOperatorName} AC Janrath / Volvo (${Math.round(roadKm)} km)`,
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Reach main ISBT / Highway Bus Boarding Point near ${start.name}`,
            durationMinutes: 10,
          },
          {
            mode: TravelMode.BUS,
            instruction: `AC Volvo / Janrath Express via National Highway to ${end.name}`,
            durationMinutes: volvoDuration - 15,
          },
          {
            mode: TravelMode.WALK,
            instruction: `Exit at ${end.name} Bus Terminal`,
            durationMinutes: 5,
          },
        ],
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 8,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, volvoDuration),
        trafficStatus: analysis.trafficStatusLabel,
        recommendationReason: 'Comfortable AC highway coach with frequent departures',
        transfersCount: 0,
      });

      routes.push({
        id: `bus_intercity_ordinary_${start.id}_${end.id}`,
        mode: TravelMode.BUS,
        durationMinutes: ordinaryDuration,
        fareInr: ordinaryFare,
        summary: `${pricing.busOperatorName} Ordinary Express`,
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Board at ${start.name} Roadways Bus Stand`,
            durationMinutes: 10,
          },
          {
            mode: TravelMode.BUS,
            instruction: `State Roadways Non-AC Express to ${end.name} (₹${ordinaryFare})`,
            durationMinutes: ordinaryDuration - 15,
          },
          {
            mode: TravelMode.WALK,
            instruction: `Alight at ${end.name} Bus Stand`,
            durationMinutes: 5,
          },
        ],
        label: RouteLabel.None,
        corridorPath: this.buildCorridorPath(start, end, -0.012),
        reliabilityScore: 7,
        crowdLevel: CrowdLevel.HIGH,
        dataSource: DataSourceLabel.SCHEDULED,
        leaveByLabel: formatLeaveBy(reachByTime, ordinaryDuration),
        trafficStatus: analysis.trafficStatusLabel,
        recommendationReason: 'Most affordable turn-up-and-go highway bus fare',
        transfersCount: 0,
      });
    }

    return routes;
  },

  buildTrainAndRrtsRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    _pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const railKm = distanceKm * 1.15;

    if (!analysis.isIntercity) {
      const emuDuration = Math.max(
        24,
        Math.round((railKm / 46.0) * 60.0) + 14
      );
      const emuFare = calculateIndianRailwaysFare(railKm, 'LOCAL_MEMU');

      routes.push({
        id: `train_suburban_emu_${start.id}_${end.id}`,
        mode: TravelMode.TRAIN,
        durationMinutes: emuDuration,
        fareInr: emuFare,
        summary: 'Suburban EMU / MEMU Passenger Train',
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Reach nearest Suburban Railway Halt from ${start.name}`,
            durationMinutes: 8,
          },
          {
            mode: TravelMode.TRAIN,
            instruction: `Suburban EMU / MEMU Express towards ${end.name} (${Math.round(railKm)} km)`,
            durationMinutes: Math.max(10, emuDuration - 15),
          },
          {
            mode: TravelMode.WALK,
            instruction: `Exit railway platform towards ${end.name}`,
            durationMinutes: 7,
          },
        ],
        label: RouteLabel.None,
        corridorPath: this.buildCorridorPath(start, end, 0.01),
        reliabilityScore: 8,
        crowdLevel: CrowdLevel.HIGH,
        dataSource: DataSourceLabel.SCHEDULED,
        leaveByLabel: formatLeaveBy(reachByTime, emuDuration),
        trafficStatus: 'Dedicated Indian Railways track • Unbeatable ₹10–₹25 fare',
        recommendationReason: 'Cheapest rail option for cross-city travel',
        transfersCount: 0,
      });
    } else {
      const vbDuration = Math.max(
        40,
        Math.round((railKm / 86.0) * 60.0) + 20
      );
      const vbFare = calculateIndianRailwaysFare(railKm, 'VANDE_BHARAT');

      const expDuration = Math.max(
        52,
        Math.round((railKm / 64.0) * 60.0) + 25
      );
      const expFare = calculateIndianRailwaysFare(railKm, 'SLEEPER');

      routes.push({
        id: `train_vande_bharat_${start.id}_${end.id}`,
        mode: TravelMode.TRAIN,
        durationMinutes: vbDuration,
        fareInr: vbFare,
        summary: 'Vande Bharat / Shatabdi AC Chair Car',
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Board at ${start.name} Railway Junction`,
            durationMinutes: 10,
          },
          {
            mode: TravelMode.TRAIN,
            instruction: `High-Speed Vande Bharat / Shatabdi Express (${Math.round(railKm)} km)`,
            durationMinutes: vbDuration - 18,
          },
          {
            mode: TravelMode.WALK,
            instruction: `Arrive at ${end.name} Railway Terminal`,
            durationMinutes: 8,
          },
        ],
        label: RouteLabel.None,
        corridorPath: this.buildCorridorPath(start, end, 0.014),
        reliabilityScore: 9,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, vbDuration),
        trafficStatus: 'Priority railway signalling • On-time performance',
        recommendationReason: 'Fastest & most comfortable intercity rail experience',
        transfersCount: 0,
      });

      routes.push({
        id: `train_mail_express_${start.id}_${end.id}`,
        mode: TravelMode.TRAIN,
        durationMinutes: expDuration,
        fareInr: expFare,
        summary: 'Superfast Mail / Express (Sleeper / 2S)',
        steps: [
          {
            mode: TravelMode.WALK,
            instruction: `Reach ${start.name} Railway Station`,
            durationMinutes: 12,
          },
          {
            mode: TravelMode.TRAIN,
            instruction: `Indian Railways Superfast Express (${Math.round(railKm)} km, ₹${expFare})`,
            durationMinutes: expDuration - 20,
          },
          {
            mode: TravelMode.WALK,
            instruction: `Exit at ${end.name} Junction`,
            durationMinutes: 8,
          },
        ],
        label: RouteLabel.None,
        corridorPath: this.buildCorridorPath(start, end, 0.009),
        reliabilityScore: 8,
        crowdLevel: CrowdLevel.HIGH,
        dataSource: DataSourceLabel.SCHEDULED,
        leaveByLabel: formatLeaveBy(reachByTime, expDuration),
        trafficStatus: 'Regular Indian Railways Express service',
        recommendationReason: 'Best budget long-distance train fare',
        transfersCount: 0,
      });
    }

    return routes;
  },

  buildFlightRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    _analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null
  ): Route[] {
    const airTimeMins = Math.max(50, Math.round((distanceKm / 680.0) * 60.0) + 25);
    const airportBufferMins = 95;
    const totalFlightJourneyMins = airTimeMins + airportBufferMins;
    const flightFare = calculateFlightFareInr(distanceKm);

    return [
      {
        id: `flight_direct_${start.id}_${end.id}`,
        mode: TravelMode.FLIGHT,
        durationMinutes: totalFlightJourneyMins,
        fareInr: flightFare,
        summary: `Non-Stop Flight (${airTimeMins}m air time + airport transfer)`,
        steps: [
          {
            mode: TravelMode.CAR,
            instruction: `Airport transfer & security check-in from ${start.name}`,
            durationMinutes: 65,
          },
          {
            mode: TravelMode.FLIGHT,
            instruction: `Non-stop Domestic Flight (IndiGo / Air India, ${Math.round(distanceKm)} km)`,
            durationMinutes: airTimeMins,
          },
          {
            mode: TravelMode.CAR,
            instruction: `Arrival terminal exit to ${end.name}`,
            durationMinutes: 30,
          },
        ],
        label: RouteLabel.None,
        corridorPath: this.buildCorridorPath(start, end, 0.025),
        reliabilityScore: 9,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, totalFlightJourneyMins),
        trafficStatus: 'Direct air corridor • Includes 95m airport transfer & check-in',
        recommendationReason: 'Saves 6+ hours on long-distance intercity travel',
        transfersCount: 0,
      },
    ];
  },

  buildRoadRoutes(
    start: DelhiPlace,
    end: DelhiPlace,
    distanceKm: number,
    roadKm: number,
    analysis: TrafficAndTransitAnalysis,
    reachByTime: string | null,
    pricing: LivePricingAndAvailability
  ): Route[] {
    const routes: Route[] = [];
    const hasRealRoad =
      Boolean(pricing.stepsSource && pricing.stepsSource !== 'template') &&
      Array.isArray(pricing.roadSteps) &&
      pricing.roadSteps.length > 0 &&
      pricing.osrmGeometry.length >= 2;
    const activeStepsSource: StepsSource = hasRealRoad
      ? pricing.stepsSource!
      : 'template';
    const baseCorridor: Array<[number, number]> = hasRealRoad
      ? pricing.osrmGeometry
      : [];

    const buildModeSteps = (mode: TravelMode): RouteStep[] => {
      if (hasRealRoad && pricing.roadSteps) {
        return pricing.roadSteps.map((st) => ({
          ...st,
          mode,
        }));
      }
      return [];
    };

    const cabSpeedKmh = analysis.isIntercity ? 64.0 : 28.0;
    const cabDuration =
      pricing.osrmRoadDurationMins ??
      Math.max(
        8,
        Math.round((roadKm / cabSpeedKmh) * 60.0 * analysis.roadTrafficMultiplier)
      );
    const cabFare = analysis.isIntercity
      ? calculateCabFare(roadKm)
      : Math.round(pricing.cabBaseFareInr + roadKm * pricing.cabPerKmInr);

    routes.push({
      id: `car_cab_${start.id}_${end.id}`,
      mode: TravelMode.CAR,
      durationMinutes: cabDuration,
      fareInr: cabFare,
      summary: analysis.isIntercity
        ? `Intercity Outstation Cab (${Math.round(roadKm)} km)`
        : `Ola / Uber AC Cab (${roadKm.toFixed(1)} km)`,
      steps: buildModeSteps(TravelMode.CAR),
      label: RouteLabel.None,
      corridorPath: baseCorridor,
      reliabilityScore: analysis.roadTrafficMultiplier > 1.35 ? 6 : 8,
      crowdLevel: CrowdLevel.LOW,
      dataSource: DataSourceLabel.LIVE,
      leaveByLabel: formatLeaveBy(reachByTime, cabDuration),
      trafficStatus: analysis.trafficStatusLabel,
      recommendationReason: 'Private door-to-door AC ride with zero transfers',
      transfersCount: 0,
      stepsSource: activeStepsSource,
    });

    if (distanceKm <= 42.0) {
      const autoDuration = Math.max(
        9,
        Math.round((roadKm / 24.0) * 60.0 * analysis.roadTrafficMultiplier)
      );
      const autoFare =
        roadKm <= 2.0
          ? pricing.autoBaseFareInr
          : Math.round(
              pricing.autoBaseFareInr + (roadKm - 2.0) * pricing.autoPerKmInr
            );

      routes.push({
        id: `car_auto_${start.id}_${end.id}`,
        mode: TravelMode.CAR,
        durationMinutes: autoDuration,
        fareInr: Math.max(autoFare, calculateAutoFare(roadKm) - 10),
        summary: `Direct Auto Rickshaw (${roadKm.toFixed(1)} km)`,
        steps: buildModeSteps(TravelMode.CAR),
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 8,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, autoDuration),
        trafficStatus: analysis.trafficStatusLabel,
        recommendationReason: 'Cheaper than cab with quick street-hail availability',
        transfersCount: 0,
        stepsSource: activeStepsSource,
      });
    }

    if (distanceKm <= 120.0) {
      const bikeSpeedKmh = analysis.isIntercity ? 55.0 : 34.0;
      const bikeMultiplier = Math.max(1.05, analysis.roadTrafficMultiplier - 0.22);
      const bikeDuration = Math.max(
        6,
        Math.round((roadKm / bikeSpeedKmh) * 60.0 * bikeMultiplier)
      );
      const bikeFare = Math.round(
        pricing.bikeBaseFareInr + roadKm * pricing.bikePerKmInr
      );

      routes.push({
        id: `bike_direct_${start.id}_${end.id}`,
        mode: TravelMode.BIKE,
        durationMinutes: bikeDuration,
        fareInr: bikeFare,
        summary:
          distanceKm <= 35.0
            ? `Rapido / Ola Bike Taxi (${roadKm.toFixed(1)} km)`
            : `Two-Wheeler Highway Ride (${Math.round(roadKm)} km)`,
        steps: buildModeSteps(TravelMode.BIKE),
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 8,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, bikeDuration),
        trafficStatus: 'Filters through traffic bottlenecks faster than 4-wheelers',
        recommendationReason: 'Fastest & cheapest solo road option',
        transfersCount: 0,
        stepsSource: activeStepsSource,
      });
    }

    if (distanceKm <= 8.0) {
      const walkKm = distanceKm * 1.18;
      const walkDuration = Math.max(5, Math.round((walkKm / 4.8) * 60.0));
      routes.push({
        id: `walk_direct_${start.id}_${end.id}`,
        mode: TravelMode.WALK,
        durationMinutes: walkDuration,
        fareInr: 0,
        summary: `Pedestrian Walk (${walkKm.toFixed(1)} km)`,
        steps: buildModeSteps(TravelMode.WALK),
        label: RouteLabel.None,
        corridorPath: baseCorridor,
        reliabilityScore: 10,
        crowdLevel: CrowdLevel.LOW,
        dataSource: DataSourceLabel.LIVE,
        leaveByLabel: formatLeaveBy(reachByTime, walkDuration),
        trafficStatus: 'Zero wait time • Pedestrian pathway',
        recommendationReason: 'Free & healthy option for short distances',
        transfersCount: 0,
        stepsSource: activeStepsSource,
      });
    }

    return routes;
  },

  attachRecommendationReasons(
    routes: Route[],
    _analysis: TrafficAndTransitAnalysis
  ): Route[] {
    if (routes.length === 0) return [];
    let fastest = routes[0];
    for (const r of routes) {
      if (r.durationMinutes < fastest.durationMinutes) fastest = r;
    }
    const nonZero = routes.filter((r) => r.fareInr > 0);
    let cheapest = nonZero.length > 0 ? nonZero[0] : routes[0];
    for (const r of nonZero) {
      if (r.fareInr < cheapest.fareInr) cheapest = r;
    }

    return routes.map((r) => {
      const extraTag =
        r.label === RouteLabel.Recommended
          ? `Recommended: ${r.recommendationReason}`
          : r.id === fastest.id
          ? `Fastest option (${r.durationMinutes} min) • Saves ${Math.max(
              0,
              cheapest.durationMinutes - r.durationMinutes
            )} min vs cheapest`
          : r.id === cheapest.id
          ? `Cheapest option (₹${r.fareInr}) • Saves ₹${Math.max(
              0,
              fastest.fareInr - r.fareInr
            )} vs fastest`
          : r.recommendationReason;
      return {
        ...r,
        recommendationReason: extraTag,
      };
    });
  },

  buildCorridorPath(
    start: DelhiPlace,
    end: DelhiPlace,
    curveOffset: number
  ): Array<[number, number]> {
    const midLat = (start.lat + end.lat) / 2.0 + curveOffset;
    const midLng = (start.lng + end.lng) / 2.0 - curveOffset;
    const q1Lat = (start.lat + midLat) / 2.0 + curveOffset * 0.4;
    const q1Lng = (start.lng + midLng) / 2.0 - curveOffset * 0.4;
    const q3Lat = (midLat + end.lat) / 2.0 + curveOffset * 0.4;
    const q3Lng = (midLng + end.lng) / 2.0 - curveOffset * 0.4;

    return [
      [start.lat, start.lng],
      [q1Lat, q1Lng],
      [midLat, midLng],
      [q3Lat, q3Lng],
      [end.lat, end.lng],
    ];
  },
};
