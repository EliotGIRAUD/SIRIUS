import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { mockPurchaseB2C, mockSubscribeB2B } from '../services/billingService.js';
import { User } from '../models/User.js';

const router = Router();

function serializeUser(user) {
  return {
    id: user._id,
    plan: user.plan,
    ownedBreeds: user.ownedBreeds,
    purchases: user.purchases,
    badges: user.badges,
  };
}

router.post('/purchase-mock', authenticate, requireRole('adopter'), async (req, res) => {
  try {
    const { productId, breedId } = req.body;
    const { user, alreadyOwned } = await mockPurchaseB2C(req.user.userId, productId, { breedId });
    return res.json({ user: serializeUser(user), alreadyOwned });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/subscribe-mock', authenticate, async (req, res) => {
  try {
    const { planId, partnerType, partnerId } = req.body;
    let pid = partnerId;
    if (!pid) {
      const user = await User.findById(req.user.userId);
      if (partnerType === 'shelter') pid = user.ownedShelterId;
      if (partnerType === 'breeder') pid = user.breederId;
    }
    const sub = await mockSubscribeB2B(partnerType, pid, planId);
    return res.json({ subscription: sub });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch('/plan', authenticate, requireRole('adopter'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (req.body.plan === 'premium') {
      user.plan = 'premium';
      if (!user.ownedBreeds.includes('golden')) user.ownedBreeds.push('golden');
    }
    await user.save();
    return res.json({
      user: {
        id: user._id,
        plan: user.plan,
        ownedBreeds: user.ownedBreeds,
        purchases: user.purchases,
        badges: user.badges,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
