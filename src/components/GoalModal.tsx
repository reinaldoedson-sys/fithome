import React, { useState } from 'react';
import { BodyGoal } from '../types/bodyEvolution';
import { parseDecimalInput } from '../utils/bodyDateUtils';
import { X, Target, AlertCircle, Ruler } from 'lucide-react';

interface GoalModalProps {
  currentGoal?: BodyGoal;
  historicalFirstWeight?: number;
  onSave: (goal: BodyGoal) => void;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  currentGoal,
  historicalFirstWeight,
  onSave,
  onClose
}) => {
  const [targetWeightInput, setTargetWeightInput] = useState(() => {
    return currentGoal?.targetWeightKg ? String(currentGoal.targetWeightKg).replace('.', ',') : '';
  });
  const [customInitialInput, setCustomInitialInput] = useState(() => {
    return currentGoal?.customInitialWeightKg ? String(currentGoal.customInitialWeightKg).replace('.', ',') : '';
  });
  const [heightInput, setHeightInput] = useState(() => {
    return currentGoal?.heightCm ? String(currentGoal.heightCm).replace('.', ',') : '';
  });
  const [targetDate, setTargetDate] = useState(() => currentGoal?.targetDate || '');
  const [notes, setNotes] = useState(() => currentGoal?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedTarget: number | undefined = undefined;
    if (targetWeightInput.trim() !== '') {
      const val = parseDecimalInput(targetWeightInput);
      if (val === null || val <= 0 || val < 20 || val > 400) {
        setError('Por favor, informe uma meta de peso válida entre 20 e 400 kg.');
        return;
      }
      parsedTarget = Number(val.toFixed(2));
    }

    let parsedInitial: number | undefined = undefined;
    if (customInitialInput.trim() !== '') {
      const val = parseDecimalInput(customInitialInput);
      if (val === null || val <= 0 || val < 20 || val > 400) {
        setError('Por favor, informe um peso inicial de referência válido entre 20 e 400 kg.');
        return;
      }
      parsedInitial = Number(val.toFixed(2));
    }

    let parsedHeight: number | undefined = undefined;
    if (heightInput.trim() !== '') {
      let val = parseDecimalInput(heightInput);
      if (val === null || val <= 0) {
        setError('Por favor, informe uma altura válida (ex: 175 cm ou 1,75 m).');
        return;
      }
      // If user typed in meters (e.g. 1.75 or 1,75), convert to centimeters
      if (val > 0 && val < 3) {
        val = val * 100;
      }
      if (val < 50 || val > 280) {
        setError('A altura deve estar entre 50 cm e 280 cm.');
        return;
      }
      parsedHeight = Math.round(val);
    }

    onSave({
      targetWeightKg: parsedTarget,
      customInitialWeightKg: parsedInitial,
      heightCm: parsedHeight,
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">
              Metas e Perfil Corporal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Height Input for BMI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sua Altura (para cálculo do IMC)</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">Recomendado</span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex: 175 ou 1,75"
                value={heightInput}
                onChange={e => setHeightInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                cm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Utilizada para calcular o IMC atual, faixas saudáveis e histórico de IMC.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Peso-Meta (kg)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex: 70,0"
                value={targetWeightInput}
                onChange={e => setTargetWeightInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                kg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pode ser meta para emagrecimento ou ganho de massa muscular.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Peso Inicial de Referência (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder={historicalFirstWeight ? `Padrão do histórico: ${historicalFirstWeight} kg` : 'Ex: 85,0'}
                value={customInitialInput}
                onChange={e => setCustomInitialInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                kg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Permite fixar o ponto de partida do seu projeto. O histórico de pesagens permanece inalterado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Data-Alvo da Meta (Opcional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Motivação / Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Foco em recomposição corporal e melhora da saúde..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Salvar Metas & Altura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
