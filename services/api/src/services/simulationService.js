import crypto from 'crypto';
import {
  GAUGE_MAX,
  GAUGE_MIN,
  INITIAL_GAUGES,
  MEAL_COOLDOWN_HOURS,
  MEAL_GRAMS_MAX,
  MEAL_GRAMS_MIN,
  SHOP_CATALOG,
  SIMULATION_DAYS,
  WALK_COOLDOWN_MINUTES,
  computeBreedBudget,
  getShopItem,
} from '@sirius/shared';
import { assertBreedAccess } from './breedAccess.js';
import { unlockBadge } from './badgeService.js';
import { evaluateChallenge, getChallengeForWeek } from './weeklyChallengeService.js';
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
    case 'meal': {
      const q = action.metadata?.pourQuality || 'ok';
      const boost = q === 'low' ? 10 : q === 'high' ? 15 : 25;
      gauges.hunger = clampGauge(gauges.hunger + boost);
      if (q === 'high') gauges.hygiene = clampGauge(gauges.hygiene - 5);
      break;
    }
    case 'water': {
      const q = action.metadata?.pourQuality || 'ok';
      const h = q === 'low' ? 2 : q === 'high' ? 8 : 5;
      const hy = q === 'low' ? 2 : q === 'high' ? -3 : 5;
      gauges.hunger = clampGauge(gauges.hunger + h);
      gauges.hygiene = clampGauge(gauges.hygiene + hy);
      break;
    }
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

const BUDGET_EVENTS = [
  { label: 'Frais véto imprévu', amount: -30 },
  { label: 'Réduction refuge partenaire', amount: 25 },
  { label: 'Cours de dressage offert', amount: -15 },
];

export async function startSimulation(userId) {
  const existing = await getActiveSimulation(userId);
  if (existing) throw new Error('Une simulation est déjà en cours');
  const dog = await Dog.findOne({ userId, active: true });
  if (!dog) throw new Error('Configurez votre chien avant de démarrer');

  const budget = computeBreedBudget(dog.breedId, Date.now());

  const simulation = await Simulation.create({
    userId,
    dogId: dog._id,
    status: 'in_progress',
    currentDay: 1,
    budgetRemaining: budget,
    initialBudget: budget,
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
  const { Breeder } = await import('../models/Breeder.js');
  const { SponsorCampaign } = await import('../models/SponsorCampaign.js');
  const breeders = await Breeder.find({ subscriptionStatus: 'active' }).limit(5);
  const sponsors = await SponsorCampaign.find({ status: 'active' }).limit(3);
  return {
    shelter: shelter ? { name: shelter.name, lat: 48.8566, lng: 2.3522 } : null,
    breeders: breeders.map((b) => ({ id: b._id, name: b.name, lat: b.lat, lng: b.lng, verified: b.verified })),
    vets: [{ name: 'Clinique Vétérinaire Centrale', lat: 48.85, lng: 2.36 }],
    sponsors: sponsors.map((s) => ({ id: s._id, name: s.name, tier: s.tier })),
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
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  assertBreedAccess(user, breedId);
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
    if (metadata.grams < MEAL_GRAMS_MIN) metadata.pourQuality = 'low';
    else if (metadata.grams > MEAL_GRAMS_MAX) metadata.pourQuality = 'high';
    else metadata.pourQuality = metadata.pourQuality || 'ok';
  }

  if (type === 'water') {
    metadata.pourQuality = metadata.pourQuality || 'ok';
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

  const weekNum = Math.ceil(simulation.currentDay / 7);
  const challenge = getChallengeForWeek(weekNum);
  if (!dayLog.weeklyChallenge?.id) {
    dayLog.weeklyChallenge = { id: challenge.id, title: challenge.title, completed: false, rewardBadgeId: 'challenge_hero' };
  }
  if (evaluateChallenge({ ...dayLog.toObject(), penalties, bonuses }, challenge)) {
    dayLog.weeklyChallenge.completed = true;
    await unlockBadge(simulation.userId, 'challenge_hero').catch(() => {});
  }

  if (simulation.currentDay % 5 === 0 && BUDGET_EVENTS.length) {
    const evt = BUDGET_EVENTS[simulation.currentDay % BUDGET_EVENTS.length];
    dayLog.budgetEvents = dayLog.budgetEvents || [];
    dayLog.budgetEvents.push({ label: evt.label, amount: evt.amount, appliedAt: new Date() });
    simulation.budgetRemaining = Math.max(0, simulation.budgetRemaining + evt.amount);
  }

  dayLog.dayScore = dayScore;
  dayLog.penalties = penalties;
  dayLog.bonuses = bonuses;
  dayLog.closedAt = new Date();
  await dayLog.save();

  if (simulation.currentDay >= 7) await unlockBadge(simulation.userId, 'week1').catch(() => {});

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

export async function abandonSimulation(userId) {
  const simulation = await getActiveSimulation(userId);
  if (!simulation) throw new Error('Aucune simulation active');
  simulation.status = 'abandoned';
  simulation.completedAt = new Date();
  simulation.finalScore = Math.max(0, simulation.finalScore - 25);
  await simulation.save();
  await Dog.updateMany({ userId, active: true }, { active: false });
  return simulation;
}

export async function changeBreed(userId, payload) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  const { breedId, name, sccLetter } = payload;
  assertBreedAccess(user, breedId);
  await abandonSimulation(userId);
  return setupDog(userId, {
    breedId,
    name,
    sccLetter,
    moralContractSigned: true,
    abandonmentProtocolCompleted: true,
  });
}

export async function getJournal(userId) {
  const simulation = await Simulation.findOne({ userId }).sort({ createdAt: -1 });
  if (!simulation) return null;
  const logs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });
  return {
    simulation: { id: simulation._id, currentDay: simulation.currentDay, status: simulation.status, finalScore: simulation.finalScore },
    entries: logs.map((log) => ({
      day: log.dayNumber,
      score: log.dayScore,
      actions: log.actions,
      penalties: log.penalties,
      bonuses: log.bonuses,
      budgetEvents: log.budgetEvents,
      weeklyChallenge: log.weeklyChallenge,
      closed: Boolean(log.closedAt),
    })),
  };
}
