'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/app/utils/apiClient';

type ProductCard = {
    id: number;
    product_name: string;
    product_price: number;
    product_brand: string;
    product_stock: number;
    product_primary_image?: string | null;
    media?: { media_data?: string; is_primary?: boolean }[];
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function thumb(p: ProductCard): string {
    const m = p.media?.find((x) => x.is_primary) || p.media?.[0];
    if (m?.media_data?.startsWith('data:')) return m.media_data;
    const img = p.product_primary_image;
    if (!img) return '/placeholder-image.jpg';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    if (img.startsWith('/')) return `${apiBase}${img}`;
    return `${apiBase}/${img}`;
}

function SearchResultsInner() {
    const searchParams = useSearchParams();
    const q = (searchParams.get('q') || '').trim();
    const [products, setProducts] = useState<ProductCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!q) {
            setProducts([]);
            setError(null);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiClient(`/product/products?search=${encodeURIComponent(q)}&limit=48`, {
                    skipAuth: true,
                });
                if (cancelled) return;
                if (res?.success && Array.isArray(res.data)) {
                    setProducts(res.data);
                } else {
                    setProducts([]);
                    setError(res?.message || 'No results');
                }
            } catch (e) {
                if (!cancelled) {
                    setProducts([]);
                    setError(e instanceof Error ? e.message : 'Search failed');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [q]);

    if (!q) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Search</h1>
                <p className="mt-3 text-slate-600">Enter a search term in the bar above to find products.</p>
                <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
                    Back to home
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">Search results</h1>
            <p className="mb-8 text-slate-600">
                {loading ? 'Searching…' : `${products.length} result${products.length === 1 ? '' : 's'} for `}
                {!loading && <span className="font-semibold text-slate-800">&ldquo;{q}&rdquo;</span>}
            </p>

            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            {loading && (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                </div>
            )}

            {!loading && products.length === 0 && !error && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
                    No products matched your search. Try different keywords or browse categories.
                </p>
            )}

            {!loading && products.length > 0 && (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                        <li key={p.id}>
                            <Link
                                href={`/product/${p.id}`}
                                className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                            >
                                <div className="aspect-square w-full overflow-hidden bg-slate-100">
                                    <img
                                        src={thumb(p)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                        }}
                                    />
                                </div>
                                <div className="p-4">
                                    <p className="line-clamp-2 font-medium text-slate-900">{p.product_name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{p.product_brand}</p>
                                    <p className="mt-2 font-semibold text-slate-900">${Number(p.product_price).toFixed(2)}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[30vh] items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                </div>
            }
        >
            <SearchResultsInner />
        </Suspense>
    );
}
