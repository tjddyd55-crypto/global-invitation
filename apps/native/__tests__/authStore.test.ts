import * as SecureStore from 'expo-secure-store';
import { loadStoredToken, persistToken, removeStoredToken, useAuthStore } from '@/src/stores/authStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'idle', token: null, user: null });
    jest.clearAllMocks();
  });

  it('persists and loads token via SecureStore only', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('session-token');

    await persistToken('session-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('gi_auth_session_token', 'session-token');

    const token = await loadStoredToken();
    expect(token).toBe('session-token');
  });

  it('clears session and removes stored token', async () => {
    useAuthStore.setState({ token: 'abc', user: { id: '1', username: 'u', email: null, nickname: null, role: 'USER' }, status: 'authenticated' });
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().clearSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('removeStoredToken is safe when SecureStore fails', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(removeStoredToken()).resolves.toBeUndefined();
  });
});
