import React, { useState, useRef } from 'react';
import { ProgressPhoto } from '../types/bodyEvolution';
import { getTodayDateString } from '../utils/bodyDateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Camera, Upload, AlertCircle, Info } from 'lucide-react';

interface PhotoUploadModalProps {
  onSave: (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  onSave,
  onClose
}) => {
  const { language, t } = useLanguage();
  const [date, setDate] = useState(() => getTodayDateString());
  const [category, setCategory] = useState<'frente' | 'costas' | 'lado' | 'outro'>('frente');
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to ~60-90 KB to safely respect browser storage limits
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800; // 800px provides crisp detail with minimal storage footprint
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context failed'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(
        language === 'en'
          ? 'Please select a valid image file (JPG, PNG or WebP).'
          : language === 'es'
          ? 'Por favor, selecciona un archivo de imagen válido (JPG, PNG o WebP).'
          : 'Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).'
      );
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const compressedDataUrl = await compressImage(file);
      setPreviewUrl(compressedDataUrl);
    } catch {
      setError(
        language === 'en'
          ? 'Error processing image. Please try a different photo.'
          : language === 'es'
          ? 'Error al procesar la imagen. Intenta con otra foto.'
          : 'Erro ao processar imagem. Tente uma foto diferente.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setError(
        language === 'en'
          ? 'Please select a photo to save.'
          : language === 'es'
          ? 'Por favor, selecciona una foto para guardar.'
          : 'Por favor, selecione uma foto para salvar.'
      );
      return;
    }
    if (!date) {
      setError(
        language === 'en'
          ? 'Please select the photo date.'
          : language === 'es'
          ? 'Por favor, selecciona la fecha de la foto.'
          : 'Por favor, selecione a data da foto.'
      );
      return;
    }

    try {
      onSave({
        date,
        photoDataUrl: previewUrl,
        category,
        notes: notes.trim() || undefined
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setError(
          language === 'en'
            ? 'Browser local storage limit reached. Delete older photos before saving new ones.'
            : language === 'es'
            ? 'Límite de almacenamiento del navegador alcanzado. Elimina fotos antiguas antes de guardar nuevas.'
            : 'Limite de armazenamento local do navegador atingido. Exclua fotos antigas antes de salvar novas.'
        );
      } else {
        setError(
          language === 'en'
            ? 'Could not save photo.'
            : language === 'es'
            ? 'No se pudo guardar la foto.'
            : 'Não foi possível salvar a foto.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">
              {language === 'en' ? 'Add Evolution Photo' : language === 'es' ? 'Añadir Foto de Evolución' : 'Adicionar Foto de Evolução'}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {language === 'en' ? 'Body Photo' : language === 'es' ? 'Foto Corporal' : 'Foto Corporal'}
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> {language === 'en' ? 'Private in your browser' : language === 'es' ? 'Privada en tu navegador' : 'Privada no seu navegador'}
              </span>
            </div>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[3/4] max-h-72 mx-auto flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                  title={language === 'en' ? 'Change image' : language === 'es' ? 'Cambiar imagen' : 'Trocar imagem'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">
                  {isProcessing
                    ? (language === 'en' ? 'Optimizing image...' : language === 'es' ? 'Optimizando imagen...' : 'Otimizando imagem...')
                    : (language === 'en' ? 'Click to select a photo' : language === 'es' ? 'Haz clic para seleccionar una foto' : 'Clique para selecionar uma foto')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'en' ? 'JPG, PNG or WebP (local smart compression)' : language === 'es' ? 'JPG, PNG o WebP (compresión inteligente local)' : 'JPG, PNG ou WebP (compressão inteligente local)'}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'en' ? 'Photo Date' : language === 'es' ? 'Fecha de la Foto' : 'Data da Foto'}
              </label>
              <input
                type="date"
                value={date}
                max={getTodayDateString()}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'en' ? 'Angle / Pose' : language === 'es' ? 'Ángulo / Pose' : 'Ângulo / Posição'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as 'frente' | 'costas' | 'lado' | 'outro')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
              >
                <option value="frente">{language === 'en' ? 'Front' : language === 'es' ? 'Frente' : 'Frente'}</option>
                <option value="lado">{language === 'en' ? 'Side / Profile' : language === 'es' ? 'Perfil / Lado' : 'Perfil / Lado'}</option>
                <option value="costas">{language === 'en' ? 'Back' : language === 'es' ? 'Espalda' : 'Costas'}</option>
                <option value="outro">{language === 'en' ? 'Other' : language === 'es' ? 'Otro' : 'Outro'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'en' ? 'Notes (Optional)' : language === 'es' ? 'Notas (Opcional)' : 'Observações (Opcional)'}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'en' ? 'Ex: Morning light, post workout...' : language === 'es' ? 'Ej: Luz matutina, post entreno...' : 'Ex: Iluminação matinal, pós-treino de pernas...'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!previewUrl || isProcessing}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {language === 'en' ? 'Save Photo' : language === 'es' ? 'Guardar Foto' : 'Salvar Foto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
