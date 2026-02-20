'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { generateProductUrl } from '@/lib/utils';

function formatPrice(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `৳ ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  // Helper removed

  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex justify-end bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-muted"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
                  <p className="mt-4 text-lg font-medium">Your cart is empty</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add some products to get started
                  </p>
                  <Link
                    href="/shop"
                    onClick={onClose}
                    className="mt-6 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border bg-card p-4"
                    >
                      {/* Product Image */}
                      <Link
                        href={generateProductUrl(item.slug)}
                        onClick={onClose}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        {item.featuredImage ? (
                          <Image
                            src={item.featuredImage}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col">
                        <Link
                          href={generateProductUrl(item.slug)}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.categoryName && (
                          <span className="mt-1 text-xs text-muted-foreground">
                            {item.categoryName}
                          </span>
                        )}
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {formatPrice(item.price)}
                          </span>

                          <div className="flex h-8 items-center rounded-lg border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1,
                                )
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:bg-muted"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={item.quantity >= item.stock}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:bg-muted disabled:opacity-50"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.cartItemId)}
                              className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-destructive/20 text-destructive transition hover:bg-destructive/10"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {item.quantity >= item.stock && (
                          <p className="mt-1 text-xs text-destructive">
                            Maximum stock reached
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t bg-muted/30 p-6 space-y-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
                >
                  Checkout
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm('Are you sure you want to clear the cart?')
                    ) {
                      clearCart();
                    }
                  }}
                  className="w-full rounded-full border px-6 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
