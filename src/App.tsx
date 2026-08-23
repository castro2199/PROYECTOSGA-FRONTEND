import { useEffect, useState } from "react";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { useAuth } from "./features/auth/hooks/useAuth";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminLayout } from "./layouts/AdminLayout";

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

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentPath());

    window.addEventListener("popstate", syncPath);
    return () => {
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated && currentPath !== "/login") {
      navigateTo("/login", true);
      return;
    }

    if (isAuthenticated && currentPath === "/login") {
      navigateTo("/admin", true);
    }
  }, [currentPath, isAuthenticated, isInitializing]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AdminLayout currentPath={currentPath} onNavigate={navigateTo} />;
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
