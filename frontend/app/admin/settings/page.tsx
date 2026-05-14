'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type AdminMe = { name?: string; role?: string; email?: string };

type Recommendation = {
    id: string;
    severity: 'info' | 'warning';
    title: string;
    detail: string;
};

type SettingsPayload = {
    nodeEnv: string;
    frontendUrl: string | null;
    baseUrl: string | null;
    port: string;
    databaseName: string | null;
    corsOriginConfigured: boolean;
    integrations: {
        emailConfigured: boolean;
        googleOAuthConfigured: boolean;
        stripeHint: boolean;
    };
    security: {
        jwtAccessConfigured: boolean;
        jwtRefreshConfigured: boolean;
        adminJwtConfigured: boolean;
    };
    readiness: { score: number; passed: number; total: number };
    server: { timeUtc: string; uptimeSeconds: number; timezone: string };
    recommendations: Recommendation[];
    hints: { message: string };
};

const quickLinks = [
    { href: '/admin/dashboard', label: 'Overview', icon: 'bi-grid-1x2', desc: 'KPIs & charts' },
    { href: '/admin/users', label: 'Users', icon: 'bi-shield-lock', desc: 'Roles & access' },
    { href: '/admin/customers', label: 'Customers', icon: 'bi-person-badge', desc: 'LTV & orders' },
    { href: '/admin/products', label: 'Products', icon: 'bi-box-seam', desc: 'Catalog & media' },
    { href: '/admin/categories', label: 'Categories', icon: 'bi-tags', desc: 'Store navigation' },
    { href: '/admin/orders', label: 'Orders', icon: 'bi-receipt', desc: 'Fulfillment' },
    { href: '/admin/payment-methods', label: 'Payments', icon: 'bi-credit-card', desc: 'Checkout methods' },
    { href: '/admin/affiliate', label: 'Affiliates', icon: 'bi-share', desc: 'Partners' },
] as const;

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h || d) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
}

function FlagRow({
    ok,
    label,
    hint,
}: {
    ok: boolean;
    label: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <div>
                <div className="text-sm font-medium text-slate-800">{label}</div>
                {hint ? <div className="mt-0.5 text-xs text-slate-500">{hint}</div> : null}
            </div>
            <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                    ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                }`}
            >
                {ok ? 'OK' : 'Action'}
            </span>
        </div>
    );
}

function CopyBtn({ text }: { text: string }) {
    if (!text) return null;
    return (
        <button
            type="button"
            title="Copy"
            className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-brand-primary hover:text-brand-primary"
            onClick={() => {
                void navigator.clipboard.writeText(text).then(
                    () => toast.success('Copied'),
                    () => toast.error('Copy failed')
                );
            }}
        >
            <i className="bi bi-clipboard text-sm" />
        </button>
    );
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [ready, setReady] = useState(false);
    const [data, setData] = useState<SettingsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
    const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
    const [apiHealthOk, setApiHealthOk] = useState<boolean | null>(null);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = (await apiClient('/admin/settings')) as {
                success?: boolean;
                data?: SettingsPayload;
                message?: string;
            };
            if (res?.success && res.data) {
                setData(res.data);
                setLastLoaded(new Date());
            } else {
                toast.error(res?.message || 'Could not load settings');
            }
        } catch {
            toast.error('Could not load settings');
        } finally {
            setLoading(false);
        }
    }, []);

    const checkApiHealth = useCallback(async () => {
        const t0 = performance.now();
        try {
            const res = (await apiClient('/admin/dashboard/stats')) as { success?: boolean };
            const ms = Math.round(performance.now() - t0);
            setApiLatencyMs(ms);
            setApiHealthOk(Boolean(res?.success));
        } catch {
            setApiLatencyMs(null);
            setApiHealthOk(false);
        }
    }, []);

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

    useEffect(() => {
        if (!ready || !adminUser) return;
        void loadSettings();
        void checkApiHealth();
    }, [ready, adminUser, loadSettings, checkApiHealth]);

    const handleRefresh = () => {
        void loadSettings();
        void checkApiHealth();
    };

    if (!ready || !adminUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            </div>
        );
    }

    const score = data?.readiness.score ?? 0;
    const circumference = 2 * Math.PI * 40;
    const dash = circumference * (1 - score / 100);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                <div className="border-b border-slate-200 bg-white shadow-sm">
                    <div className="mx-auto max-w-6xl px-6 py-6 md:px-8">
                        <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                            <Link href="/admin/dashboard" className="hover:text-brand-primary no-underline">
                                Admin
                            </Link>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-800">System &amp; operations</span>
                        </nav>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-brand-secondary md:text-3xl">
                                    System &amp; operations
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                                    Live configuration snapshot, integration readiness, and API health. Values are
                                    read-only; secrets are never returned.
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                        <i className="bi bi-person-badge text-brand-primary" />
                                        {adminUser.name || 'Admin'}
                                        <span className="text-slate-400">·</span>
                                        <span className="capitalize">{adminUser.role || 'staff'}</span>
                                    </span>
                                    {lastLoaded ? (
                                        <span>
                                            Last refreshed: {lastLoaded.toLocaleTimeString()}{' '}
                                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleRefresh}
                                    className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-primary" />
                                    ) : (
                                        <i className="bi bi-arrow-clockwise" />
                                    )}
                                    Refresh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void checkApiHealth()}
                                    className="inline-flex items-center gap-2 rounded bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90"
                                >
                                    <i className="bi bi-heart-pulse" />
                                    Ping API
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
                    {!data ? (
                        <div className="flex justify-center py-20">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Top row: readiness + API health */}
                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="rounded border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
                                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                                        Readiness
                                    </h2>
                                    <div className="mt-4 flex items-center gap-6">
                                        <div className="relative h-24 w-24 shrink-0">
                                            <svg className="-rotate-90 transform" width="96" height="96">
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#e2e8f0"
                                                    strokeWidth="8"
                                                />
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#4d6dba"
                                                    strokeWidth="8"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={dash}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-bold text-brand-secondary">{score}</span>
                                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                                    score
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">
                                                <span className="font-bold text-slate-800">{data.readiness.passed}</span>{' '}
                                                of {data.readiness.total} integration &amp; security checks passed.
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Improve score by enabling email, OAuth, payments, and dedicated JWT
                                                secrets.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                                                API health
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Round-trip to <code className="rounded bg-slate-100 px-1 text-xs">/admin/dashboard/stats</code>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {apiHealthOk === null ? (
                                                <span className="text-sm text-slate-400">Run “Ping API”</span>
                                            ) : apiHealthOk ? (
                                                <span className="inline-flex items-center gap-2 rounded bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                                                    <i className="bi bi-check-circle" /> Operational
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 rounded bg-red-50 px-3 py-1 text-sm font-bold text-red-800">
                                                    <i className="bi bi-exclamation-triangle" /> Check logs
                                                </span>
                                            )}
                                            {apiLatencyMs != null ? (
                                                <div className="mt-2 text-xs text-slate-500">
                                                    Latency: <strong className="text-slate-800">{apiLatencyMs} ms</strong>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                                        <div className="rounded border border-slate-100 bg-slate-50 p-3">
                                            <div className="text-[11px] font-bold uppercase text-slate-500">Server UTC</div>
                                            <div className="mt-1 font-mono text-xs text-slate-800">
                                                {new Date(data.server.timeUtc).toLocaleString(undefined, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'medium',
                                                })}
                                            </div>
                                        </div>
                                        <div className="rounded border border-slate-100 bg-slate-50 p-3">
                                            <div className="text-[11px] font-bold uppercase text-slate-500">Process uptime</div>
                                            <div className="mt-1 text-sm font-semibold text-slate-800">
                                                {formatUptime(data.server.uptimeSeconds)}
                                            </div>
                                        </div>
                                        <div className="rounded border border-slate-100 bg-slate-50 p-3">
                                            <div className="text-[11px] font-bold uppercase text-slate-500">Timezone</div>
                                            <div className="mt-1 truncate text-sm font-semibold text-slate-800" title={data.server.timezone}>
                                                {data.server.timezone}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {data.recommendations.length > 0 ? (
                                <div className="rounded border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-100 px-6 py-4">
                                        <h2 className="text-lg font-bold text-slate-800">Recommendations</h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Prioritized improvements for production hardening.
                                        </p>
                                    </div>
                                    <ul className="divide-y divide-slate-100">
                                        {data.recommendations.map((r) => (
                                            <li key={r.id} className="flex gap-4 px-6 py-4">
                                                <div
                                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                                                        r.severity === 'warning'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    <i
                                                        className={`bi ${r.severity === 'warning' ? 'bi-lightning-charge' : 'bi-info-circle'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">{r.title}</div>
                                                    <p className="mt-1 text-sm text-slate-600">{r.detail}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-100 px-6 py-4">
                                        <h2 className="text-lg font-bold text-slate-800">Environment</h2>
                                        <p className="mt-1 text-sm text-slate-500">URLs and runtime exposed for operations.</p>
                                    </div>
                                    <dl className="px-6 py-2">
                                        <div className="flex items-center justify-between border-b border-slate-100 py-3">
                                            <dt className="text-sm text-slate-500">Node environment</dt>
                                            <dd>
                                                <span
                                                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                                                        data.nodeEnv === 'production'
                                                            ? 'bg-emerald-50 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {data.nodeEnv}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 py-3">
                                            <dt className="text-sm text-slate-500">API port</dt>
                                            <dd className="font-mono text-sm font-semibold text-slate-800">{data.port}</dd>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 py-3">
                                            <dt className="text-sm text-slate-500">Database</dt>
                                            <dd className="max-w-[55%] truncate font-mono text-sm text-slate-800" title={data.databaseName || ''}>
                                                {data.databaseName || '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 py-3">
                                            <dt className="text-sm text-slate-500">FRONTEND_URL (CORS)</dt>
                                            <dd className="flex items-center gap-2">
                                                <span
                                                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                                                        data.corsOriginConfigured
                                                            ? 'bg-emerald-50 text-emerald-800'
                                                            : 'bg-amber-50 text-amber-900'
                                                    }`}
                                                >
                                                    {data.corsOriginConfigured ? 'Set' : 'Missing'}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <dt className="text-sm text-slate-500">Storefront URL</dt>
                                            <dd className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-[65%]">
                                                <span className="truncate font-mono text-xs text-slate-800">
                                                    {data.frontendUrl || '—'}
                                                </span>
                                                <CopyBtn text={data.frontendUrl || ''} />
                                            </dd>
                                        </div>
                                        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <dt className="text-sm text-slate-500">API base URL</dt>
                                            <dd className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-[65%]">
                                                <span className="truncate font-mono text-xs text-slate-800">
                                                    {data.baseUrl || '—'}
                                                </span>
                                                <CopyBtn text={data.baseUrl || ''} />
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="rounded border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-100 px-6 py-4">
                                        <h2 className="text-lg font-bold text-slate-800">Integrations &amp; JWT</h2>
                                        <p className="mt-1 text-sm text-slate-500">What the API layer can rely on at boot.</p>
                                    </div>
                                    <div className="px-6 py-2">
                                        <FlagRow ok={data.integrations.emailConfigured} label="Email / SMTP" hint="Transactional mail" />
                                        <FlagRow ok={data.integrations.googleOAuthConfigured} label="Google sign-in" hint="Server-side GOOGLE_CLIENT_ID" />
                                        <FlagRow ok={data.integrations.stripeHint} label="Stripe" hint="Payment keys detected" />
                                        <FlagRow ok={data.security.jwtAccessConfigured} label="User JWT secret" hint="Access tokens" />
                                        <FlagRow ok={data.security.jwtRefreshConfigured} label="Refresh JWT secret" hint="Rotation & isolation" />
                                        <FlagRow ok={data.security.adminJwtConfigured} label="Admin JWT secret" hint="Console sessions" />
                                    </div>
                                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                                        <p className="text-xs leading-relaxed text-slate-600">{data.hints.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Runbook */}
                            <div className="rounded border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h2 className="text-lg font-bold text-slate-800">Runbook</h2>
                                    <p className="mt-1 text-sm text-slate-500">Common operational tasks from this console.</p>
                                </div>
                                <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        {
                                            title: 'Verify checkout',
                                            body: 'Confirm payment methods and Stripe keys in production.',
                                            href: '/admin/payment-methods',
                                            icon: 'bi-credit-card-2-front',
                                        },
                                        {
                                            title: 'Review queue',
                                            body: 'Catch stuck orders and update shipment status.',
                                            href: '/admin/orders',
                                            icon: 'bi-truck',
                                        },
                                        {
                                            title: 'Access control',
                                            body: 'Lock compromised accounts and adjust staff roles.',
                                            href: '/admin/users',
                                            icon: 'bi-shield-lock',
                                        },
                                        {
                                            title: 'Partner revenue',
                                            body: 'Approve affiliates and monitor program stats.',
                                            href: '/admin/affiliate',
                                            icon: 'bi-graph-up',
                                        },
                                    ].map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="group rounded border border-slate-200 bg-slate-50 p-4 no-underline transition hover:border-brand-primary hover:bg-white"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white">
                                                <i className={`bi ${item.icon}`} />
                                            </div>
                                            <div className="mt-3 font-bold text-slate-800">{item.title}</div>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
                                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-primary">
                                                Open <i className="bi bi-arrow-right" />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Quick nav */}
                            <div className="rounded border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h2 className="text-lg font-bold text-slate-800">All modules</h2>
                                    <p className="mt-1 text-sm text-slate-500">Shortcuts across the admin surface.</p>
                                </div>
                                <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {quickLinks.map((q) => (
                                        <Link
                                            key={q.href}
                                            href={q.href}
                                            className="flex gap-3 rounded border border-slate-200 bg-slate-50 p-3 no-underline transition hover:border-brand-primary hover:bg-white"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white text-brand-primary shadow-sm">
                                                <i className={`bi ${q.icon}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-slate-800">{q.label}</div>
                                                <div className="truncate text-xs text-slate-500">{q.desc}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
