import { useEffect, useState } from "react";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  clearSession,
  expireSession,
  getStoredSession,
  refreshSession,
  saveSession,
} from "./features/auth/services/authService";
import type { AuthSession } from "./features/auth/types/auth.types";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminLayout } from "./layouts/AdminLayout";

function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );

  useEffect(() => {
    const handleSessionExpired = () => {
      setSession(null);
    };

    const handleSessionUpdated = (event: Event) => {
      const updatedSession = (event as CustomEvent<AuthSession>).detail;

      if (updatedSession) {
        setSession(updatedSession);
      }
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdated);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdated);
    };
  }, []);

  useEffect(() => {
    if (!session?.refreshToken) return;

    const refreshCurrentSession = async () => {
      try {
        const refreshedSession = await refreshSession(session.refreshToken ?? "");
        saveSession(refreshedSession);
      } catch {
        expireSession();
      }
    };

    const intervalId = window.setInterval(
      () => void refreshCurrentSession(),
      25 * 60 * 1000,
    );

    return () => window.clearInterval(intervalId);
  }, [session?.refreshToken]);

  if (!session) {
    return <LoginPage onLoginSuccess={setSession} />;
  }

  return (
    <AdminLayout
      onLogout={() => {
        clearSession();
        setSession(null);
      }}
      session={session}
    />
  );
}

export default App;
