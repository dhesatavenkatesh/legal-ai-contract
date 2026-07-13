import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/api";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(
  null,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(
    null,
  );

  const [token, setToken] = useState<string | null>(
    () =>
      localStorage.getItem(
        "legalai_access_token",
      ),
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(
      "legalai_access_token",
    );

    localStorage.removeItem(
      "legalai_user",
    );

    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        localStorage.setItem(
          "legalai_user",
          JSON.stringify(currentUser),
        );
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [token, logout]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginUser(
        payload,
      );

      localStorage.setItem(
        "legalai_access_token",
        response.access_token,
      );

      localStorage.setItem(
        "legalai_user",
        JSON.stringify(response.user),
      );

      setToken(response.access_token);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      await registerUser(payload);

      await login({
        email: payload.email,
        password: payload.password,
      });
    },
    [login],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(
        token && user,
      ),
      isLoading,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}