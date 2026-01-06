import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import uzTranslations from '../../locales/uz.json';
import ruTranslations from '../../locales/ru.json';

type Language = 'uz' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Flatten nested JSON objects into dot-notation keys
function flattenTranslations(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenTranslations(obj[key], newKey));
      } else {
        result[newKey] = String(obj[key]);
      }
    }
  }
  
  return result;
}

// Pre-compute translations at module level for performance
const translations = {
  uz: flattenTranslations(uzTranslations),
  ru: flattenTranslations(ruTranslations),
} as const;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'uz' || saved === 'ru') ? saved : 'uz';
  });

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t,
    }),
    [language, handleSetLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}