'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Container } from '@/components/container';
import { generateProductUrl } from '@/lib/utils';

type ProductCard = {
  id: string;
  name: string;
  featuredImage: string | null;
  price: string;
  categoryName: string | null;
};

function formatPrice(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function ProductsGrid({
  products,
  collectionKey,
}: {
  products: ProductCard[];
  collectionKey: string;
}) {
  if (!products.length) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        No products in this collection yet.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: horizontal swipeable cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-4 md:hidden snap-x snap-mandatory">
        {products.map((product) => (
          <Link
            key={product.id}
            href={generateProductUrl(product.name, product.id)}
            className="group snap-start flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
          >
            <div className="relative aspect-3/4 overflow-hidden bg-muted">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage}
                  alt={product.name}
                  fill
                  sizes="256px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2">
              {product.categoryName && (
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {product.categoryName}
                </span>
              )}
              <span className="line-clamp-2 text-sm font-medium">
                {product.name}
              </span>
              <span className="mt-1 text-sm font-semibold text-foreground">
                {formatPrice(product.price)}
              </span>
            </div>
          </Link>
        ))}

        {/* Mobile "View all" card at the end */}
        <Link
          href={`/shop?collection=${collectionKey}`}
          className="group snap-start flex w-64 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed bg-linear-to-br from-background via-card to-muted px-4 py-6 text-center text-sm font-medium text-foreground/80 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-foreground/30 bg-background/60 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/90 group-hover:border-foreground/60 group-hover:text-foreground">
            All
          </div>
          <span className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            View all
          </span>
          <span className="text-xs text-muted-foreground/90">
            Browse the full collection
          </span>
        </Link>
      </div>

      {/* Desktop / tablet: grid */}
      <div className="hidden pt-4 md:block">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={generateProductUrl(product.name, product.id)}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
            >
              <div className="relative aspect-3/4 overflow-hidden bg-muted">
                {product.featuredImage ? (
                  <Image
                    src={product.featuredImage}
                    alt={product.name}
                    fill
                    sizes="(min-width:1024px) 25vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2">
                {product.categoryName && (
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {product.categoryName}
                  </span>
                )}
                <span className="line-clamp-2 text-sm font-medium">
                  {product.name}
                </span>
                <span className="mt-1 text-sm font-semibold text-foreground">
                  {formatPrice(product.price)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

type TabKey = 'new' | 'best' | 'trending';

const tabConfig: { key: TabKey; label: string }[] = [
  { key: 'new', label: 'New Arrivals' },
  { key: 'best', label: 'Best Sell' },
  { key: 'trending', label: 'Trending' },
];

interface HomeCollectionsTabsProps {
  newArrivals: ProductCard[];
  bestSell: ProductCard[];
  trending: ProductCard[];
}

export function HomeCollectionsTabs({
  newArrivals,
  bestSell,
  trending,
}: HomeCollectionsTabsProps) {
  const [active, setActive] = useState<TabKey>('new');

  const currentProducts =
    active === 'new' ? newArrivals : active === 'best' ? bestSell : trending;

  const currentCollectionKey =
    active === 'new'
      ? 'NEW_ARRIVAL'
      : active === 'best'
        ? 'BEST_SELL'
        : 'TRENDING';

  return (
    <section className="pb-16 pt-10">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Featured Collections
          </h2>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex flex-wrap items-center gap-2">
            {tabConfig.map((tab) => {
              const isActive = tab.key === active;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActive(tab.key)}
                  className={`relative rounded-full px-3 py-1 transition ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'border text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop "View all" CTA aligned to the right of tabs */}
          <Link
            href={`/shop?collection=${currentCollectionKey}`}
            className="hidden items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:border-foreground hover:text-foreground md:inline-flex"
          >
            <span>View all</span>
          </Link>
        </div>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ProductsGrid
                products={currentProducts}
                collectionKey={currentCollectionKey}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
