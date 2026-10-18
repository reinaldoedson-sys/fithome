import React, { useState } from 'react';
import { RoutineTemplate } from '../types/workout';
import { ROUTINE_TEMPLATES } from '../data/templates';
import { EXERCISES, MUSCLE_LABELS, HOME_EQUIPMENT_LABELS } from '../data/exercises';
import { CustomRoutineModal } from './CustomRoutineModal';
import { useLanguage } from '../i18n/LanguageContext';
import { getTemplateName, getTemplateDescription, getExerciseName } from '../utils/i18nHelpers';
import {
  Play,
  Dumbbell,
  Clock,
  Layers,
  ChevronRight,
  VolumeX,
  Plus,
  Edit2,
  Trash2,
  Sparkles
} from 'lucide-react';

interface WorkoutRoutinesProps {
  customRoutines?: RoutineTemplate[];
  onStartTemplate: (template: RoutineTemplate) => void;
  onCustomWorkout: () => void;
  onSaveCustomRoutine?: (routine: RoutineTemplate) => void;
  onDeleteCustomRoutine?: (routineId: string) => void;
}

export const WorkoutRoutines: React.FC<WorkoutRoutinesProps> = ({
  customRoutines = [],
  onStartTemplate,
  onCustomWorkout,
  onSaveCustomRoutine,
  onDeleteCustomRoutine
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(
    ROUTINE_TEMPLATES[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTemplate | null>(null);

  const displayedList = activeTab === 'templates' ? ROUTINE_TEMPLATES : customRoutines;

  const handleOpenCreateModal = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (routine: RoutineTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const handleDeleteRoutine = (routineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t.routines.deleteConfirm)) {
      onDeleteCustomRoutine?.(routineId);
      if (selectedTemplate?.id === routineId) {
        setSelectedTemplate(customRoutines.find(r => r.id !== routineId) || null);
      }
    }
  };

  const handleSaveRoutineInternal = (routine: RoutineTemplate) => {
    onSaveCustomRoutine?.(routine);
    setSelectedTemplate(routine);
    setIsModalOpen(false);
    setActiveTab('custom');
  };

  const seriesWord = language === 'en' ? 'sets' : language === 'es' ? 'series' : 'séries';
  const singleSetWord = language === 'en' ? 'set' : language === 'es' ? 'serie' : 'série';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            {t.routines.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.routines.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t.routines.createNew}</span>
          </button>

          <button
            type="button"
            onClick={onCustomWorkout}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>{t.common.newWorkout}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Pre-made Templates vs Custom Routines */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('templates');
            setSelectedTemplate(ROUTINE_TEMPLATES[0]);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.routines.tabPresets} ({ROUTINE_TEMPLATES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('custom');
            setSelectedTemplate(customRoutines[0] || null);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'custom'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.routines.tabCustom} ({customRoutines.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template Cards List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {displayedList.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-semibold text-slate-300 text-sm">{t.routines.emptyCustomTitle}</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t.routines.emptyCustomDesc}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.routines.createFirst}</span>
              </button>
            </div>
          ) : (
            displayedList.map(tpl => {
              const isSelected = selectedTemplate?.id === tpl.id;
              const tplName = getTemplateName(tpl, language);
              const tplDesc = getTemplateDescription(tpl, language);

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                      <span>{tplName}</span>
                      {tpl.isCustom && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.routines.customBadge}
                        </span>
                      )}
                    </h3>

                    <div className="flex items-center gap-1.5">
                      {tpl.isCustom && (
                        <>
                          <button
                            type="button"
                            onClick={e => handleOpenEditModal(tpl, e)}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            title={t.routines.editRoutine}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={e => handleDeleteRoutine(tpl.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title={t.routines.deleteRoutine}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-emerald-400 translate-x-1' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {tplDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.routines.durationEst(tpl.durationMinutes)}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.routines.exercisesCount(tpl.exercises.length)}</span>
                    </span>
                    {tpl.apartmentFriendly && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" />
                          <span>{t.routines.apartmentFriendly}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Template Details & Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          {selectedTemplate ? (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-100">
                      {getTemplateName(selectedTemplate, language)}
                    </h3>
                    {selectedTemplate.isCustom && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t.routines.customBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {getTemplateDescription(selectedTemplate, language)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartTemplate(selectedTemplate)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.routines.startRoutine}</span>
                </button>
              </div>

              {/* Equipment Needed in Home */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  {language === 'en' ? 'What you will need at home:' : language === 'es' ? 'Lo que necesitarás en casa:' : 'O que você vai precisar em casa:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.equipmentNeeded.map(eq => (
                    <span
                      key={eq}
                      className="text-xs font-medium text-slate-200 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5"
                    >
                      <span>{HOME_EQUIPMENT_LABELS[eq]?.icon || '🏠'}</span>
                      <span>{HOME_EQUIPMENT_LABELS[eq]?.[language] || HOME_EQUIPMENT_LABELS[eq]?.pt || eq}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Muscles Targeted */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  {language === 'en' ? 'Target Muscles:' : language === 'es' ? 'Músculos Trabajados:' : 'Músculos Trabalhados:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.targetMuscles.map(m => (
                    <span
                      key={m}
                      className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                    >
                      {MUSCLE_LABELS[m]?.[language] || MUSCLE_LABELS[m]?.pt || m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Exercise Breakdown */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  {language === 'en'
                    ? `Workout Sequence (${selectedTemplate.exercises.length} exercises):`
                    : language === 'es'
                    ? `Secuencia del Entrenamiento (${selectedTemplate.exercises.length} ejercicios):`
                    : `Sequência do Treino (${selectedTemplate.exercises.length} exercícios):`}
                </span>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {selectedTemplate.exercises.map((item, idx) => {
                    const exMeta = EXERCISES.find(e => e.id === item.exerciseId);
                    const isSec = exMeta?.measurementType === 'seconds';
                    const displayName = exMeta ? getExerciseName(exMeta, language) : item.exerciseId;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-200">
                            {displayName}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {exMeta ? (HOME_EQUIPMENT_LABELS[exMeta.equipment]?.[language] || HOME_EQUIPMENT_LABELS[exMeta.equipment]?.pt) : ''}
                          </span>
                        </div>
                        <span className="font-bold text-slate-300 tabular-nums">
                          {item.defaultSets} {item.defaultSets === 1 ? singleSetWord : seriesWord} × {item.defaultTarget}{isSec ? 's' : ' reps'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              {language === 'en' ? 'Select a routine to view details.' : language === 'es' ? 'Selecciona una rutina para ver los detalles.' : 'Selecione uma rotina para ver os detalhes.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating / Editing Custom Routine */}
      {isModalOpen && (
        <CustomRoutineModal
          initialRoutine={editingRoutine}
          onSave={handleSaveRoutineInternal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
