'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type AdminMe = { name?: string; role?: string; email?: string };

type UserRow = {
    id: number;
    name: string;
    lastname: string;
    email: string;
    role: string;
    verified: boolean;
    account_locked: boolean;
    last_login_ip: string | null;
    phone_number: string | null;
    city: string | null;
    createdAt: string;
};

const ROLES = ['admin', 'user', 'staff', 'superadmin', 'moderator', 'guest', 'banned'] as const;

export default function AdminUsersPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [rows, setRows] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const limit = 15;
    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editVerified, setEditVerified] = useState(false);
    const [editLocked, setEditLocked] = useState(false);
    const [saving, setSaving] = useState(false);

    const isSuperAdmin = adminUser?.role === 'superadmin';

    const [ready, setReady] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search.trim()) params.set('search', search.trim());
            if (roleFilter) params.set('role', roleFilter);
            const res = (await apiClient(`/admin/users?${params}`)) as {
                success?: boolean;
                data?: UserRow[];
                meta?: { total: number; pages: number };
                message?: string;
            };
            if (res?.success && Array.isArray(res.data)) {
                setRows(res.data);
                setTotal(res.meta?.total ?? 0);
                setPages(res.meta?.pages ?? 1);
            } else {
                setRows([]);
                toast.error(res?.message || 'Could not load users');
            }
        } catch {
            toast.error('Could not load users');
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

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
        void load();
    }, [ready, adminUser, load]);

    const openEdit = (u: UserRow) => {
        setEditing(u);
        setEditRole(u.role);
        setEditVerified(Boolean(u.verified));
        setEditLocked(Boolean(u.account_locked));
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const res = (await apiClient(`/admin/users/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    role: editRole,
                    verified: editVerified,
                    account_locked: editLocked,
                }),
            })) as { success?: boolean; message?: string };
            if (res?.success) {
                toast.success('User updated');
                setEditing(null);
                void load();
            } else {
                toast.error(res?.message || 'Update failed');
            }
        } catch {
            toast.error('Update failed');
        } finally {
            setSaving(false);
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
                        <h1 className="text-2xl font-bold text-slate-800">Users &amp; roles</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Search accounts, verify users, lock suspicious logins, and assign roles. Only superadmins
                            can grant admin or superadmin.
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-brand-primary hover:text-brand-primary"
                    >
                        <i className="bi bi-arrow-left" /> Back to overview
                    </Link>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Search</label>
                        <div className="flex gap-2">
                            <input
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                placeholder="Name or email"
                                className="w-full max-w-md rounded border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button
                                type="button"
                                className="rounded bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90"
                                onClick={() => {
                                    setPage(1);
                                    setSearch(searchDraft);
                                }}
                            >
                                <i className="bi bi-search" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setPage(1);
                                setRoleFilter(e.target.value);
                            }}
                            className="rounded border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">All roles</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="border-b border-slate-200 px-4 py-3">User</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Role</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Status</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Last IP</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Joined</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="border-b border-slate-100 px-4 py-3">
                                                <div className="font-semibold text-slate-800">
                                                    {u.name} {u.lastname}
                                                </div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.verified ? (
                                                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                            Unverified
                                                        </span>
                                                    )}
                                                    {u.account_locked ? (
                                                        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
                                                            Locked
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-600">
                                                {u.last_login_ip || '—'}
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-600">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(u)}
                                                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10"
                                                >
                                                    <i className="bi bi-pencil-square me-1" />
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
                    <span>
                        Page {page} of {pages} · {total} users
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= pages}
                            onClick={() => setPage((p) => Math.min(pages, p + 1))}
                            className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {editing ? (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-xl">
                            <h2 className="text-lg font-bold text-slate-800">Edit user #{editing.id}</h2>
                            <p className="mt-1 text-sm text-slate-500">{editing.email}</p>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Role</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                                    >
                                        {ROLES.filter((r) => isSuperAdmin || !['admin', 'superadmin'].includes(r)).map(
                                            (r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={editVerified}
                                        onChange={(e) => setEditVerified(e.target.checked)}
                                    />
                                    Email verified
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={editLocked}
                                        onChange={(e) => setEditLocked(e.target.checked)}
                                    />
                                    Account locked
                                </label>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                                    onClick={() => setEditing(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    className="rounded bg-brand-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                    onClick={() => void saveEdit()}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
