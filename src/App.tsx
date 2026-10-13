import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  PersonalRecord,
  Exercise,
  RoutineTemplate
} from './types/workout';
import {
  WeightEntry,
  MeasurementEntry,
  BodyGoal,
  ProgressPhoto
} from './types/bodyEvolution';
import { WeeklyProgress } from './components/WeeklyProgress';
import { BodyEvolution } from './components/BodyEvolution';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutRoutines } from './components/WorkoutRoutines';
import { WorkoutHistory } from './components/WorkoutHistory';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import {
  Home,
  Dumbbell,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Scale
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'progresso' | 'evolucao' | 'exercicios' | 'rotinas' | 'historico'
  >('progresso');

  // Persistence for user workouts
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    try {
      localStorage.removeItem('fithome_workouts_v1');
      localStorage.removeItem('fithome_prs_v1');
      localStorage.removeItem('fitpulse_workouts_v1');
      localStorage.removeItem('fitpulse_prs_v1');

      const saved = localStorage.getItem('fithome_user_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Persistence for user PRs
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fithome_user_prs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Persistence for Body Evolution: Weights
  const [bodyWeights, setBodyWeights] = useState<WeightEntry[]>(() => {
    try {
      const saved = localStorage.getItem('fithome_body_weights_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Persistence for Body Evolution: Measurements
  const [bodyMeasurements, setBodyMeasurements] = useState<MeasurementEntry[]>(() => {
    try {
      const saved = localStorage.getItem('fithome_body_measurements_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Persistence for Body Evolution: Goals
  const [bodyGoal, setBodyGoal] = useState<BodyGoal>(() => {
    try {
      const saved = localStorage.getItem('fithome_body_goal_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Persistence for Body Evolution: Photos
  const [bodyPhotos, setBodyPhotos] = useState<ProgressPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('fithome_body_photos_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // LocalStorage synchronization effects
  useEffect(() => {
    try {
      localStorage.setItem('fithome_user_sessions', JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('fithome_user_prs', JSON.stringify(personalRecords));
    } catch {
      // ignore
    }
  }, [personalRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('fithome_body_weights_v1', JSON.stringify(bodyWeights));
    } catch {
      // ignore
    }
  }, [bodyWeights]);

  useEffect(() => {
    try {
      localStorage.setItem('fithome_body_measurements_v1', JSON.stringify(bodyMeasurements));
    } catch {
      // ignore
    }
  }, [bodyMeasurements]);

  useEffect(() => {
    try {
      localStorage.setItem('fithome_body_goal_v1', JSON.stringify(bodyGoal));
    } catch {
      // ignore
    }
  }, [bodyGoal]);

  useEffect(() => {
    try {
      localStorage.setItem('fithome_body_photos_v1', JSON.stringify(bodyPhotos));
    } catch {
      // ignore
    }
  }, [bodyPhotos]);

  // Active workout state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutConfig, setWorkoutConfig] = useState<{
    title: string;
    exercises?: { exerciseId: string; defaultSets: number; defaultTarget: number }[];
  }>({
    title: 'Treino em Casa'
  });

  // --- WORKOUT HANDLERS ---
  const handleStartCustomWorkout = () => {
    setWorkoutConfig({
      title: 'Treino Livre em Casa',
      exercises: []
    });
    setIsWorkoutActive(true);
  };

  const handleStartTemplate = (template: RoutineTemplate) => {
    setWorkoutConfig({
      title: template.name,
      exercises: template.exercises
    });
    setIsWorkoutActive(true);
  };

  const handleStartWithExercise = (exercise: Exercise) => {
    const defaultVal = exercise.measurementType === 'seconds' ? 30 : 12;
    setWorkoutConfig({
      title: `Treino de ${exercise.namePt}`,
      exercises: [{ exerciseId: exercise.id, defaultSets: 3, defaultTarget: defaultVal }]
    });
    setIsWorkoutActive(true);
  };

  const handleRepeatSession = (pastSession: WorkoutSession) => {
    const exercises = pastSession.exercises.map(we => ({
      exerciseId: we.exerciseId,
      defaultSets: we.sets.length || 3,
      defaultTarget: we.sets[0]?.repsOrSeconds || 12
    }));

    setWorkoutConfig({
      title: pastSession.title,
      exercises
    });
    setIsWorkoutActive(true);
  };

  const handleSaveWorkout = (newSession: WorkoutSession, newRecords: PersonalRecord[]) => {
    setSessions(prev => [newSession, ...prev]);

    if (newRecords.length > 0) {
      setPersonalRecords(prev => {
        const updated = [...prev];
        newRecords.forEach(nr => {
          const existingIdx = updated.findIndex(p => p.exerciseId === nr.exerciseId);
          if (existingIdx >= 0) {
            updated[existingIdx] = nr;
          } else {
            updated.push(nr);
          }
        });
        return updated;
      });
    }

    setIsWorkoutActive(false);
    setActiveTab('progresso');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleClearHistory = () => {
    setSessions([]);
    setPersonalRecords([]);
    try {
      localStorage.removeItem('fithome_user_sessions');
      localStorage.removeItem('fithome_user_prs');
    } catch {
      // ignore
    }
  };

  // --- BODY EVOLUTION HANDLERS ---
  const handleSaveWeight = (
    entryData: Omit<WeightEntry, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setBodyWeights(prev =>
        prev.map(item =>
          item.id === existingId
            ? { ...item, ...entryData }
            : item
        )
      );
    } else {
      const newEntry: WeightEntry = {
        id: `weight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...entryData,
        createdAt: new Date().toISOString()
      };
      setBodyWeights(prev => [...prev, newEntry]);
    }
  };

  const handleDeleteWeight = (id: string) => {
    setBodyWeights(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveMeasurement = (
    entryData: Omit<MeasurementEntry, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setBodyMeasurements(prev =>
        prev.map(item =>
          item.id === existingId
            ? { ...item, ...entryData }
            : item
        )
      );
    } else {
      const newEntry: MeasurementEntry = {
        id: `measure-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...entryData,
        createdAt: new Date().toISOString()
      };
      setBodyMeasurements(prev => [...prev, newEntry]);
    }
  };

  const handleDeleteMeasurement = (id: string) => {
    setBodyMeasurements(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveGoal = (updatedGoal: BodyGoal) => {
    setBodyGoal(updatedGoal);
  };

  const handleSavePhoto = (photoData: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
    const newPhoto: ProgressPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...photoData,
      createdAt: new Date().toISOString()
    };
    setBodyPhotos(prev => [...prev, newPhoto]);
  };

  const handleDeletePhoto = (id: string) => {
    setBodyPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Data Export (Workouts + Body Evolution)
  const handleExportData = () => {
    const backup = {
      sessions,
      personalRecords,
      bodyWeights,
      bodyMeasurements,
      bodyGoal,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fithome_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Data Import
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed.sessions)) {
          setSessions(parsed.sessions);
        }
        if (Array.isArray(parsed.personalRecords)) {
          setPersonalRecords(parsed.personalRecords);
        }
        if (Array.isArray(parsed.bodyWeights)) {
          setBodyWeights(parsed.bodyWeights);
        }
        if (Array.isArray(parsed.bodyMeasurements)) {
          setBodyMeasurements(parsed.bodyMeasurements);
        }
        if (parsed.bodyGoal && typeof parsed.bodyGoal === 'object') {
          setBodyGoal(parsed.bodyGoal);
        }
      } catch {
        // ignore format error
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation (3 Zones) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Home className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-100 font-display">
              FitHome
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('progresso')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'progresso'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              Progresso Semanal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evolucao')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'evolucao'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              Evolução Corporal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exercicios')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'exercicios'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              Exercícios & Anatomia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rotinas')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'rotinas'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              Rotinas de Casa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'historico'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : ''
              }`}
            >
              Histórico ({sessions.length})
            </button>
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleStartCustomWorkout}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Iniciar Treino em Casa</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'progresso' && (
          <WeeklyProgress
            sessions={sessions}
            personalRecords={personalRecords}
            onStartWorkout={handleStartCustomWorkout}
          />
        )}

        {activeTab === 'evolucao' && (
          <BodyEvolution
            weights={bodyWeights}
            measurements={bodyMeasurements}
            goal={bodyGoal}
            photos={bodyPhotos}
            onSaveWeight={handleSaveWeight}
            onDeleteWeight={handleDeleteWeight}
            onSaveMeasurement={handleSaveMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
            onSaveGoal={handleSaveGoal}
            onSavePhoto={handleSavePhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {activeTab === 'exercicios' && (
          <ExerciseLibrary onStartWithExercise={handleStartWithExercise} />
        )}

        {activeTab === 'rotinas' && (
          <WorkoutRoutines
            onStartTemplate={handleStartTemplate}
            onCustomWorkout={handleStartCustomWorkout}
          />
        )}

        {activeTab === 'historico' && (
          <WorkoutHistory
            sessions={sessions}
            onRepeatSession={handleRepeatSession}
            onDeleteSession={handleDeleteSession}
            onClearHistory={handleClearHistory}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation (5 items) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-16 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('progresso')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'progresso' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">Progresso</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evolucao')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'evolucao' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">Evolução</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercicios')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'exercicios' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">Exercícios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rotinas')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'rotinas' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">Rotinas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'historico' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">Histórico</span>
        </button>
      </div>

      {/* Active Workout Logger Modal */}
      {isWorkoutActive && (
        <ActiveWorkoutModal
          initialTitle={workoutConfig.title}
          initialExercises={workoutConfig.exercises}
          previousRecords={personalRecords}
          onSaveWorkout={handleSaveWorkout}
          onClose={() => setIsWorkoutActive(false)}
        />
      )}
    </div>
  );
}
