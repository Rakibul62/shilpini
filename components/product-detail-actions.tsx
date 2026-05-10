/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { ShoppingCart, Check, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';

interface ProductDetailActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    comparePrice?: string | null;
    featuredImage: string | null;
    images?: string[];
    stock: number;
    categoryName?: string | null;
    options?: {
      id: string;
      name: string;
      values: string[];
    }[];
    variants?: {
      id: string;
      title?: string | null;
      price?: string | null;
      comparePrice?: string | null;
      stock: number;
      image?: string | null;
      selections: {
        optionName: string;
        value: string;
      }[];
    }[];
  };
  onResolvedVariantChange?: (resolved: {
    image: string | null;
    price: string;
    comparePrice: string | null;
    stock: number;
    firstOptionValue: string | null;
  }) => void;
  /** When set, forces the named option to switch to the given value */
  selectedOptionOverride?: { optionName: string; value: string } | null;
  /** Called when the user clicks an option button (not a gallery thumbnail) */
  onOptionButtonSelect?: () => void;
}

const optionsMatch = (
  a: Record<string, string> = {},
  b: Record<string, string> = {},
) => {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  if (!keysA.every((key, index) => key === keysB[index])) return false;
  return keysA.every((key) => a[key] === b[key]);
};

export function ProductDetailActions({
  product,
  onResolvedVariantChange,
  selectedOptionOverride,
  onOptionButtonSelect,
}: ProductDetailActionsProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // State for selected options
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const defaults: Record<string, string> = {};
    for (const option of product.options || []) {
      if (option.values.length > 0) {
        defaults[option.name] = option.values[0];
      }
    }
    return defaults;
  });

  const hasOptions = (product.options?.length || 0) > 0;
  const allOptionsSelected = hasOptions
    ? (product.options || []).every((option) => Boolean(selectedOptions[option.name]))
    : true;

  const selectedEntries = Object.entries(selectedOptions).filter(([, value]) => Boolean(value));
  const matchedVariant =
    selectedEntries.length > 0 && product.variants?.length
      ? product.variants.find((variant) =>
          selectedEntries.every(([optionName, selectedValue]) => {
            const variantValue = variant.selections.find(
              (selection) => selection.optionName === optionName,
            )?.value;
            return variantValue === selectedValue;
          }),
        )
      : null;

  const isVariantInheritingBasePrice = matchedVariant ? !matchedVariant.price : false;
  const effectivePrice = matchedVariant?.price || product.price;
  const effectiveComparePrice = matchedVariant
    ? isVariantInheritingBasePrice
      ? product.comparePrice || null
      : matchedVariant.comparePrice || null
    : product.comparePrice || null;
  const effectiveStock = matchedVariant?.stock ?? product.stock;
  const effectiveImage =
    matchedVariant?.image || product.featuredImage || product.images?.[0] || '/window.svg';

  // Track which first-option value is currently selected so the gallery can
  // snap to the right color section even when the matched variant has a
  // different image URL than the gallery thumbnail (e.g. Blue/M vs Blue/S).
  const firstOptionName = product.options?.[0]?.name ?? null;
  const resolvedFirstOptionValue = firstOptionName
    ? (selectedOptions[firstOptionName] ?? null)
    : null;

  useEffect(() => {
    onResolvedVariantChange?.({
      image: effectiveImage,
      price: effectivePrice,
      comparePrice: effectiveComparePrice,
      stock: effectiveStock,
      firstOptionValue: resolvedFirstOptionValue,
    });
  }, [
    effectiveImage,
    effectivePrice,
    effectiveComparePrice,
    effectiveStock,
    resolvedFirstOptionValue,
    onResolvedVariantChange,
  ]);

  const cartItem = items.find(
    (item) =>
      item.id === product.id &&
      optionsMatch(item.selectedOptions, selectedOptions),
  );
  const currentCartQty = cartItem?.quantity || 0;
  const availableStock = effectiveStock - currentCartQty;

  // Apply external option override (e.g. from clicking a variant thumbnail in the gallery)
  useEffect(() => {
    if (selectedOptionOverride) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOptions((prev) => {
        if (prev[selectedOptionOverride.optionName] === selectedOptionOverride.value) return prev;
        return { ...prev, [selectedOptionOverride.optionName]: selectedOptionOverride.value };
      });
    }
  }, [selectedOptionOverride]);

  const handleOptionSelect = (optionName: string, value: string) => {
    onOptionButtonSelect?.();
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    // Validate options
    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(
        (opt) => !selectedOptions[opt.name],
      );

      if (missingOptions.length > 0) {
        toast.error(
          `Please select ${missingOptions.map((o) => o.name).join(', ')}`,
        );
        return;
      }
    }

    if (availableStock <= 0) return;

    // Create a variant ID or append options to name for the cart item
    // For now, simpler approach: just add it.
    // Ideally we need to support variants in cart properly.
    // We will append selected options to name or pass as metadata.

    // Note: The cart context currently doesn't support complex variants merging separately.
    // Updates to cart context are planned. For now we pass options.

    // Construct cart item with options
    const cartItemData = {
      ...product,
      id: product.id,
      slug: product.slug, // Explicitly ensure slug is included if it wasn't in prop spread
      price: effectivePrice,
      comparePrice: effectiveComparePrice,
      stock: effectiveStock,
      featuredImage: effectiveImage,
      selectedOptions: selectedOptions, // Pass this even if not typed yet in cart
      // Create a unique ID for this variant if needed,
      // but for now we keep ID same and let CartContext handle split if valid.
      // Wait, if ID is same, cart will merge them.
      // We will temporarily append options to ID to force separation or rely on CartContext update.
      // Let's rely on extending the addItem to just take what we give.
    };

    for (let i = 0; i < quantity; i++) {
      addItem(cartItemData);
    }

    setIsAdded(true);
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: effectivePrice,
        currency: 'BDT',
        image_url: effectiveImage || undefined,
      });
    }
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const router = useRouter();

  // ... (previous code)

  const handleOrderNow = () => {
    // Validate options
    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(
        (opt) => !selectedOptions[opt.name],
      );

      if (missingOptions.length > 0) {
        toast.error(
          `Please select ${missingOptions.map((o) => o.name).join(', ')}`,
        );
        return;
      }
    }

    if (availableStock <= 0) return;

    // Construct cart item with options
    const cartItemData = {
      ...product,
      id: product.id,
      slug: product.slug,
      price: effectivePrice,
      comparePrice: effectiveComparePrice,
      stock: effectiveStock,
      featuredImage: effectiveImage,
      selectedOptions: selectedOptions,
    };

    for (let i = 0; i < quantity; i++) {
      addItem(cartItemData);
    }

    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: effectivePrice,
        currency: 'BDT',
        image_url: effectiveImage || undefined,
      });

      window.fbq('track', 'InitiateCheckout', {
        content_ids: [product.id],
        value: effectivePrice,
        currency: 'BDT',
        num_items: quantity,
        content_type: 'product',
        image_url: effectiveImage || undefined,
      });
    }

    router.push('/checkout');
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (quantity < availableStock) setQuantity(quantity + 1);
  };

  if (effectiveStock <= 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm font-medium text-destructive">
          Out of Stock
        </div>
        <p className="text-center text-xs text-muted-foreground">
          This product is currently unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Status */}
      <div className="rounded-lg border border-green-200 bg-green-50/50 px-3 py-2 dark:border-green-900/30 dark:bg-green-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-500" />
            <span className="text-xs font-medium text-green-900 dark:text-green-100">
              In Stock
            </span>
          </div>
          <span className="text-xs text-green-700 dark:text-green-300">
            {availableStock} available
            {currentCartQty > 0 && ` · ${currentCartQty} in cart`}
          </span>
        </div>
      </div>

      {/* Product Options */}
      {product.options && product.options.length > 0 && (
        <div className="space-y-5">
          <div className="border-b pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
              Select Options
            </h3>
          </div>
          {product.options.map((option) => (
            <div key={option.id} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground">
                  {option.name}
                </label>
                {selectedOptions[option.name] && (
                  <span className="text-sm font-semibold text-primary">
                    {selectedOptions[option.name]}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionSelect(option.name, value)}
                      className={`min-w-14 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200
                            ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-accent text-foreground'
                            }
                        `}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-3">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Quantity
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center rounded-lg border-2 border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-14 items-center justify-center border-x-2 border-border">
              <span className="text-base font-semibold">{quantity}</span>
            </div>
            <button
              type="button"
              onClick={increaseQuantity}
              disabled={quantity >= availableStock}
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {availableStock <= 5 && availableStock > 0 && (
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              Only {availableStock} left!
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={availableStock <= 0}
          className="inline-flex h-12  py-2 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-background font-medium transition-all hover:bg-foreground/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:h-13"
        >
          {isAdded ? (
            <>
              <Check className="h-5 w-5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleOrderNow}
          className="inline-flex h-12 flex-1 items-center py-2 justify-center gap-2 rounded-full border-2 border-gray-300 bg-white text-foreground font-medium transition-all hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-slate-950 dark:hover:bg-slate-900 sm:h-13"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Order Now</span>
        </button>
      </div>

      {availableStock <= 0 && (
        <p className="text-center text-sm font-medium text-destructive">
          Cannot add more - stock limit reached
        </p>
      )}
    </div>
  );
}
