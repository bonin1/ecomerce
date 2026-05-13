'use client';

import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Your dashboard</h1>
            <p className="mb-8 text-slate-600">Quick links to your account and shopping.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                    href="/orders"
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                    <i className="bi bi-box-seam mb-3 text-2xl text-blue-600" />
                    <h2 className="font-semibold text-slate-900">Orders</h2>
                    <p className="mt-1 text-sm text-slate-600">View order history and tracking.</p>
                </Link>
                <Link
                    href="/wishlist"
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                    <i className="bi bi-heart mb-3 text-2xl text-red-500" />
                    <h2 className="font-semibold text-slate-900">Wishlist</h2>
                    <p className="mt-1 text-sm text-slate-600">Products you have saved.</p>
                </Link>
                <Link
                    href="/profile"
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                    <i className="bi bi-person mb-3 text-2xl text-slate-700" />
                    <h2 className="font-semibold text-slate-900">Profile</h2>
                    <p className="mt-1 text-sm text-slate-600">Manage your personal information.</p>
                </Link>
                <Link
                    href="/profile/settings"
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                    <i className="bi bi-gear mb-3 text-2xl text-slate-700" />
                    <h2 className="font-semibold text-slate-900">Settings</h2>
                    <p className="mt-1 text-sm text-slate-600">Account preferences and security.</p>
                </Link>
            </div>
        </div>
    );
}
