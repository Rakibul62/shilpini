'use client';

import { useEffect } from 'react';

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
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
        content_category: product.category,
      });
    }
  }, [product]);

  return null;
}
