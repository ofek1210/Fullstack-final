import { api, setRefreshHandler } from "../../lib/api";
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from "./tokenStorage";

export type User = {
  userId: string;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  city?: string;
  bio?: string;
  oauthProvider?: string;
};

export type ProfileUpdate = {
  username?: string;
  avatarUrl?: string;
  email?: string;
  birthDate?: string;
  gender?: string;
};

export async function login(username: string, password: string) {
  const res = await api<{ token: string; refreshToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setAccessToken(res.token);
  setRefreshToken(res.refreshToken);
  return res;
}

export async function register(username: string, password: string, email?: string) {
  const payload: { username: string; password: string; email?: string } = { username, password };
  const trimmedEmail = email?.trim();
  if (trimmedEmail) payload.email = trimmedEmail;

  const res = await api<{ token: string; refreshToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  setAccessToken(res.token);
  setRefreshToken(res.refreshToken);
  return res;
}

export async function me() {
  return api<{ user: User }>("/me");
}

export async function updateMe(profile: ProfileUpdate) {
  return api<{ user: User }>("/users/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function loginWithGoogle(accessToken: string) {
  const res = await api<{ token: string; refreshToken: string }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });

  setAccessToken(res.token);
  setRefreshToken(res.refreshToken);
  return res;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await api<{ token: string; refreshToken: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    skipRefresh: true,
  });

  setAccessToken(res.token);
  setRefreshToken(res.refreshToken);
  return res.token;
}

export async function updateUserProfile(profile: ProfileUpdate, avatarFile?: File | null) {
  const formData = new FormData();

  Object.entries(profile).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim() !== "") {
      formData.append(key, value);
    }
  });

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  return api<{ user: User }>("/users/me", {
    method: "PATCH",
    body: formData,
  });
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await api("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipRefresh: true,
      });
    } catch {
      // ignore logout failures
    }
  }
  clearTokens();
}

setRefreshHandler(async () => {
  try {
    return await refreshSession();
  } catch {
    clearTokens();
    return null;
  }
});

