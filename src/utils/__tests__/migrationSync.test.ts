import { describe, it, expect, beforeEach } from 'vitest';

describe('Migration and sync state logic', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  });

  const getStorageKey = (key: string, uid?: string | null) => {
    return uid ? `fithome_user_${uid}_${key}` : `fithome_guest_${key}`;
  };

  const hasUserMigrated = (uid: string) => {
    return mockStorage[`fithome_migrated_${uid}`] === 'true';
  };

  const markUserMigrated = (uid: string) => {
    mockStorage[`fithome_migrated_${uid}`] = 'true';
  };

  it('preserves user isolation in localStorage keys', () => {
    expect(getStorageKey('user_sessions', null)).toBe('fithome_guest_user_sessions');
    expect(getStorageKey('user_sessions', 'user_abc')).toBe('fithome_user_user_abc_user_sessions');
    expect(getStorageKey('user_sessions', 'user_xyz')).toBe('fithome_user_user_xyz_user_sessions');
  });

  it('guarantees the sequence: login -> sync -> delete all records -> empty snapshot -> reload without resurrecting deleted data', () => {
    const uid = 'test-athlete-123';
    let localSessions: Array<{ id: string; name: string }> = [];

    // Step 1: User has guest sessions in local storage before login
    mockStorage['fithome_guest_user_sessions'] = JSON.stringify([{ id: 'guest-1', name: 'Treino Convidado' }]);
    expect(hasUserMigrated(uid)).toBe(false);

    // Step 2: User logs in. Initial snapshot arrives from Firestore (remote is empty)
    let isInitialSnapshot = true;
    const remoteWorkouts: Array<{ id: string; name: string }> = [];

    const handleSnapshot = (remote: Array<{ id: string; name: string }>) => {
      const isMigrated = hasUserMigrated(uid);

      if (remote && remote.length > 0) {
        localSessions = remote;
        markUserMigrated(uid);
      } else if (!isMigrated && isInitialSnapshot) {
        // Initial migration from guest
        const guestData = mockStorage['fithome_guest_user_sessions'];
        if (guestData) {
          const parsed = JSON.parse(guestData);
          localSessions = parsed;
          // In real app, uploads to Firestore
        }
        markUserMigrated(uid);
      } else {
        // Authorized empty state (records were cleared)
        localSessions = [];
      }
      isInitialSnapshot = false;
    };

    // First snapshot triggers migration of guest data
    handleSnapshot(remoteWorkouts);
    expect(localSessions.length).toBe(1);
    expect(localSessions[0].id).toBe('guest-1');
    expect(hasUserMigrated(uid)).toBe(true);

    // Step 3: User deletes all records in the app
    // Firestore fires a new live snapshot with empty array []
    handleSnapshot([]);

    // Step 4: Callback runs on empty snapshot. Must NOT re-inject guest sessions!
    expect(localSessions.length).toBe(0);

    // Step 5: User reloads the page. hasUserMigrated is already true.
    isInitialSnapshot = true;
    expect(hasUserMigrated(uid)).toBe(true);

    // Initial snapshot after reload arrives with []
    handleSnapshot([]);
    expect(localSessions.length).toBe(0); // STILL EMPTY! No ghost resurrection!
  });
});
