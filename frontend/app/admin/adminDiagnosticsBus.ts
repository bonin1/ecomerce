export type AdminDiagnosticEntry = {
    id: string;
    ts: number;
    kind: 'network' | 'api' | 'window' | 'unhandledrejection' | 'react';
    message: string;
    detail?: string;
};

const EVT = 'admin-diagnostic-push';

export function pushAdminDiagnostic(
    entry: Omit<AdminDiagnosticEntry, 'id' | 'ts'> & { id?: string }
): void {
    if (typeof window === 'undefined') return;
    const full: AdminDiagnosticEntry = {
        id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ts: Date.now(),
        kind: entry.kind,
        message: entry.message,
        detail: entry.detail,
    };
    window.dispatchEvent(new CustomEvent<AdminDiagnosticEntry>(EVT, { detail: full }));
}

export function subscribeAdminDiagnostics(handler: (entry: AdminDiagnosticEntry) => void): () => void {
    const fn = (ev: Event) => {
        const ce = ev as CustomEvent<AdminDiagnosticEntry>;
        if (ce.detail) handler(ce.detail);
    };
    window.addEventListener(EVT, fn);
    return () => window.removeEventListener(EVT, fn);
}

export function isAdminDiagnosticsRoute(pathname: string): boolean {
    return pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
}
