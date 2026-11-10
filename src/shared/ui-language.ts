export const availableLanguages = [
  { code: 'zh', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
];

export function selectUiLanguage(...preferences: (string | null | undefined)[]): string {
  for (const preference of preferences) {
    const code = preference?.toLowerCase().split(/[-_]/)[0];
    if (availableLanguages.some((language) => language.code === code)) return code!;
  }
  return 'en';
}

export function browserUiLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  let saved: string | null = null;
  try { saved = localStorage.getItem('domain-locker.language') ?? (document.documentElement.dataset['defaultLanguage'] ? null : localStorage.getItem('language')); } catch { /* Storage is optional. */ }
  return selectUiLanguage(new URLSearchParams(location.search).get('lang'), saved,
    document.documentElement.dataset['defaultLanguage'], ...navigator.languages, navigator.language);
}
