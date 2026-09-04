import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { mr } from '../translations/mr';
import { hi } from '../translations/hi';

const LanguageContext = createContext();

const TRANSLATIONS = { en, mr, hi };
const STORAGE_KEY = 'maha_connect_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load language from localStorage:', e);
    }
    return 'en'; // Default language: English
  });

  const setLanguage = (lang) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error('Failed to save language to localStorage:', e);
      }
    }
  };

  const t = (key, params = {}) => {
    let text = TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
    if (typeof text === 'string' && params) {
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }
    return text;
  };

  const translateStatus = (status) => {
    if (!status) return '';
    const norm = status.toString().toLowerCase().replace(/\s+/g, '_');
    const key = `status_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    if (TRANSLATIONS[language]?.[norm] || TRANSLATIONS['en']?.[norm]) {
      return t(norm);
    }
    return t(status);
  };

  const translateSpecialty = (specialty) => {
    if (!specialty) return '';
    const norm = specialty.toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = `specialty_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    return t(specialty);
  };

  const translateDiagnostic = (test) => {
    if (!test) return '';
    const norm = test.toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = `diag_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    return t(test);
  };

  const translateFacilityType = (type) => {
    if (!type) return '';
    const norm = type.toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = `facility_type_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    return t(type);
  };

  const translateGender = (gender) => {
    if (!gender) return '';
    const norm = gender.toString().toLowerCase();
    const key = `gender_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    return t(gender);
  };

  const translatePriority = (priority) => {
    if (!priority) return '';
    const norm = priority.toString().toLowerCase();
    const key = `priority_${norm}`;
    if (TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key]) {
      return t(key);
    }
    return t(priority);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      translateStatus,
      translateSpecialty,
      translateDiagnostic,
      translateFacilityType,
      translateGender,
      translatePriority
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
