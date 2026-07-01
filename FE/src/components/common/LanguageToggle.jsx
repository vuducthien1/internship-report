import { Globe2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageToggle = ({ compact = false }) => {
    const { language, setLanguage, t } = useLanguage();

    if (compact) {
        return (
            <button
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                aria-label="Toggle language"
            >
                <Globe2 size={16} className="mr-2" />
                {language === 'vi' ? 'EN' : 'VI'}
            </button>
        );
    }

    return (
        <div className="flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
            <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${language === 'vi' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setLanguage('vi')}
            >
                🇻🇳 {t('vietnamese')}
            </button>
            <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${language === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setLanguage('en')}
            >
                🇬🇧 {t('english')}
            </button>
        </div>
    );
};

export default LanguageToggle;
