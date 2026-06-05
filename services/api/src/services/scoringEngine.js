import crypto from 'crypto';
import {
  ANTIPARASITIC_TARGET_DAYS,
  BRUSHES_PER_WEEK_MAX,
  BRUSHES_PER_WEEK_MIN,
  DAY_SCORE_BASE,
  IDEAL_WALK_SESSIONS,
  MEAL_GRAMS_MAX,
  MEAL_GRAMS_MIN,
  MEALS_PER_DAY,
  MIN_MENTAL_MINUTES_PER_DAY,
  MIN_WALK_MINUTES_PER_DAY,
  PENALTY_CODES,
  BONUS_CODES,
  POST_MEAL_EXERCISE_BUFFER_HOURS,
  SIMULATION_DAYS,
} from '@sirius/shared';

function hoursBetween(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60);
}

function getWeekNumber(dayNumber) {
  return Math.ceil(dayNumber / 7);
}

export function evaluateDayLog(dayLog, simulation, allLogs) {
  const penalties = [];
  const bonuses = [];
  const actions = dayLog.actions || [];
  const dayNumber = dayLog.dayNumber;

  const meals = actions.filter((a) => a.type === 'meal');
  const walks = actions.filter((a) => a.type === 'walk');
  const mental = actions.filter((a) => a.type === 'mental_stimulation');
  const brushes = actions.filter((a) => a.type === 'brush');
  const antiparasitic = actions.filter((a) => a.type === 'antiparasitic');
  const purchases = actions.filter((a) => a.type === 'shop_purchase');

  if (meals.length > MEALS_PER_DAY) {
    penalties.push({
      code: PENALTY_CODES.EXTRA_MEAL,
      message: `${meals.length} repas enregistrés (max ${MEALS_PER_DAY}) — risque obésité`,
      points: -8 * (meals.length - MEALS_PER_DAY),
    });
  } else if (meals.length < MEALS_PER_DAY) {
    penalties.push({
      code: PENALTY_CODES.MEAL_PORTION,
      message: `Seulement ${meals.length} repas (attendu ${MEALS_PER_DAY})`,
      points: -10,
    });
  }

  for (const meal of meals) {
    const grams = meal.metadata?.grams ?? 350;
    if (grams < MEAL_GRAMS_MIN || grams > MEAL_GRAMS_MAX) {
      penalties.push({
        code: PENALTY_CODES.MEAL_PORTION,
        message: `Portion ${grams}g hors plage ${MEAL_GRAMS_MIN}-${MEAL_GRAMS_MAX}g`,
        points: -5,
      });
    }
  }

  for (const walk of walks) {
    for (const meal of meals) {
      if (
        new Date(walk.timestamp) > new Date(meal.timestamp) &&
        hoursBetween(walk.timestamp, meal.timestamp) < POST_MEAL_EXERCISE_BUFFER_HOURS
      ) {
        penalties.push({
          code: PENALTY_CODES.POST_MEAL_EXERCISE,
          message: 'Effort physique trop proche d\'un repas (risque torsion d\'estomac)',
          points: -12,
        });
        break;
      }
    }
  }

  const walkMinutes = walks.reduce((sum, w) => sum + (w.metadata?.durationMinutes ?? 0), 0);
  if (walkMinutes < MIN_WALK_MINUTES_PER_DAY) {
    penalties.push({
      code: PENALTY_CODES.INSUFFICIENT_WALK,
      message: `${walkMinutes} min de marche (minimum ${MIN_WALK_MINUTES_PER_DAY} min)`,
      points: -15,
    });
  } else if (walks.length >= IDEAL_WALK_SESSIONS) {
    bonuses.push({
      code: BONUS_CODES.IDEAL_ACTIVITY,
      message: `${walks.length} sorties — activité bien fractionnée`,
      points: 5,
    });
  } else if (walks.length < 3) {
    penalties.push({
      code: PENALTY_CODES.FEW_WALK_SESSIONS,
      message: 'Activité non fractionnée (moins de 3 sorties)',
      points: -5,
    });
  }

  const mentalMinutes = mental.reduce((sum, m) => sum + (m.metadata?.durationMinutes ?? 0), 0);
  if (mentalMinutes < MIN_MENTAL_MINUTES_PER_DAY) {
    penalties.push({
      code: PENALTY_CODES.INSUFFICIENT_MENTAL,
      message: `${mentalMinutes} min de stimulation mentale (minimum ${MIN_MENTAL_MINUTES_PER_DAY} min)`,
      points: -8,
    });
  }

  const weekNumber = getWeekNumber(dayNumber);
  const weekLogs = allLogs.filter(
    (log) => getWeekNumber(log.dayNumber) === weekNumber && log.closedAt,
  );
  const weekBrushes = weekLogs.reduce(
    (sum, log) => sum + (log.actions || []).filter((a) => a.type === 'brush').length,
    0,
  ) + brushes.length;

  if (dayNumber % 7 === 0 && weekBrushes < BRUSHES_PER_WEEK_MIN) {
    penalties.push({
      code: PENALTY_CODES.MISSING_BRUSH,
      message: `Brossage insuffisant cette semaine (${weekBrushes}, attendu ${BRUSHES_PER_WEEK_MIN}-${BRUSHES_PER_WEEK_MAX})`,
      points: -6,
    });
  }

  if (ANTIPARASITIC_TARGET_DAYS.includes(dayNumber) && antiparasitic.length === 0) {
    const hasAntiparasiticBefore = allLogs.some((log) =>
      (log.actions || []).some((a) => a.type === 'antiparasitic'),
    );
    if (!hasAntiparasiticBefore && dayNumber === SIMULATION_DAYS) {
      penalties.push({
        code: PENALTY_CODES.MISSING_ANTIPARASITIC,
        message: 'Antiparasitaire mensuel non administré',
        points: -15,
      });
    }
  }

  const superfluousPurchases = purchases.filter((p) => p.metadata?.category === 'superfluous');
  const vitalPurchases = purchases.filter((p) => p.metadata?.category === 'vital');

  if (superfluousPurchases.length > 0 && vitalPurchases.length === 0 && simulation.budgetRemaining < 100) {
    penalties.push({
      code: PENALTY_CODES.BUDGET_MISMANAGEMENT,
      message: 'Achats superflus priorisés alors que le budget vital est critique',
      points: -10,
    });
  }

  let dayScore = DAY_SCORE_BASE;
  for (const p of penalties) dayScore += p.points;
  for (const b of bonuses) dayScore += b.points;
  dayScore = Math.max(0, Math.min(100, dayScore));

  if (penalties.length === 0 && bonuses.length > 0) {
    bonuses.push({
      code: BONUS_CODES.PERFECT_DAY,
      message: 'Journée exemplaire pour un Labrador',
      points: 3,
    });
    dayScore = Math.min(100, dayScore + 3);
  }

  return { dayScore, penalties, bonuses };
}

export function evaluateFinalBudget(simulation) {
  const penalties = [];
  const hasVermifuge = simulation.purchasedVitalItems.includes('vermifuge');
  const hasCroquettes = simulation.purchasedVitalItems.includes('croquettes_quality');

  if (!hasVermifuge || !hasCroquettes) {
    penalties.push({
      code: PENALTY_CODES.VITAL_NEEDS_UNMET,
      message: 'Besoins vitaux non couverts (croquettes qualité et/ou vermifuge)',
      points: -20,
    });
  }

  const total = simulation.totalSpent || 1;
  const vitalRatio = simulation.vitalSpent / total;
  if (vitalRatio >= 0.6 && simulation.superfluousSpent > simulation.vitalSpent) {
    penalties.push({
      code: PENALTY_CODES.BUDGET_MISMANAGEMENT,
      message: 'Budget déséquilibré — trop d\'accessoires superflus',
      points: -15,
    });
  } else if (vitalRatio >= 0.7) {
    return {
      bonuses: [{
        code: BONUS_CODES.BALANCED_BUDGET,
        message: 'Gestion financière équilibrée',
        points: 5,
      }],
      penalties: [],
    };
  }

  return { penalties, bonuses: [] };
}

export function computeRunningFinalScore(closedLogs, simulation) {
  if (closedLogs.length === 0) return simulation.finalScore ?? 100;

  const avgDayScore =
    closedLogs.reduce((sum, log) => sum + (log.dayScore ?? 0), 0) / closedLogs.length;

  let score = avgDayScore;
  if (simulation.status === 'completed') {
    const { penalties, bonuses } = evaluateFinalBudget(simulation);
    for (const p of penalties) score += p.points;
    for (const b of bonuses) score += b.points;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
