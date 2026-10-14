import { describe, it, expect } from 'vitest';
import { generateEvolutionReport } from '../reportUtils';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../../types/bodyEvolution';

describe('generateEvolutionReport', () => {
  const dummyGoal: BodyGoal = {
    targetWeightKg: 70,
    heightCm: 175
  };

  it('correctly handles insufficient data: 1 weight entry should NOT display 0 variation', () => {
    const singleWeight: WeightEntry[] = [
      { id: 'w1', date: '2026-10-10', weightKg: 80, createdAt: '2026-10-10T12:00:00Z' }
    ];

    const report = generateEvolutionReport(
      '2026-10-01',
      '2026-10-31',
      singleWeight,
      [],
      dummyGoal
    );

    expect(report.totalWeights).toBe(1);
    expect(report.initialWeight).toBe(80);
    expect(report.finalWeight).toBe(80);
    expect(report.hasWeightComparison).toBe(false);
    expect(report.weightDelta).toBeUndefined();
    expect(report.weightDeltaPct).toBeUndefined();
  });

  it('correctly handles 0 weight entries', () => {
    const report = generateEvolutionReport(
      '2026-10-01',
      '2026-10-31',
      [],
      [],
      dummyGoal
    );

    expect(report.totalWeights).toBe(0);
    expect(report.initialWeight).toBeUndefined();
    expect(report.finalWeight).toBeUndefined();
    expect(report.hasWeightComparison).toBe(false);
    expect(report.weightDelta).toBeUndefined();
  });

  it('correctly differentiates real zero variation from unavailable comparison', () => {
    // Two distinct weigh-ins with the same weight -> genuine stable 0 variation
    const twoWeightsSame: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 75.0, createdAt: '2026-10-01T12:00:00Z' },
      { id: 'w2', date: '2026-10-15', weightKg: 75.0, createdAt: '2026-10-15T12:00:00Z' }
    ];

    const report = generateEvolutionReport(
      '2026-10-01',
      '2026-10-31',
      twoWeightsSame,
      [],
      dummyGoal
    );

    expect(report.totalWeights).toBe(2);
    expect(report.hasWeightComparison).toBe(true);
    expect(report.weightDelta).toBe(0);
    expect(report.weightDeltaPct).toBe(0);
  });

  it('correctly calculates delta when there are multiple entries with change', () => {
    const weights: WeightEntry[] = [
      { id: 'w1', date: '2026-10-01', weightKg: 80.0, createdAt: '2026-10-01T12:00:00Z' },
      { id: 'w2', date: '2026-10-15', weightKg: 77.5, createdAt: '2026-10-15T12:00:00Z' }
    ];

    const report = generateEvolutionReport(
      '2026-10-01',
      '2026-10-31',
      weights,
      [],
      dummyGoal
    );

    expect(report.totalWeights).toBe(2);
    expect(report.hasWeightComparison).toBe(true);
    expect(report.weightDelta).toBe(-2.5);
    expect(report.weightDeltaPct).toBe(-3.1);
  });

  it('handles single measurements by marking comparison as unavailable', () => {
    const singleMeasurement: MeasurementEntry[] = [
      {
        id: 'm1',
        date: '2026-10-05',
        measurements: { cintura: 85 },
        createdAt: '2026-10-05T12:00:00Z'
      }
    ];

    const report = generateEvolutionReport(
      '2026-10-01',
      '2026-10-31',
      [],
      singleMeasurement,
      dummyGoal
    );

    expect(report.measurementsComparison.length).toBe(1);
    const cintura = report.measurementsComparison[0];
    expect(cintura.key).toBe('cintura');
    expect(cintura.initialVal).toBe(85);
    expect(cintura.finalVal).toBe(85);
    expect(cintura.hasComparison).toBe(false);
    expect(cintura.diff).toBeUndefined();
  });

  it('validates date ranges where startDate is after endDate', () => {
    const report = generateEvolutionReport(
      '2026-10-31',
      '2026-10-01',
      [],
      [],
      dummyGoal
    );

    expect(report.isValidDateRange).toBe(false);
    expect(report.dateRangeError).toBeDefined();
    expect(report.hasWeightComparison).toBe(false);
  });
});
