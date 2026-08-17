import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type UserRole = "user" | "partner" | "clinic";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
  role: UserRole;
}

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (input: LoginInput) => LoginResult;
  logout: () => void;
  resetPassword: (email: string, role: UserRole, newPass: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  updateUser: (updates: Partial<Pick<AuthUser, "name">>) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  isPartnerUser: boolean;
  getPartnerByReferralCode: (code: string) => { id: string; name: string } | null;
  userReferralCode: string | null;
  getClinicHospitalId: string | null;
}

interface DemoAccount extends AuthUser {
  password: string;
  referralCode?: string;
  hospitalId?: string;
}

const AUTH_STORAGE_KEY = "healthbridge_auth_user";
const ACCOUNTS_STORAGE_KEY = "healthbridge_mock_accounts";

// IDs that should be purged from localStorage (old demo accounts)
const PURGE_ACCOUNT_IDS = new Set(["user-demo", "clinic-demo", "partner-sopiko"]);

const defaultAccounts: DemoAccount[] = [
  {
    id: "partner-demo",
    name: "Health Bridge Partner",
    email: "partner@healthbridge.com",
    password: "partner123",
    role: "partner",
    referralCode: "HB-PARTNER",
  },
  {
    id: "clinic-hb",
    name: "HealthBridge Clinic",
    email: "clinic@healthbridge.com",
    password: "clinic123",
    role: "clinic",
    referralCode: "HB-CLINIC",
    hospitalId: "h1",
  },
];

function loadStoredAccounts(): DemoAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return defaultAccounts;
    const parsed = JSON.parse(raw) as DemoAccount[];
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Remove old demo IDs, keep real registered users
      const realUsers = parsed.filter((a) => !PURGE_ACCOUNT_IDS.has(a.id));
      // Ensure default accounts are always present
      const merged = [...defaultAccounts];
      for (const a of realUsers) {
        if (!merged.some((m) => m.id === a.id)) {
          const def = defaultAccounts.find((d) => d.id === a.id);
          merged.push(def?.referralCode ? { ...a, referralCode: def.referralCode } : a);
        }
      }
      return merged;
    }
  } catch {}
  return defaultAccounts;
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email || !parsed?.role || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [accounts, setAccounts] = useState<DemoAccount[]>(loadStoredAccounts);

  const login = ({ email, password, role }: LoginInput): LoginResult => {
    const match = accounts.find(
      (account) =>
        account.email.toLowerCase() === email.trim().toLowerCase() &&
        account.password === password &&
        account.role === role
    );

    if (!match) {
      return { ok: false, error: "Invalid credentials or role." };
    }

    const nextUser: AuthUser = {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    };

    setUser(nextUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}

    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const register = (name: string, email: string, password: string): boolean => {
    const exists = accounts.some(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.role === "user"
    );
    if (exists) return false;

    const newAccount: DemoAccount = {
      id: `user-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      password,
      role: "user",
    };
    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts));
    } catch {}
    return true;
  };

  const resetPassword = (email: string, role: UserRole, newPass: string) => {
    const accIndex = accounts.findIndex(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.role === role
    );
    if (accIndex === -1) return false;

    const newAccounts = [...accounts];
    newAccounts[accIndex] = { ...newAccounts[accIndex], password: newPass };
    setAccounts(newAccounts);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts));
    } catch {}
    return true;
  };

  const updateUser = (updates: Partial<Pick<AuthUser, "name">>) => {
    if (!user) return;
    const nextUser = { ...user, ...updates };
    setUser(nextUser);
    try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser)); } catch {}
    const idx = accounts.findIndex((a) => a.id === user.id);
    if (idx !== -1) {
      const newAccounts = [...accounts];
      newAccounts[idx] = { ...newAccounts[idx], ...updates };
      setAccounts(newAccounts);
      try { localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts)); } catch {}
    }
  };

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    if (!user) return false;
    const idx = accounts.findIndex((a) => a.id === user.id);
    if (idx === -1 || accounts[idx].password !== currentPassword) return false;
    const newAccounts = [...accounts];
    newAccounts[idx] = { ...newAccounts[idx], password: newPassword };
    setAccounts(newAccounts);
    try { localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts)); } catch {}
    return true;
  };

  const getPartnerByReferralCode = (code: string): { id: string; name: string } | null => {
    const acc = accounts.find(
      (a) =>
        (a.role === "partner" || a.role === "clinic") &&
        a.referralCode?.toUpperCase() === code.trim().toUpperCase()
    );
    return acc ? { id: acc.id, name: acc.name } : null;
  };

  const userReferralCode = useMemo<string | null>(() => {
    if (!user || (user.role !== "partner" && user.role !== "clinic")) return null;
    const acc = accounts.find((a) => a.id === user.id);
    return acc?.referralCode ?? null;
  }, [user, accounts]);

  const getClinicHospitalId = useMemo<string | null>(() => {
    if (!user || user.role !== "clinic") return null;
    const acc = accounts.find((a) => a.id === user.id);
    return acc?.hospitalId ?? null;
  }, [user, accounts]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      logout,
      resetPassword,
      register,
      updateUser,
      changePassword,
      isPartnerUser: user?.role === "partner",
      getPartnerByReferralCode,
      userReferralCode,
      getClinicHospitalId,
    }),
    [user, accounts]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
