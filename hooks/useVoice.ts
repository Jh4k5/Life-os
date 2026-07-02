// hooks/useVoice.ts
// Voice is the MAIN input. The user starts and stops — recording NEVER
// auto-stops: when the native recognizer self-ends (Android STT does this
// after silence), we commit the segment and immediately restart, accumulating
// one long transcript across segments. Only the user's stop finalizes and
// fires onFinal. NEVER fabricates text — deny/fail ends with nothing.
// Loaded through a shim so the app runs in Expo Go (voice disabled) and
// full-featured in a dev/production build. See services/speech.ts.
import { useState, useCallback, useRef } from 'react';
import { SpeechRecognition, useSpeechRecognitionEvent, speechAvailable } from '@/services/speech';
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

  // refs so native event handlers always see live values
  const committedRef = useRef(''); // finished segments, accumulated
  const currentRef = useRef(''); // live segment transcript
  const recordingRef = useRef(false); // user-intent: still recording
  const stoppingRef = useRef(false); // user pressed stop → finalize on end

  const startNative = useCallback(() => {
    SpeechRecognition.start({
      lang: LANG_MAP[i18n.language] ?? 'ar-SA',
      interimResults: true,
      continuous: true,
    });
  }, [i18n.language]);

  const finalize = useCallback(() => {
    const full = `${committedRef.current} ${currentRef.current}`.replace(/\s+/g, ' ').trim();
    committedRef.current = '';
    currentRef.current = '';
    recordingRef.current = false;
    stoppingRef.current = false;
    setPartial('');
    if (full) {
      setState('processing');
      onFinal(full);
    }
    setState('idle');
  }, [onFinal]);

  useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results?.[0]?.transcript ?? '';
    currentRef.current = transcript;
    setPartial(`${committedRef.current} ${transcript}`.replace(/\s+/g, ' ').trim());
    if (e.isFinal && transcript.trim()) {
      // segment done — bank it; the 'end' handler decides restart vs finalize
      committedRef.current = `${committedRef.current} ${transcript}`.replace(/\s+/g, ' ').trim();
      currentRef.current = '';
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (stoppingRef.current) {
      finalize();
      return;
    }
    if (recordingRef.current) {
      // native recognizer self-ended (silence) — the user did NOT stop:
      // keep the session alive by restarting immediately.
      try {
        startNative();
      } catch {
        finalize(); // can't restart — deliver what we have, honestly
      }
    }
  });

  useSpeechRecognitionEvent('error', () => {
    if (stoppingRef.current || !recordingRef.current) {
      finalize();
      return;
    }
    // transient error mid-recording → try to keep going; give up gracefully
    try {
      startNative();
    } catch {
      finalize();
    }
  });

  const start = useCallback(async () => {
    try {
      const perm = await SpeechRecognition.requestPermissionsAsync();
      if (!perm.granted) return;
      committedRef.current = '';
      currentRef.current = '';
      stoppingRef.current = false;
      recordingRef.current = true;
      setPartial('');
      setState('recording');
      startNative();
    } catch {
      recordingRef.current = false;
      setState('idle');
    }
  }, [startNative]);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    recordingRef.current = false;
    try {
      SpeechRecognition.stop();
      setState('processing');
    } catch {
      finalize();
    }
  }, [finalize]);

  const toggle = useCallback(() => {
    if (state === 'recording') stop();
    else if (state === 'idle') start();
  }, [state, start, stop]);

  return { state, partial, start, stop, toggle, available: speechAvailable };
}
