import React, { useState } from 'react';
import { ProgressPhoto } from '../types/bodyEvolution';
import { formatDateBR } from '../utils/bodyDateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { X, ArrowLeftRight } from 'lucide-react';

interface PhotoCompareModalProps {
  photos: ProgressPhoto[];
  onClose: () => void;
}

export const PhotoCompareModal: React.FC<PhotoCompareModalProps> = ({
  photos,
  onClose
}) => {
  const { language, t } = useLanguage();

  // Sort photos chronologically (oldest to newest)
  const sortedPhotos = [...photos].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const [photoAId, setPhotoAId] = useState<string>(
    sortedPhotos[0]?.id || ''
  );
  const [photoBId, setPhotoBId] = useState<string>(
    sortedPhotos[sortedPhotos.length - 1]?.id || ''
  );

  const photoA = sortedPhotos.find(p => p.id === photoAId);
  const photoB = sortedPhotos.find(p => p.id === photoBId);

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'frente':
        return language === 'en' ? 'Front' : language === 'es' ? 'Frente' : 'Frente';
      case 'lado':
        return language === 'en' ? 'Side' : language === 'es' ? 'Perfil' : 'Perfil';
      case 'costas':
        return language === 'en' ? 'Back' : language === 'es' ? 'Espalda' : 'Costas';
      default:
        return language === 'en' ? 'General' : language === 'es' ? 'General' : 'Geral';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                {language === 'en' ? 'Side-by-Side Photo Comparison' : language === 'es' ? 'Comparación Lado a Lado de Fotos' : 'Comparação Lado a Lado de Fotos'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en' ? 'Select two moments to visualize your physical transformation.' : language === 'es' ? 'Selecciona dos momentos para ver tu transformación física.' : 'Selecione dois momentos para visualizar sua transformação física.'}
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

        {/* Selection selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 shrink-0">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'en' ? 'Photo 1 (Reference / Before)' : language === 'es' ? 'Foto 1 (Referencia / Antes)' : 'Foto 1 (Referência / Antes)'}
            </label>
            <select
              value={photoAId}
              onChange={e => setPhotoAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {sortedPhotos.map(p => (
                <option key={p.id} value={p.id}>
                  {formatDateBR(p.date)} - {getCategoryLabel(p.category)} {p.notes ? `(${p.notes.slice(0, 20)}...)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'en' ? 'Photo 2 (Current / After)' : language === 'es' ? 'Foto 2 (Actual / Después)' : 'Foto 2 (Atual / Depois)'}
            </label>
            <select
              value={photoBId}
              onChange={e => setPhotoBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {sortedPhotos.map(p => (
                <option key={p.id} value={p.id}>
                  {formatDateBR(p.date)} - {getCategoryLabel(p.category)} {p.notes ? `(${p.notes.slice(0, 20)}...)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-side view */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200">
                  {photoA ? formatDateBR(photoA.date) : '-'}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {photoA ? getCategoryLabel(photoA.category) : '-'}
                </span>
              </div>

              {photoA ? (
                <div className="aspect-[3/4] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img
                    src={photoA.photoDataUrl}
                    alt="Photo A"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-slate-600 text-xs">
                  {language === 'en' ? 'No photo selected' : language === 'es' ? 'Sin foto seleccionada' : 'Nenhuma foto selecionada'}
                </div>
              )}
            </div>

            {photoA?.notes && (
              <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-900/80 rounded-lg italic">
                “{photoA.notes}”
              </p>
            )}
          </div>

          {/* Card B */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200">
                  {photoB ? formatDateBR(photoB.date) : '-'}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {photoB ? getCategoryLabel(photoB.category) : '-'}
                </span>
              </div>

              {photoB ? (
                <div className="aspect-[3/4] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img
                    src={photoB.photoDataUrl}
                    alt="Photo B"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-slate-600 text-xs">
                  {language === 'en' ? 'No photo selected' : language === 'es' ? 'Sin foto seleccionada' : 'Nenhuma foto selecionada'}
                </div>
              )}
            </div>

            {photoB?.notes && (
              <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-900/80 rounded-lg italic">
                “{photoB.notes}”
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
