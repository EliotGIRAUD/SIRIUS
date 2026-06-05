const CHALLENGES = [
  { id: 'w1_walk', week: 1, title: '3 balades cette semaine', target: 'walk', count: 3 },
  { id: 'w2_brush', week: 2, title: 'Brosser 2 fois', target: 'brush', count: 2 },
  { id: 'w3_budget', week: 3, title: 'Achat vital uniquement', target: 'vital_purchase', count: 1 },
  { id: 'w4_perfect', week: 4, title: 'Journée sans pénalité', target: 'perfect_day', count: 1 },
];

export function getChallengeForWeek(weekNumber) {
  return CHALLENGES.find((c) => c.week === weekNumber) || CHALLENGES[0];
}

export function evaluateChallenge(dayLog, challenge) {
  if (!challenge || dayLog.weeklyChallenge?.completed) return false;
  const actions = dayLog.actions || [];
  if (challenge.target === 'walk') {
    return actions.filter((a) => a.type === 'walk').length >= challenge.count;
  }
  if (challenge.target === 'brush') {
    return actions.filter((a) => a.type === 'brush').length >= challenge.count;
  }
  if (challenge.target === 'vital_purchase') {
    return actions.some((a) => a.type === 'shop_purchase' && ['essentiels', 'croquettes', 'care', 'vital'].includes(a.metadata?.category));
  }
  if (challenge.target === 'perfect_day') {
    return (dayLog.penalties || []).length === 0;
  }
  return false;
}
