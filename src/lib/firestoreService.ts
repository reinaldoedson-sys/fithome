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
import { db, handleFirestoreError, OperationType } from './firebase';
import { WorkoutSession, PersonalRecord } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../types/bodyEvolution';

// User Profile
export async function syncUserProfile(user: User) {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, path),
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Atleta FitHome',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      },
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
    await setDoc(doc(db, path), workout);
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
    await setDoc(doc(db, path), weight);
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
    await setDoc(doc(db, path), measurement);
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
    await setDoc(doc(db, path), goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
    await setDoc(doc(db, path), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Bulk sync local cache to Firestore upon login if user wishes
export async function uploadLocalDataToFirestore(
  userId: string,
  localData: {
    sessions: WorkoutSession[];
    weights: WeightEntry[];
    measurements: MeasurementEntry[];
    goal: BodyGoal;
    personalRecords: PersonalRecord[];
  }
) {
  const promises: Promise<void>[] = [];

  for (const s of localData.sessions) {
    promises.push(saveUserWorkoutToFirestore(userId, s));
  }
  for (const w of localData.weights) {
    promises.push(saveUserWeightToFirestore(userId, w));
  }
  for (const m of localData.measurements) {
    promises.push(saveUserMeasurementToFirestore(userId, m));
  }
  if (localData.goal && (localData.goal.targetWeightKg || localData.goal.customInitialWeightKg)) {
    promises.push(saveUserGoalToFirestore(userId, localData.goal));
  }
  for (const r of localData.personalRecords) {
    promises.push(saveUserRecordToFirestore(userId, r));
  }

  await Promise.allSettled(promises);
}

