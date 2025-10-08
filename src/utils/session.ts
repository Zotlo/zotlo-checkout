import { COOKIE, setCookie, deleteUuidCookie, getCookie } from "./cookie";

type Session = { id: string; exp: number };

export function getSession(params?: { path?: string, useCookie?: boolean }): Session | null {
  const { path, useCookie = false } = params || {};
  if (useCookie) {
    const id = getCookie(COOKIE.UUID)
    return { id } as Session;
  }
  const sessionString = localStorage.getItem(COOKIE.UUID);
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

export function setSession(params: { id: string, expireTimeInMinutes: number, path?: string, useCookie?: boolean }): Session {
  const { id, expireTimeInMinutes, path, useCookie = false } = params;

  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + expireTimeInMinutes * 60 * 1000);
  const pathName = path || globalThis?.location?.pathname || "/";

  if (useCookie) {
    setCookie(COOKIE.UUID, id, expireTimeInMinutes, pathName);
    return { id, exp: expirationDate.getTime() };
  }

  const sessionString = localStorage.getItem(COOKIE.UUID);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);

  const newSession = { id, exp: expirationDate.getTime() };
  const updatedSessions = { ...sessions, [pathName]: newSession };
  localStorage.setItem(COOKIE.UUID, btoa(JSON.stringify(updatedSessions)));
  return newSession;
}

export function deleteSession(params?: { path?: string, useCookie?: boolean }): void {
  const { path, useCookie = false } = params || {};
  if (useCookie) return deleteUuidCookie();
  const sessionString = localStorage.getItem(COOKIE.UUID);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  if (!sessions?.[pathName]) return;
  delete sessions[pathName];
  localStorage.setItem(COOKIE.UUID, btoa(JSON.stringify(sessions)));
}
