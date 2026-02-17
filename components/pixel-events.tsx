'use client';

import { useEffect } from 'react';
import { trackPixel } from './facebook-pixel';

interface PixelViewContentProps {
  product: {
    id: string;
    name: string;
    price: number | string;
    category?: string;
  };
}

export function PixelViewContent({ product }: PixelViewContentProps) {
  useEffect(() => {
    trackPixel('ViewContent', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'BDT',
      content_category: product.category,
    });
  }, [product]);

  return null;
}
