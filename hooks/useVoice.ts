// hooks/useVoice.ts
// Real speech capture via expo-speech-recognition. Live device transcription
// (Web Speech API on web). NEVER fabricates text — if permission is denied or
// recognition fails, it ends with no transcript and the caller does nothing.
import { useState, useCallback } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useTranslation } from 'react-i18next';

export type VoiceState = 'idle' | 'recording' | 'processing';

const LANG_MAP: Record<string, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  fr: 'fr-FR',
  tr: 'tr-TR',
  es: 'es-ES',
  de: 'de-DE',
  ur: 'ur-PK',
};

export function useVoice(onFinal: (text: string) => void) {
  const { i18n } = useTranslation();
  const [state, setState] = useState<VoiceState>('idle');
  const [partial, setPartial] = useState('');

  useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results?.[0]?.transcript ?? '';
    setPartial(transcript);
    if (e.isFinal && transcript.trim()) {
      setState('processing');
      onFinal(transcript.trim());
      setPartial('');
      setState('idle');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    // ended without a final result → return to idle, fabricate nothing
    setState((s) => (s === 'recording' ? 'idle' : s));
  });

  useSpeechRecognitionEvent('error', () => {
    setPartial('');
    setState('idle');
  });

  const start = useCallback(async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      setPartial('');
      setState('recording');
      ExpoSpeechRecognitionModule.start({
        lang: LANG_MAP[i18n.language] ?? 'ar-SA',
        interimResults: true,
        continuous: false,
      });
    } catch {
      setState('idle');
    }
  }, [i18n.language]);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* noop */
    }
    setState((s) => (s === 'recording' ? 'processing' : s));
  }, []);

  const toggle = useCallback(() => {
    if (state === 'recording') stop();
    else if (state === 'idle') start();
  }, [state, start, stop]);

  return { state, partial, start, stop, toggle };
}
