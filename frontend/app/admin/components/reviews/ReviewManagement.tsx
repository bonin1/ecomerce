'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/app/utils/apiClient';

interface PendingReview {
    id: number;
    rating: number;
    comment: string | null;
    status: string;
    createdAt: string;
    product_id?: number;
    User?: { id: number; name: string; lastname?: string };
    Produkt?: { id: number; product_name: string };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

function productBlock(r: PendingReview) {
    const p = r.Produkt ?? (r as { produkt?: { id: number; product_name: string } }).produkt;
    return p;
}

export default function ReviewManagement() {
    const [reviews, setReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            const res = (await apiClient(`/reviews/admin/reviews/pending?${params}`)) as {
                success?: boolean;
                data?: PendingReview[];
                pagination?: Pagination;
                message?: string;
            };
            if (res?.success && Array.isArray(res.data)) {
                setReviews(res.data);
                setPagination(res.pagination ?? null);
            } else {
                setReviews([]);
                if (res?.message) toast.error(res.message);
            }
        } catch {
            toast.error('Could not load pending reviews');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        void load();
    }, [load]);

    const moderate = async (reviewId: number, status: 'approved' | 'rejected') => {
        setBusyId(reviewId);
        try {
            const res = (await apiClient(`/reviews/admin/reviews/${reviewId}/moderate`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            })) as { success?: boolean; message?: string };
            if (res?.success === false) {
                toast.error(res.message || 'Moderation failed');
                return;
            }
            toast.success(status === 'approved' ? 'Review approved' : 'Review rejected');
            void load();
        } catch {
            toast.error('Moderation request failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Review moderation</h2>
                        <p className="text-sm text-slate-600">
                            Approve or reject customer reviews before they appear on product pages. Staff and admins can
                            moderate.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                            {pagination?.total ?? reviews.length} pending
                        </span>
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <i className="bi bi-arrow-clockwise" aria-hidden />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-slate-500">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    Loading queue…
                </div>
            ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-600 shadow-sm">
                    <i className="bi bi-check2-circle mb-3 text-4xl text-emerald-500" aria-hidden />
                    <p className="text-lg font-medium text-slate-800">You are all caught up</p>
                    <p className="text-sm">No reviews are waiting for moderation.</p>
                </div>
            ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                    {reviews.map((r) => {
                        const product = productBlock(r);
                        const pid = product?.id ?? r.product_id;
                        const busy = busyId === r.id;
                        return (
                            <li
                                key={r.id}
                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                            >
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Product
                                        </p>
                                        <p className="font-semibold text-slate-900">{product?.product_name ?? 'Unknown product'}</p>
                                        {pid != null ? (
                                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                                <Link
                                                    href={`/product/${pid}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 underline-offset-2 hover:underline"
                                                >
                                                    View storefront
                                                </Link>
                                                <Link
                                                    href="/admin/products"
                                                    className="text-slate-600 underline-offset-2 hover:underline"
                                                >
                                                    Admin products
                                                </Link>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${r.rating} of 5 stars`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <i
                                                key={i}
                                                className={i < r.rating ? 'bi bi-star-fill' : 'bi bi-star'}
                                                aria-hidden
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    <span className="font-medium text-slate-900">
                                        {r.User?.name} {r.User?.lastname ?? ''}
                                    </span>
                                    <span className="text-slate-400"> · </span>
                                    <time dateTime={r.createdAt}>
                                        {new Date(r.createdAt).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </time>
                                </div>

                                <p className="mb-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                    {r.comment?.trim() ? r.comment : <span className="italic text-slate-400">No written comment</span>}
                                </p>

                                <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void moderate(r.id, 'approved')}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px]"
                                    >
                                        {busy ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <i className="bi bi-check-lg" aria-hidden />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void moderate(r.id, 'rejected')}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px]"
                                    >
                                        <i className="bi bi-x-lg" aria-hidden />
                                        Reject
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {pagination && pagination.pages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-4">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= pagination.pages}
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            ) : null}
        </div>
    );
}
