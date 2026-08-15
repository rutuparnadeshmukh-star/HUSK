import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, saveTokens, saveUser, clearTokens, getStoredUser, setUnauthorizedHandler } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setReady(true);
    });
    const tokens = JSON.parse(localStorage.getItem('husk_tokens') || '{}');
    if (tokens.access) {
      api.get('/auth/me')
        .then((d) => {
          setUser(d.user);
          saveUser(d.user);
        })
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (username, pin, device) => {
    const data = await api.post('/auth/login', { username, pin, device }, { auth: false });
    if (data.biometricRequired) {
      return { biometricRequired: true, pendingAuth: data.pendingAuth, user: data.user };
    }
    saveTokens(data);
    saveUser(data.user);
    setUser(data.user);
    return { biometricRequired: false, user: data.user };
  }, []);

  const completeBiometric = useCallback(async (pendingAuth) => {
    const data = await api.post('/auth/biometric-verify', { pendingAuth }, { auth: false });
    saveTokens(data);
    saveUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post('/auth/register', payload, { auth: false });
    saveTokens(data);
    saveUser(data.user);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const tokens = JSON.parse(localStorage.getItem('husk_tokens') || '{}');
    if (tokens.refresh) {
      try {
        await api.post('/auth/logout', { refreshToken: tokens.refresh }, { auth: false });
      } catch {}
    }
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const d = await api.get('/auth/me');
    setUser(d.user);
    saveUser(d.user);
    return d.user;
  }, []);

  const value = useMemo(
    () => ({ user, setUser, ready, login, register, logout, refreshUser, completeBiometric }),
    [user, ready, login, register, logout, refreshUser, completeBiometric]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
