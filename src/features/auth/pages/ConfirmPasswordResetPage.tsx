import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { ConfirmPasswordResetForm } from "../components/ConfirmPasswordResetForm";

export function ConfirmPasswordResetPage() {
  return <main className="min-h-screen lg:grid lg:grid-cols-[40%_60%]"><AuthBrandPanel /><ConfirmPasswordResetForm /></main>;
}
