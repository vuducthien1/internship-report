import { useEffect, useRef, useState } from 'react';
import { Cloud, Mic, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getAwsStatusApi, transcribeWithAwsApi } from '../../services/awsService';

const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const VoiceInput = ({ value, onChange, onVoiceUsed, disabled = false }) => {
    const { t, language } = useLanguage();
    const [recordingMode, setRecordingMode] = useState(null);
    const [awsAvailable, setAwsAvailable] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef(null); const recorderRef = useRef(null); const streamRef = useRef(null); const chunksRef = useRef([]); const valueRef = useRef(value);
    useEffect(() => { valueRef.current = value; }, [value]);
    useEffect(() => { getAwsStatusApi().then((result) => setAwsAvailable(Boolean(result.success && result.data.services.transcribe.configured))); }, []);
    useEffect(() => () => { recognitionRef.current?.stop(); recorderRef.current?.state === 'recording' && recorderRef.current.stop(); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
    const appendTranscript = (transcript) => { if (!transcript.trim()) return; onVoiceUsed?.(); onChange(valueRef.current ? `${valueRef.current} ${transcript.trim()}` : transcript.trim()); };

    const startBrowser = () => {
        if (!SpeechRecognition || disabled) return;
        setError(''); const recognition = new SpeechRecognition(); recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US'; recognition.continuous = true; recognition.interimResults = true;
        recognition.onresult = (event) => { let transcript = ''; for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) transcript += event.results[i][0].transcript; appendTranscript(transcript); };
        recognition.onerror = () => { setError(t('micPermissionDenied')); setRecordingMode(null); }; recognition.onend = () => setRecordingMode(null);
        recognitionRef.current = recognition; recognition.start(); setRecordingMode('browser');
    };
    const stopBrowser = () => { recognitionRef.current?.stop(); recognitionRef.current = null; setRecordingMode(null); };

    const startAws = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || disabled) return;
        try {
            setError(''); const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = [];
            const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'; const recorder = new MediaRecorder(stream, { mimeType: type }); recorderRef.current = recorder;
            recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; setRecordingMode(null);
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); if (blob.size < 1000) { setError(t('voiceTooShort')); return; }
                setProcessing(true); const result = await transcribeWithAwsApi(blob, language === 'vi' ? 'vi-VN' : 'en-US'); setProcessing(false);
                if (result.success) appendTranscript(result.data.transcript); else setError(result.message);
            };
            recorder.start(); setRecordingMode('aws');
        } catch { setError(t('micPermissionDenied')); }
    };
    const stopAws = () => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); };

    if (!SpeechRecognition && !awsAvailable) return <p className="alert alert-info">{t('voiceNotSupported')}</p>;
    return <div className={`voice-input ${recordingMode ? 'recording' : ''}`}><div className="voice-controls">
        {awsAvailable && recordingMode !== 'browser' && (recordingMode === 'aws' ? <button type="button" className="btn btn-danger btn-sm" onClick={stopAws}><Square size={15}/>{t('stopRecording')}</button> : <button type="button" className="btn btn-primary btn-sm" onClick={startAws} disabled={disabled||processing}><Cloud size={15}/>{processing?t('awsTranscribing'):t('awsTranscribe')}</button>)}
        {SpeechRecognition && recordingMode !== 'aws' && (recordingMode === 'browser' ? <button type="button" className="btn btn-danger btn-sm" onClick={stopBrowser}><Square size={15}/>{t('stopRecording')}</button> : <button type="button" className="btn btn-accent btn-sm" onClick={startBrowser} disabled={disabled||processing}><Mic size={15}/>{t('browserVoice')}</button>)}
        {recordingMode && <span className="voice-indicator"><span className="voice-dot"/>{t('listening')}</span>}{processing&&<span className="text-sm font-semibold text-indigo-600">{t('awsTranscribing')}</span>}
    </div>{error&&<p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}<textarea className="form-textarea" value={value} onChange={(event)=>onChange(event.target.value)} placeholder={t('reportPlaceholder')} rows={4} required disabled={processing}/></div>;
};
export default VoiceInput;
