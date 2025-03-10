'use client';

import React from 'react';
import ProductDetail from '@/app/components/product/productID/ProductID';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params.id);

  if (isNaN(productId)) {
    return <div className="container mt-5 text-center">Invalid product ID</div>;
  }

  return (
    <main className="wrapper">
      <section className="wrapper-assist">
        <ProductDetail productId={productId} />
      </section>
    </main>
  );
}
