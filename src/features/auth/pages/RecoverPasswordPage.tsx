import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { RecoverPasswordForm } from "../components/RecoverPasswordForm";

export function RecoverPasswordPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[40%_60%]">
      <AuthBrandPanel />
      <RecoverPasswordForm />
    </main>
  );
}
