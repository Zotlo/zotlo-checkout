import { COOKIE } from "./cookie";

type Session = { id: string; exp: number };

export function getSession(path?: string): Session | null {
  const sessionString = localStorage.getItem(COOKIE.UUID);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  const session = sessions?.[pathName];

  if (!session) return null;

  if (session.exp < Date.now()) {
    deleteSession();
    return null;
  }

  return session;
}

export function setSession(id: string, expireTimeInMinutes: number, path?: string): Session {
  const sessionString = localStorage.getItem(COOKIE.UUID);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + expireTimeInMinutes * 60 * 1000);

  const newSession = { id, exp: expirationDate.getTime() };
  const updatedSessions = { ...sessions, [pathName]: newSession };
  localStorage.setItem(COOKIE.UUID, btoa(JSON.stringify(updatedSessions)));
  return newSession;
}

export function deleteSession(path?: string): void {
  const sessionString = localStorage.getItem(COOKIE.UUID);
  const sessions = (sessionString ? JSON.parse(atob(sessionString)) as Record<string, Session> : null);
  const pathName = path || globalThis?.location?.pathname || "/";
  if (!sessions?.[pathName]) return;
  delete sessions[pathName];
  localStorage.setItem(COOKIE.UUID, btoa(JSON.stringify(sessions)));
}
