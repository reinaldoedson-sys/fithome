import { WeightEntry, MeasurementEntry, BodyGoal, ProgressMilestone } from '../types/bodyEvolution';
import { parseLocalDate, formatDateBR } from './bodyDateUtils';

/**
 * Derives milestones purely as computed/derived state from historical data.
 * Does not mutate records, fabricate data, or duplicate milestones.
 */
export function deriveProgressMilestones(
  sortedWeightsAsc: WeightEntry[],
  sortedMeasurementsAsc: MeasurementEntry[],
  goal: BodyGoal
): ProgressMilestone[] {
  const milestones: ProgressMilestone[] = [];

  if (sortedWeightsAsc.length === 0 && sortedMeasurementsAsc.length === 0) {
    return milestones;
  }

  // Baseline weight for cumulative calculations
  const baselineWeight =
    goal.customInitialWeightKg !== undefined && goal.customInitialWeightKg > 0
      ? goal.customInitialWeightKg
      : sortedWeightsAsc[0]?.weightKg;

  // 1. Marco: Primeira Pesagem Registrada
  if (sortedWeightsAsc.length > 0) {
    const firstWeight = sortedWeightsAsc[0];
    milestones.push({
      id: `milestone-first-weight-${firstWeight.id}`,
      title: 'Ponto de Partida Registrado',
      description: `Início oficial do acompanhamento com ${firstWeight.weightKg} kg.`,
      date: firstWeight.date,
      type: 'first_weight',
      badge: 'Início',
      valueLabel: `${firstWeight.weightKg} kg`
    });
  }

  // 2. Marco: Menor Peso Histórico Confirmado (se houver pelo menos 2 registros)
  if (sortedWeightsAsc.length >= 2) {
    let minEntry = sortedWeightsAsc[0];
    for (let i = 1; i < sortedWeightsAsc.length; i++) {
      if (sortedWeightsAsc[i].weightKg < minEntry.weightKg) {
        minEntry = sortedWeightsAsc[i];
      }
    }

    if (minEntry.weightKg < sortedWeightsAsc[0].weightKg) {
      milestones.push({
        id: `milestone-lowest-weight-${minEntry.id}`,
        title: 'Menor Peso Histórico Alcançado',
        description: `Menor marca já atingida ao longo da sua jornada: ${minEntry.weightKg} kg.`,
        date: minEntry.date,
        type: 'lowest_weight',
        badge: 'Recorde Mínimo',
        valueLabel: `${minEntry.weightKg} kg`
      });
    }
  }

  // 3. Marcos de Redução Acumulada de 5 kg a partir do peso inicial de referência
  if (baselineWeight !== undefined && sortedWeightsAsc.length > 0) {
    // Check reduction steps (5kg, 10kg, 15kg, 20kg...)
    const isWeightLossGoal = goal.targetWeightKg ? goal.targetWeightKg < baselineWeight : true;

    if (isWeightLossGoal) {
      const maxSteps = 20; // up to 100 kg
      const completedSteps = new Set<number>();

      for (const entry of sortedWeightsAsc) {
        const loss = baselineWeight - entry.weightKg;
        for (let step = 1; step <= maxSteps; step++) {
          const thresholdKg = step * 5;
          if (loss >= thresholdKg && !completedSteps.has(thresholdKg)) {
            completedSteps.add(thresholdKg);
            milestones.push({
              id: `milestone-loss-${thresholdKg}kg-${entry.id}`,
              title: `Conquista: -${thresholdKg} kg Eliminados!`,
              description: `Superou a marca de -${thresholdKg} kg em relação ao peso inicial (${baselineWeight} kg).`,
              date: entry.date,
              type: 'weight_loss_milestone',
              badge: `-${thresholdKg} kg`,
              valueLabel: `${entry.weightKg} kg`
            });
          }
        }
      }
    } else {
      // Weight gain milestones (+5kg, +10kg...)
      const maxSteps = 10;
      const completedSteps = new Set<number>();

      for (const entry of sortedWeightsAsc) {
        const gain = entry.weightKg - baselineWeight;
        for (let step = 1; step <= maxSteps; step++) {
          const thresholdKg = step * 5;
          if (gain >= thresholdKg && !completedSteps.has(thresholdKg)) {
            completedSteps.add(thresholdKg);
            milestones.push({
              id: `milestone-gain-${thresholdKg}kg-${entry.id}`,
              title: `Conquista: +${thresholdKg} kg de Massa!`,
              description: `Alcançou o marco de +${thresholdKg} kg em relação ao peso inicial (${baselineWeight} kg).`,
              date: entry.date,
              type: 'weight_loss_milestone',
              badge: `+${thresholdKg} kg`,
              valueLabel: `${entry.weightKg} kg`
            });
          }
        }
      }
    }
  }

  // 4. Marco: Meta de Peso Atingida
  if (goal.targetWeightKg !== undefined && sortedWeightsAsc.length > 0 && baselineWeight !== undefined) {
    const isLoss = goal.targetWeightKg <= baselineWeight;

    for (const entry of sortedWeightsAsc) {
      const achieved = isLoss
        ? entry.weightKg <= goal.targetWeightKg
        : entry.weightKg >= goal.targetWeightKg;

      if (achieved) {
        milestones.push({
          id: `milestone-goal-reached-${entry.id}`,
          title: 'Meta de Peso Alcançada com Sucesso!',
          description: `Parabéns! Sua meta de ${goal.targetWeightKg} kg foi atingida nesta data com a pesagem de ${entry.weightKg} kg.`,
          date: entry.date,
          type: 'goal_reached',
          badge: 'Meta Batida!',
          valueLabel: `${entry.weightKg} kg`
        });
        break; // Only register first attainment date
      }
    }
  }

  // 5. Marco: Redução comprovada em circunferências corporais (-5 cm de cintura/abdômen)
  if (sortedMeasurementsAsc.length >= 2) {
    const firstWithWaist = sortedMeasurementsAsc.find(m => m.measurements.cintura !== undefined && m.measurements.cintura > 0);
    if (firstWithWaist && firstWithWaist.measurements.cintura) {
      const initialWaist = firstWithWaist.measurements.cintura;
      for (const m of sortedMeasurementsAsc) {
        if (m.measurements.cintura !== undefined) {
          const waistDrop = initialWaist - m.measurements.cintura;
          if (waistDrop >= 5) {
            milestones.push({
              id: `milestone-waist-drop-5cm-${m.id}`,
              title: 'Redução de Circunferência de Cintura (-5 cm)',
              description: `A cintura reduziu de ${initialWaist} cm para ${m.measurements.cintura} cm (mais de 5 cm perdidos).`,
              date: m.date,
              type: 'measurement_drop',
              badge: '-5 cm Cintura',
              valueLabel: `${m.measurements.cintura} cm`
            });
            break;
          }
        }
      }
    }
  }

  // Sort milestones chronologically ascending
  return milestones.sort((a, b) => {
    const timeA = parseLocalDate(a.date).getTime();
    const timeB = parseLocalDate(b.date).getTime();
    return timeA - timeB;
  });
}
