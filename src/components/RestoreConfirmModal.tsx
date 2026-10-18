import React, { useState } from 'react';
import { FitHomeBackup } from '../utils/backupValidator';
import { RestoreMode } from '../services/backupRestoreService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AlertTriangle,
  X,
  Check,
  Loader2,
  Calendar,
  Dumbbell,
  Scale,
  Ruler,
  Trophy,
  Camera,
  Layers,
  RefreshCw,
  Info
} from 'lucide-react';

interface RestoreConfirmModalProps {
  backup: FitHomeBackup;
  onConfirm: (mode: RestoreMode) => void;
  onClose: () => void;
  isRestoring?: boolean;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  backup,
  onConfirm,
  onClose,
  isRestoring = false
}) => {
  const { language, t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<RestoreMode>('merge');

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.backup.restoreTitle}</h3>
              <p className="text-xs text-slate-400">{t.backup.restoreSubtitle}</p>
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
        <div className="p-5 space-y-5">
          {/* Mode Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {language === 'en' ? 'Restore Mode:' : language === 'es' ? 'Modo de Restauración:' : 'Modo de Restauração:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Merge */}
              <button
                type="button"
                onClick={() => setSelectedMode('merge')}
                disabled={isRestoring}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedMode === 'merge'
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className={`w-4 h-4 ${selectedMode === 'merge' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm text-white">{t.backup.mergeOption}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t.backup.mergeDesc}
                  </p>
                </div>
              </button>

              {/* Option 2: Replace */}
              <button
                type="button"
                onClick={() => setSelectedMode('replace')}
                disabled={isRestoring}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedMode === 'replace'
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 ${selectedMode === 'replace' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm text-white">{t.backup.replaceOption}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t.backup.replaceDesc}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Warning banner */}
          {selectedMode === 'replace' ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                {t.backup.replaceWarning}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                {language === 'en'
                  ? 'Existing records with matching IDs will be safely merged and updated. No workout or measurement will be lost.'
                  : language === 'es'
                  ? 'Los registros existentes con identificadores coincidentes se actualizarán de forma segura. No se perderá ningún dato.'
                  : 'Registros já cadastrados que coincidirem em identificador serão atualizados com as informações do backup. Nenhum treino ou medida não listado no backup será apagado.'}
              </div>
            </div>
          )}

          {/* Backup Summary Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'en' ? 'Records Found in Backup:' : language === 'es' ? 'Registros Encontrados en el Archivo:' : 'Registros Encontrados no Arquivo:'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{t.progress.workoutsLabel}</div>
                  <div className="font-semibold text-white">{sessionsCount}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{t.common.weight}</div>
                  <div className="font-semibold text-white">{weightsCount}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Ruler className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{language === 'en' ? 'Measurements' : language === 'es' ? 'Medidas' : 'Medidas'}</div>
                  <div className="font-semibold text-white">{measuresCount}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{t.progress.prsTitle}</div>
                  <div className="font-semibold text-white">{prsCount}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{t.common.goal}</div>
                  <div className="font-semibold text-white">{hasGoal ? (language === 'en' ? 'Configured' : language === 'es' ? 'Configurada' : 'Configurada') : t.common.none}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <div className="text-slate-400">{t.evolution.photo}</div>
                  <div className="font-semibold text-white">{photosCount}</div>
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
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedMode)}
            disabled={isRestoring}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              selectedMode === 'replace'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.common.loading}</span>
              </>
            ) : selectedMode === 'replace' ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{language === 'en' ? 'Replace & Restore' : language === 'es' ? 'Reemplazar y Restaurar' : 'Substituir e Restaurar'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Merge & Restore' : language === 'es' ? 'Combinar y Restaurar' : 'Mesclar e Restaurar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
