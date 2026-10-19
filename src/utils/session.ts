import { COOKIE, setCookie, deleteUuidCookie, getCookie } from "./cookie";

type Session = { id: string; exp: number };

export function getSession(params?: { path?: string, useCookie?: boolean, key?: string }): Session | null {
  const { path, useCookie = false, key = COOKIE.UUID } = params || {};
  if (useCookie) {
    const id = getCookie(key)
    return { id } as Session;
  }
  const sessionString = localStorage.getItem(key);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  const session = sessions?.[pathName];

  if (!session) return null;

  if (session.exp < Date.now()) {
    deleteSession({ useCookie });
    return null;
  }

  return session;
}

export function setSession(params: { id: string, expireTimeInMinutes: number, path?: string, useCookie?: boolean, key?: string }): Session {
  const { id, expireTimeInMinutes, path, useCookie = false, key = COOKIE.UUID } = params;

  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + expireTimeInMinutes * 60 * 1000);
  const pathName = path || globalThis?.location?.pathname || "/";

  if (useCookie) {
    setCookie(key, id, expireTimeInMinutes, pathName);
    return { id, exp: expirationDate.getTime() };
  }

  const sessionString = localStorage.getItem(key);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);

  const newSession = { id, exp: expirationDate.getTime() };
  const updatedSessions = { ...sessions, [pathName]: newSession };
  localStorage.setItem(key, btoa(JSON.stringify(updatedSessions)));
  return newSession;
}

// Restarts the expiry of the current session, mirroring the backend which resets
// its session timeout on every request.
export function refreshSession(params: { expireTimeInMinutes: number, path?: string, useCookie?: boolean, key?: string }): Session | null {
  const { expireTimeInMinutes, path, useCookie, key } = params;
  const session = getSession({ path, useCookie, key });
  if (!session?.id) return null;
  return setSession({ id: session.id, expireTimeInMinutes, path, useCookie, key });
}

export function deleteSession(params?: { path?: string, useCookie?: boolean, key?: string }): void {
  const { path, useCookie = false, key = COOKIE.UUID } = params || {};
  if (useCookie) return deleteUuidCookie(key);
  const sessionString = localStorage.getItem(key);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  if (!sessions?.[pathName]) return;
  delete sessions[pathName];
  localStorage.setItem(key, btoa(JSON.stringify(sessions)));
}
