import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../i18n/LanguageContext';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>
        {language === 'en'
          ? 'Offline Mode — Local data is cached and ready to workout.'
          : language === 'es'
          ? 'Modo sin conexión — Datos locales guardados y listos para entrenar.'
          : 'Modo Offline — Seus treinos e dados continuam funcionando sem internet.'}
      </span>
    </div>
  );
};
