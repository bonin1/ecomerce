'use client';

import React, { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    isAdminDiagnosticsRoute,
    pushAdminDiagnostic,
    subscribeAdminDiagnostics,
    type AdminDiagnosticEntry,
} from '@/app/admin/adminDiagnosticsBus';

const MAX_ENTRIES = 80;

class AdminRouteErrorBoundary extends Component<
    { children: ReactNode; pathname: string },
    { error: Error | null }
> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        if (isAdminDiagnosticsRoute(this.props.pathname)) {
            pushAdminDiagnostic({
                kind: 'react',
                message: error.message || 'React render error',
                detail: [error.stack, info.componentStack].filter(Boolean).join('\n\n'),
            });
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="m-4 rounded-2xl border border-red-200 bg-red-50/95 p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-wide text-red-800">Something broke</p>
                    <p className="mt-2 font-mono text-sm text-red-950">{this.state.error.message}</p>
                    <button
                        type="button"
                        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        onClick={() => this.setState({ error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function AdminDiagnosticsDock({ pathname }: { pathname: string }) {
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<AdminDiagnosticEntry[]>([]);

    const append = useCallback((e: AdminDiagnosticEntry) => {
        setEntries((prev) => [e, ...prev].slice(0, MAX_ENTRIES));
    }, []);

    useEffect(() => subscribeAdminDiagnostics(append), [append]);

    useEffect(() => {
        if (!isAdminDiagnosticsRoute(pathname)) return;

        const onErr = (ev: ErrorEvent) => {
            pushAdminDiagnostic({
                kind: 'window',
                message: ev.message || 'window.error',
                detail: ev.error?.stack ?? ev.filename,
            });
        };
        const onRej = (ev: PromiseRejectionEvent) => {
            const r = ev.reason;
            const msg =
                r instanceof Error
                    ? r.message
                    : typeof r === 'string'
                      ? r
                      : (() => {
                            try {
                                return JSON.stringify(r);
                            } catch {
                                return String(r);
                            }
                        })();
            pushAdminDiagnostic({
                kind: 'unhandledrejection',
                message: msg,
                detail: r instanceof Error ? r.stack : undefined,
            });
        };
        window.addEventListener('error', onErr);
        window.addEventListener('unhandledrejection', onRej);
        return () => {
            window.removeEventListener('error', onErr);
            window.removeEventListener('unhandledrejection', onRej);
        };
    }, [pathname]);

    if (!isAdminDiagnosticsRoute(pathname)) return null;

    const unread = entries.length;

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[5000] flex max-w-full flex-col items-end gap-2">
            {open ? (
                <div className="pointer-events-auto max-h-[min(70vh,520px)] w-[min(100vw-2rem,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Admin diagnostics</p>
                            <p className="text-[11px] text-slate-400">Client errors & failed requests (this tab)</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                                onClick={() => setEntries([])}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20"
                                onClick={() => setOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[min(60vh,460px)] overflow-y-auto bg-slate-50 p-2">
                        {entries.length === 0 ? (
                            <p className="px-3 py-8 text-center text-sm text-slate-500">No events yet. API/network issues appear here.</p>
                        ) : (
                            <ul className="space-y-2">
                                {entries.map((e) => (
                                    <li
                                        key={e.id}
                                        className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                                {e.kind}
                                            </span>
                                            <time className="text-[10px] text-slate-400" dateTime={new Date(e.ts).toISOString()}>
                                                {new Date(e.ts).toLocaleTimeString()}
                                            </time>
                                        </div>
                                        <p className="mt-2 break-words text-sm font-medium text-slate-900">{e.message}</p>
                                        {e.detail ? (
                                            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-100 p-2 text-[11px] leading-snug text-slate-700">
                                                {e.detail}
                                            </pre>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800"
            >
                <i className="bi bi-bug" aria-hidden />
                Diagnostics
                {unread > 0 ? (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-900">{unread}</span>
                ) : null}
            </button>
        </div>
    );
}

export default function AdminShell({ children }: { children: ReactNode }) {
    const pathname = usePathname() || '';

    return (
        <>
            <AdminRouteErrorBoundary key={pathname} pathname={pathname}>
                {children}
            </AdminRouteErrorBoundary>
            <AdminDiagnosticsDock pathname={pathname} />
        </>
    );
}
