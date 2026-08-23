'use client';
import { use } from 'react';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage({ params }) {
  const { id } = use(params);
  return <ProductForm productId={id} />;
}
