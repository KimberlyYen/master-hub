export const GUEST_MODE_COOKIE = "guest-mode";

export function hasGuestCookie(
  value: string | undefined | null
): boolean {
  return value === "1";
}
