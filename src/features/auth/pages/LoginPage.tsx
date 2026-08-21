import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { LoginForm } from "../components/LoginForm";
import type { AuthSession } from "../types/auth.types";

type LoginPageProps = {
  onLoginSuccess: (session: AuthSession) => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[40%_60%]">
      <AuthBrandPanel />
      <LoginForm onSuccess={onLoginSuccess} />
    </main>
  );
}
