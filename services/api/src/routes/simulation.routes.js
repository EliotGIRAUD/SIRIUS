import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  addWalkPoints,
  advanceDayForUser,
  endWalk,
  getMapPois,
  getShopCatalog,
  getSimulationStatus,
  recordAction,
  setupDog,
  startSimulation,
  startWalk,
} from '../services/simulationService.js';
import { getConstellation } from '../services/constellationService.js';
import { DailyLog } from '../models/DailyLog.js';
import { Simulation } from '../models/Simulation.js';

const router = Router();

router.use(authenticate, requireRole('adopter'));

router.post('/setup-dog', async (req, res) => {
  try {
    const dog = await setupDog(req.user.userId, req.body);
    return res.status(201).json({ dog });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/start', async (req, res) => {
  try {
    const simulation = await startSimulation(req.user.userId);
    return res.status(201).json({ simulation });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/action', async (req, res) => {
  try {
    const { type, cost, metadata } = req.body;
    if (!type) return res.status(400).json({ error: 'type requis' });
    const result = await recordAction(req.user.userId, { type, cost, metadata });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = await getSimulationStatus(req.user.userId);
    if (!status) return res.status(404).json({ error: 'Aucune simulation' });
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/constellation', async (req, res) => {
  try {
    const simulation = await Simulation.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    if (!simulation) return res.status(404).json({ error: 'Aucune simulation' });
    const logs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });
    const constellation = await getConstellation(simulation, logs);
    return res.json({ constellation, simulation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/advance-day', async (req, res) => {
  try {
    const simulation = await advanceDayForUser(req.user.userId);
    return res.json({ simulation });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/shop', (_req, res) => res.json({ catalog: getShopCatalog() }));

router.get('/map/pois', async (req, res) => {
  try {
    const pois = await getMapPois(req.user.userId);
    return res.json(pois);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/walk/start', async (req, res) => {
  try {
    const session = await startWalk(req.user.userId);
    return res.json({ session });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/walk/:id/points', async (req, res) => {
  try {
    const session = await addWalkPoints(req.user.userId, req.params.id, req.body.points || []);
    return res.json({ session });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/walk/:id/end', async (req, res) => {
  try {
    const result = await endWalk(req.user.userId, req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
