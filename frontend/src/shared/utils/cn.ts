import type { ClassValue } from '@shared/types';

export const cn = (...classes: ClassValue[]): string => {
  return classes
    .flatMap((cls) => {
      if (cls === false || cls === null || cls === undefined || cls === 0 || cls === '') {
        return [];
      }
      if (typeof cls === 'string' || typeof cls === 'number') {
        return [String(cls)];
      }
      return Object.entries(cls)
        .filter(([, active]) => active)
        .map(([key]) => key);
    })
    .join(' ');
};
