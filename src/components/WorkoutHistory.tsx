import React, { useState } from 'react';
import { WorkoutSession } from '../types/workout';
import { EXERCISES, MUSCLE_LABELS } from '../data/exercises';
import {
  Calendar,
  Clock,
  Dumbbell,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  RefreshCw,
  FileText
} from 'lucide-react';

interface WorkoutHistoryProps {
  sessions: WorkoutSession[];
  onRepeatSession: (session: WorkoutSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearHistory: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  sessions,
  onRepeatSession,
  onDeleteSession,
  onClearHistory,
  onExportData,
  onImportData
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(sessions[0]?.id || null);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (totalSecs: number) => {
    const mins = Math.round(totalSecs / 60);
    return `${mins} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Data Management Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Histórico de Treinos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registro das suas sessões de treino em casa.
          </p>
        </div>

        {/* Action Controls: Export / Import / Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExportData}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Exportar backup em arquivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar</span>
          </button>

          <label
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Importar dados de arquivo JSON"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onImportData(file);
              }}
            />
          </label>

          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza de que deseja apagar todo o histórico de treinos?')) {
                  onClearHistory();
                }
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Apagar todo o histórico"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions Feed */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200 mb-1">Nenhum treino registrado ainda</h3>
          <p className="text-xs text-slate-400">Complete seu primeiro treino para começar a criar seu histórico.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id;

            return (
              <div
                key={session.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Session Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850/60 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-base text-slate-100">
                        {session.title}
                      </h3>
                      <span className="text-xs text-slate-400 capitalize">
                        {formatDate(session.startTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDuration(session.durationSeconds)}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="tabular-nums font-semibold text-slate-200">{session.totalVolumeKg.toLocaleString()} kg</span>
                      </span>
                      <span>·</span>
                      <span>
                        <strong className="text-slate-200 tabular-nums">{session.totalSets}</strong> séries
                      </span>
                      <span>·</span>
                      <span>{session.exercises.length} exercícios</span>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onRepeatSession(session);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60"
                      title="Repetir este treino agora"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repetir</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Deseja excluir este treino do histórico?')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Excluir treino"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400 pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    {session.notes && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{session.notes}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {session.exercises.map((we, exIdx) => {
                        const exMeta = EXERCISES.find(e => e.id === we.exerciseId);

                        return (
                          <div
                            key={exIdx}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-xs sm:text-sm text-slate-200">
                                {exMeta?.namePt || we.exerciseId}
                              </h4>
                              {exMeta && (
                                <span className="text-[11px] text-emerald-400">
                                  {MUSCLE_LABELS[exMeta.primaryMuscle].pt}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {we.sets.map((set, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] flex items-center justify-between"
                                >
                                  <span className="text-slate-500 font-bold tabular-nums">
                                    Série {set.setNumber}
                                  </span>
                                  <span className="font-semibold text-slate-200 tabular-nums">
                                    {set.weightKg > 0 ? `${set.weightKg}kg · ` : ''}
                                    {set.repsOrSeconds || 0}
                                    {exMeta?.measurementType === 'seconds' ? 's' : ' reps'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
