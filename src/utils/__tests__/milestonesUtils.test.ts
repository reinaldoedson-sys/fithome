import { describe, it, expect } from 'vitest';
import { deriveProgressMilestones } from '../milestonesUtils';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../../types/bodyEvolution';

describe('deriveProgressMilestones', () => {
  const dummyGoal: BodyGoal = {
    targetWeightKg: 70,
    heightCm: 175
  };

  it('returns empty array when there are no historical weights or measurements', () => {
    const milestones = deriveProgressMilestones([], [], dummyGoal);
    expect(milestones).toEqual([]);
  });

  it('creates a milestone for the first weight recorded', () => {
    const weights: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 85, createdAt: '2026-10-01T10:00:00Z' }
    ];

    const milestones = deriveProgressMilestones(weights, [], dummyGoal);
    expect(milestones.length).toBe(1);
    expect(milestones[0].type).toBe('first_weight');
    expect(milestones[0].date).toBe('2026-10-01');
    expect(milestones[0].valueLabel).toBe('85 kg');
  });

  it('identifies lowest weight and cumulative 5 kg loss milestones', () => {
    const weights: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 85, createdAt: '2026-10-01T10:00:00Z' },
      { id: 'w2', date: '2026-10-10', weightKg: 82, createdAt: '2026-10-10T10:00:00Z' },
      { id: 'w3', date: '2026-10-20', weightKg: 79.5, createdAt: '2026-10-20T10:00:00Z' } // Loss > 5kg (85 - 79.5 = 5.5kg)
    ];

    const milestones = deriveProgressMilestones(weights, [], dummyGoal);

    // Should have: first_weight, lowest_weight, and -5kg milestone
    const firstWeight = milestones.find(m => m.type === 'first_weight');
    const lowestWeight = milestones.find(m => m.type === 'lowest_weight');
    const fiveKgLoss = milestones.find(m => m.type === 'weight_loss_milestone');

    expect(firstWeight).toBeDefined();
    expect(lowestWeight).toBeDefined();
    expect(lowestWeight?.valueLabel).toBe('79.5 kg');
    expect(fiveKgLoss).toBeDefined();
    expect(fiveKgLoss?.badge).toBe('-5 kg');
  });

  it('detects goal reached milestone when weight reaches target', () => {
    const weights: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 74, createdAt: '2026-10-01T10:00:00Z' },
      { id: 'w2', date: '2026-10-15', weightKg: 70, createdAt: '2026-10-15T10:00:00Z' }
    ];

    const milestones = deriveProgressMilestones(weights, [], { targetWeightKg: 70 });
    const goalMilestone = milestones.find(m => m.type === 'goal_reached');

    expect(goalMilestone).toBeDefined();
    expect(goalMilestone?.date).toBe('2026-10-15');
    expect(goalMilestone?.valueLabel).toBe('70 kg');
  });

  it('detects waist circumference drop of 5 cm or more', () => {
    const measurements: MeasurementEntry[] = [
      { id: 'm1', date: '2026-10-01', measurements: { cintura: 90 }, createdAt: '2026-10-01T10:00:00Z' },
      { id: 'm2', date: '2026-10-20', measurements: { cintura: 84 }, createdAt: '2026-10-20T10:00:00Z' }
    ];

    const milestones = deriveProgressMilestones([], measurements, dummyGoal);
    const dropMilestone = milestones.find(m => m.type === 'measurement_drop');

    expect(dropMilestone).toBeDefined();
    expect(dropMilestone?.badge).toBe('-5 cm Cintura');
    expect(dropMilestone?.date).toBe('2026-10-20');
  });

  it('sorts milestones chronologically ascending', () => {
    const weights: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 85, createdAt: '2026-10-01T10:00:00Z' },
      { id: 'w2', date: '2026-10-15', weightKg: 80, createdAt: '2026-10-15T10:00:00Z' }
    ];
    const measurements: MeasurementEntry[] = [
      { id: 'm1', date: '2026-10-05', measurements: { cintura: 92 }, createdAt: '2026-10-05T10:00:00Z' },
      { id: 'm2', date: '2026-10-10', measurements: { cintura: 86 }, createdAt: '2026-10-10T10:00:00Z' }
    ];

    const milestones = deriveProgressMilestones(weights, measurements, dummyGoal);
    for (let i = 0; i < milestones.length - 1; i++) {
      expect(milestones[i].date <= milestones[i + 1].date).toBe(true);
    }
  });
});
