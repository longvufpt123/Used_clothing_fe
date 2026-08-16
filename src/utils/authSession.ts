const AUTH_STORAGE_KEYS = ['accessToken', 'refreshToken', 'tokenExpiredAt', 'user'] as const;

type JwtPayload = { exp?: number };

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenExpirationTime = (): number | null => {
  const storedExpiration = localStorage.getItem('tokenExpiredAt');
  if (storedExpiration) {
    const value = Date.parse(storedExpiration);
    if (!Number.isNaN(value)) return value;
  }

  const token = localStorage.getItem('accessToken');
  const exp = token ? decodeJwtPayload(token)?.exp : undefined;
  return typeof exp === 'number' ? exp * 1000 : null;
};

export const hasValidStoredSession = (): boolean => {
  if (!localStorage.getItem('accessToken') || !localStorage.getItem('user')) return false;
  const expiresAt = getTokenExpirationTime();
  return expiresAt === null || expiresAt > Date.now();
};

export const clearAuthSession = (notify = true) => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  if (notify) window.dispatchEvent(new Event('auth:logout'));
};
