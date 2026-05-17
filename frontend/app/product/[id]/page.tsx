'use client';

import React from 'react';
import ProductDetail from '@/app/components/product/productID/ProductID';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params?.id);

  if (!params?.id || isNaN(productId)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-600">
          Invalid product ID
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ProductDetail productId={productId} />
    </main>
  );
}
