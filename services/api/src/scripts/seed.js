import 'dotenv/config';
import bcrypt from 'bcrypt';
import { INITIAL_GAUGES, computeBreedBudget } from '@sirius/shared';
import { Breeder } from '../models/Breeder.js';
import { SponsorCampaign } from '../models/SponsorCampaign.js';
import { connectDb } from '../config/db.js';
import { AuthCode } from '../models/AuthCode.js';
import { Dog } from '../models/Dog.js';
import { Simulation } from '../models/Simulation.js';
import { Shelter } from '../models/Shelter.js';
import { User } from '../models/User.js';
import { DailyLog } from '../models/DailyLog.js';
import { generateAuthCode } from '../services/simulationService.js';

async function seed() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Shelter.deleteMany({}),
    AuthCode.deleteMany({}),
    Dog.deleteMany({}),
    Simulation.deleteMany({}),
    DailyLog.deleteMany({}),
    Breeder.deleteMany({}),
    SponsorCampaign.deleteMany({}),
  ]);

  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);

  const shelter = await Shelter.create({
    name: 'SPA Demo Paris',
    proCode: 'SPADEMO1',
    subscriptionStatus: 'active',
    subscriptionPlan: 'spa_launch',
    subscriptionValidUntil: validUntil,
    features: ['pdf', 'metrics_gps', 'attestation_6mo'],
  });

  const breederDoc = await Breeder.create({
    name: 'Élevage du Lys',
    description: 'Élevage familial Golden et Labrador',
    breeds: ['labrador', 'golden'],
    lat: 48.87,
    lng: 2.33,
    verified: true,
    subscriptionStatus: 'active',
    subscriptionValidUntil: validUntil,
    userId: null,
  });

  const breederPassword = await bcrypt.hash('breeder123', 10);
  const breederUser = await User.create({
    email: 'breeder@demo.fr',
    passwordHash: breederPassword,
    displayName: 'Paul Éleveur',
    pseudo: 'Paul Éleveur',
    role: 'breeder',
    breederId: breederDoc._id,
    emailVerified: true,
    onboardingCompleted: true,
  });
  breederDoc.userId = breederUser._id;
  await breederDoc.save();

  const sponsorPassword = await bcrypt.hash('sponsor123', 10);
  const sponsorUser = await User.create({
    email: 'sponsor@demo.fr',
    passwordHash: sponsorPassword,
    displayName: 'Sophie Marketing',
    pseudo: 'Sophie Marketing',
    role: 'sponsor',
    emailVerified: true,
    onboardingCompleted: true,
  });

  await SponsorCampaign.create({
    userId: sponsorUser._id,
    name: 'Croquettes Premium Co',
    tier: 'starter',
    status: 'active',
    impressionsLimit: 5000,
    impressionsCount: 120,
    validUntil,
  });

  const adoptCode = generateAuthCode();
  await AuthCode.create({
    shelterId: shelter._id,
    code: adoptCode,
    multiUse: true,
  });

  const shelterPassword = await bcrypt.hash('shelter123', 10);
  await User.create({
    email: 'pro@spa-demo.fr',
    passwordHash: shelterPassword,
    displayName: 'Marie Pro',
    pseudo: 'Marie Pro',
    role: 'shelter',
    ownedShelterId: shelter._id,
    emailVerified: true,
    onboardingCompleted: true,
  });

  const adopterPassword = await bcrypt.hash('adopter123', 10);
  const adopter = await User.create({
    email: 'adopter@demo.fr',
    passwordHash: adopterPassword,
    displayName: 'Jean Adoptant',
    pseudo: 'Jean Adoptant',
    role: 'adopter',
    shelterId: shelter._id,
    codeAuth: adoptCode,
    emailVerified: true,
    onboardingCompleted: true,
    rgpdAcceptedAt: new Date(),
    plan: 'free',
    ownedBreeds: ['labrador'],
    purchases: [],
    settings: { soundsEnabled: true, hapticsEnabled: true, notificationsEnabled: true, gpsEnabled: true },
  });

  const dog = await Dog.create({
    userId: adopter._id,
    breedId: 'labrador',
    name: 'Rex',
    sccLetter: 'R',
    moralContractSignedAt: new Date(),
    abandonmentProtocolCompleted: true,
    active: true,
  });

  const budget = computeBreedBudget('labrador');

  const simulation = await Simulation.create({
    userId: adopter._id,
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

  await DailyLog.create({ simulationId: simulation._id, dayNumber: 1, actions: [] });

  console.log('Seed OK');
  console.log('Shelter proCode:', shelter.proCode);
  console.log('Adopter code:', adoptCode);
  console.log('Pro login: pro@spa-demo.fr / shelter123');
  console.log('Breeder login: breeder@demo.fr / breeder123');
  console.log('Sponsor login: sponsor@demo.fr / sponsor123');
  console.log('Adopter login: adopter@demo.fr / adopter123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
