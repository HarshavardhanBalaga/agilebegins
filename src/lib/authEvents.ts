export const AUTH_CHANGED_EVENT = "auth:changed";

/**
 * Broadcasts that the session changed (login / logout / register) so the
 * navbar — and anything else listening — can re-fetch the current user
 * without a full page reload.
 */
export function emitAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }
}

/**
 * Subscribes to session changes. Returns an unsubscribe function.
 */
export function onAuthChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
}
