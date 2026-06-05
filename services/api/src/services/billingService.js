import { B2B_PLANS, B2C_PRODUCTS } from '@sirius/shared';
import { Breeder } from '../models/Breeder.js';
import { Shelter } from '../models/Shelter.js';
import { SponsorCampaign } from '../models/SponsorCampaign.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

export async function mockPurchaseB2C(userId, productId, options = {}) {
  const product = B2C_PRODUCTS[productId];
  if (!product) throw new Error('Produit inconnu');

  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  const already = (user.purchases || []).some((p) => p.productId === productId);
  if (already) return { user, alreadyOwned: true };

  user.purchases = user.purchases || [];
  user.purchases.push({
    type: 'b2c',
    productId,
    purchasedAt: new Date(),
    mock: true,
    amountEur: product.priceEur,
  });

  if (productId === 'breed_unlock' && options.breedId) {
    const owned = user.ownedBreeds || ['labrador'];
    if (!owned.includes(options.breedId)) {
      user.ownedBreeds = [...owned, options.breedId];
    }
  }

  await user.save();
  return { user, alreadyOwned: false };
}

export async function mockSubscribeB2B(partnerType, partnerId, planId) {
  const plan = B2B_PLANS[planId];
  if (!plan) throw new Error('Plan inconnu');

  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);

  let sub = await Subscription.findOne({ partnerId, partnerType, planId });
  if (!sub) {
    sub = await Subscription.create({
      partnerId,
      partnerType,
      planId,
      status: 'active',
      validUntil,
      mockPayment: true,
      amountEur: plan.priceEur,
    });
  } else {
    sub.status = 'active';
    sub.validUntil = validUntil;
    sub.mockPayment = true;
    await sub.save();
  }

  if (partnerType === 'shelter') {
    await Shelter.findByIdAndUpdate(partnerId, {
      subscriptionStatus: 'active',
      subscriptionPlan: planId,
      subscriptionValidUntil: validUntil,
      features: ['pdf', 'metrics_gps', 'attestation_6mo'],
    });
  }
  if (partnerType === 'breeder') {
    await Breeder.findByIdAndUpdate(partnerId, {
      subscriptionStatus: 'active',
      subscriptionValidUntil: validUntil,
      verified: true,
    });
  }
  if (partnerType === 'sponsor') {
    await SponsorCampaign.findByIdAndUpdate(partnerId, {
      status: 'active',
      tier: planId.replace('sponsor_', ''),
      impressionsLimit: plan.impressions || 5000,
      validUntil,
    });
  }

  return sub;
}

export async function requireShelterSubscription(shelterId) {
  const shelter = await Shelter.findById(shelterId);
  if (!shelter) throw new Error('Refuge introuvable');
  if (shelter.subscriptionStatus === 'active' && shelter.subscriptionValidUntil > new Date()) {
    return shelter;
  }
  throw new Error('Abonnement refuge requis (99 €/mois)');
}
