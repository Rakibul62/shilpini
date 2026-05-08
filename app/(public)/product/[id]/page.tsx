import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/container';
import { ProductReviews } from '@/components/product-reviews';
import { ProductDetailInteractive } from '@/components/product-detail-interactive';
import { PixelViewContent } from '@/components/pixel-events';
import {
  getProductBySlug,
  getProductReviews,
} from '@/lib/actions/product-detail';
import { prisma } from '@/lib/prisma';

import type { Metadata, ResolvingMetadata } from 'next';

export const revalidate = 3600;

// Dynamic Metadata Generation
export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.id);

  if (!product) {
    return {
      title: 'Product Not Found | Shilpini',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${product.name} | Shilpini`,
    description:
      product.description?.slice(0, 160) ||
      `Buy ${product.name} at Shilpini. Authentic Punjabi ethnic wear.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.featuredImage
        ? [product.featuredImage, ...previousImages]
        : previousImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.featuredImage ? [product.featuredImage] : [],
    },
  };
}

// Pre-generate product pages at build time for better performance
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
    take: 50, // Pre-generate top 50 products
  });

  return products.map((product) => ({
    id: product.slug,
  }));
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const reviews = await getProductReviews(product.id);

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.featuredImage ? [product.featuredImage] : product.images,
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Shilpini',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shilpini.com'}/product/${slug}`,
      priceCurrency: 'BDT',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Shilpini',
      },
    },
    aggregateRating:
      reviews.length > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue:
              reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
              reviews.length,
            reviewCount: reviews.length,
          }
        : undefined,
  };

  return (
    <main className="min-h-screen bg-background pb-12 pt-8">
      <PixelViewContent
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          category: product.category?.name,
          featuredImage: product.featuredImage,
        }}
      />
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/#products" className="hover:text-foreground">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/?category=${product.category.id}#products`}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <ProductDetailInteractive
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price.toString(),
            comparePrice: product.comparePrice?.toString() || null,
            featuredImage: product.featuredImage,
            images: product.images,
            stock: product.stock,
            categoryName: product.category?.name,
            options: product.options,
            variants: product.variants.map((variant) => ({
              id: variant.id,
              title: variant.title,
              price: variant.price?.toString() || null,
              comparePrice: variant.comparePrice?.toString() || null,
              stock: variant.stock,
              image: variant.image,
              images: variant.images,
              selections: variant.selections.map((selection) => ({
                optionName: selection.option.name,
                value: selection.value,
              })),
            })),
          }}
        />

        {/* Description */}
        {product.description && (
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold">Description</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Customer Reviews</h2>
            <ProductReviews reviews={reviews} />
          </div>
        )}
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
