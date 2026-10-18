import React, { useState } from 'react';
import { WeightEntry } from '../types/bodyEvolution';
import { getTodayDateString, parseDecimalInput, formatDateBR } from '../utils/bodyDateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Scale, Trash2, AlertCircle } from 'lucide-react';

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
  const { language, t } = useLanguage();
  const [date, setDate] = useState(() => {
    if (initialEntry?.date) {
      return initialEntry.date.split('T')[0];
    }
    return getTodayDateString();
  });

  const [weightInput, setWeightInput] = useState(() => {
    return initialEntry ? String(initialEntry.weightKg).replace('.', ',') : '';
  });

  const [notes, setNotes] = useState(() => initialEntry?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseDecimalInput(weightInput);
    if (val === null || val <= 0) {
      setError(
        language === 'en'
          ? 'Please provide a valid weight greater than zero (e.g., 74.5).'
          : language === 'es'
          ? 'Por favor, introduce un peso válido mayor que cero (ej: 74,5).'
          : 'Por favor, informe um peso válido e maior que zero (ex: 74,5 ou 74.5).'
      );
      return;
    }
    if (val < 20 || val > 400) {
      setError(
        language === 'en'
          ? 'Weight must be between 20 kg and 400 kg.'
          : language === 'es'
          ? 'El peso debe estar entre 20 kg y 400 kg.'
          : 'O peso informado deve estar entre 20 kg e 400 kg.'
      );
      return;
    }
    if (!date) {
      setError(
        language === 'en'
          ? 'Please provide the weighing date.'
          : language === 'es'
          ? 'Por favor, introduce la fecha del pesaje.'
          : 'Por favor, informe a data da pesagem.'
      );
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
              {initialEntry
                ? (language === 'en' ? 'Edit Weight Log' : language === 'es' ? 'Editar Registro de Peso' : 'Editar Registro de Peso')
                : (language === 'en' ? 'Log New Weight' : language === 'es' ? 'Registrar Nuevo Peso' : 'Registrar Novo Peso')}
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'en' ? 'Date' : language === 'es' ? 'Fecha' : 'Data da Pesagem'}
            </label>
            <input
              type="date"
              value={date}
              max={getTodayDateString()}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'en'
                ? 'You can log today weight or backdate previous measurements.'
                : language === 'es'
                ? 'Puedes registrar el peso de hoy o de fechas anteriores.'
                : 'Você pode registrar o peso de hoje ou de datas anteriores.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'en' ? 'Weight (kg)' : language === 'es' ? 'Peso (kg)' : 'Peso (kg)'}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex: 74.5"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
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
              {language === 'en' ? 'Notes (Optional)' : language === 'es' ? 'Notas (Opcional)' : 'Observações (Opcional)'}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'en' ? 'Ex: Fasted, right after waking up...' : language === 'es' ? 'Ej: En ayunas, nada más despertar...' : 'Ex: Em jejum, logo ao acordar...'}
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
                  const confirmMsg =
                    language === 'en'
                      ? `Delete log of ${initialEntry.weightKg} kg on ${formatDateBR(initialEntry.date)}?`
                      : language === 'es'
                      ? `¿Eliminar pesaje de ${initialEntry.weightKg} kg del ${formatDateBR(initialEntry.date)}?`
                      : `Deseja excluir a pesagem de ${initialEntry.weightKg} kg do dia ${formatDateBR(initialEntry.date)}?`;
                  if (confirm(confirmMsg)) {
                    onDelete(initialEntry.id);
                  }
                }}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.common.delete}</span>
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
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
