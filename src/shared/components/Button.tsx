import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "soft";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-theme-sm hover:bg-brand-600 focus-visible:outline-brand-500",
  outline:
    "border border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-brand-500",
  soft:
    "bg-brand-50 text-brand-600 hover:bg-brand-100 focus-visible:outline-brand-500",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <a
      className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
