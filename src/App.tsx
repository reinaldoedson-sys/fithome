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
import { auth, loginWithGoogle, logoutUser } from './lib/firebase';
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
  saveUserRecordToFirestore
} from './lib/firestoreService';
import { validateFitHomeBackup } from './utils/backupValidator';
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
  AlertCircle
} from 'lucide-react';
import {
  hasCategoryMigrated,
  markCategoryMigrated
} from './utils/migrationUtils';

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
  const [activeTab, setActiveTab] = useState<
    'progresso' | 'evolucao' | 'exercicios' | 'rotinas' | 'historico'
  >('progresso');

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

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

  // Firebase Realtime Subscriptions & User Lifecycle
  useEffect(() => {
    let unsubs: (() => void)[] = [];

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
        } catch {
          // ignore cache read error
        }

        let workoutsInitialHandled = false;
        let weightsInitialHandled = false;
        let measurementsInitialHandled = false;
        let recordsInitialHandled = false;
        let goalInitialHandled = false;

        // 1. Subscribe to live workouts (Independent category: workouts)
        const unsubWorkouts = subscribeUserWorkouts(currentUser.uid, remoteWorkouts => {
          const isMigrated = hasCategoryMigrated(currentUser.uid, 'workouts');

          if (remoteWorkouts && remoteWorkouts.length > 0) {
            setSessions(remoteWorkouts);
            markCategoryMigrated(currentUser.uid, 'workouts');
          } else if (!isMigrated && !workoutsInitialHandled) {
            workoutsInitialHandled = true;
            // One-time guest migration if cloud is empty on first snapshot
            const guestSessions = localStorage.getItem('fithome_guest_user_sessions') || localStorage.getItem('fithome_user_sessions');
            if (guestSessions) {
              try {
                const parsed = JSON.parse(guestSessions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  parsed.forEach((s: WorkoutSession) => saveUserWorkoutToFirestore(currentUser.uid, s));
                  setSessions(parsed);
                } else {
                  setSessions([]);
                }
              } catch {
                setSessions([]);
              }
            } else {
              setSessions([]);
            }
            markCategoryMigrated(currentUser.uid, 'workouts');
          } else {
            // Authorized state: collection was cleared / user deleted all records
            setSessions([]);
          }
          workoutsInitialHandled = true;
        });
        unsubs.push(unsubWorkouts);

        // 2. Subscribe to live weights (Independent category: weights)
        const unsubWeights = subscribeUserWeights(currentUser.uid, remoteWeights => {
          const isMigrated = hasCategoryMigrated(currentUser.uid, 'weights');

          if (remoteWeights && remoteWeights.length > 0) {
            setBodyWeights(remoteWeights);
            markCategoryMigrated(currentUser.uid, 'weights');
          } else if (!isMigrated && !weightsInitialHandled) {
            weightsInitialHandled = true;
            const guestWeights = localStorage.getItem('fithome_guest_body_weights_v1') || localStorage.getItem('fithome_body_weights_v1');
            if (guestWeights) {
              try {
                const parsed = JSON.parse(guestWeights);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  parsed.forEach((w: WeightEntry) => saveUserWeightToFirestore(currentUser.uid, w));
                  setBodyWeights(parsed);
                } else {
                  setBodyWeights([]);
                }
              } catch {
                setBodyWeights([]);
              }
            } else {
              setBodyWeights([]);
            }
            markCategoryMigrated(currentUser.uid, 'weights');
          } else {
            setBodyWeights([]);
          }
          weightsInitialHandled = true;
        });
        unsubs.push(unsubWeights);

        // 3. Subscribe to live measurements (Independent category: measurements)
        const unsubMeasurements = subscribeUserMeasurements(currentUser.uid, remoteMeasures => {
          const isMigrated = hasCategoryMigrated(currentUser.uid, 'measurements');

          if (remoteMeasures && remoteMeasures.length > 0) {
            setBodyMeasurements(remoteMeasures);
            markCategoryMigrated(currentUser.uid, 'measurements');
          } else if (!isMigrated && !measurementsInitialHandled) {
            measurementsInitialHandled = true;
            const guestMeasures = localStorage.getItem('fithome_guest_body_measurements_v1') || localStorage.getItem('fithome_body_measurements_v1');
            if (guestMeasures) {
              try {
                const parsed = JSON.parse(guestMeasures);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  parsed.forEach((m: MeasurementEntry) => saveUserMeasurementToFirestore(currentUser.uid, m));
                  setBodyMeasurements(parsed);
                } else {
                  setBodyMeasurements([]);
                }
              } catch {
                setBodyMeasurements([]);
              }
            } else {
              setBodyMeasurements([]);
            }
            markCategoryMigrated(currentUser.uid, 'measurements');
          } else {
            setBodyMeasurements([]);
          }
          measurementsInitialHandled = true;
        });
        unsubs.push(unsubMeasurements);

        // 4. Subscribe to live body goal (Independent category: goals)
        const unsubGoal = subscribeUserGoal(currentUser.uid, remoteGoal => {
          const isMigrated = hasCategoryMigrated(currentUser.uid, 'goals');
          const hasRemoteGoal =
            remoteGoal &&
            typeof remoteGoal === 'object' &&
            Object.keys(remoteGoal).length > 0 &&
            (remoteGoal.targetWeightKg !== undefined ||
              remoteGoal.customInitialWeightKg !== undefined ||
              remoteGoal.heightCm !== undefined);

          if (hasRemoteGoal) {
            setBodyGoal(remoteGoal);
            markCategoryMigrated(currentUser.uid, 'goals');
          } else if (!isMigrated && !goalInitialHandled) {
            goalInitialHandled = true;
            const guestGoalStr =
              localStorage.getItem('fithome_guest_body_goal_v1') ||
              localStorage.getItem('fithome_body_goal_v1');
            if (guestGoalStr) {
              try {
                const parsed = JSON.parse(guestGoalStr);
                if (
                  parsed &&
                  typeof parsed === 'object' &&
                  Object.keys(parsed).length > 0 &&
                  (parsed.targetWeightKg !== undefined ||
                    parsed.customInitialWeightKg !== undefined ||
                    parsed.heightCm !== undefined)
                ) {
                  saveUserGoalToFirestore(currentUser.uid, parsed);
                  setBodyGoal(parsed);
                } else {
                  setBodyGoal({});
                }
              } catch {
                setBodyGoal({});
              }
            } else {
              setBodyGoal({});
            }
            markCategoryMigrated(currentUser.uid, 'goals');
          } else {
            setBodyGoal({});
          }
          goalInitialHandled = true;
        });
        unsubs.push(unsubGoal);

        // 5. Subscribe to live PRs (Independent category: records)
        const unsubRecords = subscribeUserRecords(currentUser.uid, remoteRecords => {
          const isMigrated = hasCategoryMigrated(currentUser.uid, 'records');

          if (remoteRecords && remoteRecords.length > 0) {
            setPersonalRecords(remoteRecords);
            markCategoryMigrated(currentUser.uid, 'records');
          } else if (!isMigrated && !recordsInitialHandled) {
            recordsInitialHandled = true;
            const guestPRs = localStorage.getItem('fithome_guest_user_prs') || localStorage.getItem('fithome_user_prs');
            if (guestPRs) {
              try {
                const parsed = JSON.parse(guestPRs);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  parsed.forEach((r: PersonalRecord) => saveUserRecordToFirestore(currentUser.uid, r));
                  setPersonalRecords(parsed);
                } else {
                  setPersonalRecords([]);
                }
              } catch {
                setPersonalRecords([]);
              }
            } else {
              setPersonalRecords([]);
            }
            markCategoryMigrated(currentUser.uid, 'records');
          } else {
            setPersonalRecords([]);
          }
          recordsInitialHandled = true;
        });
        unsubs.push(unsubRecords);
      } else {
        // When logged out, reset memory state to guest cache
        setSessions(loadInitial('user_sessions', []));
        setPersonalRecords(loadInitial('user_prs', []));
        setBodyWeights(loadInitial('body_weights_v1', []));
        setBodyMeasurements(loadInitial('body_measurements_v1', []));
        setBodyGoal(loadInitial('body_goal_v1', {}));
        setBodyPhotos(loadInitial('body_photos_v1', []));
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
    sessions.forEach(s => {
      if (user) deleteUserWorkoutFromFirestore(user.uid, s.id);
    });
    setSessions([]);
    setPersonalRecords([]);
    try {
      localStorage.removeItem(getStorageKey('user_sessions', user?.uid));
      localStorage.removeItem(getStorageKey('user_prs', user?.uid));
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

  // Data Export (Workouts + Body Evolution + Progress Photos)
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
      setSyncToast('Backup completo exportado com sucesso!');
      setTimeout(() => setSyncToast(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setAuthError('Falha ao gerar o arquivo de backup.');
      setTimeout(() => setAuthError(null), 4000);
    }
  };

  // Data Import with strict all-or-nothing validation & quota handling
  const handleImportData = (file: File) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      setAuthError('Falha de leitura do arquivo selecionado.');
      setTimeout(() => setAuthError(null), 4000);
    };

    reader.onload = e => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          setAuthError('Não foi possível ler o conteúdo do arquivo.');
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
        let photoQuotaWarning = false;

        if (parsed.sessions) {
          setSessions(parsed.sessions);
          if (user) {
            parsed.sessions.forEach((s: WorkoutSession) => saveUserWorkoutToFirestore(user.uid, s));
            markCategoryMigrated(user.uid, 'workouts');
          }
        }

        if (parsed.personalRecords) {
          setPersonalRecords(parsed.personalRecords);
          if (user) {
            parsed.personalRecords.forEach((r: PersonalRecord) => saveUserRecordToFirestore(user.uid, r));
            markCategoryMigrated(user.uid, 'records');
          }
        }

        if (parsed.bodyWeights) {
          setBodyWeights(parsed.bodyWeights);
          if (user) {
            parsed.bodyWeights.forEach((w: WeightEntry) => saveUserWeightToFirestore(user.uid, w));
            markCategoryMigrated(user.uid, 'weights');
          }
        }

        if (parsed.bodyMeasurements) {
          setBodyMeasurements(parsed.bodyMeasurements);
          if (user) {
            parsed.bodyMeasurements.forEach((m: MeasurementEntry) => saveUserMeasurementToFirestore(user.uid, m));
            markCategoryMigrated(user.uid, 'measurements');
          }
        }

        if (parsed.bodyGoal) {
          setBodyGoal(parsed.bodyGoal);
          if (user) {
            saveUserGoalToFirestore(user.uid, parsed.bodyGoal);
            markCategoryMigrated(user.uid, 'goals');
          }
        }

        // Photos restoration: Local storage only (never uploaded to Firestore!)
        if (parsed.bodyPhotos) {
          try {
            const key = getStorageKey('body_photos_v1', user?.uid);
            localStorage.setItem(key, JSON.stringify(parsed.bodyPhotos));
            setBodyPhotos(parsed.bodyPhotos);
          } catch (storageErr) {
            console.warn('Storage quota limit reached while saving photos:', storageErr);
            photoQuotaWarning = true;
            // Best effort memory load
            setBodyPhotos(parsed.bodyPhotos.slice(0, 5));
          }
        }

        if (photoQuotaWarning) {
          setAuthError(
            'Dados restaurados com sucesso! No entanto, o limite de armazenamento local do navegador atingiu a cota máxima para fotos.'
          );
          setTimeout(() => setAuthError(null), 6000);
        } else {
          setSyncToast('Backup completo importado com sucesso!');
          setTimeout(() => setSyncToast(null), 3500);
        }
      } catch (err) {
        console.error('Import processing error:', err);
        setAuthError('Erro inesperado ao processar o arquivo de backup.');
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
                Treinos em Casa & Evolução
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

          {/* Zone 3: Cloud Sync + Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Firebase Auth / Cloud Status */}
            {isAuthLoading ? (
              <div className="p-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
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
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                  </div>
                  <span className="hidden xl:inline text-xs text-slate-300 max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0] || 'Atleta'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nuvem Ativa</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Desconectar do Firebase"
                  className="p-1 hover:text-rose-400 text-slate-500 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-sm active:scale-95"
                title="Sincronizar seus dados na nuvem com Firebase"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Conectar Nuvem</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleStartCustomWorkout}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Iniciar Treino em Casa</span>
              <span className="sm:hidden">Treinar</span>
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
