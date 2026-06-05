import fs from 'fs';
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Attestation } from '../models/Attestation.js';
import { DailyLog } from '../models/DailyLog.js';
import { Simulation } from '../models/Simulation.js';
import { User } from '../models/User.js';
import { Shelter } from '../models/Shelter.js';
import { generateAttestationPdf } from '../services/attestationPdf.js';
import { generateCode } from './auth.routes.js';

const router = Router();

router.use(authenticate, requireRole('shelter'));

async function assertClientBelongsToShelter(clientId, shelterId) {
  const client = await User.findOne({
    _id: clientId,
    role: 'adopter',
    shelterId,
  });
  if (!client) throw new Error('Client introuvable ou non rattaché');
  return client;
}

router.post('/codes', generateCode);

router.get('/clients', async (req, res) => {
  try {
    const shelterId = req.user.shelterId;
    const clients = await User.find({ role: 'adopter', shelterId }).select('-passwordHash');
    const clientIds = clients.map((c) => c._id);

    const simulations = await Simulation.find({ userId: { $in: clientIds } });
    const simByUser = Object.fromEntries(simulations.map((s) => [s.userId.toString(), s]));

    const result = clients.map((client) => {
      const sim = simByUser[client._id.toString()];
      return {
        id: client._id,
        displayName: client.displayName,
        email: client.email,
        simulation: sim
          ? {
              id: sim._id,
              status: sim.status,
              currentDay: sim.currentDay,
              finalScore: sim.finalScore,
              validatedByShelter: sim.validatedByShelter,
            }
          : null,
      };
    });

    return res.json({ clients: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/client/:id/metrics', async (req, res) => {
  try {
    const client = await assertClientBelongsToShelter(req.params.id, req.user.shelterId);
    const simulation = await Simulation.findOne({ userId: client._id }).sort({ createdAt: -1 });
    if (!simulation) return res.status(404).json({ error: 'Aucune simulation pour ce client' });

    const logs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });
    const attestation = await Attestation.findOne({ simulationId: simulation._id });

    return res.json({
      client: {
        id: client._id,
        displayName: client.displayName,
        email: client.email,
      },
      simulation,
      logs,
      attestation,
      heatmap: Array.from({ length: 30 }, (_, i) => {
        const log = logs.find((l) => l.dayNumber === i + 1);
        return {
          day: i + 1,
          score: log?.dayScore ?? null,
          closed: Boolean(log?.closedAt),
          penaltiesCount: log?.penalties?.length ?? 0,
        };
      }),
    });
  } catch (err) {
    return res.status(err.message.includes('introuvable') ? 404 : 500).json({ error: err.message });
  }
});

router.post('/client/:id/validate', async (req, res) => {
  try {
    const client = await assertClientBelongsToShelter(req.params.id, req.user.shelterId);
    const simulation = await Simulation.findOne({
      userId: client._id,
      status: 'completed',
    }).sort({ completedAt: -1 });

    if (!simulation) {
      return res.status(400).json({ error: 'Simulation non terminée' });
    }

    simulation.validatedByShelter = true;
    simulation.validatedAt = new Date();
    await simulation.save();

    const shelter = await Shelter.findById(req.user.shelterId);
    const logs = await DailyLog.find({ simulationId: simulation._id }).sort({ dayNumber: 1 });

    let attestation = await Attestation.findOne({ simulationId: simulation._id });
    if (!attestation) {
      attestation = await Attestation.create({
        simulationId: simulation._id,
        validatedBy: req.user.userId,
        validatedAt: new Date(),
      });
    }

    const pdfPath = await generateAttestationPdf({
      simulation,
      user: client,
      shelter,
      logs,
      attestation,
    });
    attestation.pdfPath = pdfPath;
    await attestation.save();

    return res.json({ simulation, attestation: { id: attestation._id, validatedAt: attestation.validatedAt } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/client/:id/attestation.pdf', async (req, res) => {
  try {
    const client = await assertClientBelongsToShelter(req.params.id, req.user.shelterId);
    const simulation = await Simulation.findOne({ userId: client._id, status: 'completed' }).sort({
      completedAt: -1,
    });
    if (!simulation) return res.status(404).json({ error: 'Simulation non trouvée' });

    const attestation = await Attestation.findOne({ simulationId: simulation._id });
    if (!attestation?.pdfPath || !fs.existsSync(attestation.pdfPath)) {
      return res.status(404).json({ error: 'PDF non disponible — validez d\'abord l\'attestation' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attestation-${client.displayName}.pdf"`,
    );
    return fs.createReadStream(attestation.pdfPath).pipe(res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
