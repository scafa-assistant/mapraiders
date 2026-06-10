// ============================================================
// Lightweight typed i18n — no runtime deps beyond expo-localization.
// Locale is resolved once at app start (device language, EN fallback).
// Usage:
//   import { strings as S, t, plural } from '../../i18n';
//   <Text>{S.social.friends.emptyTitle}</Text>
//   Alert.alert(S.common.error, t(S.social.friends.removeFailed, { username }));
// ============================================================

import { getLocales } from 'expo-localization';
import en from './en';
import de from './de';

export type Strings = typeof en;

const translations: Record<string, Strings> = { en, de };

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

export const strings: Strings = translations[deviceLanguage] ?? en;

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
