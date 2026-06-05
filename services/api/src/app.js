import express from 'express';
import cors from 'cors';
import simulationRoutes from './routes/simulation.routes.js';
import proRoutes from './routes/pro.routes.js';
import billingRoutes from './routes/billing.routes.js';
import breederRoutes from './routes/breeder.routes.js';
import sponsorRoutes from './routes/sponsor.routes.js';
import {
  authenticate,
  completeOnboarding,
  getMe,
  login,
  registerAdopter,
  registerBreeder,
  registerShelter,
  registerSponsor,
  updateSettings,
  validateCode,
  verifyEmail,
} from './routes/auth.routes.js';

const app = express();

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || raw === '*') return true;
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sirius-api' });
});

app.post('/auth/validate-code', validateCode);
app.post('/auth/register', registerAdopter);
app.post('/auth/register-shelter', registerShelter);
app.post('/auth/register-breeder', registerBreeder);
app.post('/auth/register-sponsor', registerSponsor);
app.post('/auth/login', login);
app.post('/auth/verify-email', verifyEmail);
app.get('/auth/me', authenticate, getMe);
app.patch('/auth/onboarding-complete', authenticate, completeOnboarding);
app.patch('/auth/settings', authenticate, updateSettings);

app.use('/simulation', simulationRoutes);
app.use('/pro', proRoutes);
app.use('/billing', billingRoutes);
app.use('/breeders', breederRoutes);
app.use('/sponsor', sponsorRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

export default app;
