const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "";
const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

type ApiOptions = RequestInit & { skipRefresh?: boolean };

let accessTokenGetter: (() => string | null) | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export function setRefreshHandler(handler: () => Promise<string | null>) {
  refreshHandler = handler;
}

function isAuthPath(path: string) {
  return ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout", "/auth/google"].includes(path);
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
  hasRetried = false
): Promise<T> {
  const { skipRefresh, ...fetchOptions } = options;
  const token = accessTokenGetter?.() ?? null;

  const headers = new Headers(fetchOptions.headers || {});
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipRefresh && !hasRetried && refreshHandler && !isAuthPath(path)) {
    const refreshedToken = await refreshHandler();
    if (refreshedToken) {
      const retryHeaders = new Headers(fetchOptions.headers || {});
      if (!isFormData && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
      return api<T>(path, { ...fetchOptions, headers: retryHeaders, skipRefresh: true }, true);
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const error = new Error((data as { error?: string } | null)?.error || "Request failed");
    (error as { status?: number }).status = res.status;
    throw error;
  }

  return data as T;
}
