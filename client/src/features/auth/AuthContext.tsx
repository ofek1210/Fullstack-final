import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "./auth.api";
import { clearTokens, getAccessToken, getRefreshToken } from "./tokenStorage";

type AuthState = {
  user: authApi.User | null;
  isLoading: boolean;
  isAuthed: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: authApi.ProfileUpdate, avatarFile?: File | null) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      if (!token && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        if (!token && refreshToken) {
          await authApi.refreshSession();
        }
        const res = await authApi.me();
        setUser(res.user);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(username: string, password: string) {
    await authApi.login(username, password);
    const res = await authApi.me();
    setUser(res.user);
  }

  async function register(username: string, password: string, email?: string) {
    await authApi.register(username, password, email);
    const res = await authApi.me();
    setUser(res.user);
  }

  async function loginWithGoogle(accessToken: string) {
    await authApi.loginWithGoogle(accessToken);
    const res = await authApi.me();
    setUser(res.user);
  }

  function logout() {
    void authApi.logout();
    setUser(null);
  }

  async function updateProfile(profile: authApi.ProfileUpdate, avatarFile?: File | null) {
    const res = await authApi.updateUserProfile(profile, avatarFile);
    setUser(res.user);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthed: Boolean(user),
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
