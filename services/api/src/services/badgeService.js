import { User } from '../models/User.js';

export const BADGE_DEFINITIONS = [
  { id: 'first_meal', title: 'Premier repas', description: 'Nourrir son chien pour la première fois' },
  { id: 'first_walk', title: 'Première balade', description: 'Valider une sortie GPS' },
  { id: 'week1', title: 'Semaine 1', description: 'Atteindre le jour 7' },
  { id: 'perfect_pour', title: 'Dosage parfait', description: '3 repas avec dosage optimal' },
  { id: 'streak_7', title: 'Streak 7', description: '7 jours sans échec majeur' },
  { id: 'budget_master', title: 'Maître budget', description: 'Finir avec budget équilibré' },
  { id: 'premium_member', title: 'Premium', description: 'Plan premium actif' },
  { id: 'challenge_hero', title: 'Défi hebdo', description: 'Compléter un défi hebdomadaire' },
];

export async function unlockBadge(userId, badgeId) {
  const user = await User.findById(userId);
  if (!user) return null;
  const exists = (user.badges || []).some((b) => b.id === badgeId);
  if (exists) return user;
  user.badges = [...(user.badges || []), { id: badgeId, unlockedAt: new Date() }];
  await user.save();
  return user;
}

export function listBadges(user) {
  const unlocked = new Set((user?.badges || []).map((b) => b.id));
  return BADGE_DEFINITIONS.map((b) => ({
    ...b,
    unlocked: unlocked.has(b.id),
    unlockedAt: user?.badges?.find((x) => x.id === b.id)?.unlockedAt ?? null,
  }));
}
