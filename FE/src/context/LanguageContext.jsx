import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'vdcm_language';

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'en' ? 'en' : 'vi';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.lang = language === 'en' ? 'en' : 'vi';
    }, [language]);

    const setLanguage = (lang) => {
        if (lang === 'vi' || lang === 'en') setLanguageState(lang);
    };

    const t = (key) => translations[language][key] || translations.vi[key] || key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};
