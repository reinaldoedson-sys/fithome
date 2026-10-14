import {
  WeightEntry,
  MeasurementEntry,
  BodyGoal,
  EvolutionReport,
  MEASUREMENT_LABELS,
  MeasurementKey
} from '../types/bodyEvolution';
import { parseLocalDate, formatDateBR } from './bodyDateUtils';
import { calculateBmi } from './bmiUtils';
import { deriveProgressMilestones } from './milestonesUtils';

/**
 * Generates an evolution report for a specified date range on demand.
 */
export function generateEvolutionReport(
  startDate: string,
  endDate: string,
  sortedWeightsAsc: WeightEntry[],
  sortedMeasurementsAsc: MeasurementEntry[],
  goal: BodyGoal
): EvolutionReport {
  const startTime = parseLocalDate(startDate).getTime();
  const endTime = parseLocalDate(endDate).getTime();

  // Filter weights in range
  const weightsInPeriod = sortedWeightsAsc.filter(w => {
    const t = parseLocalDate(w.date).getTime();
    return t >= startTime && t <= endTime;
  });

  // Filter measurements in range
  const measurementsInPeriod = sortedMeasurementsAsc.filter(m => {
    const t = parseLocalDate(m.date).getTime();
    return t >= startTime && t <= endTime;
  });

  const totalWeights = weightsInPeriod.length;
  const totalMeasurements = measurementsInPeriod.length;

  const initialWeightEntry = weightsInPeriod[0];
  const finalWeightEntry = weightsInPeriod[weightsInPeriod.length - 1];

  const initialWeight = initialWeightEntry?.weightKg;
  const finalWeight = finalWeightEntry?.weightKg;

  let weightDelta: number | undefined = undefined;
  let weightDeltaPct: number | undefined = undefined;

  if (initialWeight !== undefined && finalWeight !== undefined) {
    weightDelta = Number((finalWeight - initialWeight).toFixed(2));
    // Explicit protection against division by zero
    if (initialWeight > 0) {
      weightDeltaPct = Number(((weightDelta / initialWeight) * 100).toFixed(1));
    }
  }

  // BMI calculations if height is present
  const initialBmiInfo =
    initialWeight !== undefined && goal.heightCm ? calculateBmi(initialWeight, goal.heightCm) : null;
  const finalBmiInfo =
    finalWeight !== undefined && goal.heightCm ? calculateBmi(finalWeight, goal.heightCm) : null;

  // Measurements comparison in period
  const measurementsComparison: Array<{
    key: MeasurementKey;
    name: string;
    initialVal?: number;
    finalVal?: number;
    diff?: number;
  }> = [];

  (Object.keys(MEASUREMENT_LABELS) as MeasurementKey[]).forEach(k => {
    const list = measurementsInPeriod.filter(m => m.measurements[k] !== undefined && m.measurements[k]! > 0);
    if (list.length > 0) {
      const first = list[0].measurements[k];
      const last = list[list.length - 1].measurements[k];
      const diff = first !== undefined && last !== undefined ? Number((last - first).toFixed(1)) : undefined;

      measurementsComparison.push({
        key: k,
        name: MEASUREMENT_LABELS[k].name,
        initialVal: first,
        finalVal: last,
        diff
      });
    }
  });

  // Milestones in period
  const allMilestones = deriveProgressMilestones(sortedWeightsAsc, sortedMeasurementsAsc, goal);
  const milestonesInPeriod = allMilestones.filter(m => {
    const t = parseLocalDate(m.date).getTime();
    return t >= startTime && t <= endTime;
  });

  return {
    startDate,
    endDate,
    totalWeights,
    totalMeasurements,
    initialWeight,
    finalWeight,
    weightDelta,
    weightDeltaPct,
    initialBmi: initialBmiInfo?.bmi,
    finalBmi: finalBmiInfo?.bmi,
    initialBmiLabel: initialBmiInfo?.label,
    finalBmiLabel: finalBmiInfo?.label,
    measurementsComparison,
    milestonesInPeriod
  };
}

/**
 * Exports report data to CSV with UTF-8 BOM for perfect Excel/Sheets accentuation.
 */
export function exportReportToCsv(report: EvolutionReport, athleteName?: string): void {
  const lines: string[] = [];

  // Header section
  lines.push(`RELATÓRIO DE EVOLUÇÃO CORPORAL - FITHOME`);
  lines.push(`Atleta:;${athleteName || 'Atleta FitHome'}`);
  lines.push(`Período analisado:;${formatDateBR(report.startDate)} até ${formatDateBR(report.endDate)}`);
  lines.push(`Data de geração:;${formatDateBR(new Date().toISOString())}`);
  lines.push(``);

  // Summary section
  lines.push(`RESUMO GERAL`);
  lines.push(`Total de pesagens no período:;${report.totalWeights}`);
  lines.push(`Total de sessões de medidas:;${report.totalMeasurements}`);
  lines.push(`Peso Inicial:;${report.initialWeight !== undefined ? `${report.initialWeight} kg` : 'Não registrado'}`);
  lines.push(`Peso Final:;${report.finalWeight !== undefined ? `${report.finalWeight} kg` : 'Não registrado'}`);
  lines.push(
    `Variação Total:;${
      report.weightDelta !== undefined
        ? `${report.weightDelta > 0 ? `+${report.weightDelta}` : report.weightDelta} kg (${report.weightDeltaPct}%)`
        : 'Não calculável'
    }`
  );
  if (report.initialBmi) {
    lines.push(`IMC Inicial:;${report.initialBmi} (${report.initialBmiLabel})`);
  }
  if (report.finalBmi) {
    lines.push(`IMC Final:;${report.finalBmi} (${report.finalBmiLabel})`);
  }
  lines.push(``);

  // Measurements section
  lines.push(`EVOLUÇÃO DE MEDIDAS CORPORAIS (cm)`);
  lines.push(`Região Corporal;Medida Inicial (cm);Medida Final (cm);Diferença (cm)`);
  if (report.measurementsComparison.length > 0) {
    report.measurementsComparison.forEach(m => {
      const init = m.initialVal !== undefined ? m.initialVal : 'Não medido';
      const fin = m.finalVal !== undefined ? m.finalVal : 'Não medido';
      const diffStr = m.diff !== undefined ? (m.diff > 0 ? `+${m.diff}` : `${m.diff}`) : '—';
      lines.push(`${m.name};${init};${fin};${diffStr}`);
    });
  } else {
    lines.push(`Nenhuma medida registrada no período;;;`);
  }
  lines.push(``);

  // Milestones section
  lines.push(`MARCOS E CONQUISTAS ALCANÇADOS NO PERÍODO`);
  lines.push(`Data;Título da Conquista;Descrição;Valor Registrado`);
  if (report.milestonesInPeriod.length > 0) {
    report.milestonesInPeriod.forEach(ms => {
      lines.push(`${formatDateBR(ms.date)};${ms.title};${ms.description};${ms.valueLabel || ''}`);
    });
  } else {
    lines.push(`Nenhum marco alcançado no período;;;`);
  }

  // Generate downloadable file with UTF-8 BOM
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `relatorio_evolucao_${report.startDate}_a_${report.endDate}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
