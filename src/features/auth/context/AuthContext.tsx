import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearSession,
  getStoredSession,
  login as loginRequest,
  refreshSession,
  restoreSession,
  saveSession,
} from "../services/authService";
import type { AuthSession, LoginCredentials } from "../types/auth.types";
import { AuthContext, type AuthContextValue } from "./authContextValue";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );
  const [isInitializing, setIsInitializing] = useState(true);

  const persistSession = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const nextSession = await loginRequest(credentials);
      persistSession(nextSession);
      return nextSession;
    },
    [persistSession],
  );

  const refreshAccessToken = useCallback(async () => {
    const currentSession = getStoredSession();

    if (!currentSession?.refreshToken) {
      logout();
      return null;
    }

    try {
      const refreshedSession = await refreshSession(currentSession.refreshToken);
      persistSession(refreshedSession);
      return refreshedSession.token;
    } catch {
      logout();
      return null;
    }
  }, [logout, persistSession]);

  const refreshSessionData = useCallback(async () => {
    const currentSession = getStoredSession();
    if (!currentSession?.token) return;

    const refreshedSession = await restoreSession(currentSession);
    persistSession(refreshedSession);
  }, [persistSession]);

  useEffect(() => {
    let isMounted = true;
    const storedSession = getStoredSession();

    if (!storedSession?.token) {
      setIsInitializing(false);
      return;
    }

    restoreSession(storedSession)
      .then((restoredSession) => {
        if (!isMounted) return;
        persistSession(restoredSession);
      })
      .catch(async () => {
        if (!isMounted) return;

        const refreshedToken = await refreshAccessToken();
        if (!refreshedToken) logout();
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [logout, persistSession, refreshAccessToken]);

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, logout);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, logout);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: session?.token ?? null,
      dashboard: session?.dashboard ?? null,
      isAuthenticated: Boolean(session?.token && session?.user),
      isInitializing,
      login,
      logout,
      menuItems: session?.menuItems ?? [],
      primaryRole: session?.primaryRole ?? null,
      refreshAccessToken,
      refreshSessionData,
      refreshToken: session?.refreshToken ?? null,
      roles: session?.roles ?? [],
      user: session?.user ?? null,
    }),
    [isInitializing, login, logout, refreshAccessToken, refreshSessionData, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
