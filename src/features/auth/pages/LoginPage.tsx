import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[40%_60%]">
      <AuthBrandPanel />
      <LoginForm />
    </main>
  );
}
