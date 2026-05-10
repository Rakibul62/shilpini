'use client';

import { useCallback, useMemo, useState } from 'react';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { ProductDetailActions } from '@/components/product-detail-actions';

interface ProductDetailInteractiveProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    comparePrice?: string | null;
    featuredImage: string | null;
    images: string[];
    stock: number;
    categoryName?: string | null;
    options: {
      id: string;
      name: string;
      values: string[];
    }[];
    variants: {
      id: string;
      title?: string | null;
      price?: string | null;
      comparePrice?: string | null;
      stock: number;
      image?: string | null;
      images?: string[];
      selections: {
        optionName: string;
        value: string;
      }[];
    }[];
  };
}

function formatPrice(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `TK ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function ProductDetailInteractive({ product }: ProductDetailInteractiveProps) {
  const [resolvedState, setResolvedState] = useState<{
    image: string | null;
    price: string;
    comparePrice: string | null;
    stock: number;
    firstOptionValue: string | null;
  }>({
    image: product.featuredImage || product.images[0] || null,
    price: product.price,
    comparePrice: product.comparePrice || null,
    stock: product.stock,
    // Track which first-option value is active so the gallery can snap to
    // the correct section even when variant images differ across sizes.
    firstOptionValue: product.options[0]?.values[0] ?? null,
  });

  // When a gallery thumbnail (belonging to a first-option value) is clicked,
  // this override tells ProductDetailActions to switch to that option value.
  const [selectedOptionOverride, setSelectedOptionOverride] = useState<{
    optionName: string;
    value: string;
  } | null>(null);

  // Index explicitly chosen by the user clicking a gallery thumbnail.
  // null = let the variant-driven index take over (e.g. after option button click).
  const [userGalleryIndex, setUserGalleryIndex] = useState<number | null>(null);

  const firstOption = product.options[0] ?? null;

  // For each unique value of the first option, collect the matching variant's
  // combined image list: [variant.image, ...variant.images]
  const firstOptionImageMeta = useMemo(() => {
    if (!firstOption || product.variants.length === 0) return [];
    return firstOption.values
      .map((value) => {
        const variant = product.variants.find((v) =>
          v.selections.some(
            (s) => s.optionName === firstOption.name && s.value === value,
          ),
        );
        if (!variant) return null;
        const combined = [
          variant.image,
          ...(variant.images ?? []),
        ].filter((img): img is string => Boolean(img));
        return combined.length > 0
          ? { images: combined, optionName: firstOption.name, value }
          : null;
      })
      .filter(
        (
          meta,
        ): meta is { images: string[]; optionName: string; value: string } =>
          meta !== null,
      );
  }, [firstOption, product.variants]);

  // Interleave by column (index):
  //   Round 0 → Red[0], Blue[0], Yellow[0]
  //   Round 1 → Red[1], Blue[1], Yellow[1]
  //   Round 2 → Red[2], Blue[2]  (Yellow exhausted)
  //   …then remaining product images
  const galleryImages = useMemo(() => {
    const maxLen = Math.max(
      0,
      ...firstOptionImageMeta.map((m) => m.images.length),
    );

    const interleaved: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const meta of firstOptionImageMeta) {
        if (i < meta.images.length) {
          interleaved.push(meta.images[i]);
        }
      }
    }

    const variantImageSet = new Set(interleaved);
    const baseImages = product.featuredImage
      ? [product.featuredImage, ...product.images]
      : product.images;
    const remaining = baseImages.filter((img) => !variantImageSet.has(img));

    const ordered = [...interleaved, ...remaining];
    return ordered.length > 0 ? ordered : ['/window.svg'];
  }, [firstOptionImageMeta, product.featuredImage, product.images]);

  // Map image URL → first-option selection info (covers ALL variant images, not just index 0)
  const imageToOption = useMemo(() => {
    const map = new Map<string, { optionName: string; value: string }>();
    for (const meta of firstOptionImageMeta) {
      for (const img of meta.images) {
        map.set(img, { optionName: meta.optionName, value: meta.value });
      }
    }
    return map;
  }, [firstOptionImageMeta]);

  // When option BUTTONS are clicked (not gallery thumbnails), clear the pinned
  // gallery index so the variant-driven sync can take over.
  const handleOptionButtonSelect = useCallback(() => {
    setUserGalleryIndex(null);
  }, []);

  // Variant-driven index: snap gallery to the right section based on the
  // active first-option value. This handles the case where the matched
  // variant's image differs from the gallery thumbnail image (e.g. Blue/M
  // has a different image than Blue/S which was used to build the gallery).
  const variantDrivenIndex = useMemo(() => {
    const fov = resolvedState.firstOptionValue;
    if (fov) {
      const meta = firstOptionImageMeta.find((m) => m.value === fov);
      if (meta) {
        // If the exact resolved image is one of this option-value's images, use it
        const specificIdx = galleryImages.findIndex(
          (img) => img === resolvedState.image && imageToOption.get(img)?.value === fov,
        );
        if (specificIdx >= 0) return specificIdx;
        // Otherwise snap to the first image of this option-value's gallery section
        const firstIdx = galleryImages.indexOf(meta.images[0]);
        if (firstIdx >= 0) return firstIdx;
      }
    }
    // Fallback: find by image URL
    if (!resolvedState.image) return 0;
    const idx = galleryImages.indexOf(resolvedState.image);
    return idx >= 0 ? idx : 0;
  }, [resolvedState, firstOptionImageMeta, galleryImages, imageToOption]);

  // Use the user's pinned index when they clicked a thumbnail directly,
  // otherwise fall back to the variant-driven index.
  const externalSelectedIndex = userGalleryIndex ?? variantDrivenIndex;

  // Called when user clicks any thumbnail in the gallery
  const handleGalleryImageClick = useCallback(
    (index: number) => {
      setUserGalleryIndex(index); // Pin gallery to the clicked thumbnail
      const imageUrl = galleryImages[index];
      if (!imageUrl) return;
      const optionInfo = imageToOption.get(imageUrl);
      if (optionInfo) {
        setSelectedOptionOverride(optionInfo);
      }
    },
    [galleryImages, imageToOption],
  );

  const discount =
    resolvedState.comparePrice &&
    Number(resolvedState.comparePrice) > Number(resolvedState.price)
      ? Math.round(
          ((Number(resolvedState.comparePrice) - Number(resolvedState.price)) /
            Number(resolvedState.comparePrice)) *
            100,
        )
      : null;

  const handleResolvedVariantChange = useCallback(
    (resolved: {
      image: string | null;
      price: string;
      comparePrice: string | null;
      stock: number;
      firstOptionValue: string | null;
    }) => {
      setResolvedState((prev) => {
        if (
          prev.image === resolved.image &&
          prev.price === resolved.price &&
          prev.comparePrice === resolved.comparePrice &&
          prev.stock === resolved.stock &&
          prev.firstOptionValue === resolved.firstOptionValue
        ) {
          return prev;
        }
        return resolved;
      });
    },
    [],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <ProductImageGallery
          images={galleryImages}
          productName={product.name}
          externalSelectedIndex={externalSelectedIndex}
          onImageClick={handleGalleryImageClick}
        />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-foreground/90">
            {product.name}
          </h1>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {formatPrice(resolvedState.price)}
          </span>
          {resolvedState.comparePrice && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(resolvedState.comparePrice)}
              </span>
              {discount && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {discount}% OFF
                </span>
              )}
            </>
          )}
        </div>

        <div className="border-t pt-6">
          <ProductDetailActions
            product={product}
            onResolvedVariantChange={handleResolvedVariantChange}
            selectedOptionOverride={selectedOptionOverride}
            onOptionButtonSelect={handleOptionButtonSelect}
          />
        </div>
      </div>
    </div>
  );
}
