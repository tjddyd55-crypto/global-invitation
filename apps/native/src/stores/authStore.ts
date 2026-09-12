import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { AuthUser } from '@/src/api/auth';

const TOKEN_KEY = 'gi_auth_session_token';

type AuthStatus = 'idle' | 'bootstrapping' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  bootstrap: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  getToken: () => Promise<string | null>;
};

export async function loadStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function persistToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,

  async bootstrap() {
    set({ status: 'bootstrapping' });
    const token = await loadStoredToken();
    if (!token) {
      set({ status: 'unauthenticated', token: null, user: null });
      return;
    }
    set({ token });
  },

  setSession(token, user) {
    set({ token, user, status: 'authenticated' });
  },

  async clearSession() {
    await removeStoredToken();
    set({ token: null, user: null, status: 'unauthenticated' });
  },

  setUser(user) {
    set({ user });
  },

  async getToken() {
    const inMemory = get().token;
    if (inMemory) return inMemory;
    const stored = await loadStoredToken();
    if (stored) set({ token: stored });
    return stored;
  },
}));
