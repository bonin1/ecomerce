'use client';

/** Trimmed OAuth Web Client ID from the build env (empty if unset). */
export function getGoogleWebClientId(): string {
    return (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();
}

/** Resolves when `accounts.google.com/gsi/client` has loaded, or `null` on timeout/abort. */
export async function whenGoogleIdentityReady(
    signal: AbortSignal,
    timeoutMs = 12000
): Promise<typeof google.accounts.id | null> {
    const deadline = Date.now() + timeoutMs;
    while (!signal.aborted && Date.now() < deadline) {
        const id = typeof window !== 'undefined' ? window.google?.accounts?.id : undefined;
        if (id) return id;
        await new Promise((r) => setTimeout(r, 50));
    }
    return null;
}
