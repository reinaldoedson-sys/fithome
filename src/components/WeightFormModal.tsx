import React, { useState } from 'react';
import { WeightEntry } from '../types/bodyEvolution';
import { X, Scale, Trash2 } from 'lucide-react';

interface WeightFormModalProps {
  initialEntry?: WeightEntry | null;
  onSave: (entry: Omit<WeightEntry, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const WeightFormModal: React.FC<WeightFormModalProps> = ({
  initialEntry,
  onSave,
  onDelete,
  onClose
}) => {
  const [date, setDate] = useState(() => {
    if (initialEntry?.date) {
      return initialEntry.date.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [weightKg, setWeightKg] = useState(() => {
    return initialEntry ? String(initialEntry.weightKg) : '';
  });
  const [notes, setNotes] = useState(() => initialEntry?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(weightKg.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setError('Por favor, informe um peso válido e maior que zero (ex: 74.5).');
      return;
    }
    if (val > 500) {
      setError('Por favor, verifique o valor do peso informado.');
      return;
    }
    if (!date) {
      setError('Por favor, informe a data da pesagem.');
      return;
    }

    onSave(
      {
        date,
        weightKg: Number(val.toFixed(2)),
        notes: notes.trim() || undefined
      },
      initialEntry?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">
              {initialEntry ? 'Editar Registro de Peso' : 'Registrar Novo Peso'}
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
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Data da Pesagem
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Peso (kg) <span className="text-slate-500 font-normal">com casas decimais</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="1"
                max="500"
                placeholder="Ex: 72.5"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums pr-12"
                autoFocus
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                kg
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Em jejum pela manhã, após beber 500ml de água..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            {initialEntry && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente excluir este registro de peso?')) {
                    onDelete(initialEntry.id);
                  }
                }}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                {initialEntry ? 'Salvar Alterações' : 'Registrar Peso'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
