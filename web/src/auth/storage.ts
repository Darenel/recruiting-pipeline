export type UserRole = "RECRUITER" | "ADMIN";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const storageKey = "recruiting.auth";

export function readAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function writeAuthSession(session: AuthSession) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(storageKey);
}
