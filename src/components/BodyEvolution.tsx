import React, { useState, useMemo } from 'react';
import {
  WeightEntry,
  MeasurementEntry,
  BodyGoal,
  ProgressPhoto,
  MEASUREMENT_LABELS,
  MeasurementKey
} from '../types/bodyEvolution';
import {
  parseLocalDate,
  formatDateBR,
  formatDateShort,
  getPeriodCutoffDate,
  getTodayDateString
} from '../utils/bodyDateUtils';
import { calculateBmi } from '../utils/bmiUtils';
import { deriveProgressMilestones } from '../utils/milestonesUtils';
import { generateEvolutionReport, exportReportToCsv } from '../utils/reportUtils';
import { WeightFormModal } from './WeightFormModal';
import { MeasurementsFormModal } from './MeasurementsFormModal';
import { GoalModal } from './GoalModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import { PhotoCompareModal } from './PhotoCompareModal';
import {
  Scale,
  Ruler,
  Target,
  Camera,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Trash2,
  Edit2,
  ArrowLeftRight,
  CheckCircle2,
  Award,
  FileText,
  Printer,
  Download,
  Activity,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface BodyEvolutionProps {
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  goal: BodyGoal;
  photos: ProgressPhoto[];
  onSaveWeight: (entry: Omit<WeightEntry, 'id' | 'createdAt'>, existingId?: string) => void;
  onDeleteWeight: (id: string) => void;
  onSaveMeasurement: (entry: Omit<MeasurementEntry, 'id' | 'createdAt'>, existingId?: string) => void;
  onDeleteMeasurement: (id: string) => void;
  onSaveGoal: (goal: BodyGoal) => void;
  onSavePhoto: (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => void;
  onDeletePhoto: (id: string) => void;
}

export const BodyEvolution: React.FC<BodyEvolutionProps> = ({
  weights,
  measurements,
  goal,
  photos,
  onSaveWeight,
  onDeleteWeight,
  onSaveMeasurement,
  onDeleteMeasurement,
  onSaveGoal,
  onSavePhoto,
  onDeletePhoto
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'resumo' | 'graficos' | 'imc' | 'marcos' | 'relatorios' | 'comparacao' | 'historico' | 'fotos'
  >('resumo');

  // Modal triggers
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);

  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementEntry | null>(null);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [showPhotoCompareModal, setShowPhotoCompareModal] = useState(false);

  // Chart filters
  const [weightPeriod, setWeightPeriod] = useState<'30d' | '3m' | '6m' | '1y' | 'all'>('all');
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState<MeasurementKey>('cintura');

  // Timeline filter
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'weight' | 'measurements'>('all');

  // --- SORTED WEIGHTS CHRONOLOGICALLY ---
  const sortedWeightsAsc = useMemo(() => {
    return [...weights].sort((a, b) => {
      const timeA = parseLocalDate(a.date).getTime();
      const timeB = parseLocalDate(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [weights]);

  // Current weight: latest valid record
  const currentWeightEntry = sortedWeightsAsc[sortedWeightsAsc.length - 1];
  const currentWeight = currentWeightEntry?.weightKg;

  // Initial weight baseline
  const historicalFirstWeightEntry = sortedWeightsAsc[0];
  const baselineInitialWeight =
    goal.customInitialWeightKg !== undefined && goal.customInitialWeightKg > 0
      ? goal.customInitialWeightKg
      : historicalFirstWeightEntry?.weightKg;

  // Total weight variation from baseline
  const weightDelta =
    currentWeight !== undefined && baselineInitialWeight !== undefined
      ? Number((currentWeight - baselineInitialWeight).toFixed(2))
      : undefined;

  const weightDeltaPct =
    weightDelta !== undefined && baselineInitialWeight && baselineInitialWeight > 0
      ? Number(((weightDelta / baselineInitialWeight) * 100).toFixed(1))
      : undefined;

  // Goal progress
  const goalTarget = goal.targetWeightKg;
  let goalRemainingDelta: number | undefined = undefined;
  let goalProgressPct: number | undefined = undefined;
  let isGoalReached = false;

  if (currentWeight !== undefined && goalTarget !== undefined) {
    goalRemainingDelta = Number((currentWeight - goalTarget).toFixed(2));

    if (baselineInitialWeight !== undefined && baselineInitialWeight !== goalTarget) {
      if (goalTarget < baselineInitialWeight) {
        const totalToLose = baselineInitialWeight - goalTarget;
        const lostSoFar = baselineInitialWeight - currentWeight;
        goalProgressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
        isGoalReached = currentWeight <= goalTarget;
      } else {
        const totalToGain = goalTarget - baselineInitialWeight;
        const gainedSoFar = currentWeight - baselineInitialWeight;
        goalProgressPct = Math.min(100, Math.max(0, Math.round((gainedSoFar / totalToGain) * 100)));
        isGoalReached = currentWeight >= goalTarget;
      }
    }
  }

  // --- IMC (CURRENT & HISTORICAL) ---
  const userHeightCm = goal.heightCm;
  const currentBmiInfo = useMemo(() => {
    return calculateBmi(currentWeight, userHeightCm);
  }, [currentWeight, userHeightCm]);

  // Historical BMI data points for chart
  const historicalBmiChartData = useMemo(() => {
    if (!userHeightCm || sortedWeightsAsc.length === 0) return [];

    const dateCounts: Record<string, number> = {};
    const dateTotal: Record<string, number> = {};
    sortedWeightsAsc.forEach(w => {
      const d = w.date.split('T')[0];
      dateTotal[d] = (dateTotal[d] || 0) + 1;
    });

    return sortedWeightsAsc.map(w => {
      const d = w.date.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
      const count = dateCounts[d];
      const hasMultiple = (dateTotal[d] || 0) > 1;

      let dateFormatted = formatDateShort(w.date);
      if (hasMultiple) {
        dateFormatted = `${dateFormatted} (${count}ª)`;
      }

      const bmiResult = calculateBmi(w.weightKg, userHeightCm);

      return {
        id: w.id,
        date: w.date,
        dateFormatted,
        fullDate: formatDateBR(w.date),
        indexInDay: hasMultiple ? count : undefined,
        weightKg: w.weightKg,
        bmi: bmiResult?.bmi || 0,
        bmiLabel: bmiResult?.label || '',
        notes: w.notes
      };
    });
  }, [sortedWeightsAsc, userHeightCm]);

  // --- AUTOMATIC PROGRESS MILESTONES ---
  const sortedMeasurementsAsc = useMemo(() => {
    return [...measurements].sort((a, b) => {
      const timeA = parseLocalDate(a.date).getTime();
      const timeB = parseLocalDate(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [measurements]);

  const milestones = useMemo(() => {
    return deriveProgressMilestones(sortedWeightsAsc, sortedMeasurementsAsc, goal);
  }, [sortedWeightsAsc, sortedMeasurementsAsc, goal]);

  // --- REPORT SECTION STATE ---
  const allRecordedDates = useMemo(() => {
    const set = new Set<string>();
    weights.forEach(w => set.add(w.date.split('T')[0]));
    measurements.forEach(m => set.add(m.date.split('T')[0]));
    return Array.from(set).sort((a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime());
  }, [weights, measurements]);

  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    return allRecordedDates[0] || getTodayDateString();
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return allRecordedDates[allRecordedDates.length - 1] || getTodayDateString();
  });

  // Generated on-demand report
  const generatedReport = useMemo(() => {
    return generateEvolutionReport(
      reportStartDate,
      reportEndDate,
      sortedWeightsAsc,
      sortedMeasurementsAsc,
      goal
    );
  }, [reportStartDate, reportEndDate, sortedWeightsAsc, sortedMeasurementsAsc, goal]);

  // Shortcut period for reports
  const handleApplyReportPreset = (preset: '30d' | '90d' | 'year' | 'all') => {
    const today = getTodayDateString();
    setReportEndDate(today);

    if (preset === 'all') {
      setReportStartDate(allRecordedDates[0] || today);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setReportStartDate(d.toISOString().split('T')[0]);
    } else if (preset === '90d') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setReportStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'year') {
      const yearStart = `${new Date().getFullYear()}-01-01`;
      setReportStartDate(yearStart);
    }
  };

  // --- FILTERED WEIGHT CHART DATA ---
  const filteredWeightChartData = useMemo(() => {
    if (sortedWeightsAsc.length === 0) return [];

    const cutoffTime = getPeriodCutoffDate(weightPeriod).getTime();
    const filtered = sortedWeightsAsc.filter(
      w => parseLocalDate(w.date).getTime() >= cutoffTime
    );

    const dateCounts: Record<string, number> = {};
    const dateTotal: Record<string, number> = {};
    filtered.forEach(w => {
      const d = w.date.split('T')[0];
      dateTotal[d] = (dateTotal[d] || 0) + 1;
    });

    return filtered.map(w => {
      const d = w.date.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
      const count = dateCounts[d];
      const hasMultiple = (dateTotal[d] || 0) > 1;

      let dateFormatted = formatDateShort(w.date);
      if (hasMultiple) {
        dateFormatted = `${dateFormatted} (${count}ª)`;
      }

      return {
        id: w.id,
        date: w.date,
        dateFormatted,
        fullDate: formatDateBR(w.date),
        indexInDay: hasMultiple ? count : undefined,
        weightKg: w.weightKg,
        notes: w.notes
      };
    });
  }, [sortedWeightsAsc, weightPeriod]);

  // Available measurement keys
  const availableMeasurementKeys = useMemo(() => {
    const set = new Set<MeasurementKey>();
    measurements.forEach(m => {
      (Object.keys(m.measurements) as MeasurementKey[]).forEach(k => {
        if (m.measurements[k] !== undefined && m.measurements[k]! > 0) {
          set.add(k);
        }
      });
    });
    return Array.from(set);
  }, [measurements]);

  // Chart data for selected body region
  const measurementChartData = useMemo(() => {
    const list = sortedMeasurementsAsc
      .filter(m => m.measurements[selectedMeasurementKey] !== undefined && m.measurements[selectedMeasurementKey]! > 0)
      .map(m => ({
        id: m.id,
        date: m.date,
        dateFormatted: formatDateShort(m.date),
        fullDate: formatDateBR(m.date),
        valueCm: m.measurements[selectedMeasurementKey] as number,
        notes: m.notes
      }));
    return list;
  }, [sortedMeasurementsAsc, selectedMeasurementKey]);

  // Regional variations (initial vs latest)
  const measurementVariations = useMemo(() => {
    const results: Array<{
      key: MeasurementKey;
      name: string;
      initialVal?: number;
      initialDate?: string;
      currentVal?: number;
      currentDate?: string;
      diff?: number;
    }> = [];

    (Object.keys(MEASUREMENT_LABELS) as MeasurementKey[]).forEach(k => {
      const entriesWithMeasure = sortedMeasurementsAsc.filter(
        m => m.measurements[k] !== undefined && m.measurements[k]! > 0
      );

      if (entriesWithMeasure.length > 0) {
        const first = entriesWithMeasure[0];
        const last = entriesWithMeasure[entriesWithMeasure.length - 1];

        const initialVal = first.measurements[k];
        const currentVal = last.measurements[k];
        const diff =
          initialVal !== undefined && currentVal !== undefined
            ? Number((currentVal - initialVal).toFixed(1))
            : undefined;

        results.push({
          key: k,
          name: MEASUREMENT_LABELS[k].name,
          initialVal,
          initialDate: first.date,
          currentVal,
          currentDate: last.date,
          diff
        });
      }
    });

    return results;
  }, [sortedMeasurementsAsc]);

  // Two-date period comparison state
  const [compareDateA, setCompareDateA] = useState<string>(() => allRecordedDates[0] || '');
  const [compareDateB, setCompareDateB] = useState<string>(
    () => allRecordedDates[allRecordedDates.length - 1] || ''
  );

  React.useEffect(() => {
    if (allRecordedDates.length > 0) {
      if (!compareDateA || !allRecordedDates.includes(compareDateA)) {
        setCompareDateA(allRecordedDates[0]);
      }
      if (!compareDateB || !allRecordedDates.includes(compareDateB)) {
        setCompareDateB(allRecordedDates[allRecordedDates.length - 1]);
      }
    }
  }, [allRecordedDates]);

  const periodComparisonData = useMemo(() => {
    if (!compareDateA || !compareDateB) return null;

    const weightsA = sortedWeightsAsc.filter(w => w.date.split('T')[0] === compareDateA);
    const weightEntryA = weightsA[weightsA.length - 1];

    const weightsB = sortedWeightsAsc.filter(w => w.date.split('T')[0] === compareDateB);
    const weightEntryB = weightsB[weightsB.length - 1];

    let weightDeltaComp: number | undefined = undefined;
    let weightDeltaCompPct: number | undefined = undefined;

    if (weightEntryA && weightEntryB) {
      weightDeltaComp = Number((weightEntryB.weightKg - weightEntryA.weightKg).toFixed(2));
      if (weightEntryA.weightKg > 0) {
        weightDeltaCompPct = Number(((weightDeltaComp / weightEntryA.weightKg) * 100).toFixed(1));
      }
    }

    const measureEntryA = sortedMeasurementsAsc
      .filter(m => m.date.split('T')[0] === compareDateA)
      .slice(-1)[0];
    const measureEntryB = sortedMeasurementsAsc
      .filter(m => m.date.split('T')[0] === compareDateB)
      .slice(-1)[0];

    const regionsComparison: Array<{
      key: MeasurementKey;
      name: string;
      valA?: number;
      valB?: number;
      diff?: number;
    }> = [];

    (Object.keys(MEASUREMENT_LABELS) as MeasurementKey[]).forEach(k => {
      const valA = measureEntryA?.measurements?.[k];
      const valB = measureEntryB?.measurements?.[k];

      if (valA !== undefined || valB !== undefined) {
        const diff =
          valA !== undefined && valB !== undefined
            ? Number((valB - valA).toFixed(1))
            : undefined;

        regionsComparison.push({
          key: k,
          name: MEASUREMENT_LABELS[k].name,
          valA,
          valB,
          diff
        });
      }
    });

    return {
      dateA: compareDateA,
      dateB: compareDateB,
      weightA: weightEntryA?.weightKg,
      weightB: weightEntryB?.weightKg,
      weightDeltaComp,
      weightDeltaCompPct,
      regionsComparison
    };
  }, [compareDateA, compareDateB, sortedWeightsAsc, sortedMeasurementsAsc]);

  // Unified timeline
  const unifiedTimeline = useMemo(() => {
    interface TimelineItem {
      id: string;
      date: string;
      createdAt: string;
      type: 'weight' | 'measurement';
      weightEntry?: WeightEntry;
      measurementEntry?: MeasurementEntry;
    }

    const items: TimelineItem[] = [];

    if (timelineFilter === 'all' || timelineFilter === 'weight') {
      weights.forEach(w => {
        items.push({
          id: `w-${w.id}`,
          date: w.date,
          createdAt: w.createdAt,
          type: 'weight',
          weightEntry: w
        });
      });
    }

    if (timelineFilter === 'all' || timelineFilter === 'measurements') {
      measurements.forEach(m => {
        items.push({
          id: `m-${m.id}`,
          date: m.date,
          createdAt: m.createdAt,
          type: 'measurement',
          measurementEntry: m
        });
      });
    }

    return items.sort((a, b) => {
      const timeA = parseLocalDate(a.date).getTime();
      const timeB = parseLocalDate(b.date).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [weights, measurements, timelineFilter]);

  const isCompletelyEmpty = weights.length === 0 && measurements.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Evolução Corporal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe peso, medidas corporais, IMC, marcos de conquista e relatórios completos.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingWeight(null);
              setShowWeightModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Peso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMeasurement(null);
              setShowMeasurementsModal(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registrar Medidas</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Ajustar Metas e Altura"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Metas & Altura</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPhotoUploadModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Adicionar Foto de Evolução"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Foto</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-full overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab('resumo')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'resumo'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Resumo Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('graficos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'graficos'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Gráficos
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('imc')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'imc'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>IMC & Saúde</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('marcos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'marcos'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3 h-3" />
          <span>Marcos ({milestones.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('relatorios')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'relatorios'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Relatórios</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('comparacao')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'comparacao'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-3 h-3" />
          <span>Comparar Datas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('historico')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'historico'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Histórico ({weights.length + measurements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('fotos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'fotos'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Fotos</span>
          {photos.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-emerald-300 font-bold tabular-nums">
              {photos.length}
            </span>
          )}
        </button>
      </div>

      {/* EMPTY STATE */}
      {isCompletelyEmpty ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-8 max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <Scale className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Nenhum registro de evolução corporal cadastrado
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
            Comece registrando o seu peso de hoje ou suas circunferências corporais (cintura, abdômen, tórax, braços). Seus dados ficam salvos de forma segura e sincronizados.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditingWeight(null);
                setShowWeightModal(true);
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Meu Primeiro Peso</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingMeasurement(null);
                setShowMeasurementsModal(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Registrar Medidas</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: RESUMO GERAL */}
          {activeSubTab === 'resumo' && (
            <div className="space-y-6">
              {/* Highlight KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Peso Atual */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Peso Atual</span>
                    <Scale className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="my-1">
                    {currentWeight !== undefined ? (
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tabular-nums">
                        {currentWeight} <span className="text-sm font-normal text-slate-400">kg</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sem pesagem</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                    <span>
                      {currentWeightEntry ? `Último: ${formatDateBR(currentWeightEntry.date)}` : 'Nenhum'}
                    </span>
                  </div>
                </div>

                {/* 2. Peso Inicial */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Peso Inicial</span>
                    <span className="text-[10px] text-slate-500">
                      {goal.customInitialWeightKg ? 'Definido' : 'Histórico'}
                    </span>
                  </div>
                  <div className="my-1">
                    {baselineInitialWeight !== undefined ? (
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-display tabular-nums">
                        {baselineInitialWeight} <span className="text-sm font-normal text-slate-400">kg</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sem registro inicial</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-1">
                    {historicalFirstWeightEntry ? `Desde ${formatDateBR(historicalFirstWeightEntry.date)}` : 'Ponto de partida'}
                  </div>
                </div>

                {/* 3. Variação Total */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Variação Total</span>
                    {weightDelta !== undefined ? (
                      weightDelta < 0 ? (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      ) : weightDelta > 0 ? (
                        <TrendingUp className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-400" />
                      )
                    ) : null}
                  </div>
                  <div className="my-1">
                    {weightDelta !== undefined ? (
                      <div className="text-2xl sm:text-3xl font-extrabold font-display tabular-nums text-slate-100">
                        {weightDelta > 0 ? `+${weightDelta}` : weightDelta} <span className="text-sm font-normal text-slate-400">kg</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Aguardando dados</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {weightDelta !== undefined && weightDeltaPct !== undefined ? (
                      <span>
                        {weightDelta < 0 ? 'Redução de ' : weightDelta > 0 ? 'Aumento de ' : 'Estável ('}
                        <strong className="text-slate-200">{Math.abs(weightDeltaPct)}%</strong>
                      </span>
                    ) : (
                      <span>Variação vs ponto inicial</span>
                    )}
                  </div>
                </div>

                {/* 4. Meta de Peso */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Meta de Peso</span>
                    <button
                      type="button"
                      onClick={() => setShowGoalModal(true)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Ajustar
                    </button>
                  </div>
                  <div className="my-1">
                    {goalTarget !== undefined ? (
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tabular-nums">
                        {goalTarget} <span className="text-sm font-normal text-slate-400">kg</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowGoalModal(true)}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        + Cadastrar meta
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {goalRemainingDelta !== undefined ? (
                      isGoalReached ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Meta alcançada!
                        </span>
                      ) : (
                        <span>
                          Faltam <strong className="text-slate-200">{Math.abs(goalRemainingDelta)} kg</strong>
                        </span>
                      )
                    ) : (
                      <span>{goal.targetDate ? `Até ${formatDateBR(goal.targetDate)}` : 'Sem prazo'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Goal Progress Banner */}
              {goalTarget !== undefined && goalProgressPct !== undefined && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Progresso em Direção à Meta ({goalTarget} kg)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">
                      {goalProgressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${goalProgressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Início: {baselineInitialWeight} kg</span>
                    <span>Atual: {currentWeight} kg</span>
                    <span>Meta: {goalTarget} kg</span>
                  </div>
                </div>
              )}

              {/* BMI Summary Teaser Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-100">
                        Índice de Massa Corporal (IMC)
                      </h3>
                      {currentBmiInfo && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${currentBmiInfo.color}`}>
                          {currentBmiInfo.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentBmiInfo
                        ? `IMC Atual: ${currentBmiInfo.bmi} kg/m² para estatura de ${userHeightCm} cm.`
                        : 'Cadastre sua altura para habilitar o cálculo automático do IMC e faixas de peso saudáveis.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {currentBmiInfo ? (
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('imc')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>Ver Análise de IMC</span> →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowGoalModal(true)}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Cadastrar Altura</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Glance Weight Chart */}
              {filteredWeightChartData.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100">
                        Tendência Recente de Peso
                      </h3>
                      <p className="text-xs text-slate-400">
                        {filteredWeightChartData.length} registros cadastrados
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('graficos')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Abrir Gráficos Detalhados →
                    </button>
                  </div>

                  <div className="w-full h-56 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={filteredWeightChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="dateFormatted"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                                  <div className="font-semibold text-slate-300 mb-1">
                                    {d.fullDate} {d.indexInDay ? `(${d.indexInDay}ª pesagem)` : ''}
                                  </div>
                                  <div className="text-base font-extrabold text-emerald-400 font-display tabular-nums">
                                    {d.weightKg} kg
                                  </div>
                                  {d.notes && <p className="text-[10px] text-slate-400 mt-1">{d.notes}</p>}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weightKg"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#10b981', stroke: '#022c22', strokeWidth: 1.5 }}
                          activeDot={{ r: 6, fill: '#34d399', stroke: '#022c22', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Regional Measurements Delta Table */}
              {measurementVariations.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        Variação de Medidas Corporais (Início vs Atual)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Diferença em centímetros comparando o primeiro e o mais recente registro de cada região corporal.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {measurementVariations.map(m => {
                      const diff = m.diff;
                      return (
                        <div
                          key={m.key}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-200">
                              {m.name}
                            </span>
                            {diff !== undefined && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                                  diff < 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : diff > 0
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff} cm
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Inicial:</span>
                              <span className="font-semibold text-slate-300 tabular-nums">
                                {m.initialVal} cm
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">Atual:</span>
                              <span className="font-bold text-slate-100 tabular-nums">
                                {m.currentVal} cm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRÁFICOS INTERATIVOS */}
          {activeSubTab === 'graficos' && (
            <div className="space-y-6">
              {/* Gráfico 1 — Evolução do Peso */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-400" />
                      <span>Gráfico 1: Evolução do Peso Corporal</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Histórico completo de pesagem com filtros de período e escala dinâmica.
                    </p>
                  </div>

                  {/* Period filter buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl self-start sm:self-auto overflow-x-auto">
                    {[
                      { key: '30d' as const, label: '30 dias' },
                      { key: '3m' as const, label: '3 meses' },
                      { key: '6m' as const, label: '6 meses' },
                      { key: '1y' as const, label: '1 ano' },
                      { key: 'all' as const, label: 'Tudo' }
                    ].map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setWeightPeriod(p.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          weightPeriod === p.key
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredWeightChartData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Nenhum registro de peso no período selecionado.
                  </div>
                ) : (
                  <div className="w-full h-72 sm:h-80 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={filteredWeightChartData}
                        margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#334155" strokeDasharray="4 4" opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="dateFormatted"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickFormatter={val => `${val} kg`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                                  <div className="font-bold text-slate-200 mb-1">
                                    {d.fullDate} {d.indexInDay ? `(${d.indexInDay}ª pesagem do dia)` : ''}
                                  </div>
                                  <div className="text-lg font-extrabold text-emerald-400 font-display tabular-nums">
                                    {d.weightKg} kg
                                  </div>
                                  {d.notes && (
                                    <p className="text-[11px] text-slate-400 mt-1.5 italic max-w-xs">
                                      “{d.notes}”
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weightKg"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4.5, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#34d399', stroke: '#022c22', strokeWidth: 2.5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfico 2 — Evolução das Medidas Corporais */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-emerald-400" />
                      <span>Gráfico 2: Evolução das Medidas Corporais</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selecione uma região específica para visualizar a progressão em centímetros (cm).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-medium">Região:</label>
                    <select
                      value={selectedMeasurementKey}
                      onChange={e => setSelectedMeasurementKey(e.target.value as MeasurementKey)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {(availableMeasurementKeys.length > 0
                        ? availableMeasurementKeys
                        : (Object.keys(MEASUREMENT_LABELS) as MeasurementKey[])
                      ).map(k => (
                        <option key={k} value={k}>
                          {MEASUREMENT_LABELS[k].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {measurementChartData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Nenhum registro encontrado para {MEASUREMENT_LABELS[selectedMeasurementKey].name}.
                  </div>
                ) : (
                  <div className="w-full h-72 sm:h-80 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={measurementChartData}
                        margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#334155" strokeDasharray="4 4" opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="dateFormatted"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickFormatter={val => `${val} cm`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                                  <div className="font-bold text-slate-200 mb-1">{d.fullDate}</div>
                                  <div className="text-slate-400 text-[11px] mb-0.5">
                                    {MEASUREMENT_LABELS[selectedMeasurementKey].name}:
                                  </div>
                                  <div className="text-lg font-extrabold text-sky-400 font-display tabular-nums">
                                    {d.valueCm} cm
                                  </div>
                                  {d.notes && (
                                    <p className="text-[11px] text-slate-400 mt-1.5 italic max-w-xs">
                                      “{d.notes}”
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="valueCm"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          dot={{ r: 4.5, fill: '#38bdf8', stroke: '#082f49', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#7dd3fc', stroke: '#082f49', strokeWidth: 2.5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: IMC & SAÚDE */}
          {activeSubTab === 'imc' && (
            <div className="space-y-6">
              {!userHeightCm ? (
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-sm">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2">
                    Altura Não Cadastrada
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                    Para calcular o Índice de Massa Corporal (IMC) e exibir as faixas de peso saudáveis da OMS, informe sua estatura nas configurações de meta.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(true)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Cadastrar Minha Altura</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Current BMI Card & Reference Scales */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: BMI Gauge / Value */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="font-semibold uppercase tracking-wider">IMC Atual</span>
                          <span className="text-slate-500">Altura: {userHeightCm} cm</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl sm:text-5xl font-black text-slate-100 font-display tabular-nums">
                            {currentBmiInfo?.bmi}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">kg/m²</span>
                        </div>
                        {currentBmiInfo && (
                          <div className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border mb-3 ${currentBmiInfo.color}`}>
                            {currentBmiInfo.label}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          {currentBmiInfo?.description}
                        </p>
                      </div>

                      {/* Healthy weight range info */}
                      {currentBmiInfo && (
                        <div className="pt-3 border-t border-slate-800/80 text-xs">
                          <span className="text-slate-400 block mb-1">Faixa de peso saudável para sua altura:</span>
                          <span className="font-bold text-emerald-400 tabular-nums">
                            {currentBmiInfo.healthyWeightRange.minKg} kg — {currentBmiInfo.healthyWeightRange.maxKg} kg
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: WHO Classification Reference Table */}
                    <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-200">
                          Tabela de Classificação da OMS (Adultos)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowGoalModal(true)}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Alterar Altura
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        {[
                          { range: '< 18.5', label: 'Abaixo do peso', classKey: 'abaixo_peso', color: 'text-amber-400' },
                          { range: '18.5 – 24.9', label: 'Eutrofia / Normal', classKey: 'normal', color: 'text-emerald-400' },
                          { range: '25.0 – 29.9', label: 'Sobrepeso', classKey: 'sobrepeso', color: 'text-yellow-400' },
                          { range: '30.0 – 34.9', label: 'Obesidade Grau I', classKey: 'obesidade_1', color: 'text-orange-400' },
                          { range: '35.0 – 39.9', label: 'Obesidade Grau II', classKey: 'obesidade_2', color: 'text-rose-400' },
                          { range: '≥ 40.0', label: 'Obesidade Grau III', classKey: 'obesidade_3', color: 'text-red-400' }
                        ].map(c => {
                          const isCurrent = currentBmiInfo?.classification === c.classKey;
                          return (
                            <div
                              key={c.classKey}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isCurrent
                                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${c.color.replace('text-', 'bg-')}`} />
                                <span className={`font-semibold ${isCurrent ? 'text-slate-100 font-bold' : 'text-slate-300'}`}>
                                  {c.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                    Seu IMC
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-400">{c.range}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Clinical explanation & limitations */}
                      <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Nota clínica:</strong> O IMC é um indicador populacional de triagem clínica para adultos e não deve ser tratado como diagnóstico isolado. Ele não mede diretamente a porcentagem de gordura corporal nem diferencia massa muscular hipertrofiada de adiposidade.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historical BMI Chart */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <span>Evolução Histórica do IMC</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Acompanhe a curva do seu índice de massa corporal a cada pesagem ao longo do tempo.
                      </p>
                    </div>

                    {historicalBmiChartData.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                        Nenhuma pesagem cadastrada para traçar a curva de IMC.
                      </div>
                    ) : (
                      <div className="w-full h-72 sm:h-80 select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={historicalBmiChartData}
                            margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid stroke="#334155" strokeDasharray="4 4" opacity={0.3} vertical={false} />
                            <ReferenceLine y={24.9} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Limite Normal (24.9)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                            <ReferenceLine y={18.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Limite Baixo Peso (18.5)', fill: '#f59e0b', fontSize: 10, position: 'insideBottomRight' }} />
                            <XAxis
                              dataKey="dateFormatted"
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              tickLine={false}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={val => `${val}`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                                      <div className="font-bold text-slate-200 mb-1">
                                        {d.fullDate} {d.indexInDay ? `(${d.indexInDay}ª pesagem)` : ''}
                                      </div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-black text-emerald-400 font-display tabular-nums">
                                          IMC: {d.bmi}
                                        </span>
                                        <span className="text-[10px] text-slate-400">({d.bmiLabel})</span>
                                      </div>
                                      <div className="text-slate-300 text-[11px]">
                                        Peso registrado: <strong>{d.weightKg} kg</strong>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="bmi"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ r: 4.5, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
                              activeDot={{ r: 7, fill: '#34d399', stroke: '#022c22', strokeWidth: 2.5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: MARCOS DE PROGRESSO */}
          {activeSubTab === 'marcos' && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <span>Linha do Tempo de Conquistas e Marcos</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Marcos calculados deterministicamente a partir do seu histórico de pesagens e medições.
                    </p>
                  </div>
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Ainda não há marcos suficientes registrados. Continue consistente nos treinos e registros!
                  </div>
                ) : (
                  <div className="relative pl-6 sm:pl-8 border-l border-emerald-500/30 space-y-6 ml-2 sm:ml-4 my-4">
                    {milestones.map((ms, idx) => (
                      <div key={ms.id} className="relative group">
                        {/* Milestone dot */}
                        <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>

                        {/* Milestone card */}
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <span className="font-bold text-sm text-slate-100">
                              {ms.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {ms.badge && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {ms.badge}
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-medium">
                                {formatDateBR(ms.date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {ms.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RELATÓRIOS POR PERÍODO */}
          {activeSubTab === 'relatorios' && (
            <div className="space-y-6">
              {/* Controls bar (Dates + Presets + Export buttons) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span>Gerador de Relatórios de Evolução</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selecione um intervalo de datas para gerar um sumário executivo, imprimir em PDF ou exportar CSV.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportReportToCsv(generatedReport)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                      title="Exportar para planilha CSV (compatível com Excel)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Exportar CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      title="Imprimir ou Salvar em PDF pelo navegador"
                    >
                      <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Imprimir / Salvar PDF</span>
                    </button>
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Períodos pré-definidos:</span>
                  {[
                    { key: '30d' as const, label: 'Últimos 30 dias' },
                    { key: '90d' as const, label: 'Últimos 90 dias' },
                    { key: 'year' as const, label: 'Ano Atual' },
                    { key: 'all' as const, label: 'Histórico Completo' }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleApplyReportPreset(p.key)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}

                  <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0">
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-500">até</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Printable Report Document Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 print:bg-white print:text-black print:border-none print:p-0">
                {/* Report Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-display">
                      Relatório de Evolução Corporal
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Período avaliado: <strong>{formatDateBR(generatedReport.startDate)}</strong> até <strong>{formatDateBR(generatedReport.endDate)}</strong>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>FitHome · Treinos em Casa</div>
                    <div>{generatedReport.totalWeights} pesagens · {generatedReport.totalMeasurements} sessões de medidas</div>
                  </div>
                </div>

                {/* Weight & BMI Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-500 block mb-1">Peso no Início</span>
                    <span className="text-xl font-bold text-slate-200 tabular-nums">
                      {generatedReport.initialWeight !== undefined ? `${generatedReport.initialWeight} kg` : 'Sem registro'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-500 block mb-1">Peso no Final</span>
                    <span className="text-xl font-bold text-slate-100 tabular-nums">
                      {generatedReport.finalWeight !== undefined ? `${generatedReport.finalWeight} kg` : 'Sem registro'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-500 block mb-1">Variação no Período</span>
                    <span className="text-xl font-bold text-slate-100 tabular-nums">
                      {generatedReport.weightDelta !== undefined ? (
                        <span className={generatedReport.weightDelta < 0 ? 'text-emerald-400' : 'text-sky-400'}>
                          {generatedReport.weightDelta > 0 ? `+${generatedReport.weightDelta}` : generatedReport.weightDelta} kg
                        </span>
                      ) : (
                        '—'
                      )}
                    </span>
                    {generatedReport.weightDeltaPct !== undefined && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        ({generatedReport.weightDeltaPct}%)
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-500 block mb-1">IMC (Início → Final)</span>
                    <span className="text-base font-bold text-slate-200 tabular-nums">
                      {generatedReport.initialBmi && generatedReport.finalBmi
                        ? `${generatedReport.initialBmi} → ${generatedReport.finalBmi}`
                        : generatedReport.finalBmi
                        ? `${generatedReport.finalBmi}`
                        : 'Não calculado'}
                    </span>
                    {generatedReport.finalBmiLabel && (
                      <span className="text-[10px] text-emerald-400 block mt-0.5 truncate">
                        {generatedReport.finalBmiLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Measurements Evolution Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Evolução das Medidas Corporais no Período
                  </h4>

                  {generatedReport.measurementsComparison.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                      Nenhuma medida registrada no período selecionado.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2 px-3 font-semibold">Região</th>
                            <th className="py-2 px-3 font-semibold">Medida Inicial</th>
                            <th className="py-2 px-3 font-semibold">Medida Final</th>
                            <th className="py-2 px-3 font-semibold">Diferença</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {generatedReport.measurementsComparison.map(m => (
                            <tr key={m.key} className="hover:bg-slate-950/30">
                              <td className="py-2.5 px-3 font-bold text-slate-200">{m.name}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">
                                {m.initialVal !== undefined ? `${m.initialVal} cm` : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-100 font-semibold">
                                {m.finalVal !== undefined ? `${m.finalVal} cm` : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {m.diff !== undefined ? (
                                  <span className={m.diff < 0 ? 'text-emerald-400' : m.diff > 0 ? 'text-sky-400' : 'text-slate-400'}>
                                    {m.diff > 0 ? `+${m.diff}` : m.diff} cm
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Milestones Achieved In Period */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Marcos Conquistados no Período ({generatedReport.milestonesInPeriod.length})
                  </h4>

                  {generatedReport.milestonesInPeriod.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Nenhum marco alcançado durante o intervalo de datas selecionado.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {generatedReport.milestonesInPeriod.map(ms => (
                        <div key={ms.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-200">{ms.title}</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {formatDateBR(ms.date)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{ms.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COMPARAÇÃO POR PERÍODO / DUAS DATAS */}
          {activeSubTab === 'comparacao' && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                    <span>Comparação Entre Duas Datas Específicas</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecione duas datas para comparar peso e medidas corporais lado a lado com diferenças exatas.
                  </p>
                </div>

                {allRecordedDates.length < 2 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    É necessário ter registros em pelo menos duas datas diferentes para realizar comparações.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Data 1 (Ponto de Partida / Referência)
                        </label>
                        <select
                          value={compareDateA}
                          onChange={e => setCompareDateA(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {allRecordedDates.map(d => (
                            <option key={d} value={d}>
                              {formatDateBR(d)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Data 2 (Ponto Atual / Comparação)
                        </label>
                        <select
                          value={compareDateB}
                          onChange={e => setCompareDateB(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {allRecordedDates.map(d => (
                            <option key={d} value={d}>
                              {formatDateBR(d)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {periodComparisonData && (
                      <div className="space-y-6">
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                              <Scale className="w-4 h-4 text-emerald-400" /> Comparação de Peso
                            </span>
                            {periodComparisonData.weightDeltaComp !== undefined && (
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums ${
                                  periodComparisonData.weightDeltaComp < 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : periodComparisonData.weightDeltaComp > 0
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {periodComparisonData.weightDeltaComp > 0
                                  ? `+${periodComparisonData.weightDeltaComp}`
                                  : periodComparisonData.weightDeltaComp}{' '}
                                kg ({periodComparisonData.weightDeltaCompPct}%)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                {formatDateBR(periodComparisonData.dateA)}
                              </span>
                              <span className="text-xl font-bold text-slate-100 tabular-nums">
                                {periodComparisonData.weightA !== undefined
                                  ? `${periodComparisonData.weightA} kg`
                                  : 'Sem registro'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-500 block">
                                {formatDateBR(periodComparisonData.dateB)}
                              </span>
                              <span className="text-xl font-bold text-slate-100 tabular-nums">
                                {periodComparisonData.weightB !== undefined
                                  ? `${periodComparisonData.weightB} kg`
                                  : 'Sem registro'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                            Medidas Corporais ({formatDateBR(compareDateA)} vs {formatDateBR(compareDateB)})
                          </h4>

                          {periodComparisonData.regionsComparison.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-xs">
                              Nenhuma medida registrada em nenhuma das duas datas selecionadas.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {periodComparisonData.regionsComparison.map(r => (
                                <div
                                  key={r.key}
                                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-slate-200">
                                      {r.name}
                                    </span>
                                    {r.diff !== undefined ? (
                                      <span
                                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                                          r.diff < 0
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : r.diff > 0
                                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                            : 'bg-slate-800 text-slate-400'
                                        }`}
                                      >
                                        {r.diff > 0 ? `+${r.diff}` : r.diff} cm
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">
                                        Não comparável
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block">Ponto A:</span>
                                      <span className="font-semibold text-slate-300 tabular-nums">
                                        {r.valA !== undefined ? `${r.valA} cm` : '—'}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-500 block">Ponto B:</span>
                                      <span className="font-bold text-slate-100 tabular-nums">
                                        {r.valB !== undefined ? `${r.valB} cm` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: HISTÓRICO CRONOLÓGICO */}
          {activeSubTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100">
                  Linha do Tempo dos Registros
                </h3>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Filtrar:</span>
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        timelineFilter === 'all'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('weight')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        timelineFilter === 'weight'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Apenas Peso
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('measurements')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        timelineFilter === 'measurements'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Apenas Medidas
                    </button>
                  </div>
                </div>
              </div>

              {unifiedTimeline.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
                  Nenhum registro encontrado para o filtro selecionado.
                </div>
              ) : (
                <div className="space-y-3">
                  {unifiedTimeline.map(item => {
                    if (item.type === 'weight' && item.weightEntry) {
                      const w = item.weightEntry;
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                              <Scale className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base text-slate-100 tabular-nums">
                                  {w.weightKg} kg
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  · {formatDateBR(w.date)}
                                </span>
                              </div>
                              {w.notes && (
                                <p className="text-xs text-slate-400 mt-1 italic">
                                  {w.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWeight(w);
                                setShowWeightModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Editar pesagem"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Deseja excluir a pesagem de ${w.weightKg} kg do dia ${formatDateBR(w.date)}?`
                                  )
                                ) {
                                  onDeleteWeight(w.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Excluir pesagem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === 'measurement' && item.measurementEntry) {
                      const m = item.measurementEntry;
                      const measureEntries = Object.entries(m.measurements).filter(
                        ([, v]) => v !== undefined && v > 0
                      ) as [MeasurementKey, number][];

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                                <Ruler className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-bold text-sm text-slate-100">
                                    Medidas Corporais
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    · {formatDateBR(m.date)} ({measureEntries.length} regiões)
                                  </span>
                                </div>
                                {m.notes && (
                                  <p className="text-xs text-slate-400 italic mb-2">
                                    {m.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMeasurement(m);
                                  setShowMeasurementsModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Editar medidas"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Deseja excluir as medidas do dia ${formatDateBR(m.date)}?`
                                    )
                                  ) {
                                    onDeleteMeasurement(m.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Excluir medidas"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/60">
                            {measureEntries.map(([k, val]) => (
                              <div
                                key={k}
                                className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5"
                              >
                                <span className="text-slate-400">{MEASUREMENT_LABELS[k].short}:</span>
                                <span className="font-bold text-slate-200 tabular-nums">{val} cm</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: FOTOS DE PROGRESSO */}
          {activeSubTab === 'fotos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span>Galeria de Fotos Corporais</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fotos armazenadas de forma 100% privada e local no seu navegador.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {photos.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoCompareModal(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Comparar Lado a Lado</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPhotoUploadModal(true)}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Adicionar Foto</span>
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-8">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-200 mb-1">
                    Nenhuma foto cadastrada ainda
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Tire fotos periódicas no espelho para visualizar sua transformação estética e composição corporal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPhotoUploadModal(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Adicionar Primeira Foto</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map(p => (
                    <div
                      key={p.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:border-slate-700 transition-colors"
                    >
                      <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={p.photoDataUrl}
                          alt={`Foto corporal ${p.date}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja excluir esta foto de ${formatDateBR(p.date)}?`)) {
                              onDeletePhoto(p.id);
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-all"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-200">
                            {formatDateBR(p.date)}
                          </span>
                          <span className="capitalize text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {p.category || 'Geral'}
                          </span>
                        </div>
                        {p.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- ALL MODALS --- */}
      {showWeightModal && (
        <WeightFormModal
          initialEntry={editingWeight}
          onSave={(entry, id) => {
            onSaveWeight(entry, id);
            setShowWeightModal(false);
          }}
          onDelete={id => {
            onDeleteWeight(id);
            setShowWeightModal(false);
          }}
          onClose={() => setShowWeightModal(false)}
        />
      )}

      {showMeasurementsModal && (
        <MeasurementsFormModal
          initialEntry={editingMeasurement}
          onSave={(entry, id) => {
            onSaveMeasurement(entry, id);
            setShowMeasurementsModal(false);
          }}
          onDelete={id => {
            onDeleteMeasurement(id);
            setShowMeasurementsModal(false);
          }}
          onClose={() => setShowMeasurementsModal(false)}
        />
      )}

      {showGoalModal && (
        <GoalModal
          currentGoal={goal}
          historicalFirstWeight={historicalFirstWeightEntry?.weightKg}
          onSave={updatedGoal => {
            onSaveGoal(updatedGoal);
            setShowGoalModal(false);
          }}
          onClose={() => setShowGoalModal(false)}
        />
      )}

      {showPhotoUploadModal && (
        <PhotoUploadModal
          onSave={photo => {
            onSavePhoto(photo);
            setShowPhotoUploadModal(false);
          }}
          onClose={() => setShowPhotoUploadModal(false)}
        />
      )}

      {showPhotoCompareModal && (
        <PhotoCompareModal
          photos={photos}
          onClose={() => setShowPhotoCompareModal(false)}
        />
      )}
    </div>
  );
};
