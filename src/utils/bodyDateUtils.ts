/**
 * Date and calculation utilities for FitHome Body Evolution module.
 * Designed to avoid UTC timezone day-shifting and ensure exact comparisons.
 */

// Parse a date string YYYY-MM-DD or ISO string into a safe local Date at midday (12:00:00)
// Setting midday avoids any timezone day-shift caused by UTC midnight conversions or DST.
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const clean = dateStr.split('T')[0];
  const [year, month, day] = clean.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateStr);
  return new Date(year, month - 1, day, 12, 0, 0);
}

// Format date as DD/MM/YYYY
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-');
    if (year && month && day) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Format date as DD/MM for chart labels
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const clean = dateStr.split('T')[0];
    const [, month, day] = clean.split('-');
    if (month && day) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Get today's date string in YYYY-MM-DD format using local time
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate the start cutoff date for periods: 30d, 3m, 6m, 1y, all
export function getPeriodCutoffDate(period: '30d' | '3m' | '6m' | '1y' | 'all'): Date {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);

  if (period === '30d') {
    cutoff.setDate(cutoff.getDate() - 30);
  } else if (period === '3m') {
    cutoff.setMonth(cutoff.getMonth() - 3);
  } else if (period === '6m') {
    cutoff.setMonth(cutoff.getMonth() - 6);
  } else if (period === '1y') {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  } else {
    // 'all'
    return new Date(0);
  }

  return cutoff;
}

// Parse decimal input accepting either comma or dot
export function parseDecimalInput(input: string): number | null {
  if (!input) return null;
  const normalized = input.trim().replace(',', '.');
  const val = parseFloat(normalized);
  if (isNaN(val)) return null;
  return val;
}
