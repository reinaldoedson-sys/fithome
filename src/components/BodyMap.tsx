import React, { useState } from 'react';
import { MuscleGroup } from '../types/workout';
import { MUSCLE_LABELS, EXERCISES } from '../data/exercises';
import { RotateCw, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BodyMapProps {
  selectedMuscles: MuscleGroup[];
  onToggleMuscle: (muscle: MuscleGroup) => void;
  onClearSelection?: () => void;
}

export const BodyMap: React.FC<BodyMapProps> = ({
  selectedMuscles,
  onToggleMuscle,
  onClearSelection
}) => {
  const { language, t } = useLanguage();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  const getExerciseCount = (muscle: MuscleGroup) => {
    return EXERCISES.filter(e => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle)).length;
  };

  const isSelected = (muscle: MuscleGroup) => selectedMuscles.includes(muscle);

  const getFillClass = (muscle: MuscleGroup) => {
    const active = isSelected(muscle);
    const hovered = hoveredMuscle === muscle;

    if (active) {
      return 'fill-emerald-500 stroke-emerald-300 stroke-[1.5] filter drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] cursor-pointer transition-all duration-200';
    }
    if (hovered) {
      return 'fill-emerald-700/80 stroke-emerald-400 stroke-1 cursor-pointer transition-all duration-200';
    }
    return 'fill-slate-800 hover:fill-slate-700 stroke-slate-700 stroke-[0.8] cursor-pointer transition-all duration-200';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-6 items-stretch">
      {/* Visual Canvas Column */}
      <div className="flex-1 flex flex-col items-center">
        {/* Controls row */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setView('front')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                view === 'front'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.bodyMap.frontView}
            </button>
            <button
              type="button"
              onClick={() => setView('back')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                view === 'back'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.bodyMap.backView}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView(v => (v === 'front' ? 'back' : 'front'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            title={t.bodyMap.rotate}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.bodyMap.rotate}</span>
          </button>
        </div>

        {/* Interactive SVG Human Map */}
        <div className="relative w-full max-w-[280px] h-[360px] flex items-center justify-center p-2 bg-slate-950/40 rounded-2xl border border-slate-800/60">
          <svg
            viewBox="0 0 200 360"
            className="w-full h-full select-none"
            aria-label="Mapa muscular anatômico interativo"
          >
            {/* Background body silhouette guides */}
            <g opacity="0.15">
              {/* Head outline */}
              <circle cx="100" cy="30" r="18" className="fill-slate-600" />
              {/* Neck */}
              <path d="M 92 46 L 108 46 L 110 58 L 90 58 Z" className="fill-slate-600" />
            </g>

            {view === 'front' ? (
              /* ANTERIOR / FRONT VIEW */
              <g id="front-body">
                {/* Traps anterior */}
                <path
                  d="M 91 48 L 109 48 L 126 62 L 112 66 L 100 60 L 88 66 L 74 62 Z"
                  className={getFillClass('traps')}
                  onClick={() => onToggleMuscle('traps')}
                  onMouseEnter={() => setHoveredMuscle('traps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Shoulders / Deltoids (Left & Right) */}
                <path
                  d="M 72 63 L 60 74 L 56 94 L 66 102 L 72 82 L 75 66 Z"
                  className={getFillClass('shoulders')}
                  onClick={() => onToggleMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 128 63 L 140 74 L 144 94 L 134 102 L 128 82 L 125 66 Z"
                  className={getFillClass('shoulders')}
                  onClick={() => onToggleMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Chest (Peitoral) */}
                <path
                  d="M 75 67 L 98 67 L 98 102 L 76 96 L 71 80 Z"
                  className={getFillClass('chest')}
                  onClick={() => onToggleMuscle('chest')}
                  onMouseEnter={() => setHoveredMuscle('chest')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 102 67 L 125 67 L 129 80 L 124 96 L 102 102 Z"
                  className={getFillClass('chest')}
                  onClick={() => onToggleMuscle('chest')}
                  onMouseEnter={() => setHoveredMuscle('chest')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Biceps (Left & Right) */}
                <path
                  d="M 55 96 L 66 103 L 64 134 L 52 125 L 51 106 Z"
                  className={getFillClass('biceps')}
                  onClick={() => onToggleMuscle('biceps')}
                  onMouseEnter={() => setHoveredMuscle('biceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 145 96 L 134 103 L 136 134 L 148 125 L 149 106 Z"
                  className={getFillClass('biceps')}
                  onClick={() => onToggleMuscle('biceps')}
                  onMouseEnter={() => setHoveredMuscle('biceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Forearms (Left & Right) */}
                <path
                  d="M 50 128 L 62 136 L 56 182 L 44 174 L 46 142 Z"
                  className={getFillClass('forearms')}
                  onClick={() => onToggleMuscle('forearms')}
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 150 128 L 138 136 L 144 182 L 156 174 L 154 142 Z"
                  className={getFillClass('forearms')}
                  onClick={() => onToggleMuscle('forearms')}
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Abs (Reto Abdominal) */}
                <path
                  d="M 80 102 L 120 102 L 118 152 L 100 160 L 82 152 Z"
                  className={getFillClass('abs')}
                  onClick={() => onToggleMuscle('abs')}
                  onMouseEnter={() => setHoveredMuscle('abs')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Quads (Quadríceps - Left & Right) */}
                <path
                  d="M 75 166 L 98 166 L 96 242 L 78 240 L 70 188 Z"
                  className={getFillClass('quads')}
                  onClick={() => onToggleMuscle('quads')}
                  onMouseEnter={() => setHoveredMuscle('quads')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 102 166 L 125 166 L 130 188 L 122 240 L 104 242 Z"
                  className={getFillClass('quads')}
                  onClick={() => onToggleMuscle('quads')}
                  onMouseEnter={() => setHoveredMuscle('quads')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Calves (Panturrilhas - Front / Tibiais) */}
                <path
                  d="M 76 254 L 94 254 L 91 328 L 78 325 L 72 284 Z"
                  className={getFillClass('calves')}
                  onClick={() => onToggleMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 106 254 L 124 254 L 128 284 L 122 325 L 109 328 Z"
                  className={getFillClass('calves')}
                  onClick={() => onToggleMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
              </g>
            ) : (
              /* POSTERIOR / BACK VIEW */
              <g id="back-body">
                {/* Traps (Trapézio superior e médio) */}
                <path
                  d="M 91 48 L 109 48 L 126 62 L 114 96 L 100 114 L 86 96 L 74 62 Z"
                  className={getFillClass('traps')}
                  onClick={() => onToggleMuscle('traps')}
                  onMouseEnter={() => setHoveredMuscle('traps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Shoulders / Rear Delts */}
                <path
                  d="M 72 63 L 58 74 L 56 94 L 66 102 L 72 82 L 75 66 Z"
                  className={getFillClass('shoulders')}
                  onClick={() => onToggleMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 128 63 L 142 74 L 144 94 L 134 102 L 128 82 L 125 66 Z"
                  className={getFillClass('shoulders')}
                  onClick={() => onToggleMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Lats / Dorsais */}
                <path
                  d="M 72 84 L 84 96 L 98 114 L 98 142 L 76 132 L 68 102 Z"
                  className={getFillClass('lats')}
                  onClick={() => onToggleMuscle('lats')}
                  onMouseEnter={() => setHoveredMuscle('lats')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 128 84 L 132 102 L 124 132 L 102 142 L 102 114 L 116 96 Z"
                  className={getFillClass('lats')}
                  onClick={() => onToggleMuscle('lats')}
                  onMouseEnter={() => setHoveredMuscle('lats')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Triceps (Left & Right) */}
                <path
                  d="M 55 96 L 66 103 L 64 134 L 52 125 L 51 106 Z"
                  className={getFillClass('triceps')}
                  onClick={() => onToggleMuscle('triceps')}
                  onMouseEnter={() => setHoveredMuscle('triceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 145 96 L 134 103 L 136 134 L 148 125 L 149 106 Z"
                  className={getFillClass('triceps')}
                  onClick={() => onToggleMuscle('triceps')}
                  onMouseEnter={() => setHoveredMuscle('triceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Lower Back / Lombar */}
                <path
                  d="M 86 138 L 114 138 L 116 160 L 84 160 Z"
                  className={getFillClass('lower_back')}
                  onClick={() => onToggleMuscle('lower_back')}
                  onMouseEnter={() => setHoveredMuscle('lower_back')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Glutes (Glúteos) */}
                <path
                  d="M 76 162 L 99 162 L 98 198 L 72 190 Z"
                  className={getFillClass('glutes')}
                  onClick={() => onToggleMuscle('glutes')}
                  onMouseEnter={() => setHoveredMuscle('glutes')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 101 162 L 124 162 L 128 190 L 102 198 Z"
                  className={getFillClass('glutes')}
                  onClick={() => onToggleMuscle('glutes')}
                  onMouseEnter={() => setHoveredMuscle('glutes')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Hamstrings (Posterior de Coxa) */}
                <path
                  d="M 74 196 L 98 200 L 96 242 L 78 240 L 70 216 Z"
                  className={getFillClass('hamstrings')}
                  onClick={() => onToggleMuscle('hamstrings')}
                  onMouseEnter={() => setHoveredMuscle('hamstrings')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 102 200 L 126 196 L 130 216 L 122 240 L 104 242 Z"
                  className={getFillClass('hamstrings')}
                  onClick={() => onToggleMuscle('hamstrings')}
                  onMouseEnter={() => setHoveredMuscle('hamstrings')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />

                {/* Calves (Panturrilhas - Gastrocnêmios) */}
                <path
                  d="M 74 252 L 95 252 L 91 326 L 76 322 L 68 280 Z"
                  className={getFillClass('calves')}
                  onClick={() => onToggleMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
                <path
                  d="M 105 252 L 126 252 L 132 280 L 124 322 L 109 326 Z"
                  className={getFillClass('calves')}
                  onClick={() => onToggleMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
              </g>
            )}
          </svg>

          {/* Floating Hover Indicator */}
          {hoveredMuscle && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/50 text-slate-100 text-xs py-1 px-3 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
              <span className="font-semibold text-emerald-400">{MUSCLE_LABELS[hoveredMuscle][language] || MUSCLE_LABELS[hoveredMuscle].pt}</span>
              <span className="text-slate-400 ml-1.5">
                ({getExerciseCount(hoveredMuscle)}{' '}
                {language === 'en' ? 'exercises' : language === 'es' ? 'ejercicios' : 'exercícios'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Muscle list & rapid selection panel */}
      <div className="w-full md:w-64 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-sm font-semibold text-slate-200">
              {t.bodyMap.selectedMuscles}
            </h4>
            {selectedMuscles.length > 0 && onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {t.bodyMap.clearSelection(selectedMuscles.length)}
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            {t.bodyMap.instructions}
          </p>

          {/* Quick toggle chips */}
          <div className="grid grid-cols-2 gap-1.5 max-h-[250px] overflow-y-auto pr-1">
            {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map(muscle => {
              const active = isSelected(muscle);
              const count = getExerciseCount(muscle);
              const muscleLabel = MUSCLE_LABELS[muscle][language] || MUSCLE_LABELS[muscle].pt;
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => onToggleMuscle(muscle)}
                  onMouseEnter={() => setHoveredMuscle(muscle)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between border ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate pr-1">{muscleLabel}</span>
                  {active ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Informative helper at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{t.bodyMap.selectedCount(selectedMuscles.length)}</span>
          <span className="text-slate-500">{t.bodyMap.tapToIsolate}</span>
        </div>
      </div>
    </div>
  );
};
