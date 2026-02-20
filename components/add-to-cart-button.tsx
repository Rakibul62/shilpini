'use client';

import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    featuredImage: string | null;
    stock: number;
    categoryName?: string | null;
  };
  variant?: 'default' | 'icon' | 'compact';
  className?: string;
}

export function AddToCartButton({
  product,
  variant = 'default',
  className = '',
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a Link
    e.stopPropagation();

    addItem(product);
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  if (product.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex h-10 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive sm:h-12 ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        className={`inline-flex h-7 w-full items-center justify-center gap-1 rounded-full border bg-background transition hover:bg-muted sm:h-10 sm:gap-2 ${className}`}
      >
        {isAdded ? (
          <>
            <Check className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
            <span className="text-[10px] font-medium sm:text-sm">Added</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-[10px] font-medium sm:text-sm">Add</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        className={`inline-flex h-7 w-full items-center justify-center gap-1 rounded-full border border-foreground/20 bg-foreground/10 text-foreground transition hover:bg-foreground/20 sm:h-10 sm:gap-2 ${className}`}
      >
        {isAdded ? (
          <>
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-[10px] font-medium sm:text-sm">Added</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-[10px] font-medium sm:text-sm">Add</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition hover:bg-foreground/90 sm:h-12 ${className}`}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}
