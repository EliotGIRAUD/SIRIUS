import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';

import { Breeder } from '../models/Breeder.js';

import { SponsorCampaign } from '../models/SponsorCampaign.js';

import { User } from '../models/User.js';



const router = Router();



function serializeBreeder(breeder) {

  return {

    id: breeder._id,

    name: breeder.name,

    description: breeder.description,

    breeds: breeder.breeds,

    lat: breeder.lat,

    lng: breeder.lng,

    verified: breeder.verified,

    subscriptionStatus: breeder.subscriptionStatus,

    subscriptionValidUntil: breeder.subscriptionValidUntil,

    monthlyViews: breeder.monthlyViews,

  };

}



router.get('/me', authenticate, requireRole('breeder'), async (req, res) => {

  try {

    const user = await User.findById(req.user.userId);

    if (!user?.breederId) return res.status(404).json({ error: 'Éleveur introuvable' });

    const breeder = await Breeder.findById(user.breederId);

    if (!breeder) return res.status(404).json({ error: 'Éleveur introuvable' });

    return res.json({ breeder: serializeBreeder(breeder) });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



router.patch('/me', authenticate, requireRole('breeder'), async (req, res) => {

  try {

    const user = await User.findById(req.user.userId);

    if (!user?.breederId) return res.status(404).json({ error: 'Éleveur introuvable' });

    const breeder = await Breeder.findById(user.breederId);

    if (!breeder) return res.status(404).json({ error: 'Éleveur introuvable' });

    const { name, description, breeds, lat, lng } = req.body;

    if (name) breeder.name = name;

    if (description !== undefined) breeder.description = description;

    if (breeds) breeder.breeds = breeds;

    if (lat !== undefined) breeder.lat = lat;

    if (lng !== undefined) breeder.lng = lng;

    await breeder.save();

    return res.json({ breeder: serializeBreeder(breeder) });

  } catch (err) {

    return res.status(400).json({ error: err.message });

  }

});



router.get('/recommended', authenticate, async (req, res) => {

  try {

    const { breedId } = req.query;

    const breeders = await Breeder.find({

      subscriptionStatus: 'active',

      ...(breedId ? { breeds: breedId } : {}),

    }).sort({ verified: -1, monthlyViews: -1 }).limit(5);

    return res.json({ breeders });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



router.get('/sponsors/active', async (_req, res) => {

  try {

    const campaigns = await SponsorCampaign.find({ status: 'active' });

    return res.json({ campaigns });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



router.get('/:id', async (req, res) => {

  try {

    const breeder = await Breeder.findById(req.params.id);

    if (!breeder) return res.status(404).json({ error: 'Éleveur introuvable' });

    breeder.monthlyViews += 1;

    await breeder.save();

    return res.json({ breeder });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



router.post('/register-mock', authenticate, async (req, res) => {

  try {

    const { name, description, breeds, lat, lng } = req.body;

    const breeder = await Breeder.create({

      userId: req.user.userId,

      name,

      description: description || '',

      breeds: breeds || ['labrador'],

      lat: lat ?? 48.87,

      lng: lng ?? 2.33,

    });

    return res.status(201).json({ breeder });

  } catch (err) {

    return res.status(400).json({ error: err.message });

  }

});



export default router;

