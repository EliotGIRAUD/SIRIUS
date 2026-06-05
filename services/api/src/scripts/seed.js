import 'dotenv/config';
import bcrypt from 'bcrypt';
import { INITIAL_BUDGET, INITIAL_GAUGES } from '@sirius/shared';
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
  ]);

  const shelter = await Shelter.create({
    name: 'SPA Demo Paris',
    proCode: 'SPADEMO1',
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

  const simulation = await Simulation.create({
    userId: adopter._id,
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

  await DailyLog.create({ simulationId: simulation._id, dayNumber: 1, actions: [] });

  console.log('Seed OK');
  console.log('Shelter proCode:', shelter.proCode);
  console.log('Adopter code:', adoptCode);
  console.log('Pro login: pro@spa-demo.fr / shelter123');
  console.log('Adopter login: adopter@demo.fr / adopter123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
