// lib/i18n.ts
import * as Loc from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ar from '@/locales/ar.json';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import tr from '@/locales/tr.json';
import es from '@/locales/es.json';
import de from '@/locales/de.json';
import ur from '@/locales/ur.json';

export const RTL = ['ar', 'ur'];

export const LANGS = [
  { code: 'ar', flag: '🇸🇦', name: 'العربية', rtl: true },
  { code: 'en', flag: '🇺🇸', name: 'English', rtl: false },
  { code: 'fr', flag: '🇫🇷', name: 'Français', rtl: false },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe', rtl: false },
  { code: 'es', flag: '🇪🇸', name: 'Español', rtl: false },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', rtl: false },
  { code: 'ur', flag: '🇵🇰', name: 'اردو', rtl: true },
];

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    fr: { translation: fr },
    tr: { translation: tr },
    es: { translation: es },
    de: { translation: de },
    ur: { translation: ur },
  },
  lng: Loc.getLocales()[0]?.languageCode ?? 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  // Hermes (RN) does not ship a complete Intl.PluralRules, which the v4 JSON
  // plural format depends on. Use v3 so pluralization never touches Intl —
  // otherwise i18next logs an error on every startup.
  compatibilityJSON: 'v3',
});

export const changeLang = async (code: string) => {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem('@lang', code);
};

// Restore the user's chosen language on boot. i18n.init is synchronous (device
// locale), so we asynchronously re-apply the persisted `@lang` right after —
// otherwise a language change silently reset to the device locale on restart.
AsyncStorage.getItem('@lang')
  .then((code) => {
    if (code && code !== i18n.language) i18n.changeLanguage(code);
  })
  .catch(() => {});

export default i18n;
