import React, { useState } from 'react';
import { Exercise, MuscleGroup, HomeEquipment } from '../types/workout';
import { EXERCISES, MUSCLE_LABELS, HOME_EQUIPMENT_LABELS } from '../data/exercises';
import { BodyMap } from './BodyMap';
import {
  Search,
  Filter,
  Dumbbell,
  Info,
  X,
  Play,
  VolumeX,
  Clock,
  Repeat
} from 'lucide-react';

interface ExerciseLibraryProps {
  onStartWithExercise: (exercise: Exercise) => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onStartWithExercise
}) => {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<HomeEquipment | 'all'>('all');
  const [apartmentOnly, setApartmentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);
  const [showBodyMap, setShowBodyMap] = useState(true);

  const handleToggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  const handleClearMuscles = () => {
    setSelectedMuscles([]);
  };

  const filteredExercises = EXERCISES.filter(ex => {
    // Muscle filter
    if (selectedMuscles.length > 0) {
      const matchesMuscle =
        selectedMuscles.includes(ex.primaryMuscle) ||
        ex.secondaryMuscles.some(sm => selectedMuscles.includes(sm));
      if (!matchesMuscle) return false;
    }

    // Equipment filter
    if (selectedEquipment !== 'all' && ex.equipment !== selectedEquipment) {
      return false;
    }

    // Apartment friendly filter
    if (apartmentOnly && !ex.apartmentFriendly) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ex.namePt.toLowerCase().includes(q) || ex.name.toLowerCase().includes(q);
      const matchMuscle = MUSCLE_LABELS[ex.primaryMuscle].pt.toLowerCase().includes(q);
      const matchEq = HOME_EQUIPMENT_LABELS[ex.equipment].pt.toLowerCase().includes(q);
      if (!matchName && !matchMuscle && !matchEq) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Body Map toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Exercícios em Casa & Mapa Muscular
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Toque nos músculos do corpo humano para encontrar exercícios usando peso corporal, sofá, cadeira ou toalha.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBodyMap(v => !v)}
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showBodyMap ? 'Ocultar Mapa Corporal' : 'Exibir Mapa Corporal'}</span>
        </button>
      </div>

      {/* Anatomical Body Map Component */}
      {showBodyMap && (
        <BodyMap
          selectedMuscles={selectedMuscles}
          onToggleMuscle={handleToggleMuscle}
          onClearSelection={handleClearMuscles}
        />
      )}

      {/* Search & Home Equipment Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por exercício, sofá, toalha, parede, flexão..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Apartment Silent Filter Toggle */}
          <button
            type="button"
            onClick={() => setApartmentOnly(v => !v)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border ${
              apartmentOnly
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">Sem Barulho (Apartamento)</span>
          </button>

          {/* Quick Active Filter Indicator */}
          {(selectedMuscles.length > 0 || selectedEquipment !== 'all' || apartmentOnly) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMuscles([]);
                setSelectedEquipment('all');
                setApartmentOnly(false);
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors whitespace-nowrap"
            >
              Resetar Filtros
            </button>
          )}
        </div>

        {/* Equipment horizontal bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 font-medium text-xs mr-1 shrink-0">
            Acessório:
          </span>
          <button
            type="button"
            onClick={() => setSelectedEquipment('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedEquipment === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos
          </button>
          {(Object.keys(HOME_EQUIPMENT_LABELS) as HomeEquipment[]).map(eq => (
            <button
              key={eq}
              type="button"
              onClick={() => setSelectedEquipment(eq)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedEquipment === eq
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{HOME_EQUIPMENT_LABELS[eq].icon}</span>
              <span>{HOME_EQUIPMENT_LABELS[eq].pt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span>
            Mostrando <strong className="text-slate-200 tabular-nums">{filteredExercises.length}</strong> exercícios para treinar em casa
          </span>
          {selectedMuscles.length > 0 && (
            <span>
              Filtrado por: {selectedMuscles.map(m => MUSCLE_LABELS[m].pt).join(', ')}
            </span>
          )}
        </div>

        {filteredExercises.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-slate-200">Nenhum exercício encontrado com estes filtros</h4>
            <p className="text-xs text-slate-400 mt-1">Experimente limpar os filtros de músculos ou acessórios caseiros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {exercise.namePt}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {HOME_EQUIPMENT_LABELS[exercise.equipment].icon} {HOME_EQUIPMENT_LABELS[exercise.equipment].pt}
                      </p>
                    </div>

                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                      {MUSCLE_LABELS[exercise.primaryMuscle].pt}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 my-2.5">
                    {exercise.instructions[0]}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-400">
                      {exercise.measurementType === 'seconds' ? (
                        <>
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Isometria (Segundos)</span>
                        </>
                      ) : (
                        <>
                          <Repeat className="w-3 h-3 text-emerald-400" />
                          <span>Repetições</span>
                        </>
                      )}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{exercise.difficulty}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseModal(exercise)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Como Fazer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartWithExercise(exercise)}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Treinar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExerciseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  {selectedExerciseModal.namePt}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {HOME_EQUIPMENT_LABELS[selectedExerciseModal.equipment].icon}{' '}
                  {HOME_EQUIPMENT_LABELS[selectedExerciseModal.equipment].pt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExerciseModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Muscle Breakdown */}
            <div className="py-4 border-b border-slate-800 flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Músculo Alvo:</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {MUSCLE_LABELS[selectedExerciseModal.primaryMuscle].pt}
                </span>
              </div>
              {selectedExerciseModal.secondaryMuscles.length > 0 && (
                <div>
                  <span className="text-slate-500 block mb-1">Secundários:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExerciseModal.secondaryMuscles.map(sm => (
                      <span
                        key={sm}
                        className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/60"
                      >
                        {MUSCLE_LABELS[sm].pt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step-by-Step Instructions */}
            <div className="py-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-3">
                Como Executar em Casa
              </h4>
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                {selectedExerciseModal.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-slate-800 text-emerald-400 font-bold rounded-full flex items-center justify-center shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Home Tips */}
            {selectedExerciseModal.homeTips.length > 0 && (
              <div className="py-4">
                <h4 className="text-sm font-bold text-amber-400 mb-2">
                  Dicas para Fazer em Casa (Adaptações & Segurança)
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedExerciseModal.homeTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 bg-slate-950/50 rounded-lg border border-slate-850">
                      <span className="text-amber-400 font-bold">›</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedExerciseModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const ex = selectedExerciseModal;
                  setSelectedExerciseModal(null);
                  onStartWithExercise(ex);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Treino com este Exercício</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
