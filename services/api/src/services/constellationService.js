import { CONSTELLATION_STARS } from '@sirius/shared';
import { DailyLog } from '../models/DailyLog.js';

export async function getConstellation(simulation, logs) {
  const closedLogs = logs.filter((l) => l.closedAt);
  const stars = CONSTELLATION_STARS.map((star) => {
    let status = 'locked';
    const dayLog = logs.find((l) => l.dayNumber === star.day);
    const isPast = simulation.currentDay > star.day || simulation.status === 'completed';
    const isCurrent = simulation.currentDay === star.day && simulation.status === 'in_progress';

    if (isPast || isCurrent) status = 'available';
    if (dayLog?.closedAt) {
      const score = dayLog.dayScore ?? 0;
      const hasMajorPenalty = (dayLog.penalties || []).some((p) => p.points <= -10);
      if (star.type === 'discipline') {
        status = score >= 70 && !hasMajorPenalty ? 'obtained' : 'failed';
      } else {
        status = evaluateEventStar(star.id, simulation, logs, dayLog) ? 'obtained' : isPast ? 'failed' : 'available';
      }
    }
    if (simulation.currentDay < star.day && simulation.status === 'in_progress') status = 'locked';

    return { ...star, status };
  });

  const obtained = stars.filter((s) => s.status === 'obtained').length;
  return { stars, obtained, total: stars.length, trophyUnlocked: simulation.status === 'completed' };
}

function evaluateEventStar(starId, simulation, logs, dayLog) {
  const actions = (dayLog?.actions || []).map((a) => a.type);
  const allActions = logs.flatMap((l) => (l.actions || []).map((a) => ({ type: a.type, day: l.dayNumber, meta: a.metadata })));
  switch (starId) {
    case 'e01': return true;
    case 'e02': return allActions.some((a) => a.type === 'shop_purchase');
    case 'e03': return allActions.some((a) => a.type === 'walk');
    case 'e04': return actions.includes('brush');
    case 'e05': return allActions.some((a) => a.meta?.itemId === 'vermifuge');
    case 'e06': return actions.includes('vet_care');
    case 'e07': return simulation.currentDay >= 14;
    case 'e08': return actions.includes('play');
    case 'e09': return simulation.currentDay >= 21;
    case 'e10': return allActions.some((a) => a.meta?.itemId === 'croquettes_quality');
    case 'e11': return actions.includes('antiparasitic');
    case 'e12': return (simulation.finalScore ?? 0) >= 60;
    case 'e13': return (simulation.purchasedVitalItems || []).length >= 2;
    case 'e14': return simulation.status === 'completed';
    case 'e15': return simulation.validatedByShelter === true;
    default: return false;
  }
}

export function computeStreak(logs) {
  const closed = [...logs].filter((l) => l.closedAt).sort((a, b) => b.dayNumber - a.dayNumber);
  let streak = 0;
  for (const log of closed) {
    const major = (log.penalties || []).some((p) => p.points <= -10);
    if (major) break;
    if ((log.dayScore ?? 0) >= 60) streak += 1;
    else break;
  }
  return streak;
}

export function deriveHealthState(gauges) {
  if (gauges.hunger < 30 || gauges.energy < 30) return 'sick';
  if (gauges.hunger < 50) return 'hungry';
  if (gauges.energy < 50) return 'tired';
  if (gauges.mental < 40) return 'sad';
  return 'happy';
}
