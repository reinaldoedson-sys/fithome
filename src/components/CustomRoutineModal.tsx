import React, { useState } from 'react';
import { RoutineTemplate, MuscleGroup, HomeEquipment } from '../types/workout';
import { EXERCISES, MUSCLE_LABELS, HOME_EQUIPMENT_LABELS } from '../data/exercises';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Clock,
  VolumeX,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';

interface CustomRoutineModalProps {
  initialRoutine?: RoutineTemplate | null;
  onSave: (routine: RoutineTemplate) => void;
  onClose: () => void;
}

interface RoutineExerciseItem {
  exerciseId: string;
  defaultSets: number;
  defaultTarget: number;
}

export const CustomRoutineModal: React.FC<CustomRoutineModalProps> = ({
  initialRoutine,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(initialRoutine?.name || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(initialRoutine?.durationMinutes || 25);
  const [apartmentFriendly, setApartmentFriendly] = useState(initialRoutine?.apartmentFriendly || false);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExerciseItem[]>(
    initialRoutine?.exercises || [
      { exerciseId: 'pushup_standard', defaultSets: 3, defaultTarget: 12 },
      { exerciseId: 'squat_bodyweight', defaultSets: 3, defaultTarget: 15 },
      { exerciseId: 'plank_floor', defaultSets: 3, defaultTarget: 45 }
    ]
  );

  const [searchExercise, setSearchExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter exercises to add
  const availableExercises = EXERCISES.filter(ex => {
    const matchesSearch =
      ex.namePt.toLowerCase().includes(searchExercise.toLowerCase()) ||
      ex.name.toLowerCase().includes(searchExercise.toLowerCase());
    const matchesMuscle =
      selectedCategory === 'all' || ex.primaryMuscle === selectedCategory;
    return matchesSearch && matchesMuscle;
  });

  const handleAddExercise = (exerciseId: string) => {
    const exMeta = EXERCISES.find(e => e.id === exerciseId);
    if (!exMeta) return;

    const defaultTarget = exMeta.measurementType === 'seconds' ? 45 : 12;
    setSelectedExercises(prev => [...prev, { exerciseId, defaultSets: 3, defaultTarget }]);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedExercises(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedExercises.length - 1) return;
    setSelectedExercises(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleUpdateItem = (
    index: number,
    field: 'defaultSets' | 'defaultTarget',
    val: number
  ) => {
    const clamped = Math.max(1, Math.min(999, val || 1));
    setSelectedExercises(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: clamped };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Por favor, informe um nome para a sua rotina.');
      return;
    }

    if (selectedExercises.length === 0) {
      setErrorMsg('Adicione pelo menos 1 exercício à rotina.');
      return;
    }

    // Automatically derive targetMuscles and equipmentNeeded from exercises
    const musclesSet = new Set<MuscleGroup>();
    const equipmentSet = new Set<HomeEquipment>();

    selectedExercises.forEach(item => {
      const meta = EXERCISES.find(e => e.id === item.exerciseId);
      if (meta) {
        musclesSet.add(meta.primaryMuscle);
        meta.secondaryMuscles.forEach(m => musclesSet.add(m));
        equipmentSet.add(meta.equipment);
      }
    });

    const nowIso = new Date().toISOString();

    const routineToSave: RoutineTemplate = {
      id: initialRoutine?.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim() || 'Rotina personalizada criada pelo usuário',
      targetMuscles: Array.from(musclesSet),
      equipmentNeeded: Array.from(equipmentSet),
      durationMinutes: Math.max(5, durationMinutes),
      apartmentFriendly,
      exercises: selectedExercises,
      isCustom: true,
      createdAt: initialRoutine?.createdAt || nowIso,
      updatedAt: nowIso
    };

    onSave(routineToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {initialRoutine ? 'Editar Rotina Personalizada' : 'Criar Nova Rotina de Treino'}
              </h3>
              <p className="text-xs text-slate-400">Monte um treino customizado com seus exercícios favoritos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Routine Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nome da Rotina *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Ex: Treino A - Peito e Braços em Casa"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Descrição ou Dicas do Treino
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Foco em sobrecarga progressiva com mochila e flexões"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Duração Estimada (minutos)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none pl-9 transition-colors"
                  />
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={apartmentFriendly}
                    onChange={e => setApartmentFriendly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                  <span className="flex items-center gap-1.5">
                    <VolumeX className="w-4 h-4 text-emerald-400" />
                    <span>Silencioso (Sem barulho / apartamento)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Exercises Section */}
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Exercícios da Rotina</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    {selectedExercises.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">Defina a ordem, séries e metas de repetições/tempo</p>
              </div>
            </div>

            {/* List of Chosen Exercises */}
            <div className="space-y-2">
              {selectedExercises.map((item, idx) => {
                const meta = EXERCISES.find(e => e.id === item.exerciseId);
                const isSeconds = meta?.measurementType === 'seconds';

                return (
                  <div
                    key={`${item.exerciseId}-${idx}`}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === selectedExercises.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                          {meta?.namePt || item.exerciseId}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate">
                          {meta ? MUSCLE_LABELS[meta.primaryMuscle]?.pt : ''} · {meta ? HOME_EQUIPMENT_LABELS[meta.equipment]?.pt : ''}
                        </p>
                      </div>
                    </div>

                    {/* Sets & Target Inputs */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <label className="text-slate-400">Séries:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={item.defaultSets}
                          onChange={e => handleUpdateItem(idx, 'defaultSets', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-xs text-slate-100"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <label className="text-slate-400">{isSeconds ? 'Segundos:' : 'Reps:'}</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={item.defaultTarget}
                          onChange={e => handleUpdateItem(idx, 'defaultTarget', Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-xs text-slate-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remover exercício"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Exercise Selector Box */}
            <div className="p-3.5 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                + Adicionar Exercício ao Treino:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchExercise}
                    onChange={e => setSearchExercise(e.target.value)}
                    placeholder="Buscar por nome..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todos os Músculos</option>
                  {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.pt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Exercise Chips to Add */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {availableExercises.slice(0, 15).map(ex => {
                  const isAlreadyAdded = selectedExercises.some(se => se.exerciseId === ex.id);

                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2 bg-slate-900/80 hover:bg-slate-850 rounded-lg text-xs transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-slate-200 block truncate">{ex.namePt}</span>
                        <span className="text-[10px] text-slate-400">
                          {MUSCLE_LABELS[ex.primaryMuscle]?.pt} · {HOME_EQUIPMENT_LABELS[ex.equipment]?.pt}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddExercise(ex.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 ${
                          isAlreadyAdded
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialRoutine ? 'Salvar Alterações' : 'Criar Rotina'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
