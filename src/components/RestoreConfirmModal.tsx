import React from 'react';
import { FitHomeBackup } from '../utils/backupValidator';
import { AlertTriangle, X, Check, Loader2, Calendar, Dumbbell, Scale, Ruler, Trophy, Camera } from 'lucide-react';

interface RestoreConfirmModalProps {
  backup: FitHomeBackup;
  onConfirm: () => void;
  onClose: () => void;
  isRestoring?: boolean;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  backup,
  onConfirm,
  onClose,
  isRestoring = false
}) => {
  const sessionsCount = backup.sessions?.length || 0;
  const weightsCount = backup.bodyWeights?.length || 0;
  const measuresCount = backup.bodyMeasurements?.length || 0;
  const prsCount = backup.personalRecords?.length || 0;
  const photosCount = backup.bodyPhotos?.length || 0;
  const hasGoal = Boolean(
    backup.bodyGoal &&
    (backup.bodyGoal.targetWeightKg !== undefined ||
      backup.bodyGoal.customInitialWeightKg !== undefined ||
      backup.bodyGoal.heightCm !== undefined)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirmar Restauração</h3>
              <p className="text-xs text-slate-400">Substituição e atualização de dados</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
            Você já possui dados registrados no FitHome. Restaurar este backup substituirá ou atualizará seus treinos, pesagens, medidas e metas locais e na nuvem.
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Conteúdo do Arquivo de Backup:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Treinos</div>
                  <div className="font-semibold text-white">{sessionsCount} registros</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Pesagens</div>
                  <div className="font-semibold text-white">{weightsCount} registros</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Ruler className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Medidas Corporais</div>
                  <div className="font-semibold text-white">{measuresCount} registros</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Recordes (PRs)</div>
                  <div className="font-semibold text-white">{prsCount} registros</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Metas Corporais</div>
                  <div className="font-semibold text-white">{hasGoal ? 'Configuradas' : 'Nenhuma'}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <div className="text-slate-400">Fotos Corporais</div>
                  <div className="font-semibold text-white">{photosCount} fotos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Restaurando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar e Restaurar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
