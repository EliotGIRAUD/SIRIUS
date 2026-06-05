export type UserRole = 'adopter' | 'shelter';

export type SimulationStatus = 'in_progress' | 'completed';

export type ActionType =
  | 'meal'
  | 'water'
  | 'walk'
  | 'mental_stimulation'
  | 'brush'
  | 'antiparasitic'
  | 'shop_purchase'
  | 'vet_care'
  | 'play'
  | 'affection';

export type ShopItemId =
  | 'croquettes_quality'
  | 'vermifuge'
  | 'toy'
  | 'fancy_collar'
  | 'vet_checkup'
  | 'water_bowl';

export type ShopItemCategory = 'vital' | 'superfluous' | 'care' | 'croquettes' | 'essentiels';

export interface ShopItem {
  id: ShopItemId;
  label: string;
  price: number;
  category: ShopItemCategory;
}

export interface Gauges {
  hunger: number;
  energy: number;
  hygiene: number;
  mental: number;
}

export interface SimulationAction {
  type: ActionType;
  timestamp: string;
  cost: number;
  metadata?: Record<string, unknown>;
}

export interface PenaltyBonus {
  code: string;
  message: string;
  points: number;
}

export const SIMULATION_DAYS = 30;

export const INITIAL_BUDGET = 450;

export const INITIAL_GAUGES: Gauges = {
  hunger: 80,
  energy: 80,
  hygiene: 80,
  mental: 80,
};

export const GAUGE_MIN = 0;
export const GAUGE_MAX = 100;

export const MEALS_PER_DAY = 2;
export const MEAL_GRAMS_MIN = 300;
export const MEAL_GRAMS_MAX = 400;
export const MEAL_COOLDOWN_HOURS = 4;
export const POST_MEAL_EXERCISE_BUFFER_HOURS = 2;

export const MIN_WALK_MINUTES_PER_DAY = 90;
export const IDEAL_WALK_SESSIONS = 4;
export const MIN_MENTAL_MINUTES_PER_DAY = 15;
export const WALK_COOLDOWN_MINUTES = 30;

export const BRUSHES_PER_WEEK_MIN = 1;
export const BRUSHES_PER_WEEK_MAX = 2;
export const ANTIPARASITIC_TARGET_DAYS = [28, 29, 30] as const;

export const DAY_SCORE_BASE = 100;
export const FINAL_SCORE_MAX = 100;

export const SHOP_CATALOG: ShopItem[] = [
  { id: 'croquettes_quality', label: 'Croquettes premium (sac 2kg)', price: 45, category: 'croquettes' },
  { id: 'vermifuge', label: 'Vermifuge mensuel', price: 35, category: 'essentiels' },
  { id: 'vet_checkup', label: 'Consultation vétérinaire', price: 55, category: 'care' },
  { id: 'toy', label: 'Jouet interactif', price: 18, category: 'superfluous' },
  { id: 'fancy_collar', label: 'Collier design', price: 25, category: 'superfluous' },
  { id: 'water_bowl', label: 'Gamelle anti-glouton', price: 22, category: 'essentiels' },
];

export const SHOP_CATEGORIES = ['essentiels', 'croquettes', 'care', 'superfluous'] as const;

export const PENALTY_CODES = {
  EXTRA_MEAL: 'extra_meal',
  MEAL_PORTION: 'meal_portion',
  POST_MEAL_EXERCISE: 'post_meal_exercise',
  INSUFFICIENT_WALK: 'insufficient_walk',
  INSUFFICIENT_MENTAL: 'insufficient_mental',
  FEW_WALK_SESSIONS: 'few_walk_sessions',
  MISSING_BRUSH: 'missing_brush',
  MISSING_ANTIPARASITIC: 'missing_antiparasitic',
  BUDGET_MISMANAGEMENT: 'budget_mismanagement',
  VITAL_NEEDS_UNMET: 'vital_needs_unmet',
} as const;

export const BONUS_CODES = {
  PERFECT_DAY: 'perfect_day',
  BALANCED_BUDGET: 'balanced_budget',
  IDEAL_ACTIVITY: 'ideal_activity',
} as const;

export function getShopItem(id: ShopItemId): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === id);
}

export function isVitalItem(id: ShopItemId): boolean {
  const item = getShopItem(id);
  return item?.category === 'vital' || item?.category === 'essentiels' || item?.category === 'croquettes';
}
