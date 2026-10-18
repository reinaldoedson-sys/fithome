import React, { useState, useEffect } from 'react';
import {
  WorkoutExercise,
  WorkoutSet,
  WorkoutSession,
  SetType,
  PersonalRecord
} from '../types/workout';
import { EXERCISES, MUSCLE_LABELS, HOME_EQUIPMENT_LABELS } from '../data/exercises';
import {
  X,
  Plus,
  Trash2,
  Check,
  Trophy,
  Dumbbell,
  Timer as TimerIcon,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RestTimer } from './RestTimer';
import { useLanguage } from '../i18n/LanguageContext';

interface ActiveWorkoutModalProps {
  initialTitle?: string;
  initialExercises?: { exerciseId: string; defaultSets: number; defaultTarget: number }[];
  previousRecords: PersonalRecord[];
  onSaveWorkout: (session: WorkoutSession, newRecords: PersonalRecord[]) => void;
  onClose: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  initialTitle,
  initialExercises = [],
  previousRecords,
  onSaveWorkout,
  onClose
}) => {
  const { language, t } = useLanguage();
  const defaultTitle = language === 'en' ? 'Home Workout' : language === 'es' ? 'Entrenamiento en Casa' : 'Treino em Casa';
  const [title, setTitle] = useState(initialTitle || defaultTitle);
  const [startTime] = useState<string>(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Rest Timer State
  const [restDuration, setRestDuration] = useState(60);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Initialize workout exercises
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(() => {
    if (initialExercises.length > 0) {
      return initialExercises.map((init, eIdx) => {
        const pr = previousRecords.find(p => p.exerciseId === init.exerciseId);

        const sets: WorkoutSet[] = Array.from({ length: init.defaultSets }).map((_, sIdx) => ({
          id: `set-${eIdx}-${sIdx}-${Date.now()}`,
          setNumber: sIdx + 1,
          type: 'normal',
          weightKg: 0,
          repsOrSeconds: init.defaultTarget,
          completed: false,
          previousRecord: pr ? pr.maxScore : undefined
        }));

        return {
          id: `we-${eIdx}-${Date.now()}`,
          exerciseId: init.exerciseId,
          sets
        };
      });
    }

    // Default to classic push-up if starting from scratch
    return [
      {
        id: `we-0-${Date.now()}`,
        exerciseId: 'pushup-standard',
        sets: [
          {
            id: `set-0-0-${Date.now()}`,
            setNumber: 1,
            type: 'warmup',
            weightKg: 0,
            repsOrSeconds: 8,
            completed: false
          },
          {
            id: `set-0-1-${Date.now()}`,
            setNumber: 2,
            type: 'normal',
            weightKg: 0,
            repsOrSeconds: 12,
            completed: false
          },
          {
            id: `set-0-2-${Date.now()}`,
            setNumber: 3,
            type: 'normal',
            weightKg: 0,
            repsOrSeconds: 12,
            completed: false
          }
        ]
      }
    ];
  });

  // Workout duration stopwatch
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRestRunning && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft(t => {
          if (t <= 1) {
            setIsRestRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRestRunning, restTimeLeft]);

  const startRestTimer = (seconds = 60) => {
    setRestDuration(seconds);
    setRestTimeLeft(seconds);
    setIsRestRunning(true);
    setShowRestTimer(true);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Stats
  const completedSetsCount = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter(s => s.completed).length,
    0
  );

  const totalVolumeKg = workoutExercises.reduce((acc, we) => {
    return (
      acc +
      we.sets
        .filter(s => s.completed)
        .reduce((sAcc, s) => sAcc + (s.weightKg || 0) * (s.repsOrSeconds || 0), 0)
    );
  }, 0);

  // Set management
  const handleToggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      const targetSet = updated[exerciseIdx].sets[setIdx];
      const willBeComplete = !targetSet.completed;
      targetSet.completed = willBeComplete;

      if (willBeComplete) {
        startRestTimer(60);
      }
      return updated;
    });
  };

  const handleUpdateSet = (
    exerciseIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: unknown
  ) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx] = {
        ...updated[exerciseIdx].sets[setIdx],
        [field]: value
      };
      return updated;
    });
  };

  const handleAddSet = (exerciseIdx: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      const currentSets = updated[exerciseIdx].sets;
      const lastSet = currentSets[currentSets.length - 1];

      const newSet: WorkoutSet = {
        id: `set-${Date.now()}-${Math.random()}`,
        setNumber: currentSets.length + 1,
        type: 'normal',
        weightKg: lastSet ? lastSet.weightKg : 0,
        repsOrSeconds: lastSet ? lastSet.repsOrSeconds : 10,
        completed: false,
        previousRecord: lastSet?.previousRecord
      };

      updated[exerciseIdx].sets = [...currentSets, newSet];
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets = updated[exerciseIdx].sets.filter((_, idx) => idx !== setIdx);
      updated[exerciseIdx].sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIdx: number) => {
    setWorkoutExercises(prev => prev.filter((_, idx) => idx !== exerciseIdx));
  };

  const handleAddExerciseToWorkout = (exerciseId: string) => {
    const exMeta = EXERCISES.find(e => e.id === exerciseId);
    const pr = previousRecords.find(p => p.exerciseId === exerciseId);
    const defaultVal = exMeta?.measurementType === 'seconds' ? 30 : 12;

    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId,
      sets: [
        {
          id: `set-0-${Date.now()}`,
          setNumber: 1,
          type: 'normal',
          weightKg: 0,
          repsOrSeconds: defaultVal,
          completed: false,
          previousRecord: pr ? pr.maxScore : undefined
        },
        {
          id: `set-1-${Date.now()}`,
          setNumber: 2,
          type: 'normal',
          weightKg: 0,
          repsOrSeconds: defaultVal,
          completed: false,
          previousRecord: pr ? pr.maxScore : undefined
        },
        {
          id: `set-2-${Date.now()}`,
          setNumber: 3,
          type: 'normal',
          weightKg: 0,
          repsOrSeconds: defaultVal,
          completed: false,
          previousRecord: pr ? pr.maxScore : undefined
        }
      ]
    };

    setWorkoutExercises(prev => [...prev, newEx]);
    setShowAddExerciseModal(false);
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    const endTime = new Date().toISOString();
    const newRecords: PersonalRecord[] = [];

    workoutExercises.forEach(we => {
      const exerciseMeta = EXERCISES.find(e => e.id === we.exerciseId);
      if (!exerciseMeta) return;

      const existingPR = previousRecords.find(p => p.exerciseId === we.exerciseId);

      we.sets
        .filter(s => s.completed && s.repsOrSeconds > 0)
        .forEach(s => {
          const score = s.repsOrSeconds;
          if (!existingPR || score > existingPR.maxScore) {
            newRecords.push({
              exerciseId: we.exerciseId,
              exerciseName: exerciseMeta.namePt,
              maxScore: score,
              metricLabel: exerciseMeta.measurementType === 'seconds' ? 'segundos' : 'reps',
              achievedAt: endTime
            });
          }
        });
    });

    const session: WorkoutSession = {
      id: `workout-${Date.now()}`,
      title: title.trim() || defaultTitle,
      startTime,
      endTime,
      durationSeconds: elapsedSeconds,
      exercises: workoutExercises,
      totalVolumeKg,
      totalSets: completedSetsCount,
      notes: notes.trim() || undefined
    };

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    onSaveWorkout(session, newRecords);
  };

  const setTypeLabels: Record<SetType, { label: string; badge: string }> = {
    normal: { label: t.workoutActive.normal, badge: 'bg-slate-800 text-slate-300' },
    warmup: { label: t.workoutActive.warmup, badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    dropset: { label: t.workoutActive.dropset, badge: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
    failure: { label: t.workoutActive.failure, badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' }
  };

  const filteredExercisesForModal = EXERCISES.filter(ex =>
    ex.namePt.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    MUSCLE_LABELS[ex.primaryMuscle].pt.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    (MUSCLE_LABELS[ex.primaryMuscle][language] && MUSCLE_LABELS[ex.primaryMuscle][language].toLowerCase().includes(exerciseSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-y-auto">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent text-slate-100 font-bold text-base sm:text-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 -ml-1 border-b border-transparent hover:border-slate-700 transition-colors"
              placeholder={defaultTitle}
            />
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <TimerIcon className="w-3.5 h-3.5" />
                <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
              </span>
              <span>·</span>
              <span>
                <strong className="text-slate-200 tabular-nums">{completedSetsCount}</strong> {t.streak.seriesCount(completedSetsCount)}
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">{defaultTitle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t.workoutActive.finish}</span>
          </button>
        </div>
      </header>

      {/* Main Workout Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-36">
        {workoutExercises.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
            <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              {language === 'en' ? 'Your workout is empty' : language === 'es' ? 'Tu entrenamiento está vacío' : 'Seu treino em casa está vazio'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {language === 'en' ? 'Add the first exercise to start training.' : language === 'es' ? 'Añade el primer ejercicio para empezar a entrenar.' : 'Adicione o primeiro exercício para começar a treinar.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddExerciseModal(true)}
              className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-emerald-400 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.workoutActive.addExercise}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {workoutExercises.map((we, exIdx) => {
              const exerciseMeta = EXERCISES.find(e => e.id === we.exerciseId);
              const pr = previousRecords.find(p => p.exerciseId === we.exerciseId);
              const isSeconds = exerciseMeta?.measurementType === 'seconds';
              const displayName = language === 'en' ? (exerciseMeta?.name || we.exerciseId) : (exerciseMeta?.namePt || we.exerciseId);

              return (
                <div
                  key={we.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative"
                >
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-100">
                          {displayName}
                        </h3>
                        {exerciseMeta && (
                          <span className="text-xs text-emerald-400 font-medium">
                            {MUSCLE_LABELS[exerciseMeta.primaryMuscle][language] || MUSCLE_LABELS[exerciseMeta.primaryMuscle].pt}
                          </span>
                        )}
                        {pr && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <Trophy className="w-3 h-3" />
                            {language === 'en' ? 'Record: ' : language === 'es' ? 'Récord: ' : 'Recorde: '} {pr.maxScore} {pr.metricLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>{exerciseMeta ? (HOME_EQUIPMENT_LABELS[exerciseMeta.equipment][language] || HOME_EQUIPMENT_LABELS[exerciseMeta.equipment].pt) : ''}</span>
                        <span>·</span>
                        <span className="text-emerald-400/90 font-medium">
                          {isSeconds
                            ? (language === 'en' ? 'Measured in Seconds (Isometrics)' : language === 'es' ? 'Medido en Segundos (Isometría)' : 'Medido em Segundos (Isometria)')
                            : (language === 'en' ? 'Measured in Repetitions' : language === 'es' ? 'Medido en Repeticiones' : 'Medido em Repetições')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Home Tip Box */}
                  {exerciseMeta?.homeTips && exerciseMeta.homeTips.length > 0 && (
                    <div className="mb-3.5 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{exerciseMeta.homeTips[0]}</span>
                    </div>
                  )}

                  {/* Table of Sets */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                          <th className="py-2 px-1 text-center w-10">{t.workoutActive.set}</th>
                          <th className="py-2 px-2 text-center w-24">{language === 'en' ? 'Type' : 'Tipo'}</th>
                          <th className="py-2 px-2 text-center w-28">
                            {isSeconds ? (language === 'en' ? 'Time (sec)' : language === 'es' ? 'Tiempo (seg)' : 'Tempo (seg)') : t.common.reps}
                          </th>
                          <th className="py-2 px-2 text-center w-24">{t.workoutActive.weightKg}</th>
                          <th className="py-2 px-2 text-center w-12">✓</th>
                          <th className="py-2 px-1 text-right w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {we.sets.map((set, setIdx) => {
                          const isComplete = set.completed;

                          return (
                            <tr
                              key={set.id}
                              className={`transition-colors ${
                                isComplete
                                  ? 'bg-emerald-950/20'
                                  : 'hover:bg-slate-800/30'
                              }`}
                            >
                              {/* Set Number */}
                              <td className="py-2.5 px-1 text-center font-bold text-slate-300 tabular-nums">
                                {set.setNumber}
                              </td>

                              {/* Set Type Selector */}
                              <td className="py-2.5 px-2 text-center">
                                <select
                                  value={set.type}
                                  onChange={e =>
                                    handleUpdateSet(
                                      exIdx,
                                      setIdx,
                                      'type',
                                      e.target.value as SetType
                                    )
                                  }
                                  className={`text-[11px] font-semibold rounded-lg px-2 py-1 bg-slate-950 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                    setTypeLabels[set.type].badge
                                  }`}
                                >
                                  <option value="normal">{t.workoutActive.normal}</option>
                                  <option value="warmup">{t.workoutActive.warmup}</option>
                                  <option value="dropset">{t.workoutActive.dropset}</option>
                                  <option value="failure">{t.workoutActive.failure}</option>
                                </select>
                              </td>

                              {/* Reps or Seconds Input */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    value={set.repsOrSeconds === 0 ? '' : set.repsOrSeconds}
                                    placeholder={isSeconds ? '30s' : '10'}
                                    onChange={e =>
                                      handleUpdateSet(
                                        exIdx,
                                        setIdx,
                                        'repsOrSeconds',
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                    className="w-16 text-center font-bold text-slate-100 bg-slate-950 border border-slate-700 rounded-lg py-1 px-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                                  />
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {isSeconds ? 's' : 'x'}
                                  </span>
                                </div>
                              </td>

                              {/* Extra weight (e.g. mochila com livros ou pesinho) */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weightKg === 0 ? '' : set.weightKg}
                                    placeholder="0"
                                    title={language === 'en' ? '0 = Bodyweight only. Add weight if using backpack or weights.' : language === 'es' ? '0 = Solo peso corporal. Añade peso si usas mochila o pesas.' : '0 = Apenas peso corporal. Adicione se usar mochila ou garrafas.'}
                                    onChange={e =>
                                      handleUpdateSet(
                                        exIdx,
                                        setIdx,
                                        'weightKg',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-14 text-center font-semibold text-slate-200 bg-slate-950 border border-slate-700 rounded-lg py-1 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                                  />
                                  <span className="text-[10px] text-slate-500">kg</span>
                                </div>
                              </td>

                              {/* Completion Checkbox */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                                  className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                    isComplete
                                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-200'
                                  }`}
                                  title={isComplete ? t.workoutActive.completeSet : t.workoutActive.completeSet}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                              </td>

                              {/* Delete Set */}
                              <td className="py-2.5 px-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIdx, setIdx)}
                                  className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                                  title={t.common.delete}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Set Button */}
                  <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Add Set' : language === 'es' ? 'Añadir Serie' : 'Adicionar Série'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startRestTimer(60)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <TimerIcon className="w-3.5 h-3.5" />
                      <span>{t.restTimer.rest} 60s</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Workout Notes */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <label htmlFor="workout-notes-input" className="block text-xs font-semibold text-slate-300 mb-2">
                {language === 'en' ? 'Workout Notes (Optional)' : language === 'es' ? 'Notas del Entrenamiento (Opcional)' : 'Anotações do Treino em Casa (Opcional)'}
              </label>
              <textarea
                id="workout-notes-input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t.workoutActive.notesPlaceholder}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Bottom Add Exercise Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAddExerciseModal(true)}
                className="w-full py-3.5 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/30 hover:bg-slate-900 text-slate-300 hover:text-emerald-300 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.workoutActive.addExercise}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Rest Timer Component */}
      {showRestTimer && (
        <RestTimer
          duration={restDuration}
          timeLeft={restTimeLeft}
          isRunning={isRestRunning}
          onTogglePlay={() => setIsRestRunning(r => !r)}
          onAdjustTime={delta => setRestTimeLeft(t => Math.max(0, t + delta))}
          onClose={() => setShowRestTimer(false)}
        />
      )}

      {/* Modal to pick and add an exercise */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base">{t.workoutActive.addExercise}</h3>
              <button
                type="button"
                onClick={() => setShowAddExerciseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <input
                type="text"
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder={t.exercises.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredExercisesForModal.map(exercise => {
                const displayName = language === 'en' ? exercise.name : exercise.namePt;
                const eqLabel = HOME_EQUIPMENT_LABELS[exercise.equipment][language] || HOME_EQUIPMENT_LABELS[exercise.equipment].pt;
                const muscleLabel = MUSCLE_LABELS[exercise.primaryMuscle][language] || MUSCLE_LABELS[exercise.primaryMuscle].pt;

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleAddExerciseToWorkout(exercise.id)}
                    className="w-full text-left p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {displayName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {eqLabel} · {muscleLabel}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal before finishing */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">{t.workoutActive.finishDialogTitle}?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {language === 'en' ? (
                <>
                  You completed <strong className="text-slate-200">{completedSetsCount} sets</strong> in{' '}
                  <strong className="text-slate-200">{formatTime(elapsedSeconds)}</strong>. Outstanding dedication!
                </>
              ) : language === 'es' ? (
                <>
                  Completaste <strong className="text-slate-200">{completedSetsCount} series</strong> en{' '}
                  <strong className="text-slate-200">{formatTime(elapsedSeconds)}</strong>. ¡Excelente dedicación!
                </>
              ) : (
                <>
                  Você completou <strong className="text-slate-200">{completedSetsCount} séries</strong> em{' '}
                  <strong className="text-slate-200">{formatTime(elapsedSeconds)}</strong>. Excelente dedicação!
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
              >
                {language === 'en' ? 'Keep Training' : language === 'es' ? 'Continuar Entrenando' : 'Continuar Treinando'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  handleFinishWorkout();
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20"
              >
                {language === 'en' ? 'Save & Log' : language === 'es' ? 'Guardar y Registrar' : 'Salvar & Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
