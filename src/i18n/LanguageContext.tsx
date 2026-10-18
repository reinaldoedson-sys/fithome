import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations } from './types';
import { pt } from './translations/pt';
import { en } from './translations/en';
import { es } from './translations/es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isPt: boolean;
  isEn: boolean;
  isEs: boolean;
}

const translationsMap: Record<Language, Translations> = {
  pt,
  en,
  es
};

const LANGUAGE_STORAGE_KEY = 'fithome_language';

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (saved && (saved === 'pt' || saved === 'en' || saved === 'es')) {
      return saved;
    }

    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('pt')) return 'pt';
  } catch {
    // ignore
  }
  return 'pt';
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: pt,
  isPt: true,
  isEn: false,
  isEs: false
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translationsMap[language] || pt,
    isPt: language === 'pt',
    isEn: language === 'en',
    isEs: language === 'es'
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
