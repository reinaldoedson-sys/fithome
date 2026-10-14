import { describe, it, expect } from 'vitest';
import { calculateBmi } from '../bmiUtils';

describe('calculateBmi precision & WHO classifications', () => {
  it('correctly classifies values across WHO thresholds using raw unrounded BMI', () => {
    // Height: 1.70 m -> heightM^2 = 2.89

    // Underweight boundary: < 18.5
    // weight = 53.46 -> bmiRaw = 53.46 / 2.89 = 18.49827... (< 18.5)
    const justUnder185 = calculateBmi(53.46, 170);
    expect(justUnder185).not.toBeNull();
    expect(justUnder185?.classification).toBe('abaixo_peso');
    expect(justUnder185?.bmi).toBe(18.5); // rounded for display

    // Exactly 18.5 -> Normal
    const at185 = calculateBmi(18.5 * 2.89, 170);
    expect(at185?.classification).toBe('normal');

    // Normal vs Overweight boundary: 25.0
    // weight = 72.24 -> bmiRaw = 72.24 / 2.89 = 24.9965... (< 25.0 -> MUST BE NORMAL!)
    // Note: 24.996 rounds to 25.0 for display, but classification must be 'normal'
    const justUnder25 = calculateBmi(72.24, 170);
    expect(justUnder25).not.toBeNull();
    expect(justUnder25?.classification).toBe('normal');
    expect(justUnder25?.bmi).toBe(25.0);

    // Exactly 25.0 -> Sobrepeso
    const at25 = calculateBmi(25.0 * 2.89, 170);
    expect(at25?.classification).toBe('sobrepeso');

    // Overweight vs Obese I boundary: 30.0
    // weight = 86.69 -> bmiRaw = 86.69 / 2.89 = 29.9965... (< 30.0 -> MUST BE SOBREPESO!)
    const justUnder30 = calculateBmi(86.69, 170);
    expect(justUnder30?.classification).toBe('sobrepeso');
    expect(justUnder30?.bmi).toBe(30.0);

    // Exactly 30.0 -> Obesidade I
    const at30 = calculateBmi(30.0 * 2.89, 170);
    expect(at30?.classification).toBe('obesidade_1');

    // Obese I vs Obese II boundary: 35.0
    // weight = 101.14 -> bmiRaw = 101.14 / 2.89 = 34.9965... (< 35.0 -> MUST BE OBESIDADE I!)
    const justUnder35 = calculateBmi(101.14, 170);
    expect(justUnder35?.classification).toBe('obesidade_1');
    expect(justUnder35?.bmi).toBe(35.0);

    // Exactly 35.0 -> Obesidade II
    const at35 = calculateBmi(35.0 * 2.89, 170);
    expect(at35?.classification).toBe('obesidade_2');

    // Obese II vs Obese III boundary: 40.0
    // weight = 115.59 -> bmiRaw = 115.59 / 2.89 = 39.9965... (< 40.0 -> MUST BE OBESIDADE II!)
    const justUnder40 = calculateBmi(115.59, 170);
    expect(justUnder40?.classification).toBe('obesidade_2');
    expect(justUnder40?.bmi).toBe(40.0);

    // Exactly 40.0 -> Obesidade III
    const at40 = calculateBmi(40.0 * 2.89, 170);
    expect(at40?.classification).toBe('obesidade_3');
  });

  it('rejects non-finite, negative, zero, and out-of-bounds inputs', () => {
    expect(calculateBmi(0, 170)).toBeNull();
    expect(calculateBmi(-70, 170)).toBeNull();
    expect(calculateBmi(NaN, 170)).toBeNull();
    expect(calculateBmi(Infinity, 170)).toBeNull();
    expect(calculateBmi(70, 0)).toBeNull();
    expect(calculateBmi(70, 40)).toBeNull(); // below 50 cm
    expect(calculateBmi(70, 300)).toBeNull(); // above 280 cm
    expect(calculateBmi(70, NaN)).toBeNull();
    expect(calculateBmi(70, Infinity)).toBeNull();
    expect(calculateBmi(undefined, 170)).toBeNull();
    expect(calculateBmi(70, undefined)).toBeNull();
  });
});
