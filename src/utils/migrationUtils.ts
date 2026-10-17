/**
 * FitHome - Migration & Synchronization Utilities
 * 
 * Provides per-category independent migration tracking between local storage (guest data)
 * and Firebase Firestore (authenticated user subcollections).
 * 
 * Guarantees:
 * 1. Independent Category Migration: Completion of one category (e.g. weights) does NOT
 *    block or interfere with the migration of other categories (e.g. workouts, measurements).
 * 2. Protection against Ghost Data: Once a category is migrated, subsequent empty snapshots
 *    from Firestore (such as when a user clears history or deletes records) are respected
 *    and do NOT re-resurrect old guest data.
 * 3. User & Guest Isolation: Every user has their own migration state scoped by their UID.
 * 4. Backward Compatibility: Falls back gracefully if legacy global migration flags exist.
 */

export type MigrationCategory = 'workouts' | 'weights' | 'measurements' | 'records' | 'goals';

export const ALL_MIGRATION_CATEGORIES: readonly MigrationCategory[] = [
  'workouts',
  'weights',
  'measurements',
  'records',
  'goals'
] as const;

/**
 * Returns the localStorage key for a user's migration flag for a specific category.
 */
export function getCategoryMigrationKey(uid: string, category: MigrationCategory): string {
  return `fithome_migrated_${uid}_${category}`;
}

/**
 * Checks whether a specific category has already been migrated for the given user.
 */
export function hasCategoryMigrated(
  uid: string,
  category: MigrationCategory,
  storage: Storage = localStorage
): boolean {
  if (!uid) return false;
  try {
    // 1. Check category-specific migration flag
    const catFlag = storage.getItem(getCategoryMigrationKey(uid, category));
    if (catFlag !== null) {
      return catFlag === 'true';
    }

    // 2. Check legacy global migration flag for backward compatibility
    const legacyFlag = storage.getItem(`fithome_migrated_${uid}`);
    if (legacyFlag === 'true') {
      return true;
    }
  } catch {
    // Storage access error fallback
  }
  return false;
}

/**
 * Marks a specific category as migrated for the given user.
 */
export function markCategoryMigrated(
  uid: string,
  category: MigrationCategory,
  storage: Storage = localStorage
): void {
  if (!uid) return;
  try {
    storage.setItem(getCategoryMigrationKey(uid, category), 'true');
  } catch {
    // ignore quota/storage errors
  }
}

/**
 * Resets migration status for a category (useful in testing or profile reset).
 */
export function resetCategoryMigration(
  uid: string,
  category: MigrationCategory,
  storage: Storage = localStorage
): void {
  if (!uid) return;
  try {
    storage.removeItem(getCategoryMigrationKey(uid, category));
  } catch {
    // ignore
  }
}

/**
 * Checks whether all tracked categories have completed migration for the user.
 */
export function areAllCategoriesMigrated(
  uid: string,
  storage: Storage = localStorage
): boolean {
  if (!uid) return false;
  return ALL_MIGRATION_CATEGORIES.every(category => hasCategoryMigrated(uid, category, storage));
}
