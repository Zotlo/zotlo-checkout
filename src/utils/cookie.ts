export enum COOKIE {
  UUID = "zc_uuid",
  CARD_UUID = "zc_card_uuid",
}

export function setCookie(
  name: string,
  value: string,
  expireTimeInMinutes?: number,
  path: string = "/",
  secure: boolean = false,
  sameSite: "Strict" | "Lax" | "None" = "Lax"
): void {
  // Build cookie string
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Add expiration if specified
  if (expireTimeInMinutes !== undefined) {
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + expireTimeInMinutes * 60 * 1000
    );
    cookieString += `; expires=${expirationDate.toUTCString()}`;
  }

  cookieString += `; path=${path}`;
  if (secure) cookieString += "; secure";
  cookieString += `; samesite=${sameSite}`;
  // Set the cookie
  globalThis.document.cookie = cookieString;
}

export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + "=";
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1);
    }

    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

export function deleteCookie(name: string, path: string = "/"): void {
  setCookie(name, "", -1, path);
}

export function deleteUuidCookie(key: string = COOKIE.UUID): void {
  const pathName = globalThis?.location?.pathname || "/";
  deleteCookie(key, pathName);
}
