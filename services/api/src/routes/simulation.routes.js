import fs from 'fs';
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  abandonSimulation,
  addWalkPoints,
  advanceDayForUser,
  changeBreed,
  endWalk,
  getJournal,
  getMapPois,
  getShopCatalog,
  getSimulationStatus,
  recordAction,
  setupDog,
  startSimulation,
  startWalk,
} from '../services/simulationService.js';
import { getConstellation } from '../services/constellationService.js';
import { hasPdfAccess } from '../services/breedAccess.js';
import { listBadges } from '../services/badgeService.js';
import { mockPurchaseB2C } from '../services/billingService.js';
import { DailyLog } from '../models/DailyLog.js';
import { Simulation } from '../models/Simulation.js';
import { User } from '../models/User.js';
import { Attestation } from '../models/Attestation.js';

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
    const user = await User.findById(req.user.userId);
    return res.json({ ...status, userPlan: user?.plan, ownedBreeds: user?.ownedBreeds, hasPdfAccess: hasPdfAccess(user) });
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
    const status = await getSimulationStatus(req.user.userId);
    return res.json({ constellation, simulation, streak: status?.streak ?? 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/journal', async (req, res) => {
  try {
    const journal = await getJournal(req.user.userId);
    if (!journal) return res.status(404).json({ error: 'Aucun journal' });
    return res.json(journal);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/badges', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    return res.json({ badges: listBadges(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-mock', async (req, res) => {
  try {
    const { productId, breedId } = req.body;
    const { user } = await mockPurchaseB2C(req.user.userId, productId, { breedId });
    return res.json({ purchases: user.purchases, ownedBreeds: user.ownedBreeds, hasPdfAccess: hasPdfAccess(user) });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/abandon', async (req, res) => {
  try {
    const simulation = await abandonSimulation(req.user.userId);
    return res.json({ simulation });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/change-breed', async (req, res) => {
  try {
    const dog = await changeBreed(req.user.userId, req.body);
    const simulation = await startSimulation(req.user.userId);
    return res.json({ dog, simulation });
  } catch (err) {
    return res.status(400).json({ error: err.message });
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

router.get('/attestation.pdf', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!hasPdfAccess(user)) return res.status(403).json({ error: 'Achetez le rapport PDF (4,99 €)' });
    const simulation = await Simulation.findOne({ userId: req.user.userId, status: 'completed' }).sort({ completedAt: -1 });
    if (!simulation) return res.status(404).json({ error: 'Simulation non terminée' });
    const attestation = await Attestation.findOne({ simulationId: simulation._id });
    if (!attestation?.pdfPath || !fs.existsSync(attestation.pdfPath)) {
      return res.status(404).json({ error: 'PDF non encore généré — validation refuge requise' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    return fs.createReadStream(attestation.pdfPath).pipe(res);
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
