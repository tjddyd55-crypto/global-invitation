import { ko, type KoStrings } from './ko';

const strings: KoStrings = ko;

export function t(path: string): string {
  const parts = path.split('.');
  let current: unknown = strings;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export { ko };
