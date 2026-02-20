import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/container';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { ProductReviews } from '@/components/product-reviews';
import { ProductDetailActions } from '@/components/product-detail-actions';
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

function formatPrice(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `TK ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

  const images = product.featuredImage
    ? [product.featuredImage, ...product.images]
    : product.images;

  const discount =
    product.comparePrice && Number(product.comparePrice) > Number(product.price)
      ? Math.round(
          ((Number(product.comparePrice) - Number(product.price)) /
            Number(product.comparePrice)) *
            100,
        )
      : null;

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

        {/* Product Details */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery images={images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-foreground/90">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {formatPrice(product.price.toString())}
              </span>
              {product.comparePrice &&
                Number(product.comparePrice) > Number(product.price) && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.comparePrice.toString())}
                    </span>
                    {discount && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <ProductDetailActions
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price.toString(),
                  featuredImage: product.featuredImage,
                  stock: product.stock,
                  categoryName: product.category?.name,
                  options: product.options,
                }}
              />
            </div>
          </div>
        </div>

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
