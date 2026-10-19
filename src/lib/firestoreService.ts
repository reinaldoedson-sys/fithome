import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, cleanForFirestore } from './firebase';
import { WorkoutSession, PersonalRecord, RoutineTemplate } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../types/bodyEvolution';

// User Profile
export async function syncUserProfile(user: User) {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, path),
      cleanForFirestore({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Atleta FitHome',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync Workouts
export function subscribeUserWorkouts(
  userId: string,
  onData: (workouts: WorkoutSession[]) => void,
  onError?: (err: unknown) => void
) {
  const collectionPath = `users/${userId}/workouts`;
  try {
    const q = query(collection(db, collectionPath), orderBy('startTime', 'desc'));
    return onSnapshot(
      q,
      snapshot => {
        const list: WorkoutSession[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as WorkoutSession);
        });
        onData(list);
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

export async function saveUserWorkoutToFirestore(userId: string, workout: WorkoutSession) {
  const path = `users/${userId}/workouts/${workout.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...workout,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserWorkoutFromFirestore(userId: string, workoutId: string) {
  const path = `users/${userId}/workouts/${workoutId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Weights
export function subscribeUserWeights(
  userId: string,
  onData: (weights: WeightEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const collectionPath = `users/${userId}/weights`;
  try {
    const q = query(collection(db, collectionPath), orderBy('date', 'asc'));
    return onSnapshot(
      q,
      snapshot => {
        const list: WeightEntry[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as WeightEntry);
        });
        onData(list);
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

export async function saveUserWeightToFirestore(userId: string, weight: WeightEntry) {
  const path = `users/${userId}/weights/${weight.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...weight,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserWeightFromFirestore(userId: string, weightId: string) {
  const path = `users/${userId}/weights/${weightId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Measurements
export function subscribeUserMeasurements(
  userId: string,
  onData: (measurements: MeasurementEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const collectionPath = `users/${userId}/measurements`;
  try {
    const q = query(collection(db, collectionPath), orderBy('date', 'asc'));
    return onSnapshot(
      q,
      snapshot => {
        const list: MeasurementEntry[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as MeasurementEntry);
        });
        onData(list);
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

export async function saveUserMeasurementToFirestore(userId: string, measurement: MeasurementEntry) {
  const path = `users/${userId}/measurements/${measurement.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...measurement,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserMeasurementFromFirestore(userId: string, measurementId: string) {
  const path = `users/${userId}/measurements/${measurementId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Body Goal
export function subscribeUserGoal(
  userId: string,
  onData: (goal: BodyGoal) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/goals/current`;
  try {
    return onSnapshot(
      doc(db, path),
      docSnap => {
        if (docSnap.exists()) {
          onData(docSnap.data() as BodyGoal);
        }
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

export async function saveUserGoalToFirestore(userId: string, goal: BodyGoal) {
  const path = `users/${userId}/goals/current`;
  try {
    const cleaned = cleanForFirestore({
      ...goal,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserGoalFromFirestore(userId: string) {
  const path = `users/${userId}/goals/current`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Personal Records
export function subscribeUserRecords(
  userId: string,
  onData: (records: PersonalRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const collectionPath = `users/${userId}/records`;
  try {
    return onSnapshot(
      collection(db, collectionPath),
      snapshot => {
        const list: PersonalRecord[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as PersonalRecord);
        });
        onData(list);
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

export async function saveUserRecordToFirestore(userId: string, record: PersonalRecord) {
  const path = `users/${userId}/records/${record.exerciseId}`;
  try {
    const cleaned = cleanForFirestore({
      ...record,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserRecordFromFirestore(userId: string, exerciseId: string) {
  const path = `users/${userId}/records/${exerciseId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync Custom Routines
export function subscribeUserRoutines(
  userId: string,
  onData: (routines: RoutineTemplate[]) => void,
  onError?: (err: unknown) => void
) {
  const collectionPath = `users/${userId}/routines`;
  try {
    return onSnapshot(
      collection(db, collectionPath),
      snapshot => {
        const list: RoutineTemplate[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as RoutineTemplate);
        });
        onData(list);
      },
      error => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

export async function saveUserRoutineToFirestore(userId: string, routine: RoutineTemplate) {
  const path = `users/${userId}/routines/${routine.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...routine,
      userId
    });
    await setDoc(doc(db, path), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserRoutineFromFirestore(userId: string, routineId: string) {
  const path = `users/${userId}/routines/${routineId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk sync local cache to Firestore upon login or manual sync button
export async function uploadLocalDataToFirestore(
  userId: string,
  localData: {
    sessions?: WorkoutSession[];
    weights?: WeightEntry[];
    measurements?: MeasurementEntry[];
    goal?: BodyGoal;
    personalRecords?: PersonalRecord[];
    customRoutines?: RoutineTemplate[];
  }
): Promise<{ count: number; errors: string[] }> {
  const promises: Promise<void>[] = [];
  const errors: string[] = [];
  let count = 0;

  if (localData.sessions) {
    for (const s of localData.sessions) {
      if (s && s.id) {
        count++;
        promises.push(saveUserWorkoutToFirestore(userId, s));
      }
    }
  }

  if (localData.weights) {
    for (const w of localData.weights) {
      if (w && w.id) {
        count++;
        promises.push(saveUserWeightToFirestore(userId, w));
      }
    }
  }

  if (localData.measurements) {
    for (const m of localData.measurements) {
      if (m && m.id) {
        count++;
        promises.push(saveUserMeasurementToFirestore(userId, m));
      }
    }
  }

  if (localData.goal && (localData.goal.targetWeightKg !== undefined || localData.goal.customInitialWeightKg !== undefined)) {
    count++;
    promises.push(saveUserGoalToFirestore(userId, localData.goal));
  }

  if (localData.personalRecords) {
    for (const r of localData.personalRecords) {
      if (r && r.exerciseId) {
        count++;
        promises.push(saveUserRecordToFirestore(userId, r));
      }
    }
  }

  if (localData.customRoutines) {
    for (const cr of localData.customRoutines) {
      if (cr && cr.id) {
        count++;
        promises.push(saveUserRoutineToFirestore(userId, cr));
      }
    }
  }

  const results = await Promise.allSettled(promises);
  results.forEach(res => {
    if (res.status === 'rejected') {
      errors.push(String(res.reason));
    }
  });

  return { count, errors };
}
