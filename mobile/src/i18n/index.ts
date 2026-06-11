// ============================================================
// Lightweight typed i18n — no runtime deps beyond expo-localization.
// Locale = manual override (persisted) or device language, EN fallback.
//
// `strings` is a mutable container: its domain objects are swapped in
// place on language change, so render-time reads (S.common.save) are
// always current. App.tsx remounts the tree on change via onLanguageChange.
// IMPORTANT: never capture string VALUES at module scope — wrap config
// objects that use S.* in functions evaluated at render time.
//
// Usage:
//   import { strings as S, t, plural } from '../../i18n';
//   <Text>{S.social.friends.emptyTitle}</Text>
//   Alert.alert(S.common.error, t(S.social.friends.removeFailed, { username }));
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import en from './en';
import de from './de';

export type Strings = typeof en;
export type AppLanguage = 'system' | 'en' | 'de';

const LANGUAGE_KEY = '@mapraiders_language';

const translations: Record<string, Strings> = { en, de };

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

let currentLanguage: AppLanguage = 'system';

function resolve(lang: AppLanguage): Strings {
  const code = lang === 'system' ? deviceLanguage : lang;
  return translations[code] ?? en;
}

export const strings: Strings = { ...resolve('system') };

const listeners = new Set<() => void>();

function apply(lang: AppLanguage): void {
  currentLanguage = lang;
  Object.assign(strings, resolve(lang));
}

/** The user's language setting ('system' = follow device locale). */
export function getAppLanguage(): AppLanguage {
  return currentLanguage;
}

/** The effective language code currently rendered ('en' | 'de'). */
export function getEffectiveLanguage(): string {
  const code = currentLanguage === 'system' ? deviceLanguage : currentLanguage;
  return translations[code] ? code : 'en';
}

/**
 * Load the persisted language override. Must complete before the first
 * render (App.tsx awaits this) so cold starts show the right language.
 */
export async function initLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'de') {
      apply(stored);
    }
  } catch {
    // keep device locale
  }
}

/** Change language at runtime; persists and notifies listeners (App remounts). */
export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  apply(lang);
  listeners.forEach((listener) => listener());
  try {
    if (lang === 'system') {
      await AsyncStorage.removeItem(LANGUAGE_KEY);
    } else {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    }
  } catch {
    // in-memory switch still applied
  }
}

export function onLanguageChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Interpolate {placeholders} in a translated template. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`,
  );
}

/** Pick singular/plural template by count and interpolate {count}. */
export function plural(count: number, one: string, other: string): string {
  return t(count === 1 ? one : other, { count });
}
