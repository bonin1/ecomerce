'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type AdminMe = { role?: string };
type LogRow = {
    id: number;
    createdAt: string;
    actor_user_id: number | null;
    actor_role: string | null;
    action: string;
    entity_type: string;
    entity_id: number | null;
    ip: string | null;
    metadata: unknown;
};

export default function AdminAuditLogPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [ready, setReady] = useState(false);
    const [rows, setRows] = useState<LogRow[]>([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('adminUser');
        const token = localStorage.getItem('adminToken');
        if (!user || !token) {
            router.replace('/admin/login');
            return;
        }
        const syncCookie = Cookies.get('adminTokenSync');
        if (token && !syncCookie) {
            Cookies.set('adminTokenSync', token, { expires: 1 / 6, path: '/', sameSite: 'Strict' });
        }
        try {
            setAdminUser(JSON.parse(user) as AdminMe);
        } catch {
            router.replace('/admin/login');
            return;
        }
        setReady(true);
    }, [router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = (await apiClient(`/admin/ops/activity-logs?page=${page}&limit=40`)) as {
                success?: boolean;
                data?: LogRow[];
                meta?: { pages?: number };
                message?: string;
            };
            if (res?.success && Array.isArray(res.data)) {
                setRows(res.data);
                setPages(res.meta?.pages ?? 1);
            } else {
                setRows([]);
                toast.error(res?.message || 'Could not load audit log');
            }
        } catch {
            toast.error('Could not load audit log');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (!ready) return;
        const r = String(adminUser?.role || '').toLowerCase();
        if (!['admin', 'superadmin'].includes(r)) {
            router.replace('/admin/dashboard');
            return;
        }
        void load();
    }, [ready, adminUser, load, router]);

    const exportCsv = async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const token = localStorage.getItem('adminToken');
        if (!token) {
            toast.error('No token');
            return;
        }
        try {
            const res = await fetch(`${base}/admin/ops/activity-logs/export.csv`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (!res.ok) {
                toast.error('Export failed');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'admin-activity.csv';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch {
            toast.error('Export failed');
        }
    };

    if (!ready || !adminUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Immutable trail for role changes, orders, reviews, payment methods, and platform actions.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                        >
                            Export CSV
                        </button>
                        <Link
                            href="/admin/operations"
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline"
                        >
                            Operations hub
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="px-3 py-2">Time</th>
                                        <th className="px-3 py-2">Actor</th>
                                        <th className="px-3 py-2">Action</th>
                                        <th className="px-3 py-2">Entity</th>
                                        <th className="px-3 py-2">IP</th>
                                        <th className="px-3 py-2">Meta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                                            <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                                                {new Date(r.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 text-xs">
                                                #{r.actor_user_id ?? '—'} {r.actor_role ? `(${r.actor_role})` : ''}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-900">{r.action}</td>
                                            <td className="px-3 py-2 text-xs">
                                                {r.entity_type} {r.entity_id != null ? `#${r.entity_id}` : ''}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.ip || '—'}</td>
                                            <td className="max-w-xs truncate px-3 py-2 font-mono text-[10px] text-slate-500">
                                                {JSON.stringify(r.metadata)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-2 text-sm">
                    <button
                        type="button"
                        disabled={page <= 1}
                        className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        disabled={page >= pages}
                        className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            </main>
        </div>
    );
}
