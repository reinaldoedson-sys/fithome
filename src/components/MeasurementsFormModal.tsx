import React, { useState } from 'react';
import { MeasurementEntry, BodyMeasurements, MEASUREMENT_LABELS, MeasurementKey } from '../types/bodyEvolution';
import { X, Ruler, Trash2 } from 'lucide-react';

interface MeasurementsFormModalProps {
  initialEntry?: MeasurementEntry | null;
  onSave: (entry: Omit<MeasurementEntry, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const MeasurementsFormModal: React.FC<MeasurementsFormModalProps> = ({
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

  const [measurements, setMeasurements] = useState<Record<MeasurementKey, string>>(() => {
    const state: Record<string, string> = {};
    (Object.keys(MEASUREMENT_LABELS) as MeasurementKey[]).forEach(k => {
      const existingVal = initialEntry?.measurements?.[k];
      state[k] = existingVal !== undefined ? String(existingVal) : '';
    });
    return state as Record<MeasurementKey, string>;
  });

  const [notes, setNotes] = useState(() => initialEntry?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (key: MeasurementKey, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Por favor, informe a data da medição.');
      return;
    }

    // Build measurements object with only filled valid numbers
    const validMeasurements: BodyMeasurements = {};
    let atLeastOneFilled = false;

    (Object.keys(measurements) as MeasurementKey[]).forEach(k => {
      const raw = measurements[k].trim().replace(',', '.');
      if (raw !== '') {
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0) {
          validMeasurements[k] = Number(val.toFixed(1));
          atLeastOneFilled = true;
        }
      }
    });

    if (!atLeastOneFilled) {
      setError('Preencha ao menos uma medida corporal para salvar.');
      return;
    }

    onSave(
      {
        date,
        measurements: validMeasurements,
        notes: notes.trim() || undefined
      },
      initialEntry?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                {initialEntry ? 'Editar Medidas Corporais' : 'Registrar Medidas Corporais'}
              </h3>
              <p className="text-xs text-slate-400">
                Preencha apenas as regiões que você deseja registrar hoje (em cm).
              </p>
            </div>
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
          <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data da Medição
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              Medidas Corporais (cm)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(MEASUREMENT_LABELS) as MeasurementKey[]).map(key => (
                <div key={key} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 truncate">
                    {MEASUREMENT_LABELS[key].name}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="300"
                      placeholder="0.0"
                      value={measurements[key]}
                      onChange={e => handleFieldChange(key, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1 px-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Medido pela manhã, fita métrica relaxada sem apertar..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800 shrink-0">
            {initialEntry && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente excluir este registro de medidas?')) {
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
                {initialEntry ? 'Salvar Alterações' : 'Salvar Medidas'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
