'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type AdminMe = { id?: number; role?: string; name?: string };

type TabId =
    | 'platform'
    | 'compliance'
    | 'risk'
    | 'returns'
    | 'coupons'
    | 'flags'
    | 'analytics'
    | 'inventory'
    | 'notes';

export default function AdminOperationsHubPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState<TabId>('platform');

    const [platform, setPlatform] = useState<Record<string, unknown>>({});
    const [platformDraft, setPlatformDraft] = useState<Record<string, unknown>>({});
    const [consents, setConsents] = useState<unknown[]>([]);
    const [risk, setRisk] = useState<unknown[]>([]);
    const [returns, setReturns] = useState<unknown[]>([]);
    const [flags, setFlags] = useState<unknown[]>([]);
    const [analytics, setAnalytics] = useState<unknown>(null);
    const [lowStock, setLowStock] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [riskScanOrderId, setRiskScanOrderId] = useState('');
    const [returnForm, setReturnForm] = useState({ order_id: '', user_id: '', reason: '' });
    const [returnEditor, setReturnEditor] = useState<{ id: number; status: string; admin_notes: string } | null>(null);

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

    const role = String(adminUser?.role || '').toLowerCase();
    const isSuper = role === 'superadmin';
    const isFullAdmin = role === 'admin' || role === 'superadmin';
    const canModerate = ['admin', 'superadmin', 'moderator'].includes(role);
    const canOpsRead = ['admin', 'superadmin', 'staff', 'moderator'].includes(role);

    const loadPlatform = useCallback(async () => {
        const res = (await apiClient('/admin/ops/platform-settings')) as { success?: boolean; data?: Record<string, unknown> };
        if (res?.success && res.data) {
            setPlatform(res.data);
            setPlatformDraft(res.data);
        } else toast.error((res as { message?: string })?.message || 'Could not load platform settings');
    }, []);

    useEffect(() => {
        setReturnEditor(null);
    }, [tab]);

    const loadTabData = useCallback(async () => {
        if (!ready || !canOpsRead) return;
        setLoading(true);
        try {
            if (tab === 'platform' && isFullAdmin) await loadPlatform();
            if (tab === 'compliance' && isFullAdmin) {
                const c = (await apiClient('/admin/ops/marketing-consents')) as {
                    success?: boolean;
                    data?: unknown[];
                    message?: string;
                };
                if (c?.success === false) {
                    toast.error(c.message || 'Could not load marketing consent log');
                    setConsents([]);
                } else {
                    setConsents(Array.isArray(c.data) ? c.data : []);
                }
            }
            if (tab === 'risk' && isFullAdmin) {
                const r = (await apiClient('/admin/ops/risk-flags')) as {
                    success?: boolean;
                    data?: unknown[];
                    message?: string;
                };
                if (r?.success === false) {
                    toast.error(r.message || 'Could not load risk flags');
                    setRisk([]);
                } else {
                    setRisk(Array.isArray(r.data) ? r.data : []);
                }
            }
            if (tab === 'returns') {
                const r = (await apiClient('/admin/ops/returns')) as {
                    success?: boolean;
                    data?: unknown[];
                    message?: string;
                };
                if (r?.success === false) {
                    toast.error(r.message || 'Could not load returns');
                    setReturns([]);
                } else {
                    setReturns(Array.isArray(r.data) ? r.data : []);
                }
            }
            if (tab === 'flags' && canModerate) {
                const r = (await apiClient('/admin/ops/content-flags?status=open')) as {
                    success?: boolean;
                    data?: unknown[];
                    message?: string;
                };
                if (r?.success === false) {
                    toast.error(r.message || 'Could not load content flags');
                    setFlags([]);
                } else {
                    setFlags(Array.isArray(r.data) ? r.data : []);
                }
            }
            if (tab === 'analytics') {
                const r = (await apiClient('/admin/ops/analytics/summary')) as {
                    success?: boolean;
                    data?: unknown;
                    message?: string;
                };
                if (r?.success === false) {
                    toast.error(r.message || 'Could not load analytics');
                    setAnalytics(null);
                } else {
                    setAnalytics(r.data ?? null);
                }
            }
            if (tab === 'inventory') {
                const r = (await apiClient('/admin/ops/inventory/low-stock')) as {
                    success?: boolean;
                    data?: unknown;
                    message?: string;
                };
                if (r?.success === false) {
                    toast.error(r.message || 'Could not load low-stock report');
                    setLowStock(null);
                } else {
                    setLowStock(r.data ?? null);
                }
            }
        } catch {
            toast.error('Request failed');
        } finally {
            setLoading(false);
        }
    }, [ready, tab, isFullAdmin, canModerate, canOpsRead, loadPlatform]);

    useEffect(() => {
        void loadTabData();
    }, [loadTabData]);

    const savePlatform = async () => {
        if (!isSuper) {
            toast.error('Only superadmin can save platform flags');
            return;
        }
        const res = (await apiClient('/admin/ops/platform-settings', {
            method: 'PATCH',
            body: JSON.stringify(platformDraft),
        })) as { success?: boolean; message?: string };
        if (res?.success) {
            toast.success('Saved');
            void loadPlatform();
        } else toast.error(res?.message || 'Save failed');
    };

    const runRiskScan = async () => {
        const oid = parseInt(String(riskScanOrderId).trim(), 10);
        if (!Number.isFinite(oid) || oid <= 0) {
            toast.error('Enter a numeric order ID');
            return;
        }
        const res = (await apiClient(`/admin/ops/orders/${oid}/risk-scan`, { method: 'POST' })) as {
            success?: boolean;
            message?: string;
        };
        if (res?.success) {
            toast.success('Risk scan saved for this order');
            setRiskScanOrderId('');
            void loadTabData();
        } else {
            toast.error(res?.message || 'Scan failed');
        }
    };

    const submitNewReturn = async () => {
        if (!isFullAdmin) return;
        const order_id = parseInt(returnForm.order_id, 10);
        const user_id = parseInt(returnForm.user_id, 10);
        if (!Number.isFinite(order_id) || !Number.isFinite(user_id)) {
            toast.error('Order ID and user ID must be numbers');
            return;
        }
        const res = (await apiClient('/admin/ops/returns', {
            method: 'POST',
            body: JSON.stringify({
                order_id,
                user_id,
                reason: returnForm.reason.trim() || null,
            }),
        })) as { success?: boolean; message?: string };
        if (res?.success) {
            toast.success('Return request created');
            setReturnForm({ order_id: '', user_id: '', reason: '' });
            void loadTabData();
        } else {
            toast.error(res?.message || 'Create failed');
        }
    };

    const applyReturnPatch = async () => {
        if (!returnEditor || !isFullAdmin) return;
        const res = (await apiClient(`/admin/ops/returns/${returnEditor.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: returnEditor.status,
                admin_notes: returnEditor.admin_notes.trim() || null,
            }),
        })) as { success?: boolean; message?: string };
        if (res?.success) {
            toast.success('Return updated');
            setReturnEditor(null);
            void loadTabData();
        } else {
            toast.error(res?.message || 'Update failed');
        }
    };

    const clearRiskFlag = async (id: number) => {
        const res = (await apiClient(`/admin/ops/risk-flags/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cleared' }),
        })) as { success?: boolean; message?: string };
        if (res?.success) {
            toast.success('Flag marked cleared');
            void loadTabData();
        } else {
            toast.error(res?.message || 'Failed');
        }
    };

    if (!ready || !adminUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            </div>
        );
    }

    if (!canOpsRead) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex-1 p-8">
                    <p className="text-slate-600">You do not have access to this area.</p>
                </main>
            </div>
        );
    }

    const tabs: { id: TabId; label: string; show: boolean }[] = [
        { id: 'platform', label: 'Platform & maintenance', show: isFullAdmin },
        { id: 'compliance', label: 'GDPR & consent log', show: isFullAdmin },
        { id: 'risk', label: 'Fraud & risk', show: isFullAdmin },
        { id: 'returns', label: 'Returns / RMA', show: true },
        { id: 'coupons', label: 'Coupons', show: isFullAdmin },
        { id: 'flags', label: 'Moderation inbox', show: canModerate },
        { id: 'analytics', label: 'Analytics (read-only)', show: true },
        { id: 'inventory', label: 'Low stock', show: true },
        { id: 'notes', label: 'Internal notes', show: isFullAdmin },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Operations hub</h1>
                        <p className="mt-1 max-w-3xl text-sm text-slate-600">
                            Platform switches, compliance consent log, fraud risk queue, returns, coupons, moderation inbox,
                            read-only analytics, low-stock SKUs, and pointers to internal notes on Orders/Users. Superadmin
                            saves platform-wide settings; staff respect read-only mode when enabled.
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-brand-primary"
                    >
                        <i className="bi bi-arrow-left" /> Dashboard
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                    {tabs
                        .filter((t) => t.show)
                        .map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    tab === t.id
                                        ? 'bg-slate-900 text-white shadow'
                                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : null}

                    {tab === 'platform' && isFullAdmin && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Toggle storefront sections, show a maintenance banner, set SLA hours for new processing
                                orders, and enable staff read-only mode during incidents.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-semibold text-slate-800">Maintenance banner (public)</span>
                                    <textarea
                                        className="min-h-[72px] rounded-lg border border-slate-200 px-3 py-2"
                                        value={String(platformDraft.maintenance_banner ?? '')}
                                        onChange={(e) => setPlatformDraft((p) => ({ ...p, maintenance_banner: e.target.value }))}
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(platformDraft.staff_readonly)}
                                        onChange={(e) => setPlatformDraft((p) => ({ ...p, staff_readonly: e.target.checked }))}
                                    />
                                    Staff read-only (blocks staff POST/PUT/PATCH/DELETE on admin APIs)
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={platformDraft.feature_home_trending !== false}
                                        onChange={(e) =>
                                            setPlatformDraft((p) => ({ ...p, feature_home_trending: e.target.checked }))
                                        }
                                    />
                                    Home: trending strip
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={platformDraft.feature_home_hero !== false}
                                        onChange={(e) => setPlatformDraft((p) => ({ ...p, feature_home_hero: e.target.checked }))}
                                    />
                                    Home: hero
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-semibold text-slate-800">SLA respond (hours)</span>
                                    <input
                                        type="number"
                                        className="rounded-lg border border-slate-200 px-3 py-2"
                                        value={Number(platformDraft.order_sla_respond_hours ?? 24)}
                                        onChange={(e) =>
                                            setPlatformDraft((p) => ({ ...p, order_sla_respond_hours: Number(e.target.value) }))
                                        }
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-semibold text-slate-800">SLA ship (hours)</span>
                                    <input
                                        type="number"
                                        className="rounded-lg border border-slate-200 px-3 py-2"
                                        value={Number(platformDraft.order_sla_ship_hours ?? 72)}
                                        onChange={(e) =>
                                            setPlatformDraft((p) => ({ ...p, order_sla_ship_hours: Number(e.target.value) }))
                                        }
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-semibold text-slate-800">Anonymize orders older than (years)</span>
                                    <input
                                        type="number"
                                        className="rounded-lg border border-slate-200 px-3 py-2"
                                        value={Number(platformDraft.anonymize_orders_after_years ?? 7)}
                                        onChange={(e) =>
                                            setPlatformDraft((p) => ({
                                                ...p,
                                                anonymize_orders_after_years: Number(e.target.value),
                                            }))
                                        }
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-semibold text-slate-800">Low-stock threshold (units)</span>
                                    <input
                                        type="number"
                                        className="rounded-lg border border-slate-200 px-3 py-2"
                                        value={Number(platformDraft.low_stock_threshold ?? 5)}
                                        onChange={(e) =>
                                            setPlatformDraft((p) => ({ ...p, low_stock_threshold: Number(e.target.value) }))
                                        }
                                    />
                                </label>
                            </div>
                            {isSuper ? (
                                <button
                                    type="button"
                                    onClick={() => void savePlatform()}
                                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                                >
                                    Save platform settings
                                </button>
                            ) : (
                                <p className="text-sm text-amber-800">Only a superadmin can save these switches.</p>
                            )}
                            <p className="text-xs text-slate-500">
                                Storefront can read public config from{' '}
                                <code className="rounded bg-slate-100 px-1">{process.env.NEXT_PUBLIC_API_URL}/public/site-config</code>
                            </p>
                        </div>
                    )}

                    {tab === 'compliance' && isFullAdmin && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Rows come from the <code className="rounded bg-white px-1">marketing_consent_logs</code>{' '}
                                    table. New events are written when an admin posts to{' '}
                                    <code className="rounded bg-white px-1">POST /admin/ops/marketing-consent</code> (e.g.
                                    CRM import) or when you wire newsletter subscribe/unsubscribe flows to that endpoint.
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    If the list is empty, no consent events have been recorded yet — the UI is still
                                    connected; there is simply no data.
                                </p>
                            </div>
                            <p className="text-sm text-slate-600">
                                {consents.length} row{consents.length === 1 ? '' : 's'} (most recent first, cap 500).
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2">When</th>
                                            <th className="px-3 py-2">Channel</th>
                                            <th className="px-3 py-2">Opt-in</th>
                                            <th className="px-3 py-2">User</th>
                                            <th className="px-3 py-2">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consents.map((c) => {
                                            const row = c as Record<string, unknown>;
                                            return (
                                                <tr key={String(row.id)} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 font-mono text-xs text-slate-600">
                                                        {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">{String(row.channel ?? '')}</td>
                                                    <td className="px-3 py-2">{row.opted_in ? 'Yes' : 'No'}</td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        {row.user_id != null ? `#${row.user_id}` : '—'}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                                                        {row.ip != null ? String(row.ip) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {!consents.length ? <p className="text-sm text-slate-500">No consent rows yet.</p> : null}
                            {isSuper ? (
                                <button
                                    type="button"
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800"
                                    onClick={async () => {
                                        if (!window.confirm('Anonymize shipping/contact fields for up to 500 oldest orders past retention?')) return;
                                        const res = (await apiClient('/admin/ops/compliance/anonymize-old-orders', {
                                            method: 'POST',
                                        })) as { success?: boolean; message?: string };
                                        if (res?.success) toast.success('Batch job run');
                                        else toast.error(res?.message || 'Failed');
                                    }}
                                >
                                    Run order anonymization batch (cap 500)
                                </button>
                            ) : null}
                        </div>
                    )}

                    {tab === 'risk' && isFullAdmin && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Open rows in <code className="rounded bg-white px-1">order_risk_flags</code>. A scan
                                    computes a simple score (e.g. duplicate email velocity, high order value) and upserts
                                    a flag for that order. Use <strong>Clear</strong> when you have reviewed a flag.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-2">
                                <label className="flex flex-col text-sm">
                                    <span className="font-semibold text-slate-800">Order ID to scan</span>
                                    <input
                                        className="mt-1 w-40 rounded-lg border border-slate-200 px-3 py-2"
                                        value={riskScanOrderId}
                                        onChange={(e) => setRiskScanOrderId(e.target.value)}
                                        placeholder="e.g. 42"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => void runRiskScan()}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                                >
                                    Run risk scan
                                </button>
                                <Link
                                    href="/admin/orders"
                                    className="text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
                                >
                                    Open orders
                                </Link>
                            </div>
                            <p className="text-sm text-slate-600">{risk.length} open flag{risk.length === 1 ? '' : 's'}.</p>
                            <ul className="space-y-2 text-sm">
                                {risk.map((raw) => {
                                    const r = raw as {
                                        id: number;
                                        order_id: number;
                                        score: number;
                                        reasons?: unknown;
                                        orderRecord?: {
                                            order_number?: string;
                                            total_amount?: string | number;
                                            status?: string;
                                            contact_email?: string;
                                        };
                                    };
                                    const ord = r.orderRecord;
                                    return (
                                        <li key={r.id} className="rounded-lg border border-slate-200 p-3">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <div className="font-semibold text-slate-900">
                                                        Order #{r.order_id}
                                                        {ord?.order_number ? (
                                                            <span className="ml-2 font-mono text-slate-600">
                                                                {ord.order_number}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        Score {r.score}
                                                        {ord?.total_amount != null
                                                            ? ` · $${Number(ord.total_amount).toFixed(2)}`
                                                            : ''}
                                                        {ord?.status ? ` · ${ord.status}` : ''}
                                                    </div>
                                                    <pre className="mt-2 max-h-28 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
                                                        {JSON.stringify(r.reasons, null, 2)}
                                                    </pre>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="shrink-0 rounded border border-slate-300 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-50"
                                                    onClick={() => void clearRiskFlag(r.id)}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {!risk.length ? <p className="text-sm text-slate-500">No open risk flags.</p> : null}
                        </div>
                    )}

                    {tab === 'returns' && (
                        <div className="space-y-4 text-sm text-slate-700">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Rows are <code className="rounded bg-white px-1">return_requests</code>. Everyone with
                                    admin access can <strong>view</strong> the list. Only <strong>admin / superadmin</strong>{' '}
                                    can create or change returns (same as the API).
                                </p>
                            </div>
                            {isFullAdmin ? (
                                <div className="rounded-lg border border-slate-200 p-4">
                                    <p className="mb-3 font-semibold text-slate-900">Create return</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                                            Order ID
                                            <input
                                                className="rounded border border-slate-200 px-2 py-2 text-sm font-normal text-slate-900"
                                                value={returnForm.order_id}
                                                onChange={(e) => setReturnForm((f) => ({ ...f, order_id: e.target.value }))}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                                            User ID
                                            <input
                                                className="rounded border border-slate-200 px-2 py-2 text-sm font-normal text-slate-900"
                                                value={returnForm.user_id}
                                                onChange={(e) => setReturnForm((f) => ({ ...f, user_id: e.target.value }))}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500 sm:col-span-3">
                                            Reason (optional)
                                            <input
                                                className="rounded border border-slate-200 px-2 py-2 text-sm font-normal text-slate-900"
                                                value={returnForm.reason}
                                                onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void submitNewReturn()}
                                        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                                    >
                                        Create return row
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-amber-800">Your role can view returns but not create or edit them.</p>
                            )}
                            <p className="font-semibold text-slate-900">
                                {returns.length} return row{returns.length === 1 ? '' : 's'}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2">ID</th>
                                            <th className="px-3 py-2">Order</th>
                                            <th className="px-3 py-2">User</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">Reason</th>
                                            <th className="px-3 py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returns.map((raw) => {
                                            const r = raw as {
                                                id: number;
                                                order_id: number;
                                                user_id: number;
                                                status: string;
                                                reason?: string | null;
                                                admin_notes?: string | null;
                                            };
                                            return (
                                                <tr key={r.id} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 font-mono">{r.id}</td>
                                                    <td className="px-3 py-2">{r.order_id}</td>
                                                    <td className="px-3 py-2">{r.user_id}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="max-w-xs truncate px-3 py-2 text-slate-600">
                                                        {r.reason || '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {isFullAdmin ? (
                                                            <button
                                                                type="button"
                                                                className="text-xs font-bold text-brand-primary hover:underline"
                                                                onClick={() =>
                                                                    setReturnEditor({
                                                                        id: r.id,
                                                                        status: r.status,
                                                                        admin_notes: String(r.admin_notes ?? ''),
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {!returns.length ? <p className="text-slate-500">No return requests yet.</p> : null}
                            {returnEditor && isFullAdmin ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <p className="font-semibold text-slate-900">Update return #{returnEditor.id}</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                                            Status
                                            <select
                                                className="rounded border border-slate-200 px-2 py-2 text-sm font-normal text-slate-900"
                                                value={returnEditor.status}
                                                onChange={(e) =>
                                                    setReturnEditor((ed) =>
                                                        ed ? { ...ed, status: e.target.value } : ed
                                                    )
                                                }
                                            >
                                                {[
                                                    'requested',
                                                    'approved',
                                                    'rejected',
                                                    'received',
                                                    'refunded',
                                                    'store_credit',
                                                ].map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500 sm:col-span-2">
                                            Admin notes
                                            <textarea
                                                className="min-h-[72px] rounded border border-slate-200 px-2 py-2 text-sm font-normal text-slate-900"
                                                value={returnEditor.admin_notes}
                                                onChange={(e) =>
                                                    setReturnEditor((ed) =>
                                                        ed ? { ...ed, admin_notes: e.target.value } : ed
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void applyReturnPatch()}
                                            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                        >
                                            Save return
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReturnEditor(null)}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {tab === 'coupons' && isFullAdmin && (
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>
                                Manage promo codes on the dedicated{' '}
                                <Link
                                    href="/admin/coupons"
                                    className="font-bold text-brand-primary underline-offset-2 hover:underline"
                                >
                                    Coupons
                                </Link>{' '}
                                page: create, edit, delete, set schedules, limits, and product/category scopes. Shoppers
                                apply codes on checkout; the backend validates and increments usage when an order is placed.
                            </p>
                            <p className="text-xs text-slate-500">
                                API: <code className="rounded bg-slate-100 px-1">GET /admin/ops/coupons</code>,{' '}
                                <code className="rounded bg-slate-100 px-1">POST /admin/ops/coupons</code> (body includes{' '}
                                <code className="rounded bg-slate-100 px-1">id</code> to update),{' '}
                                <code className="rounded bg-slate-100 px-1">DELETE /admin/ops/coupons/:id</code>
                            </p>
                            <Link
                                href="/admin/coupons"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-slate-800"
                            >
                                Open coupon manager
                            </Link>
                        </div>
                    )}

                    {tab === 'flags' && canModerate && (
                        <div className="space-y-3">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Open items in <code className="rounded bg-white px-1">content_flags</code> (generic
                                    entity reports). They only appear after something calls{' '}
                                    <code className="rounded bg-white px-1">POST /admin/ops/content-flags</code> (for
                                    example a future &quot;Report product&quot; button). This inbox is connected; an empty
                                    list means nothing has been flagged yet.
                                </p>
                            </div>
                            {flags.map((f: any) => (
                                <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                                    <div className="text-sm">
                                        <strong>{f.entity_type}</strong> #{f.entity_id} — {f.reason || 'no reason'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                                            onClick={async () => {
                                                const res = (await apiClient(`/admin/ops/content-flags/${f.id}`, {
                                                    method: 'PATCH',
                                                    body: JSON.stringify({ status: 'resolved' }),
                                                })) as { success?: boolean; message?: string };
                                                if (res?.success) {
                                                    toast.success('Resolved');
                                                    void loadTabData();
                                                } else {
                                                    toast.error(res?.message || 'Failed');
                                                }
                                            }}
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded border px-3 py-1 text-xs font-bold"
                                            onClick={async () => {
                                                const res = (await apiClient(`/admin/ops/content-flags/${f.id}`, {
                                                    method: 'PATCH',
                                                    body: JSON.stringify({ status: 'dismissed' }),
                                                })) as { success?: boolean; message?: string };
                                                if (res?.success) {
                                                    toast.success('Dismissed');
                                                    void loadTabData();
                                                } else {
                                                    toast.error(res?.message || 'Failed');
                                                }
                                            }}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {!flags.length ? <p className="text-slate-500">No open flags.</p> : null}
                        </div>
                    )}

                    {tab === 'analytics' && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Server-side snapshot from <code className="rounded bg-white px-1">GET /admin/ops/analytics/summary</code>
                                    : paid order count and revenue in the last 30 days, plus pending product reviews. No
                                    marketing funnel or ad data until you integrate tracking.
                                </p>
                            </div>
                            {analytics && typeof analytics === 'object' && !Array.isArray(analytics) ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        {
                                            label: 'Orders (30d)',
                                            value: String((analytics as Record<string, unknown>).orders_last_30d ?? '—'),
                                        },
                                        {
                                            label: 'Paid revenue (30d)',
                                            value:
                                                (analytics as Record<string, unknown>).paid_revenue_last_30d != null
                                                    ? `$${Number((analytics as Record<string, unknown>).paid_revenue_last_30d).toFixed(2)}`
                                                    : '—',
                                        },
                                        {
                                            label: 'Pending reviews',
                                            value: String((analytics as Record<string, unknown>).pending_reviews ?? '—'),
                                        },
                                        {
                                            label: 'Window',
                                            value: `${String((analytics as Record<string, unknown>).window_days ?? '?')} days`,
                                        },
                                    ].map((card) => (
                                        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                                            <p className="mt-2 text-2xl font-black text-slate-900">{card.value}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No analytics payload.</p>
                            )}
                            {(analytics as Record<string, unknown>)?.note ? (
                                <p className="text-sm text-slate-600">
                                    {(analytics as Record<string, unknown>).note as string}
                                </p>
                            ) : null}
                            <details className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100">
                                <summary className="cursor-pointer text-sm font-semibold">Raw JSON</summary>
                                <pre className="mt-2 max-h-64 overflow-auto text-xs">
                                    {JSON.stringify(analytics, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}

                    {tab === 'inventory' && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">What this is</p>
                                <p className="mt-1">
                                    Products with stock between 1 and the <strong>low-stock threshold</strong> from
                                    platform settings (default 5). Data comes from{' '}
                                    <code className="rounded bg-white px-1">GET /admin/ops/inventory/low-stock</code>.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
                                    onClick={async () => {
                                        const res = (await apiClient('/admin/ops/inventory/low-stock/notify-stub', {
                                            method: 'POST',
                                        })) as { success?: boolean; message?: string };
                                        if (res?.success) toast.success(res.message || 'Stub sent');
                                        else toast.error(res?.message || 'Failed');
                                    }}
                                >
                                    Email ops (stub)
                                </button>
                                {isFullAdmin ? (
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
                                        onClick={() => setTab('platform')}
                                    >
                                        Change threshold in “Platform &amp; maintenance” tab
                                    </button>
                                ) : null}
                            </div>
                            {(() => {
                                const inv = lowStock as {
                                    threshold?: number;
                                    products?: Array<{
                                        id: number;
                                        product_name: string;
                                        product_stock: number;
                                        product_brand?: string | null;
                                    }>;
                                } | null;
                                const prods = inv?.products ?? [];
                                return (
                                    <>
                                        <p className="text-sm text-slate-600">
                                            Threshold: <strong>{inv?.threshold ?? '—'}</strong> · {prods.length} SKU
                                            {prods.length === 1 ? '' : 's'}
                                        </p>
                                        {prods.length ? (
                                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                <table className="min-w-full text-left text-sm">
                                                    <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                                                        <tr>
                                                            <th className="px-3 py-2">ID</th>
                                                            <th className="px-3 py-2">Product</th>
                                                            <th className="px-3 py-2">Brand</th>
                                                            <th className="px-3 py-2">Stock</th>
                                                            <th className="px-3 py-2 text-right">Link</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {prods.map((p) => (
                                                            <tr key={p.id} className="border-t border-slate-100">
                                                                <td className="px-3 py-2 font-mono">{p.id}</td>
                                                                <td className="px-3 py-2">{p.product_name}</td>
                                                                <td className="px-3 py-2 text-slate-600">{p.product_brand || '—'}</td>
                                                                <td className="px-3 py-2 font-semibold text-amber-800">
                                                                    {p.product_stock}
                                                                </td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <Link
                                                                        href="/admin/products"
                                                                        className="text-xs font-bold text-brand-primary hover:underline"
                                                                    >
                                                                        Catalog
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">No SKUs in the low-stock band right now.</p>
                                        )}
                                    </>
                                );
                            })()}
                            <details className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100">
                                <summary className="cursor-pointer text-sm font-semibold">Raw JSON</summary>
                                <pre className="mt-2 max-h-48 overflow-auto text-xs">{JSON.stringify(lowStock, null, 2)}</pre>
                            </details>
                        </div>
                    )}

                    {tab === 'notes' && isFullAdmin && (
                        <div className="space-y-4 text-sm text-slate-700">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <p className="font-semibold text-slate-900">Internal notes are wired in the admin UI</p>
                                <ul className="mt-2 list-disc space-y-2 pl-5">
                                    <li>
                                        <strong>Orders:</strong>{' '}
                                        <Link className="font-semibold text-brand-primary hover:underline" href="/admin/orders">
                                            Orders
                                        </Link>{' '}
                                        → open any order → section <strong>Internal notes</strong> (loads{' '}
                                        <code className="rounded bg-white px-1">GET /admin/ops/orders/:orderId/notes</code>, add
                                        via <code className="rounded bg-white px-1">POST</code>).
                                    </li>
                                    <li>
                                        <strong>Users:</strong>{' '}
                                        <Link className="font-semibold text-brand-primary hover:underline" href="/admin/users">
                                            Users
                                        </Link>{' '}
                                        → <strong>Notes</strong> on a row (same pattern for{' '}
                                        <code className="rounded bg-white px-1">/admin/ops/users/:userId/notes</code>).
                                    </li>
                                </ul>
                            </div>
                            <p className="text-xs text-slate-500">
                                Notes are staff/admin visibility only; they are not emailed to customers.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
