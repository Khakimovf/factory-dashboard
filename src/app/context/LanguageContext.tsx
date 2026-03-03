import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import uzTranslations from '../../locales/uz.json';
import ruTranslations from '../../locales/ru.json';
import krTranslations from '../../locales/kr.json';

type Language = 'uz' | 'ru' | 'kr';

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

// Lazy-init per language to avoid flattening all 3 at startup (reduces memory)
const rawLocales: Record<Language, Record<string, unknown>> = {
  uz: uzTranslations as Record<string, unknown>,
  ru: ruTranslations as Record<string, unknown>,
  kr: krTranslations as Record<string, unknown>,
};
const flattenedCache: Partial<Record<Language, Record<string, string>>> = {};

function getTranslations(lang: Language): Record<string, string> {
  if (!flattenedCache[lang]) {
    flattenedCache[lang] = flattenTranslations(rawLocales[lang]);
  }
  return flattenedCache[lang] as Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return saved === 'uz' || saved === 'ru' || saved === 'kr' ? (saved as Language) : 'uz';
  });

  const t = useCallback((key: string): string => {
    return getTranslations(language)[key] || key;
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