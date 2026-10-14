import { describe, it, expect } from 'vitest';
import { parseDecimalInput, parseLocalDate, formatDateBR } from '../bodyDateUtils';

describe('parseDecimalInput strict validation', () => {
  it('accepts valid integers and decimals with comma or dot', () => {
    expect(parseDecimalInput('75')).toBe(75);
    expect(parseDecimalInput('75.5')).toBe(75.5);
    expect(parseDecimalInput('75,5')).toBe(75.5);
    expect(parseDecimalInput('0.85')).toBe(0.85);
    expect(parseDecimalInput('0,85')).toBe(0.85);
    expect(parseDecimalInput('.5')).toBe(0.5);
    expect(parseDecimalInput(',5')).toBe(0.5);
    expect(parseDecimalInput('  82.4  ')).toBe(82.4);
    expect(parseDecimalInput(70)).toBe(70);
  });

  it('strictly rejects partially invalid inputs and corrupt strings', () => {
    expect(parseDecimalInput('12.34.56')).toBeNull();
    expect(parseDecimalInput('12,34,56')).toBeNull();
    expect(parseDecimalInput('75.2abc')).toBeNull();
    expect(parseDecimalInput('abc75.2')).toBeNull();
    expect(parseDecimalInput('75 2')).toBeNull();
    expect(parseDecimalInput('12e5')).toBeNull();
    expect(parseDecimalInput('-10')).toBeNull();
    expect(parseDecimalInput('-10.5')).toBeNull();
    expect(parseDecimalInput('Infinity')).toBeNull();
    expect(parseDecimalInput('NaN')).toBeNull();
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('   ')).toBeNull();
    expect(parseDecimalInput(null)).toBeNull();
    expect(parseDecimalInput(undefined)).toBeNull();
  });
});

describe('parseLocalDate timezone stability', () => {
  it('parses YYYY-MM-DD at local midday (12:00:00) to prevent day-shifts', () => {
    const d = parseLocalDate('2026-10-14');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // 0-indexed October
    expect(d.getDate()).toBe(14);
    expect(d.getHours()).toBe(12);
  });

  it('formats dates consistently in DD/MM/YYYY', () => {
    expect(formatDateBR('2026-10-14')).toBe('14/10/2026');
    expect(formatDateBR('2026-01-05T10:00:00Z')).toBe('05/01/2026');
  });
});
