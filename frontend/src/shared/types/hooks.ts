export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export type UseLocalStorageReturn<T> = [
  value: T,
  setValue: (value: T | ((prev: T) => T)) => void,
  removeValue: () => void,
];
