'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fetchWishlist, removeFromWishlist } from '@/app/API/wishlist';

type WishlistRow = {
    wishlistId: number;
    addedAt: string;
    id: number;
    product_name: string;
    product_price: number;
    product_brand: string;
    product_stock: number;
    product_primary_image?: string | null;
    preview_image_data?: string | null;
    product_discount_active?: boolean;
    product_discount_price?: number | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/** Inline SVG data URL — never triggers another network request (avoids onError loops). */
const IMAGE_FALLBACK = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#eef1f8"/><stop offset="100%" stop-color="#dce3f0"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="140" y="160" width="200" height="140" rx="4" fill="none" stroke="#4d6dba" stroke-width="2" opacity="0.35"/>
      <circle cx="240" cy="210" r="28" fill="#4d6dba" opacity="0.2"/>
      <path d="M200 280h80" stroke="#2a344a" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
    </svg>`
)}`;

function buildPrimaryImageUrl(p: WishlistRow): string | null {
    const img = p.product_primary_image;
    if (!img || typeof img !== 'string') return null;
    const t = img.trim();
    if (!t) return null;
    if (t.startsWith('data:') || t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('/')) return `${apiBase}${t}`;
    return `${apiBase}/${t}`;
}

function WishlistCardImage({ product }: { product: WishlistRow }) {
    const [phase, setPhase] = useState<'preview' | 'primary' | 'fallback'>(() =>
        product.preview_image_data ? 'preview' : buildPrimaryImageUrl(product) ? 'primary' : 'fallback'
    );

    const src = useMemo(() => {
        if (phase === 'fallback') return IMAGE_FALLBACK;
        if (phase === 'preview' && product.preview_image_data) return product.preview_image_data;
        const u = buildPrimaryImageUrl(product);
        if (u) return u;
        return IMAGE_FALLBACK;
    }, [phase, product]);

    const handleError = () => {
        if (phase === 'preview' && buildPrimaryImageUrl(product)) {
            setPhase('primary');
            return;
        }
        setPhase('fallback');
    };

    return (
        <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={handleError}
            loading="lazy"
        />
    );
}

export default function WishlistPage() {
    const router = useRouter();
    const [items, setItems] = useState<WishlistRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        const token =
            typeof window !== 'undefined'
                ? sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
                : null;
        const userRaw =
            typeof window !== 'undefined'
                ? localStorage.getItem('user') || sessionStorage.getItem('user')
                : null;
        if (!token && !userRaw) {
            router.replace('/login?next=/wishlist');
            return;
        }
        setLoading(true);
        try {
            const res = await fetchWishlist();
            if (res?.success && Array.isArray(res.data)) {
                setItems(res.data);
            } else {
                setItems([]);
                if (res?.message) toast.error(res.message);
            }
        } catch {
            toast.error('Could not load wishlist');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleRemove = async (productId: number) => {
        setRemovingId(productId);
        try {
            const res = await removeFromWishlist(productId);
            if (res?.success) {
                toast.success('Removed from wishlist');
                setItems((prev) => prev.filter((i) => i.id !== productId));
            } else {
                toast.error(res?.message || 'Remove failed');
            }
        } catch {
            toast.error('Remove failed');
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center px-4">
                <div
                    className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/20 border-t-brand-primary"
                    aria-label="Loading"
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-brand-secondary md:text-3xl">My Wishlist</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your saved items.</p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded bg-brand-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90 no-underline"
                >
                    Continue Shopping
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="rounded border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded bg-slate-50">
                        <i className="bi bi-heart text-3xl text-brand-primary" />
                    </div>
                    <p className="text-lg font-bold text-brand-secondary">Your wishlist is empty</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        When you find something you love, tap the heart on the product page to save it here.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex rounded bg-brand-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90 no-underline"
                    >
                        Browse the store
                    </Link>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 list-none p-0 m-0">
                    {items.map((p) => {
                        const price =
                            p.product_discount_active && p.product_discount_price != null
                                ? Number(p.product_discount_price)
                                : Number(p.product_price);
                        return (
                            <li
                                key={p.wishlistId}
                                className="group relative overflow-hidden rounded border border-slate-200 bg-white transition hover:border-brand-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col"
                            >
                                <Link href={`/product/${p.id}`} className="block relative bg-slate-50 aspect-[4/3] w-full overflow-hidden no-underline">
                                    <WishlistCardImage product={p} />
                                    {p.product_discount_active && (
                                        <span className="absolute left-2 top-2 rounded bg-[#ff4747] px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                                            SALE
                                        </span>
                                    )}
                                </Link>
                                <div className="p-3 flex flex-col flex-1">
                                    <Link href={`/product/${p.id}`} className="no-underline">
                                        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-700 hover:text-brand-primary transition-colors">
                                            {p.product_name}
                                        </p>
                                    </Link>
                                    <div className="mt-2 mb-3">
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-lg font-bold text-brand-secondary">${price.toFixed(2)}</span>
                                            {p.product_discount_active && (
                                                <span className="text-xs text-slate-400 line-through mb-0.5">
                                                    ${Number(p.product_price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
                                        <Link 
                                            href={`/product/${p.id}`}
                                            className="flex-1 rounded bg-brand-primary/10 border border-brand-primary/20 py-1.5 text-center text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white no-underline"
                                        >
                                            View
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={removingId === p.id}
                                            onClick={() => handleRemove(p.id)}
                                            className="flex items-center justify-center w-8 rounded border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                            title="Remove from wishlist"
                                        >
                                            {removingId === p.id ? (
                                                <i className="bi bi-hourglass text-sm" />
                                            ) : (
                                                <i className="bi bi-trash3 text-sm" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}