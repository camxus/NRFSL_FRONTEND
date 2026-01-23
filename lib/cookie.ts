export function setCookieClient(
  name: string,
  value: string,
  days: number = 7
): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookieClient(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
      const c = cookie.trim();
      if (c.indexOf(nameEQ) === 0) {
        resolve(decodeURIComponent(c.substring(nameEQ.length)));
        return;
      }
    }
    resolve(null);
  });
}

export function removeCookieClient(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
