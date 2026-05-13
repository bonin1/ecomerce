'use client';

import React from 'react';
import ProductDetail from '@/app/components/product/productID/ProductID';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params?.id);

  if (!params?.id || isNaN(productId)) {
    return (
      <main className="wrapper">
        <section className="wrapper-assist">
          <div className="container mt-5 text-center">Invalid product ID</div>
        </section>
      </main>
    );
  }

  return (
    <main className="wrapper">
      <section className="wrapper-assist">
        <ProductDetail productId={productId} />
      </section>
    </main>
  );
}
