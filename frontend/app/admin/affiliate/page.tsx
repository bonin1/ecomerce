'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import AffiliateStatsDashboard from '../components/affiliate/AffiliateStats';
import AffiliateList from '../components/affiliate/AffiliateList';
import AffiliateLinkBuilder from '../components/affiliate/AffiliateLinkBuilder';
import { SITE_NAME } from '@/app/config/site';

type AdminMe = { name?: string; role?: string };

export default function AffiliateManagementPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState<'overview' | 'affiliates' | 'links'>('overview');

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
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Affiliate program</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            {SITE_NAME} partner hub: approve applications, monitor clicks and conversions, and keep
                            commissions aligned with your storefront.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/affiliate"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-brand-primary"
                        >
                            <i className="bi bi-box-arrow-up-right" /> Public program page
                        </Link>
                        <Link
                            href="/admin/settings"
                            className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-brand-primary"
                        >
                            <i className="bi bi-gear" /> System
                        </Link>
                        <Link
                            href="/admin/customers"
                            className="inline-flex items-center gap-2 rounded bg-brand-secondary px-4 py-2 text-sm font-bold text-white no-underline hover:opacity-95"
                        >
                            <i className="bi bi-person-badge" /> Customers
                        </Link>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2 rounded border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setTab('overview')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold transition min-w-[140px] ${
                            tab === 'overview'
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <i className="bi bi-graph-up-arrow" />
                        Performance
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('affiliates')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold transition min-w-[140px] ${
                            tab === 'affiliates'
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <i className="bi bi-people" />
                        Partners
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('links')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold transition min-w-[140px] ${
                            tab === 'links'
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <i className="bi bi-link-45deg" />
                        Link builder
                    </button>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                    {tab === 'overview' ? (
                        <AffiliateStatsDashboard />
                    ) : tab === 'affiliates' ? (
                        <AffiliateList />
                    ) : (
                        <AffiliateLinkBuilder />
                    )}
                </div>
            </main>
        </div>
    );
}
