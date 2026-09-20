import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  verifyMfa as verifyMfaRequest,
} from "../services/authService";
import type { AuthSession, LoginCredentials, MfaChallenge } from "../types/auth.types";
import { AuthContext, type AuthContextValue } from "./authContextValue";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const lastActivityRef = useRef(Date.now());

  const persistSession = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const idleTimeout = session?.sessionPolicy?.idleTimeoutSeconds;
    if (!session?.token || !idleTimeout || idleTimeout <= 0) return;
    lastActivityRef.current = Date.now();
    let lastRecorded = 0;
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < 1000) return;
      lastRecorded = now;
      lastActivityRef.current = now;
    };
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "scroll", "touchstart", "popstate"];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current < idleTimeout * 1000) return;
      clearSession();
      setSession(null);
      sessionStorage.setItem("sga.auth.idle-message", "La sesion se cerro por inactividad.");
    }, Math.min(30_000, Math.max(1_000, idleTimeout * 1000)));
    return () => { events.forEach((event) => window.removeEventListener(event, recordActivity)); window.clearInterval(timer); };
  }, [session?.sessionPolicy?.idleTimeoutSeconds, session?.token]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const nextSession = await loginRequest(credentials);
      if ("token" in nextSession) persistSession(nextSession);
      return nextSession;
    },
    [persistSession],
  );

  const verifyMfa = useCallback(
    async (challenge: MfaChallenge, code: string) => {
      const nextSession = await verifyMfaRequest(challenge, code);
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
      verifyMfa,
      logout,
      menuItems: session?.menuItems ?? [],
      primaryRole: session?.primaryRole ?? null,
      refreshAccessToken,
      refreshSessionData,
      refreshToken: session?.refreshToken ?? null,
      roles: session?.roles ?? [],
      user: session?.user ?? null,
    }),
    [isInitializing, login, logout, refreshAccessToken, refreshSessionData, session, verifyMfa],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
