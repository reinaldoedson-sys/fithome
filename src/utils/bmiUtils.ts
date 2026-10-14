import { BmiInfo, BmiClassification } from '../types/bodyEvolution';

/**
 * Calculates Body Mass Index (BMI / IMC) and returns WHO adult classification.
 * Formula: weightKg / (heightM * heightM)
 */
export function calculateBmi(weightKg?: number, heightCm?: number): BmiInfo | null {
  if (
    weightKg === undefined ||
    weightKg <= 0 ||
    heightCm === undefined ||
    heightCm < 50 ||
    heightCm > 280
  ) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Number(bmiRaw.toFixed(1));

  let classification: BmiClassification = 'normal';
  let label = 'Peso normal';
  let description = 'Faixa de peso considerada saudável segundo a OMS para adultos.';
  let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (bmi < 18.5) {
    classification = 'abaixo_peso';
    label = 'Abaixo do peso';
    description = 'Peso inferior à faixa de referência recomendada para a estatura.';
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (bmi < 25.0) {
    classification = 'normal';
    label = 'Eutrofia / Normal';
    description = 'Faixa de equilíbrio nutricional recomendada pela OMS para adultos.';
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (bmi < 30.0) {
    classification = 'sobrepeso';
    label = 'Sobrepeso';
    description = 'Leve elevação do peso em relação à estatura. Recomenda-se atenção à composição corporal.';
    color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  } else if (bmi < 35.0) {
    classification = 'obesidade_1';
    label = 'Obesidade Grau I';
    description = 'Elevação moderada do peso. A prática de exercícios e hábitos saudáveis é indicada.';
    color = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  } else if (bmi < 40.0) {
    classification = 'obesidade_2';
    label = 'Obesidade Grau II';
    description = 'Elevação severa. Acompanhamento multiprofissional em saúde é recomendado.';
    color = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else {
    classification = 'obesidade_3';
    label = 'Obesidade Grau III';
    description = 'Elevação muito severa da relação peso/altura. Atenção médica prioritária recomendada.';
    color = 'text-red-400 bg-red-500/10 border-red-500/20';
  }

  const minKg = Number((18.5 * heightM * heightM).toFixed(1));
  const maxKg = Number((24.9 * heightM * heightM).toFixed(1));

  return {
    bmi,
    classification,
    label,
    description,
    color,
    healthyWeightRange: { minKg, maxKg }
  };
}
