import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDayLog, evaluateFinalBudget } from '../src/services/scoringEngine.js';

test('evaluateDayLog penalizes extra meals', () => {
  const dayLog = {
    dayNumber: 1,
    actions: [
      { type: 'meal', timestamp: new Date('2026-01-01T08:00:00Z'), metadata: { grams: 350 } },
      { type: 'meal', timestamp: new Date('2026-01-01T12:00:00Z'), metadata: { grams: 350 } },
      { type: 'meal', timestamp: new Date('2026-01-01T18:00:00Z'), metadata: { grams: 350 } },
    ],
  };
  const result = evaluateDayLog(dayLog, { budgetRemaining: 400 }, []);
  assert.ok(result.penalties.some((p) => p.code === 'extra_meal'));
});

test('evaluateDayLog penalizes post-meal exercise', () => {
  const dayLog = {
    dayNumber: 2,
    actions: [
      { type: 'meal', timestamp: new Date('2026-01-01T12:00:00Z'), metadata: { grams: 350 } },
      { type: 'walk', timestamp: new Date('2026-01-01T12:45:00Z'), metadata: { durationMinutes: 30 } },
    ],
  };
  const result = evaluateDayLog(dayLog, { budgetRemaining: 400 }, []);
  assert.ok(result.penalties.some((p) => p.code === 'post_meal_exercise'));
});

test('evaluateFinalBudget penalizes missing vital items', () => {
  const result = evaluateFinalBudget({
    purchasedVitalItems: [],
    vitalSpent: 0,
    superfluousSpent: 50,
    totalSpent: 50,
    budgetRemaining: 400,
  });
  assert.ok(result.penalties.some((p) => p.code === 'vital_needs_unmet'));
});
