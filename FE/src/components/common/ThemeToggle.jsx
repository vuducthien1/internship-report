import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const ThemeToggle = ({ compact = false }) => {
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();

    if (compact) {
        return (
            <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                title={theme === 'light' ? t('darkMode') : t('lightMode')}
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        );
    }

    return (
        <div className="flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
            <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${theme === 'light' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setTheme('light')}
            >
                <span className="mr-2">☀️</span>{t('lightMode')}
            </button>
            <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${theme === 'dark' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setTheme('dark')}
            >
                <span className="mr-2">🌙</span>{t('darkMode')}
            </button>
        </div>
    );
};

export default ThemeToggle;
