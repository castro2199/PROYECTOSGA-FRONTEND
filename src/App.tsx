import { useEffect, useState } from "react";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { useAuth } from "./features/auth/hooks/useAuth";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RecoverPasswordPage } from "./features/auth/pages/RecoverPasswordPage";
import { ConfirmPasswordResetPage } from "./features/auth/pages/ConfirmPasswordResetPage";
import { AdminLayout } from "./layouts/AdminLayout";
import { NotificationProvider } from "./features/notifications/context/NotificationProvider";

function getCurrentPath() {
  return window.location.pathname || "/admin";
}

function navigateTo(path: string, replace = false) {
  const nextPath = path.startsWith("/") ? path : `/${path}`;

  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="rounded-2xl border border-gray-200 bg-white px-8 py-6 text-center shadow-theme-xs">
        <p className="text-sm font-semibold text-gray-900">
          Validando sesion...
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Estamos recuperando tu perfil, menu y dashboard.
        </p>
      </section>
    </main>
  );
}

function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const isPublicAuthPath =
    currentPath === "/login" ||
    currentPath === "/recuperar-contrasena" ||
    currentPath === "/recuperar-contrasena/confirmar";

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentPath());

    window.addEventListener("popstate", syncPath);
    return () => {
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated && !isPublicAuthPath) {
      navigateTo("/login", true);
      return;
    }

    if (isAuthenticated && isPublicAuthPath) {
      navigateTo("/admin", true);
    }
  }, [currentPath, isAuthenticated, isInitializing, isPublicAuthPath]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    if (currentPath === "/recuperar-contrasena") {
      return <RecoverPasswordPage />;
    }

    if (currentPath === "/recuperar-contrasena/confirmar") {
      return <ConfirmPasswordResetPage />;
    }

    return <LoginPage />;
  }

  return <NotificationProvider><AdminLayout currentPath={currentPath} onNavigate={navigateTo} /></NotificationProvider>;
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
