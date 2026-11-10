import { describe, expect, it } from 'vitest';
import { selectUiLanguage } from './ui-language';
import { columns, importCsv } from './portfolio';
import en from '../assets/i18n/en.json';
import zh from '../assets/i18n/zh.json';

function entries(node: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    const name = prefix + key;
    if (typeof value === 'string') result[name] = value;
    else Object.assign(result, entries(value as Record<string, unknown>, name + '.'));
  }
  return result;
}

describe('Domain Locker language selection', () => {
  it('honors the first supported preference and normalizes Chinese locale tags', () => {
    expect(selectUiLanguage('en', 'zh-CN')).toBe('en');
    expect(selectUiLanguage('unknown', 'zh-Hans-CN', 'en')).toBe('zh');
    expect(selectUiLanguage(null, 'de-DE')).toBe('de');
  });

  it('covers all English keys and keeps their interpolation parameters', () => {
    const english = entries(en);
    const chinese = entries(zh);
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
    const parameters = (text: string) => (text.match(/[{]+[a-zA-Z]+[}]+/g) || []).sort();
    for (const key of Object.keys(english)) {
      expect(chinese[key], key).toBeTruthy();
      expect(parameters(chinese[key]), key).toEqual(parameters(english[key]));
    }
  });

  it('reports the field and record number in Chinese for an invalid import', () => {
    const csv = [columns.join(','), 'invalid,,,,,,,,'].join('\n');
    expect(() => importCsv(csv, true)).toThrow(/第 1 条记录.*域名/);
    expect(() => importCsv(csv)).toThrow(/Record 1.*domainFull/);
  });
});
