import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getApiErrorMessage,
  readApiResponse,
} from "@/lib/api-response";

export type UserRole =
  | "super_admin"
  | "admin"
  | "volunteer"
  | "member";

export interface AuthUser {
  id: number;
  name: string;
  profileImageUrl: string | null;
  description: string | null;
  thoughtTemplateId: number | null;
  email: string;
  phone: string | null;
  city: string | null;
  cityDetectedAutomatically: boolean;
  role: UserRole;
  customBadge: string | null;
  orgUnitId: number | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (params: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    name: string;
    profileImageUrl?: string | null;
    description?: string | null;
    city?: string | null;
  }) => Promise<void>;
  refresh: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 90,
  volunteer: 10,
  member: 10,
};

const STORAGE_KEYS = {
  accessToken: "msrf_access_token",
  refreshToken: "msrf_refresh_token",
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
    isLoading: true,
  });

  const setTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      setState((s) => ({ ...s, accessToken, refreshToken }));
    },
    [],
  );

  const clearTokens = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
  }, []);

  // Try to load current user on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { user: AuthUser; accessToken?: string };
          if (data.accessToken) {
            const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
            if (storedRefresh) {
              setTokens(data.accessToken, storedRefresh);
            }
          }
          setState((s) => ({ ...s, user: data.user, isLoading: false }));
        } else if (r.status === 401) {
          // Try refresh
          const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
          if (storedRefresh) {
            const refreshed = await tryRefresh(storedRefresh);
            if (!refreshed) clearTokens();
          } else {
            clearTokens();
          }
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, isLoading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleCustomBadgeUpdated(event: Event) {
      const detail = (event as CustomEvent<{ userId?: number; customBadge?: string | null }>).detail;
      if (typeof detail?.userId !== "number") return;

      setState((current) => {
        const currentUser = current.user;
        if (!currentUser || currentUser.id !== detail.userId) return current;

        return {
          ...current,
          user: {
            ...currentUser,
            customBadge: detail.customBadge ?? null,
          },
        };
      });
    }

    window.addEventListener("custom-badge-updated", handleCustomBadgeUpdated);
    return () => window.removeEventListener("custom-badge-updated", handleCustomBadgeUpdated);
  }, []);

  async function tryRefresh(currentRefreshToken: string): Promise<boolean> {
    try {
      const r = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (!r.ok) return false;

      const data = await r.json() as {
        accessToken: string;
        refreshToken: string;
      };
      setTokens(data.accessToken, data.refreshToken);

      // Fetch user after refresh
      const meRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json() as { user: AuthUser };
        setState((s) => ({ ...s, user: meData.user, isLoading: false }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const login = useCallback(
    async ({
      email,
      password,
      rememberMe = false,
    }: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await readApiResponse<{
        accessToken?: string;
        refreshToken?: string;
        user?: AuthUser;
        error?: string;
      }>(r);

      if (!r.ok) {
        throw new Error(getApiErrorMessage(r, data, "Login failed"));
      }

      setTokens(data!.accessToken!, data!.refreshToken!);
      setState((s) => ({ ...s, user: data!.user! }));
    },
    [setTokens],
  );

  const logout = useCallback(async () => {
    const rt = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (rt) {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {});
    }
    clearTokens();
  }, [clearTokens]);

  const updateProfile = useCallback(
    async (updates: {
      name: string;
      profileImageUrl?: string | null;
      description?: string | null;
      city?: string | null;
    }) => {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken);
      const r = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: updates.name,
          ...(updates.profileImageUrl !== undefined
            ? { profileImageUrl: updates.profileImageUrl }
            : {}),
          ...(updates.description !== undefined
            ? { description: updates.description }
            : {}),
          ...(updates.city !== undefined ? { city: updates.city } : {}),
        }),
      });

       const data = await readApiResponse<{ user?: AuthUser; error?: string }>(r);
       if (!r.ok) {
         throw new Error(getApiErrorMessage(r, data, "Unable to update profile"));
       }
       setState((s) => ({ ...s, user: data?.user ?? s.user }));
    },
    [],
  );

  const refresh = useCallback(async (): Promise<boolean> => {
    const rt = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!rt) return false;
    return tryRefresh(rt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTokens]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!state.user) return false;
      return roles.includes(state.user.role);
    },
    [state.user],
  );

  const hasMinRole = useCallback(
    (minRole: UserRole) => {
      if (!state.user) return false;
      return ROLE_HIERARCHY[state.user.role] >= ROLE_HIERARCHY[minRole];
    },
    [state.user],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user,
        login,
        logout,
        updateProfile,
        refresh,
        hasRole,
        hasMinRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
