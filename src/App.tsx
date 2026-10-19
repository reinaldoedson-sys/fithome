import React, { useState, useEffect, useRef } from 'react';
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
import { auth, loginWithGoogle, logoutUser, checkRedirectAuth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  syncUserProfile,
  subscribeUserWorkouts,
  saveUserWorkoutToFirestore,
  deleteUserWorkoutFromFirestore,
  subscribeUserWeights,
  saveUserWeightToFirestore,
  deleteUserWeightFromFirestore,
  subscribeUserMeasurements,
  saveUserMeasurementToFirestore,
  deleteUserMeasurementFromFirestore,
  subscribeUserGoal,
  saveUserGoalToFirestore,
  subscribeUserRecords,
  saveUserRecordToFirestore,
  deleteUserRecordFromFirestore,
  subscribeUserRoutines,
  saveUserRoutineToFirestore,
  deleteUserRoutineFromFirestore
} from './lib/firestoreService';
import { validateFitHomeBackup, FitHomeBackup } from './utils/backupValidator';
import { RestoreConfirmModal } from './components/RestoreConfirmModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  handleCategorySnapshot,
  syncRestoredBackupToFirestore
} from './services/migrationService';
import {
  executeBackupRestore,
  RestoreMode,
  ExistingAppState
} from './services/backupRestoreService';
import {
  Home,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Scale,
  Cloud,
  CheckCircle2,
  LogOut,
  LogIn,
  Loader2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import {
  hasCategoryMigrated,
  markCategoryMigrated
} from './utils/migrationUtils';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageSelector } from './components/LanguageSelector';

// Helper to scope localStorage by user ID or 'guest'
function getStorageKey(key: string, uid?: string | null): string {
  return uid ? `fithome_user_${uid}_${key}` : `fithome_guest_${key}`;
}

function loadInitial<T>(key: string, fallback: T): T {
  try {
    // Try current guest key or legacy key
    const saved = localStorage.getItem(`fithome_guest_${key}`) || localStorage.getItem(`fithome_${key}`);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return fallback;
}

export default function App() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'progresso' | 'evolucao' | 'exercicios' | 'rotinas' | 'historico'
  >('progresso');

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingRestoreBackup, setPendingRestoreBackup] = useState<FitHomeBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Reference to hold current user ID across callbacks
  const currentUserIdRef = useRef<string | null>(null);

  // State for user workouts
  const [sessions, setSessions] = useState<WorkoutSession[]>(() =>
    loadInitial('user_sessions', [])
  );

  // State for user PRs
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() =>
    loadInitial('user_prs', [])
  );

  // State for Body Evolution: Weights
  const [bodyWeights, setBodyWeights] = useState<WeightEntry[]>(() =>
    loadInitial('body_weights_v1', [])
  );

  // State for Body Evolution: Measurements
  const [bodyMeasurements, setBodyMeasurements] = useState<MeasurementEntry[]>(() =>
    loadInitial('body_measurements_v1', [])
  );

  // State for Body Evolution: Goals
  const [bodyGoal, setBodyGoal] = useState<BodyGoal>(() =>
    loadInitial('body_goal_v1', {})
  );

  // State for Body Evolution: Photos
  const [bodyPhotos, setBodyPhotos] = useState<ProgressPhoto[]>(() =>
    loadInitial('body_photos_v1', [])
  );

  // State for user custom routines
  const [customRoutines, setCustomRoutines] = useState<RoutineTemplate[]>(() =>
    loadInitial('custom_routines_v1', [])
  );

  // LocalStorage synchronization effects (user-isolated offline cache)
  useEffect(() => {
    try {
      const key = getStorageKey('user_sessions', user?.uid);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('user_prs', user?.uid);
      localStorage.setItem(key, JSON.stringify(personalRecords));
    } catch {
      // ignore
    }
  }, [personalRecords, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('body_weights_v1', user?.uid);
      localStorage.setItem(key, JSON.stringify(bodyWeights));
    } catch {
      // ignore
    }
  }, [bodyWeights, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('body_measurements_v1', user?.uid);
      localStorage.setItem(key, JSON.stringify(bodyMeasurements));
    } catch {
      // ignore
    }
  }, [bodyMeasurements, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('body_goal_v1', user?.uid);
      localStorage.setItem(key, JSON.stringify(bodyGoal));
    } catch {
      // ignore
    }
  }, [bodyGoal, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('body_photos_v1', user?.uid);
      localStorage.setItem(key, JSON.stringify(bodyPhotos));
    } catch {
      // ignore
    }
  }, [bodyPhotos, user?.uid]);

  useEffect(() => {
    try {
      const key = getStorageKey('custom_routines_v1', user?.uid);
      localStorage.setItem(key, JSON.stringify(customRoutines));
    } catch {
      // ignore
    }
  }, [customRoutines, user?.uid]);

  // Firebase Realtime Subscriptions & User Lifecycle
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    // Check if user just returned from mobile redirect authentication
    checkRedirectAuth()
      .then(res => {
        if (res?.user) {
          setSyncToast('Conectado via Google com sucesso! Dados sincronizados na nuvem.');
          setTimeout(() => setSyncToast(null), 4000);
        }
      })
      .catch(err => {
        console.warn('Redirect auth check warning:', err);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
      currentUserIdRef.current = currentUser ? currentUser.uid : null;
      setUser(currentUser);
      setIsAuthLoading(false);

      // Clean up previous listeners
      unsubs.forEach(fn => fn());
      unsubs = [];

      if (currentUser) {
        // Sync user profile in Firestore
        syncUserProfile(currentUser).catch(err => console.error('Profile sync error:', err));

        // Load any user-cached records first
        try {
          const cachedWeights = localStorage.getItem(getStorageKey('body_weights_v1', currentUser.uid));
          if (cachedWeights) setBodyWeights(JSON.parse(cachedWeights));

          const cachedMeasures = localStorage.getItem(getStorageKey('body_measurements_v1', currentUser.uid));
          if (cachedMeasures) setBodyMeasurements(JSON.parse(cachedMeasures));

          const cachedGoal = localStorage.getItem(getStorageKey('body_goal_v1', currentUser.uid));
          if (cachedGoal) setBodyGoal(JSON.parse(cachedGoal));

          const cachedSessions = localStorage.getItem(getStorageKey('user_sessions', currentUser.uid));
          if (cachedSessions) setSessions(JSON.parse(cachedSessions));

          const cachedPRs = localStorage.getItem(getStorageKey('user_prs', currentUser.uid));
          if (cachedPRs) setPersonalRecords(JSON.parse(cachedPRs));

          const cachedPhotos = localStorage.getItem(getStorageKey('body_photos_v1', currentUser.uid));
          if (cachedPhotos) setBodyPhotos(JSON.parse(cachedPhotos));

          const cachedRoutines = localStorage.getItem(getStorageKey('custom_routines_v1', currentUser.uid));
          if (cachedRoutines) setCustomRoutines(JSON.parse(cachedRoutines));
        } catch {
          // ignore cache read error
        }

        // 1. Subscribe to live workouts (Independent category: workouts)
        const unsubWorkouts = subscribeUserWorkouts(currentUser.uid, remoteWorkouts => {
          handleCategorySnapshot(currentUser.uid, 'workouts', remoteWorkouts, setSessions);
        });
        unsubs.push(unsubWorkouts);

        // 2. Subscribe to live weights (Independent category: weights)
        const unsubWeights = subscribeUserWeights(currentUser.uid, remoteWeights => {
          handleCategorySnapshot(currentUser.uid, 'weights', remoteWeights, setBodyWeights);
        });
        unsubs.push(unsubWeights);

        // 3. Subscribe to live measurements (Independent category: measurements)
        const unsubMeasurements = subscribeUserMeasurements(currentUser.uid, remoteMeasures => {
          handleCategorySnapshot(currentUser.uid, 'measurements', remoteMeasures, setBodyMeasurements);
        });
        unsubs.push(unsubMeasurements);

        // 4. Subscribe to live body goal (Independent category: goals)
        const unsubGoal = subscribeUserGoal(currentUser.uid, remoteGoal => {
          handleCategorySnapshot(currentUser.uid, 'goals', remoteGoal, setBodyGoal);
        });
        unsubs.push(unsubGoal);

        // 5. Subscribe to live PRs (Independent category: records)
        const unsubRecords = subscribeUserRecords(currentUser.uid, remoteRecords => {
          handleCategorySnapshot(currentUser.uid, 'records', remoteRecords, setPersonalRecords);
        });
        unsubs.push(unsubRecords);

        // 6. Subscribe to live custom routines
        const unsubRoutines = subscribeUserRoutines(currentUser.uid, remoteRoutines => {
          if (remoteRoutines && remoteRoutines.length > 0) {
            setCustomRoutines(remoteRoutines);
          }
        });
        unsubs.push(unsubRoutines);
      } else {
        // When logged out, reset memory state to guest cache
        setSessions(loadInitial('user_sessions', []));
        setPersonalRecords(loadInitial('user_prs', []));
        setBodyWeights(loadInitial('body_weights_v1', []));
        setBodyMeasurements(loadInitial('body_measurements_v1', []));
        setBodyGoal(loadInitial('body_goal_v1', {}));
        setBodyPhotos(loadInitial('body_photos_v1', []));
        setCustomRoutines(loadInitial('custom_routines_v1', []));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(fn => fn());
    };
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
      setSyncToast('Conectado ao Firebase com sucesso! Dados sincronizados na nuvem.');
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setAuthError('Não foi possível conectar com o Google no momento.');
      setTimeout(() => setAuthError(null), 4000);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setSyncToast('Desconectado do Firebase. Modo local ativado.');
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

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

    // Sync to Firestore if authenticated
    if (user) {
      saveUserWorkoutToFirestore(user.uid, newSession);
      newRecords.forEach(nr => {
        saveUserRecordToFirestore(user.uid, nr);
      });
    }

    setIsWorkoutActive(false);
    setActiveTab('progresso');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (user) {
      deleteUserWorkoutFromFirestore(user.uid, sessionId);
    }
  };

  const handleClearHistory = () => {
    if (user) {
      sessions.forEach(s => deleteUserWorkoutFromFirestore(user.uid, s.id));
      personalRecords.forEach(pr => deleteUserRecordFromFirestore(user.uid, pr.exerciseId));
    }
    setSessions([]);
    setPersonalRecords([]);
    try {
      localStorage.removeItem(getStorageKey('user_sessions', user?.uid));
      localStorage.removeItem(getStorageKey('user_prs', user?.uid));
    } catch {
      // ignore
    }
    setSyncToast('Histórico de treinos e recordes apagado com sucesso.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // --- BODY EVOLUTION HANDLERS ---
  const handleSaveWeight = (
    entryData: Omit<WeightEntry, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      let updatedEntry: WeightEntry | null = null;
      setBodyWeights(prev =>
        prev.map(item => {
          if (item.id === existingId) {
            updatedEntry = { ...item, ...entryData };
            return updatedEntry;
          }
          return item;
        })
      );
      if (user && updatedEntry) {
        saveUserWeightToFirestore(user.uid, updatedEntry);
      }
    } else {
      const newEntry: WeightEntry = {
        id: `weight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...entryData,
        createdAt: new Date().toISOString()
      };
      setBodyWeights(prev => [...prev, newEntry]);
      if (user) {
        saveUserWeightToFirestore(user.uid, newEntry);
      }
    }
  };

  const handleDeleteWeight = (id: string) => {
    setBodyWeights(prev => prev.filter(item => item.id !== id));
    if (user) {
      deleteUserWeightFromFirestore(user.uid, id);
    }
  };

  const handleSaveMeasurement = (
    entryData: Omit<MeasurementEntry, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      let updatedEntry: MeasurementEntry | null = null;
      setBodyMeasurements(prev =>
        prev.map(item => {
          if (item.id === existingId) {
            updatedEntry = { ...item, ...entryData };
            return updatedEntry;
          }
          return item;
        })
      );
      if (user && updatedEntry) {
        saveUserMeasurementToFirestore(user.uid, updatedEntry);
      }
    } else {
      const newEntry: MeasurementEntry = {
        id: `measure-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...entryData,
        createdAt: new Date().toISOString()
      };
      setBodyMeasurements(prev => [...prev, newEntry]);
      if (user) {
        saveUserMeasurementToFirestore(user.uid, newEntry);
      }
    }
  };

  const handleDeleteMeasurement = (id: string) => {
    setBodyMeasurements(prev => prev.filter(item => item.id !== id));
    if (user) {
      deleteUserMeasurementFromFirestore(user.uid, id);
    }
  };

  const handleSaveGoal = (updatedGoal: BodyGoal) => {
    setBodyGoal(updatedGoal);
    if (user) {
      saveUserGoalToFirestore(user.uid, updatedGoal);
    }
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

  const handleSaveCustomRoutine = (routine: RoutineTemplate) => {
    setCustomRoutines(prev => {
      const idx = prev.findIndex(r => r.id === routine.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = routine;
        return copy;
      }
      return [routine, ...prev];
    });

    if (user) {
      saveUserRoutineToFirestore(user.uid, routine);
    }

    setSyncToast(
      language === 'en'
        ? 'Custom routine saved!'
        : language === 'es'
        ? '¡Rutina personalizada guardada!'
        : 'Rotina personalizada salva!'
    );
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleDeleteCustomRoutine = (routineId: string) => {
    setCustomRoutines(prev => prev.filter(r => r.id !== routineId));

    if (user) {
      deleteUserRoutineFromFirestore(user.uid, routineId);
    }

    setSyncToast(
      language === 'en'
        ? 'Custom routine removed.'
        : language === 'es'
        ? 'Rutina personalizada eliminada.'
        : 'Rotina personalizada removida.'
    );
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Data Export (Workouts + Body Evolution + Progress Photos + Custom Routines)
  const handleExportData = () => {
    try {
      const backup = {
        version: '2.0',
        sessions,
        personalRecords,
        bodyWeights,
        bodyMeasurements,
        bodyGoal,
        bodyPhotos, // Photos included in JSON export
        customRoutines, // Custom routines included in backup
        exportedAt: new Date().toISOString()
      };
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fithome_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSyncToast(
        language === 'en'
          ? 'Full backup successfully exported!'
          : language === 'es'
          ? '¡Copia de seguridad completa exportada con éxito!'
          : 'Backup completo exportado com sucesso!'
      );
      setTimeout(() => setSyncToast(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setAuthError(
        language === 'en'
          ? 'Failed to generate backup file.'
          : language === 'es'
          ? 'Error al generar el archivo de copia de seguridad.'
          : 'Falha ao gerar o arquivo de backup.'
      );
      setTimeout(() => setAuthError(null), 4000);
    }
  };

  // Data Restore Execution: handles atomic state update, quota safety, and async Firestore sync
  const executeRestore = async (parsed: FitHomeBackup, mode: RestoreMode = 'merge') => {
    setIsRestoring(true);
    try {
      const existingState: ExistingAppState = {
        sessions,
        personalRecords,
        bodyWeights,
        bodyMeasurements,
        bodyGoal,
        bodyPhotos
      };

      const result = await executeBackupRestore(
        mode,
        existingState,
        parsed,
        user?.uid
      );

      // 1. Update React state with the resulting merged or replaced state
      setSessions(result.data.sessions);
      setPersonalRecords(result.data.personalRecords);
      setBodyWeights(result.data.bodyWeights);
      setBodyMeasurements(result.data.bodyMeasurements);
      setBodyGoal(result.data.bodyGoal);
      setBodyPhotos(result.data.bodyPhotos);

      // 2. Feedback reporting
      if (result.isPartial) {
        setAuthError(
          language === 'en'
            ? `Partial restore: local data updated, but cloud sync had errors (${result.errors.join(', ')}). You can try again.`
            : language === 'es'
            ? `Restauración parcial: datos locales actualizados, pero hubo error en la nube (${result.errors.join(', ')}). Puedes intentarlo de nuevo.`
            : `Restauração parcial: dados locais atualizados, mas houve falha na nuvem (${result.errors.join(', ')}). Você pode tentar novamente.`
        );
        setTimeout(() => setAuthError(null), 7000);
      } else if (result.photoQuotaExceeded) {
        setAuthError(
          language === 'en'
            ? 'Backup restored! However, browser local storage quota was reached for progress photos.'
            : language === 'es'
            ? '¡Copia restaurada! Sin embargo, se alcanzó el límite de almacenamiento del navegador para fotos corporales.'
            : 'Backup restaurado! Porém, o limite de espaço de armazenamento local do navegador foi atingido para fotos corporais.'
        );
        setTimeout(() => setAuthError(null), 6000);
      } else {
        const modeLabel = mode === 'replace'
          ? (language === 'en' ? 'replaced' : language === 'es' ? 'reemplazado' : 'substituído')
          : (language === 'en' ? 'merged' : language === 'es' ? 'combinado' : 'mesclado');
        setSyncToast(
          language === 'en'
            ? `Backup ${modeLabel} and synced successfully!`
            : language === 'es'
            ? `¡Copia de seguridad ${modeLabel} y sincronizada con éxito!`
            : `Backup ${modeLabel} e sincronizado com sucesso!`
        );
        setTimeout(() => setSyncToast(null), 3500);
      }
    } catch (err) {
      console.error('Import processing error:', err);
      setAuthError(
        language === 'en'
          ? 'Unexpected error processing backup file.'
          : language === 'es'
          ? 'Error inesperado al procesar el archivo de copia de seguridad.'
          : 'Erro inesperado ao processar o arquivo de backup.'
      );
      setTimeout(() => setAuthError(null), 4000);
    } finally {
      setIsRestoring(false);
      setPendingRestoreBackup(null);
    }
  };

  // Data Import with strict all-or-nothing validation, user confirmation, & quota handling
  const handleImportData = (file: File) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      setAuthError(
        language === 'en'
          ? 'Failed to read selected file.'
          : language === 'es'
          ? 'Error al leer el archivo seleccionado.'
          : 'Falha de leitura do arquivo selecionado.'
      );
      setTimeout(() => setAuthError(null), 4000);
    };

    reader.onload = e => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          setAuthError(
            language === 'en'
              ? 'Could not read file content.'
              : language === 'es'
              ? 'No se pudo leer el contenido del archivo.'
              : 'Não foi possível ler o conteúdo do arquivo.'
          );
          setTimeout(() => setAuthError(null), 4000);
          return;
        }

        // Strict schema validation before any state mutation
        const validation = validateFitHomeBackup(text);
        if (!validation.isValid) {
          setAuthError(validation.error);
          setTimeout(() => setAuthError(null), 5000);
          return;
        }

        const parsed = validation.data;
        const hasExistingData =
          sessions.length > 0 ||
          personalRecords.length > 0 ||
          bodyWeights.length > 0 ||
          bodyMeasurements.length > 0 ||
          (bodyGoal && Object.keys(bodyGoal).length > 0) ||
          bodyPhotos.length > 0;

        if (hasExistingData) {
          // Solicit user confirmation before overwriting existing data
          setPendingRestoreBackup(parsed);
        } else {
          executeRestore(parsed, 'replace');
        }
      } catch (err) {
        console.error('Import reading error:', err);
        setAuthError(
          language === 'en'
            ? 'Unexpected error processing backup file.'
            : language === 'es'
            ? 'Error inesperado al procesar el archivo de copia de seguridad.'
            : 'Erro inesperado ao processar o arquivo de backup.'
        );
        setTimeout(() => setAuthError(null), 4000);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Notification Toasts */}
      {syncToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm rounded-xl shadow-xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {authError && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs sm:text-sm rounded-xl shadow-xl backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* In-App PWA Installation Prompt / Banner */}
      <PWAInstallBanner />

      {/* Top Bar Navigation (3 Zones) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Home className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-100 font-display leading-tight">
                FitHome
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline -mt-0.5">
                {language === 'en' ? 'Home Workouts & Body Evolution' : language === 'es' ? 'Entrenamientos en Casa y Evolución' : 'Treinos em Casa & Evolução'}
              </span>
            </div>
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
              {t.nav.progress}
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
              {t.nav.evolution}
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
              {t.nav.exercises}
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
              {t.nav.routines}
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
              {t.nav.historyCount(sessions.length)}
            </button>
          </nav>

          {/* Zone 3: Language Selector + Cloud Sync + Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Firebase Auth / Cloud Status */}
            {isAuthLoading ? (
              <div className="p-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : user ? (
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 rounded-xl text-xs text-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Gerenciar sincronização na nuvem"
              >
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500/50"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
                </div>
                <span className="hidden xl:inline text-xs text-slate-300 max-w-[90px] truncate">
                  {user.displayName?.split(' ')[0] || 'Atleta'}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.common.cloudActive}</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Conectar com o Google para sincronizar entre computador e celular"
              >
                <Cloud className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sincronizar Nuvem</span>
                <span className="sm:hidden font-bold">Sincronizar</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
            )}

            {/* PWA Mobile / Install Modal Button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title={language === 'en' ? 'Install on Mobile (PWA)' : language === 'es' ? 'Instalar en el Móvil (PWA)' : 'Instalar no Celular (PWA)'}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{language === 'en' ? 'Install App' : language === 'es' ? 'Instalar App' : 'Instalar no Celular'}</span>
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleStartCustomWorkout}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{t.common.startWorkout}</span>
              <span className="sm:hidden">{t.common.start}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {/* Sync guidance banner for unauthenticated users */}
        {!user && (
          <div className="mb-6 p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900/90 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  Sincronização entre Web e Celular
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                  Conecte a mesma conta Google no PC e no celular para ver seus treinos e evolução em tempo real.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Conectar e Sincronizar</span>
            </button>
          </div>
        )}
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
            customRoutines={customRoutines}
            onStartTemplate={handleStartTemplate}
            onCustomWorkout={handleStartCustomWorkout}
            onSaveCustomRoutine={handleSaveCustomRoutine}
            onDeleteCustomRoutine={handleDeleteCustomRoutine}
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

      {/* Mobile Fixed Bottom Navigation (5 items) with iPhone Safe Area padding */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-16 pb-[env(safe-area-inset-bottom,0px)] px-1">
        <button
          type="button"
          onClick={() => setActiveTab('progresso')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'progresso' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">{t.nav.progress.split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evolucao')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'evolucao' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">{t.nav.evolution.split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercicios')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'exercicios' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">{t.nav.exercises.split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rotinas')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'rotinas' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">{t.nav.routines.split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'historico' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1 truncate">{t.nav.history}</span>
        </button>
      </div>

      {/* Offline Connectivity Toast Indicator */}
      <OfflineIndicator />

      {/* PWA Full Installation & QR Code Guide Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

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

      {/* Backup Restoration Confirmation Modal */}
      {pendingRestoreBackup && (
        <RestoreConfirmModal
          backup={pendingRestoreBackup}
          onConfirm={(mode) => executeRestore(pendingRestoreBackup, mode)}
          onClose={() => setPendingRestoreBackup(null)}
          isRestoring={isRestoring}
        />
      )}

      {/* Cloud Sync Status & Multi-Device Manager Modal */}
      <CloudSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sessions={sessions}
        bodyWeights={bodyWeights}
        bodyMeasurements={bodyMeasurements}
        bodyGoal={bodyGoal}
        personalRecords={personalRecords}
      />
    </div>
  );
}
