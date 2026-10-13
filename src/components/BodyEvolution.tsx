import React, { useState, useMemo } from 'react';
import {
  WeightEntry,
  MeasurementEntry,
  BodyGoal,
  ProgressPhoto,
  MEASUREMENT_LABELS,
  MeasurementKey
} from '../types/bodyEvolution';
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
  Filter,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
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
  // Active sub-section / view tab
  const [activeSubTab, setActiveSubTab] = useState<'resumo' | 'graficos' | 'historico' | 'fotos'>('resumo');

  // Modals state
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

  // Helper date formatter DD/MM/YYYY
  const formatDateBR = (isoDate: string) => {
    try {
      const parts = isoDate.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const formatDateShort = (isoDate: string) => {
    try {
      const parts = isoDate.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  // --- WEIGHT CALCULATIONS ---
  // Sorted chronologically (oldest to newest)
  const sortedWeightsAsc = useMemo(() => {
    return [...weights].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [weights]);

  // Current weight: most recent record
  const currentWeightEntry = sortedWeightsAsc[sortedWeightsAsc.length - 1];
  const currentWeight = currentWeightEntry?.weightKg;

  // Initial weight: first historical record OR custom reference baseline set in goals
  const historicalFirstWeightEntry = sortedWeightsAsc[0];
  const baselineInitialWeight =
    goal.customInitialWeightKg !== undefined && goal.customInitialWeightKg > 0
      ? goal.customInitialWeightKg
      : historicalFirstWeightEntry?.weightKg;

  // Weight variation
  const weightDelta =
    currentWeight !== undefined && baselineInitialWeight !== undefined
      ? Number((currentWeight - baselineInitialWeight).toFixed(2))
      : undefined;

  const weightDeltaPct =
    weightDelta !== undefined && baselineInitialWeight && baselineInitialWeight > 0
      ? Number(((weightDelta / baselineInitialWeight) * 100).toFixed(1))
      : undefined;

  // Goal progress calculation
  const goalTarget = goal.targetWeightKg;
  let goalRemainingDelta: number | undefined = undefined;
  let goalProgressPct: number | undefined = undefined;
  let isGoalReached = false;

  if (currentWeight !== undefined && goalTarget !== undefined) {
    goalRemainingDelta = Number((currentWeight - goalTarget).toFixed(2));

    if (baselineInitialWeight !== undefined && baselineInitialWeight !== goalTarget) {
      if (goalTarget < baselineInitialWeight) {
        // Goal is losing weight
        const totalToLose = baselineInitialWeight - goalTarget;
        const lostSoFar = baselineInitialWeight - currentWeight;
        goalProgressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
        isGoalReached = currentWeight <= goalTarget;
      } else {
        // Goal is gaining weight
        const totalToGain = goalTarget - baselineInitialWeight;
        const gainedSoFar = currentWeight - baselineInitialWeight;
        goalProgressPct = Math.min(100, Math.max(0, Math.round((gainedSoFar / totalToGain) * 100)));
        isGoalReached = currentWeight >= goalTarget;
      }
    }
  }

  // --- FILTERED WEIGHT CHART DATA ---
  const filteredWeightChartData = useMemo(() => {
    if (sortedWeightsAsc.length === 0) return [];

    const nowTime = new Date().getTime();
    const cutoffMap = {
      '30d': nowTime - 30 * 24 * 60 * 60 * 1000,
      '3m': nowTime - 90 * 24 * 60 * 60 * 1000,
      '6m': nowTime - 180 * 24 * 60 * 60 * 1000,
      '1y': nowTime - 365 * 24 * 60 * 60 * 1000,
      'all': 0
    };

    const cutoff = cutoffMap[weightPeriod];
    const filtered = sortedWeightsAsc.filter(w => new Date(w.date).getTime() >= cutoff);

    return filtered.map(w => ({
      id: w.id,
      date: w.date,
      dateFormatted: formatDateShort(w.date),
      fullDate: formatDateBR(w.date),
      weightKg: w.weightKg,
      notes: w.notes
    }));
  }, [sortedWeightsAsc, weightPeriod]);

  // --- BODY MEASUREMENTS SORTED & CHART DATA ---
  const sortedMeasurementsAsc = useMemo(() => {
    return [...measurements].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [measurements]);

  // Chart data for selected measurement region
  const measurementChartData = useMemo(() => {
    const list = sortedMeasurementsAsc
      .filter(m => m.measurements[selectedMeasurementKey] !== undefined)
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

  // Regional measurements comparison (first vs latest for every body part)
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
        m => m.measurements[k] !== undefined
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

  // Available measurement keys that have at least one record
  const availableMeasurementKeys = useMemo(() => {
    const set = new Set<MeasurementKey>();
    measurements.forEach(m => {
      (Object.keys(m.measurements) as MeasurementKey[]).forEach(k => {
        if (m.measurements[k] !== undefined) set.add(k);
      });
    });
    return Array.from(set);
  }, [measurements]);

  // --- UNIFIED CHRONOLOGICAL TIMELINE ---
  const unifiedTimeline = useMemo(() => {
    interface TimelineItem {
      id: string;
      date: string;
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
          type: 'measurement',
          measurementEntry: m
        });
      });
    }

    // Sort descending (latest first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weights, measurements, timelineFilter]);

  // Is completely empty?
  const isCompletelyEmpty = weights.length === 0 && measurements.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Evolução Corporal & Medidas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe a evolução do seu peso, circunferências corporais e metas físicas ao longo do tempo.
          </p>
        </div>

        {/* Primary Action Buttons */}
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
            title="Configurar Metas"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Metas</span>
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
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('resumo')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'graficos'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Gráficos Interativos
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('historico')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'fotos'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Fotos de Progresso</span>
          {photos.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-emerald-300 font-bold tabular-nums">
              {photos.length}
            </span>
          )}
        </button>
      </div>

      {/* EMPTY STATE (When no records exist yet) */}
      {isCompletelyEmpty ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-8 max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <Scale className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Nenhum registro de evolução corporal cadastrado
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
            Comece registrando o seu peso de hoje ou suas circunferências corporais (cintura, braço, tórax). Todas as medições são salvas com segurança no seu navegador para você acompanhar sua evolução.
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
          {/* TAB 1: RESUMO DA EVOLUÇÃO */}
          {activeSubTab === 'resumo' && (
            <div className="space-y-6">
              {/* Summary KPI Cards Grid */}
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
                      <span className="text-xs text-slate-500">Sem registros</span>
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
                    {historicalFirstWeightEntry ? `Desde ${formatDateBR(historicalFirstWeightEntry.date)}` : 'Base de cálculo'}
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
                      <span className="text-xs text-slate-500">Aguardando mais dados</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {weightDelta !== undefined && weightDeltaPct !== undefined ? (
                      <span>
                        {weightDelta < 0 ? 'Perda de ' : weightDelta > 0 ? 'Ganho de ' : 'Estável ('}
                        <strong className="text-slate-200">{Math.abs(weightDeltaPct)}%</strong>
                      </span>
                    ) : (
                      <span>Variação em relação ao inicial</span>
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
                          <CheckCircle2 className="w-3 h-3" /> Meta atingida!
                        </span>
                      ) : (
                        <span>
                          Faltam <strong className="text-slate-200">{Math.abs(goalRemainingDelta)} kg</strong>
                        </span>
                      )
                    ) : (
                      <span>{goal.targetDate ? `Até ${formatDateBR(goal.targetDate)}` : 'Sem prazo definido'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Goal Progress Banner (if goal is configured) */}
              {goalTarget !== undefined && goalProgressPct !== undefined && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Progresso da Meta de Peso ({goalTarget} kg)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">
                      {goalProgressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
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

              {/* Mini Weight Chart Quick Glance */}
              {filteredWeightChartData.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100">
                        Histórico Rápido de Peso
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
                      Ver Gráficos Detalhados →
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
                                  <div className="font-semibold text-slate-300 mb-1">{d.fullDate}</div>
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

              {/* Regional Measurements Delta Table (Gráfico 3 — Variação das medidas) */}
              {measurementVariations.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        Variação de Medidas Corporais (Início vs Atual)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Diferença em centímetros comparando o primeiro e o mais recente registro de cada região.
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
                      Curva histórica de pesagem em quilogramas (kg) ao longo do tempo.
                    </p>
                  </div>

                  {/* Period filter buttons: 30d, 3m, 6m, 1y, all */}
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
                  <div className="text-center py-12 text-slate-500 text-xs">
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
                                  <div className="font-bold text-slate-200 mb-1">{d.fullDate}</div>
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

                  {/* Body Region Selector Dropdown */}
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
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Nenhum registro encontrado para {MEASUREMENT_LABELS[selectedMeasurementKey].name}. Preencha esta medida ao registrar suas circunferências.
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

          {/* TAB 3: HISTÓRICO CRONOLÓGICO */}
          {activeSubTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100">
                  Linha do Tempo dos Registros
                </h3>

                {/* Filter by Type */}
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
                                if (confirm(`Deseja excluir a pesagem de ${w.weightKg} kg do dia ${formatDateBR(w.date)}?`)) {
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
                        ([, v]) => v !== undefined
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
                                  if (confirm(`Deseja excluir as medidas do dia ${formatDateBR(m.date)}?`)) {
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

                          {/* Pill badges with filled measurements */}
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

          {/* TAB 4: FOTOS DE PROGRESSO */}
          {activeSubTab === 'fotos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span>Galeria de Fotos Corporais</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fotos salvas 100% no seu navegador de forma privada e segura.
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
