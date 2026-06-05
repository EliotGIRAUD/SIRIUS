import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signToken } from '../config/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { AuthCode } from '../models/AuthCode.js';
import { Shelter } from '../models/Shelter.js';
import { User } from '../models/User.js';
import { generateAuthCode, generateProCode } from '../services/simulationService.js';

const DEV_VERIFY_CODE = '123456';

function buildToken(user, shelterId = null) {
  return signToken({
    userId: user._id.toString(),
    role: user.role,
    shelterId: (shelterId || user.shelterId || user.ownedShelterId)?.toString() ?? null,
    email: user.email,
  });
}

function serializeUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    pseudo: user.pseudo || user.displayName,
    shelterId: user.shelterId,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    settings: user.settings,
  };
}

export async function validateCode(req, res) {
  try {
    const { code } = req.body;
    if (!code || String(code).trim().length !== 6) {
      return res.status(400).json({ error: 'Code SPA requis (6 caractères)' });
    }
    const normalized = String(code).toUpperCase().trim();
    const shelter = await Shelter.findOne({ proCode: normalized });
    const authCode = await AuthCode.findOne({
      code: normalized,
      $or: [{ usedBy: null }, { multiUse: true }],
    });
    if (!shelter && !authCode) {
      return res.status(404).json({ error: 'Code SPA invalide' });
    }
    const shelterDoc = shelter || (authCode ? await Shelter.findById(authCode.shelterId) : null);
    return res.json({
      valid: true,
      shelter: shelterDoc ? { id: shelterDoc._id, name: shelterDoc.name } : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function registerAdopter(req, res) {
  try {
    const { email, password, pseudo, displayName, proCode, rgpdAccepted } = req.body;
    const name = pseudo || displayName;
    if (!email || !password || !name || !proCode) {
      return res.status(400).json({ error: 'Champs requis: email, password, pseudo, proCode' });
    }
    if (!rgpdAccepted) {
      return res.status(400).json({ error: 'Acceptation RGPD requise' });
    }

    const normalizedCode = String(proCode).toUpperCase().trim();
    const shelter = await Shelter.findOne({ proCode: normalizedCode });
    const authCode = await AuthCode.findOne({
      code: normalizedCode,
      $or: [{ usedBy: null }, { multiUse: true }],
    });
    if (!shelter && !authCode) {
      return res.status(400).json({ error: 'Code refuge invalide' });
    }
    const shelterId = shelter?._id || authCode?.shelterId;
    const codeToUse = authCode?.code ?? normalizedCode;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const verifyCode = DEV_VERIFY_CODE;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName: name,
      pseudo: name,
      role: 'adopter',
      shelterId,
      codeAuth: codeToUse,
      emailVerifyCode: verifyCode,
      emailVerified: false,
      rgpdAcceptedAt: new Date(),
    });

    if (authCode && !authCode.multiUse) {
      authCode.usedBy = user._id;
      authCode.usedAt = new Date();
      await authCode.save();
    }

    const token = buildToken(user, shelterId);
    return res.status(201).json({ token, user: serializeUser(user), devVerifyCode: verifyCode });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const ok = code === user.emailVerifyCode || code === DEV_VERIFY_CODE;
    if (!ok) return res.status(400).json({ error: 'Code invalide' });
    user.emailVerified = true;
    user.emailVerifyCode = null;
    await user.save();
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    let shelter = null;
    const shelterId = user.role === 'shelter' ? user.ownedShelterId : user.shelterId;
    if (shelterId) shelter = await Shelter.findById(shelterId);
    return res.json({ user: serializeUser(user), shelter: shelter ? { id: shelter._id, name: shelter.name, proCode: shelter.proCode } : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function completeOnboarding(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    user.onboardingCompleted = true;
    if (req.body?.settings) user.settings = { ...user.settings?.toObject?.() ?? user.settings, ...req.body.settings };
    await user.save();
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    user.settings = { ...user.settings?.toObject?.() ?? user.settings, ...req.body };
    await user.save();
    return res.json({ settings: user.settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function registerShelter(req, res) {
  try {
    const { email, password, displayName, shelterName } = req.body;
    if (!email || !password || !displayName || !shelterName) {
      return res.status(400).json({ error: 'Champs requis: email, password, displayName, shelterName' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });
    const proCode = generateProCode().slice(0, 6);
    const shelter = await Shelter.create({ name: shelterName, proCode });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      pseudo: displayName,
      role: 'shelter',
      ownedShelterId: shelter._id,
      emailVerified: true,
      onboardingCompleted: true,
    });
    const token = buildToken(user, shelter._id);
    return res.status(201).json({
      token,
      user: serializeUser(user),
      shelter: { id: shelter._id, name: shelter.name, proCode: shelter.proCode },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
    const shelterId = user.role === 'shelter' ? user.ownedShelterId : user.shelterId;
    const token = buildToken(user, shelterId);
    let shelter = null;
    if (shelterId) shelter = await Shelter.findById(shelterId);
    return res.json({ token, user: serializeUser(user), shelter: shelter ? { id: shelter._id, name: shelter.name, proCode: shelter.proCode } : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function generateCode(req, res) {
  try {
    const shelterId = req.user.shelterId;
    if (!shelterId) return res.status(400).json({ error: 'Refuge non associé' });
    const { multiUse = false } = req.body ?? {};
    const code = generateAuthCode().slice(0, 6);
    const authCode = await AuthCode.create({ shelterId, code, multiUse: Boolean(multiUse) });
    return res.status(201).json({ code: authCode.code, multiUse: authCode.multiUse });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export { authenticate };
