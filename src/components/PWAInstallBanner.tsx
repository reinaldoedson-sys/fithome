import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, canPromptNative, installApp } = usePWAInstall();
  const { language, t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed as standalone PWA or user dismissed during this session
  if (isInstalled || dismissed) {
    return null;
  }

  const handleActionClick = () => {
    if (canPromptNative) {
      installApp();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <aside aria-label={t.pwa.installButton} className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-b border-emerald-500/30 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-white block sm:inline mr-1.5 truncate">
              {language === 'en'
                ? 'FitHome on your Mobile:'
                : language === 'es'
                ? 'FitHome en tu Móvil:'
                : 'FitHome no seu Celular:'}
            </span>
            <span className="text-slate-400 hidden md:inline">
              {t.pwa.installDesc}
            </span>
            <span className="text-slate-400 md:hidden text-[11px] truncate block">
              {language === 'en'
                ? 'Install PWA app with 1 tap'
                : language === 'es'
                ? 'Instala la app PWA en 1 toque'
                : 'Instale o app PWA com 1 toque'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleActionClick}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 text-xs"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">
              {language === 'en' ? 'Install App' : language === 'es' ? 'Instalar App' : 'Instalar no Celular'}
            </span>
            <span className="sm:hidden">{t.pwa.installButton}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="hidden sm:flex px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors items-center gap-1 border border-slate-700/60"
            title="Como instalar no iPhone / Android"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'How it works' : language === 'es' ? 'Cómo funciona' : 'Como instalar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Comprehensive Install & QR Modal */}
      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
