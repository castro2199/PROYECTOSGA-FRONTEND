import { createContext } from "react";
import type {
  AuthMenuItem,
  AuthSession,
  AuthUser,
  LoginCredentials,
} from "../types/auth.types";

export type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  roles: string[];
  primaryRole: string | null;
  menuItems: AuthMenuItem[];
  dashboard: unknown;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  refreshSessionData: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
