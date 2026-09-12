import { createContext, useContext } from 'react';
import type { View } from 'react-native';

type KeyboardFormContextValue = {
  scrollToField: (field: View) => void;
};

export const KeyboardFormContext = createContext<KeyboardFormContextValue | null>(null);

export function useKeyboardFormScroll(): KeyboardFormContextValue | null {
  return useContext(KeyboardFormContext);
}
