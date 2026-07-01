import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageToggle from '../../components/common/LanguageToggle';
import PageHeader from '../../components/common/PageHeader';

const VOICE_AUTO_KEY = 'vdcm_voice_auto_transcribe';

const Settings = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [voiceAuto, setVoiceAuto] = useState(() => {
        const saved = localStorage.getItem(VOICE_AUTO_KEY);
        return saved !== 'false';
    });

    const handleVoiceAutoChange = (value) => {
        setVoiceAuto(value);
        localStorage.setItem(VOICE_AUTO_KEY, String(value));
    };

    return (
        <div>
            <PageHeader
                title={t('settings')}
                subtitle={t('preferences')}
                icon="⚙️"
            />

            <div className="settings-grid">
                <div className="card settings-card">
                    <h3>
                        <span className="settings-card-icon">🎨</span>
                        {t('appearance')}
                    </h3>
                    <div className="settings-row">
                        <div>
                            <div className="settings-label">{t('theme')}</div>
                            <div className="settings-desc">
                                {theme === 'light' ? t('lightMode') : t('darkMode')}
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="card settings-card">
                    <h3>
                        <span className="settings-card-icon">🌐</span>
                        {t('language')}
                    </h3>
                    <div className="settings-row">
                        <div>
                            <div className="settings-label">{t('language')}</div>
                            <div className="settings-desc">{t('preferences')}</div>
                        </div>
                        <LanguageToggle />
                    </div>
                </div>

                <div className="card settings-card">
                    <h3>
                        <span className="settings-card-icon">🎤</span>
                        {t('voiceSettings')}
                    </h3>
                    <div className="settings-row">
                        <div>
                            <div className="settings-label">{t('autoTranscribe')}</div>
                            <div className="settings-desc">{t('featureVoiceDesc')}</div>
                        </div>
                        <div className="toggle-group">
                            <button
                                className={`toggle-btn ${voiceAuto ? 'active' : ''}`}
                                onClick={() => handleVoiceAutoChange(true)}
                            >
                                ON
                            </button>
                            <button
                                className={`toggle-btn ${!voiceAuto ? 'active' : ''}`}
                                onClick={() => handleVoiceAutoChange(false)}
                            >
                                OFF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
