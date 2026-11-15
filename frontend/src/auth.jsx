import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrf } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null, verification: false, payments: false });

  const apply = useCallback((s) => {
    setCsrf(s.csrf);
    setState((prev) => ({ ready: true, user: s.user ?? null, verification: s.verification ?? prev.verification, payments: s.payments ?? prev.payments }));
  }, []);

  useEffect(() => {
    let alive = true;
    api('/api/session')
      .then((s) => alive && apply(s))
      .catch(() => alive && setState({ ready: true, user: null, verification: false, payments: false }));
    return () => {
      alive = false;
    };
  }, [apply]);

  const login = useCallback(async (email, password) => apply(await api('/api/login', { method: 'POST', body: { email, password } })), [apply]);
  const register = useCallback(
    async (name, email, password) => apply(await api('/api/register', { method: 'POST', body: { name, email, password } })),
    [apply]
  );
  const logout = useCallback(async () => apply(await api('/api/logout', { method: 'POST' })), [apply]);
  const refresh = useCallback(async () => apply(await api('/api/session')), [apply]);

  // adopt: take over a session the server just started (after a password reset).
  const value = useMemo(() => ({ ...state, login, register, logout, refresh, adopt: apply }), [state, login, register, logout, refresh, apply]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
