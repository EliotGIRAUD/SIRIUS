import crypto from 'crypto';
import {
  GAUGE_MAX,
  GAUGE_MIN,
  INITIAL_BUDGET,
  INITIAL_GAUGES,
  MEAL_COOLDOWN_HOURS,
  SHOP_CATALOG,
  SIMULATION_DAYS,
  WALK_COOLDOWN_MINUTES,
  getShopItem,
} from '@sirius/shared';
import { DailyLog } from '../models/DailyLog.js';
import { Dog } from '../models/Dog.js';
import { Shelter } from '../models/Shelter.js';
import { Simulation } from '../models/Simulation.js';
import { User } from '../models/User.js';
import { WalkSession } from '../models/WalkSession.js';
import { computeStreak, deriveHealthState, getConstellation } from './constellationService.js';
import { validateWalkSession } from './walkValidator.js';
import {
  computeRunningFinalScore,
  evaluateDayLog,
  evaluateFinalBudget,
} from './scoringEngine.js';

function clampGauge(value) {
  return Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, value));
}

function hoursSince(lastTimestamp) {
  if (!lastTimestamp) return Infinity;
  return (Date.now() - new Date(lastTimestamp).getTime()) / (1000 * 60 * 60);
}

function minutesSince(lastTimestamp) {
  if (!lastTimestamp) return Infinity;
  return (Date.now() - new Date(lastTimestamp).getTime()) / (1000 * 60);
}

function applyGaugeEffects(simulation, action) {
  const gauges = { ...simulation.gauges.toObject?.() ?? simulation.gauges };

  switch (action.type) {
    case 'meal':
      gauges.hunger = clampGauge(gauges.hunger + 25);
      break;
    case 'water':
      gauges.hunger = clampGauge(gauges.hunger + 5);
      gauges.hygiene = clampGauge(gauges.hygiene + 5);
      break;
    case 'play':
    case 'affection':
      gauges.mental = clampGauge(gauges.mental + 15);
      gauges.energy = clampGauge(gauges.energy + 5);
      break;
    case 'walk': {
      const mins = action.metadata?.durationMinutes ?? 30;
      gauges.energy = clampGauge(gauges.energy + Math.min(20, mins / 3));
      gauges.mental = clampGauge(gauges.mental + 5);
      break;
    }
    case 'mental_stimulation': {
      const mins = action.metadata?.durationMinutes ?? 15;
      gauges.mental = clampGauge(gauges.mental + Math.min(20, mins));
      break;
    }
    case 'brush':
      gauges.hygiene = clampGauge(gauges.hygiene + 20);
      break;
    case 'antiparasitic':
      gauges.hygiene = clampGauge(gauges.hygiene + 10);
      break;
    case 'vet_care':
      gauges.hygiene = clampGauge(gauges.hygiene + 15);
      break;
    default:
      break;
  }

  gauges.hunger = clampGauge(gauges.hunger - 3);
  gauges.energy = clampGauge(gauges.energy - 2);
  return gauges;
}

async function getActiveSimulation(userId) {
  return Simulation.findOne({ userId, status: 'in_progress' });
}

async function getOrCreateDayLog(simulationId, dayNumber) {
  let log = await DailyLog.findOne({ simulationId, dayNumber });
  if (!log) {
    log = await DailyLog.create({ simulationId, dayNumber, actions: [] });
  }
  return log;
}

export async function startSimulation(userId) {
  const existing = await getActiveSimulation(userId);
  if (existing) throw new Error('Une simulation est déjà en cours');
  const dog = await Dog.findOne({ userId, active: true });
  if (!dog) throw new Error('Configurez votre chien avant de démarrer');

  const simulation = await Simulation.create({
    userId,
    dogId: dog._id,
    status: 'in_progress',
    currentDay: 1,
    budgetRemaining: INITIAL_BUDGET,
    initialBudget: INITIAL_BUDGET,
    gauges: INITIAL_GAUGES,
    finalScore: 100,
  });
  dog.simulationId = simulation._id;
  await dog.save();
  await getOrCreateDayLog(simulation._id, 1);
  return simulation;
}

export async function startWalk(userId) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');
  const active = await WalkSession.findOne({ simulationId: simulation._id, endedAt: null });
  if (active) return active;
  return WalkSession.create({
    simulationId: simulation._id,
    userId,
    startedAt: new Date(),
    points: [],
  });
}

export async function addWalkPoints(userId, sessionId, points) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');
  const session = await WalkSession.findOne({ _id: sessionId, simulationId: simulation._id, endedAt: null });
  if (!session) throw new Error('Session de balade introuvable');
  session.points.push(...points.map((p) => ({ ...p, timestamp: new Date(p.timestamp) })));
  await session.save();
  return session;
}

export async function endWalk(userId, sessionId) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');
  const session = await WalkSession.findOne({ _id: sessionId, simulationId: simulation._id, endedAt: null });
  if (!session) throw new Error('Session de balade introuvable');
  session.endedAt = new Date();
  session.durationMinutes = Math.round((session.endedAt - session.startedAt) / 60000);
  const validation = validateWalkSession(session);
  session.distanceMeters = validation.distanceMeters;
  session.validated = validation.validated;
  session.cheatFlags = validation.cheatFlags;
  await session.save();
  if (validation.validated) {
    await recordAction(userId, {
      type: 'walk',
      metadata: { durationMinutes: session.durationMinutes, distanceMeters: session.distanceMeters, gps: true },
    });
  }
  return { session, validation };
}

export async function getMapPois(userId) {
  const user = await User.findById(userId);
  const shelter = user?.shelterId ? await Shelter.findById(user.shelterId) : null;
  return {
    shelter: shelter ? { name: shelter.name, lat: 48.8566, lng: 2.3522 } : null,
    breeders: [{ name: 'Élevage du Lys', lat: 48.87, lng: 2.33 }],
    vets: [{ name: 'Clinique Vétérinaire Centrale', lat: 48.85, lng: 2.36 }],
  };
}

async function enrichStatus(simulation, dayLog) {
  const logs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });
  const dog = simulation.dogId ? await Dog.findById(simulation.dogId) : await Dog.findOne({ userId: simulation.userId, active: true });
  const streak = computeStreak(logs);
  const healthState = deriveHealthState(simulation.gauges);
  const constellation = await getConstellation(simulation, logs);
  const recentWalks = await WalkSession.find({ simulationId: simulation._id }).sort({ startedAt: -1 }).limit(5);
  return { logs, dog, streak, healthState, constellation, recentWalks };
}

export async function setupDog(userId, payload) {
  const { breedId, name, sccLetter, moralContractSigned, abandonmentProtocolCompleted } = payload;
  if (!breedId || !name) throw new Error('Race et nom requis');
  if (!moralContractSigned || !abandonmentProtocolCompleted) {
    throw new Error('Contrat moral et protocole abandon requis');
  }
  await Dog.updateMany({ userId, active: true }, { active: false });
  const dog = await Dog.create({
    userId,
    breedId,
    name: name.trim(),
    sccLetter: sccLetter?.trim() || null,
    moralContractSignedAt: new Date(),
    abandonmentProtocolCompleted: true,
    active: true,
  });
  return dog;
}

export async function getSimulationStatus(userId) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) {
    const completed = await Simulation.findOne({ userId, status: 'completed' }).sort({ completedAt: -1 });
    if (!completed) return null;
    const extra = await enrichStatus(completed, null);
    return { simulation: completed, dayLog: null, alerts: [], cooldowns: {}, ...extra };
  }

  const dayLog = await getOrCreateDayLog(simulation._id, simulation.currentDay);
  const alerts = [];
  const cooldowns = {};

  const meals = dayLog.actions.filter((a) => a.type === 'meal');
  const walks = dayLog.actions.filter((a) => a.type === 'walk');
  const lastMeal = meals[meals.length - 1];
  const lastWalk = walks[walks.length - 1];

  if (lastMeal) {
    const remaining = MEAL_COOLDOWN_HOURS - hoursSince(lastMeal.timestamp);
    if (remaining > 0) cooldowns.meal = Math.ceil(remaining * 60);
  }
  if (lastWalk) {
    const remaining = WALK_COOLDOWN_MINUTES - minutesSince(lastWalk.timestamp);
    if (remaining > 0) cooldowns.walk = Math.ceil(remaining);
  }

  if (simulation.gauges.hunger < 40) alerts.push({ type: 'hunger', message: 'Faim basse — prévoir un repas' });
  if (simulation.gauges.energy < 40) alerts.push({ type: 'energy', message: 'Énergie basse — sortie recommandée' });
  if (simulation.budgetRemaining < 50) alerts.push({ type: 'budget', message: 'Budget critique' });

  const extra = await enrichStatus(simulation, dayLog);
  return { simulation, dayLog, alerts, cooldowns, ...extra };
}

export async function recordAction(userId, payload) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');

  const { type, metadata = {} } = payload;
  let cost = payload.cost ?? 0;

  const dayLog = await getOrCreateDayLog(simulation._id, simulation.currentDay);
  const actions = dayLog.actions;

  if (type === 'meal') {
    const meals = actions.filter((a) => a.type === 'meal');
    const lastMeal = meals[meals.length - 1];
    if (lastMeal && hoursSince(lastMeal.timestamp) < MEAL_COOLDOWN_HOURS) {
      throw new Error('Cooldown repas actif');
    }
    metadata.grams = metadata.grams ?? 350;
  }

  if (type === 'walk') {
    const walks = actions.filter((a) => a.type === 'walk');
    const lastWalk = walks[walks.length - 1];
    if (lastWalk && minutesSince(lastWalk.timestamp) < WALK_COOLDOWN_MINUTES) {
      throw new Error('Cooldown balade actif (30 min)');
    }
    metadata.durationMinutes = metadata.durationMinutes ?? 30;
  }

  if (type === 'mental_stimulation') {
    metadata.durationMinutes = metadata.durationMinutes ?? 15;
  }

  if (type === 'shop_purchase') {
    const item = getShopItem(metadata.itemId);
    if (!item) throw new Error('Article inconnu');
    cost = item.price;
    metadata.category = item.category;
    metadata.label = item.label;

    if (simulation.budgetRemaining < cost) {
      throw new Error('Budget insuffisant');
    }

    simulation.budgetRemaining -= cost;
    simulation.totalSpent += cost;
    if (['vital', 'essentiels', 'croquettes', 'care'].includes(item.category)) {
      simulation.vitalSpent += cost;
      if (!simulation.purchasedVitalItems.includes(item.id)) {
        simulation.purchasedVitalItems.push(item.id);
      }
    } else if (item.category === 'superfluous') {
      simulation.superfluousSpent += cost;
    }
  } else if (cost > 0) {
    if (simulation.budgetRemaining < cost) throw new Error('Budget insuffisant');
    simulation.budgetRemaining -= cost;
    simulation.totalSpent += cost;
  }

  const action = {
    type,
    timestamp: new Date(),
    cost,
    metadata,
  };

  dayLog.actions.push(action);
  simulation.gauges = applyGaugeEffects(simulation, action);

  await dayLog.save();
  await simulation.save();

  return { simulation, dayLog, action };
}

export async function closeDay(simulationId) {
  const simulation = await Simulation.findById(simulationId);
  if (!simulation || simulation.status !== 'in_progress') return null;

  const dayLog = await DailyLog.findOne({
    simulationId: simulation._id,
    dayNumber: simulation.currentDay,
  });
  if (!dayLog || dayLog.closedAt) return simulation;

  const allLogs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });
  const { dayScore, penalties, bonuses } = evaluateDayLog(dayLog, simulation, allLogs);

  dayLog.dayScore = dayScore;
  dayLog.penalties = penalties;
  dayLog.bonuses = bonuses;
  dayLog.closedAt = new Date();
  await dayLog.save();

  const closedLogs = await DailyLog.find({
    simulationId: simulation._id,
    closedAt: { $ne: null },
  });
  simulation.finalScore = computeRunningFinalScore(closedLogs, simulation);

  if (simulation.currentDay >= SIMULATION_DAYS) {
    simulation.status = 'completed';
    simulation.completedAt = new Date();
    const { penalties: fp, bonuses: fb } = evaluateFinalBudget(simulation);
    const finalLog = await DailyLog.findOne({ simulationId: simulation._id, dayNumber: SIMULATION_DAYS });
    if (finalLog) {
      if (fp.length) finalLog.penalties.push(...fp);
      if (fb.length) finalLog.bonuses.push(...fb);
      await finalLog.save();
    }
    simulation.finalScore = computeRunningFinalScore(closedLogs, simulation);
  } else {
    simulation.currentDay += 1;
    simulation.gauges = {
      hunger: clampGauge(simulation.gauges.hunger - 10),
      energy: clampGauge(simulation.gauges.energy - 8),
      hygiene: clampGauge(simulation.gauges.hygiene - 5),
      mental: clampGauge(simulation.gauges.mental - 5),
    };
    await getOrCreateDayLog(simulation._id, simulation.currentDay);
  }

  await simulation.save();
  return simulation;
}

export async function advanceDayForUser(userId) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');
  return closeDay(simulation._id);
}

export async function closeAllActiveDays() {
  const active = await Simulation.find({ status: 'in_progress' });
  const results = [];
  for (const sim of active) {
    results.push(await closeDay(sim._id));
  }
  return results;
}

export function getShopCatalog() {
  return SHOP_CATALOG;
}

export function generateProCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function generateAuthCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}
