import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  LogIn,
  X,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Dumbbell,
  Scale,
  Ruler,
  Trophy,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { WorkoutSession, PersonalRecord } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../types/bodyEvolution';
import { uploadLocalDataToFirestore } from '../lib/firestoreService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  sessions: WorkoutSession[];
  bodyWeights: WeightEntry[];
  bodyMeasurements: MeasurementEntry[];
  bodyGoal: BodyGoal;
  personalRecords: PersonalRecord[];
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  sessions,
  bodyWeights,
  bodyMeasurements,
  bodyGoal,
  personalRecords
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('fithome_last_cloud_sync') || 'Agora há pouco';
  });

  if (!isOpen) return null;

  const handleManualSync = async () => {
    if (!user) {
      await onLogin();
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await uploadLocalDataToFirestore(user.uid, {
        sessions,
        weights: bodyWeights,
        measurements: bodyMeasurements,
        goal: bodyGoal,
        personalRecords
      });

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem('fithome_last_cloud_sync', nowStr);
      setSyncFeedback(`Sincronização concluída com sucesso! ${res.count} itens sincronizados.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncFeedback('Erro ao sincronizar. Verifique sua conexão com a internet.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${user ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
              <Cloud className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Sincronização Web & Celular
              </h2>
              <p className="text-xs text-slate-400">
                FitHome Cloud Sync (Firebase)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Badge */}
          {user ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30 shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400">Conectado e Sincronizado</span>
                  </div>
                  <p className="text-sm font-bold text-slate-100 truncate">
                    {user.displayName || 'Atleta FitHome'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors shrink-0 flex items-center gap-1"
                title="Desconectar conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-200">
                    Modo Local (Offline) Ativo
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Seus treinos estão salvos apenas neste navegador. Para que eles apareçam automaticamente no seu celular e no computador, conecte sua conta Google.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogin}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Conectar com Google e Sincronizar</span>
              </button>
            </div>
          )}

          {/* Feedback Toast Message */}
          {syncFeedback && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Device Sync Visual Diagram */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Sincronização entre Dispositivos
            </h3>
            <div className="flex items-center justify-between text-center px-4 py-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Laptop className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">Computador</span>
                <span className="text-[10px] text-slate-500">Navegador Web</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowRightLeft className={`w-5 h-5 ${user ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-[10px] font-semibold ${user ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {user ? 'Nuvem Ativa' : 'Desconectado'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">Celular</span>
                <span className="text-[10px] text-slate-500">App PWA</span>
              </div>
            </div>
          </div>

          {/* Data Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Treinos</span>
              </div>
              <span className="text-lg font-bold text-slate-100 font-display">
                {sessions.length}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Scale className="w-3.5 h-3.5 text-teal-400" />
                <span>Pesos</span>
              </div>
              <span className="text-lg font-bold text-slate-100 font-display">
                {bodyWeights.length}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                <span>Medidas</span>
              </div>
              <span className="text-lg font-bold text-slate-100 font-display">
                {bodyMeasurements.length}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Recordes</span>
              </div>
              <span className="text-lg font-bold text-slate-100 font-display">
                {personalRecords.length}
              </span>
            </div>
          </div>

          {/* How It Works Guide */}
          <div className="space-y-2 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Como manter tudo 100% sincronizado:</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-400">
              <li>
                <strong className="text-slate-200">Mesma conta Google:</strong> Conecte-se com a mesma conta de email tanto no computador quanto no celular.
              </li>
              <li>
                <strong className="text-slate-200">Sincronização em tempo real:</strong> Ao salvar um treino ou peso no celular, ele aparece no computador instantaneamente.
              </li>
              <li>
                <strong className="text-slate-200">Treinos offline:</strong> Se você treinar sem internet, o FitHome salva tudo localmente e sincroniza assim que a internet voltar.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Última checagem: {lastSyncTime}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {user ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sincronizar Agora</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Entrar com Google</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
