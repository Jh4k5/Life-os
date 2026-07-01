// services/speech.ts
// Expo Go does NOT bundle the third-party `expo-speech-recognition` native
// module. Importing it directly would crash the app on launch in Expo Go.
// This shim loads it only when the native side is actually present, so:
//   • Expo Go            → voice gracefully disabled (everything else works)
//   • dev/production build → full real speech recognition
// The chosen implementation is fixed once at module load, so the exported hook
// keeps a stable identity — safe under the Rules of Hooks.
import { requireOptionalNativeModule } from 'expo-modules-core';

type PermResult = { granted: boolean };
interface SpeechModule {
  requestPermissionsAsync: () => Promise<PermResult>;
  start: (opts: { lang: string; interimResults?: boolean; continuous?: boolean }) => void;
  stop: () => void;
}

// null in Expo Go (module absent) — never throws.
const hasNative = !!requireOptionalNativeModule('ExpoSpeechRecognition');

let mod: any = null;
if (hasNative) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('expo-speech-recognition');
  } catch {
    mod = null;
  }
}

/** True only in a dev/production build where the native module exists. */
export const speechAvailable: boolean = hasNative && !!mod;

/** Real module in a build; safe no-op stubs in Expo Go. */
export const SpeechRecognition: SpeechModule = mod?.ExpoSpeechRecognitionModule ?? {
  requestPermissionsAsync: async () => ({ granted: false }),
  start: () => {},
  stop: () => {},
};

/** Real event hook in a build; a no-op hook in Expo Go (registers nothing). */
export const useSpeechRecognitionEvent: (event: string, listener: (e: any) => void) => void =
  mod?.useSpeechRecognitionEvent ?? (() => {});
