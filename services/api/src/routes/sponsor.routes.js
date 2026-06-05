import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';

import { SponsorCampaign } from '../models/SponsorCampaign.js';

import { mockSubscribeB2B } from '../services/billingService.js';



const router = Router();



function serializeCampaign(campaign) {

  return {

    id: campaign._id,

    name: campaign.name,

    tier: campaign.tier,

    status: campaign.status,

    impressionsLimit: campaign.impressionsLimit,

    impressionsCount: campaign.impressionsCount,

    validUntil: campaign.validUntil,

    placement: campaign.placement,

  };

}



router.get('/campaigns', authenticate, requireRole('sponsor'), async (req, res) => {

  try {

    const campaigns = await SponsorCampaign.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    return res.json({ campaigns: campaigns.map(serializeCampaign) });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



router.post('/campaigns', authenticate, requireRole('sponsor'), async (req, res) => {

  try {

    const { name, tier, placement } = req.body;

    const campaign = await SponsorCampaign.create({

      userId: req.user.userId,

      name,

      tier,

      placement: placement || 'map',

      status: 'inactive',

    });

    return res.status(201).json({ campaign: serializeCampaign(campaign) });

  } catch (err) {

    return res.status(400).json({ error: err.message });

  }

});



router.post('/campaigns/:id/activate-mock', authenticate, requireRole('sponsor'), async (req, res) => {

  try {

    const campaign = await SponsorCampaign.findOne({ _id: req.params.id, userId: req.user.userId });

    if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

    const planId = `sponsor_${req.body.tier || campaign.tier}`;

    const sub = await mockSubscribeB2B('sponsor', campaign._id, planId);

    const updated = await SponsorCampaign.findById(campaign._id);

    return res.json({ campaign: serializeCampaign(updated), subscription: sub });

  } catch (err) {

    return res.status(400).json({ error: err.message });

  }

});



router.post('/impression', async (req, res) => {

  try {

    const { campaignId } = req.body;

    const campaign = await SponsorCampaign.findById(campaignId);

    if (!campaign || campaign.status !== 'active') return res.json({ recorded: false });

    campaign.impressionsCount += 1;

    await campaign.save();

    return res.json({ recorded: true, impressionsCount: campaign.impressionsCount });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

});



export default router;

