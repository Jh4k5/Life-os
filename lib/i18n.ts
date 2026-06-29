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
  compatibilityJSON: 'v4',
});

export const changeLang = async (code: string) => {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem('@lang', code);
};

export default i18n;
