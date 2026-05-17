'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type CouponRow = {
    id: number;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number | string;
    max_uses: number | null;
    used_count: number;
    starts_at: string | null;
    ends_at: string | null;
    product_ids: number[] | null;
    category_ids: number[] | null;
    stackable: boolean;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
};

function toDatetimeLocalInput(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function idsToCsv(ids: number[] | null | undefined): string {
    if (!ids || !Array.isArray(ids) || !ids.length) return '';
    return ids.join(', ');
}

const emptyForm = {
    id: '' as number | '',
    code: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '10',
    max_uses: '',
    starts_at: '',
    ends_at: '',
    product_ids_csv: '',
    category_ids_csv: '',
    stackable: false,
    active: true,
};

export default function AdminCouponsPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [isFullAdmin, setIsFullAdmin] = useState(false);
    const [rows, setRows] = useState<CouponRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

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
            const u = JSON.parse(user) as { role?: string };
            const r = String(u?.role || '').toLowerCase();
            const ok = r === 'admin' || r === 'superadmin';
            setIsFullAdmin(ok);
            if (!ok) {
                router.replace('/admin/dashboard');
                return;
            }
        } catch {
            router.replace('/admin/login');
            return;
        }
        setReady(true);
    }, [router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = (await apiClient('/admin/ops/coupons')) as { success?: boolean; data?: CouponRow[]; message?: string };
            if (res?.success && Array.isArray(res.data)) {
                setRows(res.data);
            } else {
                toast.error(res?.message || 'Could not load coupons');
                setRows([]);
            }
        } catch {
            toast.error('Could not load coupons');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!ready) return;
        void load();
    }, [ready, load]);

    const resetForm = () => setForm({ ...emptyForm });

    const editRow = (c: CouponRow) => {
        setForm({
            id: c.id,
            code: c.code,
            discount_type: c.discount_type,
            discount_value: String(c.discount_value),
            max_uses: c.max_uses != null ? String(c.max_uses) : '',
            starts_at: toDatetimeLocalInput(c.starts_at),
            ends_at: toDatetimeLocalInput(c.ends_at),
            product_ids_csv: idsToCsv(c.product_ids ?? undefined),
            category_ids_csv: idsToCsv(c.category_ids ?? undefined),
            stackable: Boolean(c.stackable),
            active: Boolean(c.active),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim()) {
            toast.error('Code is required');
            return;
        }
        const body: Record<string, unknown> = {
            code: form.code.trim(),
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value),
            max_uses: form.max_uses.trim() === '' ? null : parseInt(form.max_uses, 10),
            starts_at: form.starts_at.trim() === '' ? null : form.starts_at,
            ends_at: form.ends_at.trim() === '' ? null : form.ends_at,
            product_ids: form.product_ids_csv.trim() === '' ? null : form.product_ids_csv,
            category_ids: form.category_ids_csv.trim() === '' ? null : form.category_ids_csv,
            stackable: form.stackable,
            active: form.active,
        };
        if (body.max_uses !== null && (typeof body.max_uses !== 'number' || Number.isNaN(body.max_uses) || body.max_uses < 0)) {
            toast.error('Max uses must be empty or a valid number');
            return;
        }
        if (Number.isNaN(body.discount_value as number)) {
            toast.error('Discount value must be a number');
            return;
        }
        if (form.id !== '') {
            body.id = form.id;
        }
        setSaving(true);
        try {
            const res = (await apiClient('/admin/ops/coupons', {
                method: 'POST',
                body: JSON.stringify(body),
            })) as { success?: boolean; message?: string };
            if (res?.success) {
                toast.success(form.id === '' ? 'Coupon created' : 'Coupon updated');
                resetForm();
                await load();
            } else {
                toast.error(res?.message || 'Save failed');
            }
        } catch {
            toast.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (c: CouponRow) => {
        if (
            !window.confirm(
                `Delete coupon "${c.code}"? This cannot be undone. Orders that already used the code keep their history; new checkouts will not find this coupon.`
            )
        ) {
            return;
        }
        setSaving(true);
        try {
            const res = (await apiClient(`/admin/ops/coupons/${c.id}`, { method: 'DELETE' })) as {
                success?: boolean;
                message?: string;
            };
            if (res?.success) {
                toast.success('Coupon deleted');
                if (form.id === c.id) resetForm();
                await load();
            } else {
                toast.error(res?.message || 'Delete failed');
            }
        } catch {
            toast.error('Delete failed');
        } finally {
            setSaving(false);
        }
    };

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            </div>
        );
    }

    if (!isFullAdmin) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 md:py-10">
                <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Sales</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Promo codes</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                            Create and edit coupons here. Shoppers enter the code on the{' '}
                            <strong>checkout</strong> page; the API validates dates, usage limits, and optional product or
                            category restrictions. Codes are stored in uppercase.
                        </p>
                        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            <li>
                                <strong>List / CRUD:</strong> this page (admin or superadmin only).
                            </li>
                            <li>
                                <strong>Storefront:</strong> <code className="rounded bg-slate-200 px-1">/checkout</code> →
                                field &quot;Promo code&quot;.
                            </li>
                            <li>
                                <strong>API:</strong>{' '}
                                <code className="rounded bg-slate-200 px-1">GET/POST /admin/ops/coupons</code>,{' '}
                                <code className="rounded bg-slate-200 px-1">DELETE /admin/ops/coupons/:id</code>
                            </li>
                        </ul>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/operations"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                            <i className="bi bi-sliders" /> Operations hub
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                            <i className="bi bi-receipt" /> Orders
                        </Link>
                    </div>
                </header>

                <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">{form.id === '' ? 'New coupon' : `Edit coupon #${form.id}`}</h2>
                    <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Code *</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 font-mono uppercase"
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                                placeholder="SAVE10"
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Discount type *</span>
                            <select
                                className="rounded-lg border border-slate-200 px-3 py-2"
                                value={form.discount_type}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, discount_type: e.target.value as 'percent' | 'fixed' }))
                                }
                            >
                                <option value="percent">Percent off eligible subtotal</option>
                                <option value="fixed">Fixed amount off eligible subtotal</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Discount value *</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="rounded-lg border border-slate-200 px-3 py-2"
                                value={form.discount_value}
                                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                            />
                            <span className="text-xs text-slate-500">
                                {form.discount_type === 'percent' ? 'Percent (e.g. 15 for 15%).' : 'Dollar amount (e.g. 5.00).'}
                            </span>
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Max redemptions</span>
                            <input
                                type="number"
                                min="0"
                                className="rounded-lg border border-slate-200 px-3 py-2"
                                value={form.max_uses}
                                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                                placeholder="Empty = unlimited"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Starts at</span>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-slate-200 px-3 py-2"
                                value={form.starts_at}
                                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-800">Ends at</span>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-slate-200 px-3 py-2"
                                value={form.ends_at}
                                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm md:col-span-2">
                            <span className="font-semibold text-slate-800">Restrict to product IDs (comma-separated)</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                                value={form.product_ids_csv}
                                onChange={(e) => setForm((f) => ({ ...f, product_ids_csv: e.target.value }))}
                                placeholder="e.g. 12, 34 — leave empty for all products"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm md:col-span-2">
                            <span className="font-semibold text-slate-800">Restrict to category IDs (comma-separated)</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                                value={form.category_ids_csv}
                                onChange={(e) => setForm((f) => ({ ...f, category_ids_csv: e.target.value }))}
                                placeholder="e.g. 1, 2 — leave empty for all categories"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input
                                type="checkbox"
                                checked={form.stackable}
                                onChange={(e) => setForm((f) => ({ ...f, stackable: e.target.checked }))}
                            />
                            Stackable (reserved; checkout currently applies one code)
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                            />
                            Active
                        </label>
                        <div className="flex flex-wrap gap-2 md:col-span-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : form.id === '' ? 'Create coupon' : 'Save changes'}
                            </button>
                            {form.id !== '' ? (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => resetForm()}
                                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                                >
                                    Cancel edit
                                </button>
                            ) : null}
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">All coupons</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-600">No coupons yet. Create one above.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                        <th className="py-2 pr-4">Code</th>
                                        <th className="py-2 pr-4">Type</th>
                                        <th className="py-2 pr-4">Value</th>
                                        <th className="py-2 pr-4">Used / max</th>
                                        <th className="py-2 pr-4">Window</th>
                                        <th className="py-2 pr-4">Scope</th>
                                        <th className="py-2 pr-4">Active</th>
                                        <th className="py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((c) => (
                                        <tr key={c.id} className="border-b border-slate-100">
                                            <td className="py-2 pr-4 font-mono font-semibold">{c.code}</td>
                                            <td className="py-2 pr-4">{c.discount_type}</td>
                                            <td className="py-2 pr-4">
                                                {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {c.used_count} / {c.max_uses == null ? '∞' : c.max_uses}
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-slate-600">
                                                {c.starts_at ? new Date(c.starts_at).toLocaleString() : '—'} →{' '}
                                                {c.ends_at ? new Date(c.ends_at).toLocaleString() : '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-slate-600">
                                                {c.product_ids?.length ? `Products: ${c.product_ids.join(', ')}` : null}
                                                {c.product_ids?.length && c.category_ids?.length ? <br /> : null}
                                                {c.category_ids?.length ? `Categories: ${c.category_ids.join(', ')}` : null}
                                                {!c.product_ids?.length && !c.category_ids?.length ? 'All cart lines' : null}
                                            </td>
                                            <td className="py-2 pr-4">{c.active ? 'Yes' : 'No'}</td>
                                            <td className="py-2">
                                                <button
                                                    type="button"
                                                    className="mr-2 text-sm font-bold text-brand-primary hover:underline"
                                                    onClick={() => editRow(c)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-sm font-bold text-red-600 hover:underline"
                                                    onClick={() => void remove(c)}
                                                    disabled={saving}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
