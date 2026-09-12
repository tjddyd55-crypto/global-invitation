import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';

export function useFormFocusChain<T extends string>(fieldOrder: readonly T[]) {
  const refs = useRef<Partial<Record<T, TextInput | null>>>({});

  const setRef = useCallback((name: T) => (node: TextInput | null) => {
    refs.current[name] = node;
  }, []);

  const focusField = useCallback((name: T) => {
    refs.current[name]?.focus();
  }, []);

  const focusNext = useCallback((current: T) => {
    const index = fieldOrder.indexOf(current);
    if (index < 0) return false;
    const next = fieldOrder[index + 1];
    if (!next) return false;
    refs.current[next]?.focus();
    return true;
  }, [fieldOrder]);

  const focusFirst = useCallback(() => {
    const first = fieldOrder[0];
    if (!first) return;
    refs.current[first]?.focus();
  }, [fieldOrder]);

  return { setRef, focusField, focusNext, focusFirst, refs };
}
