import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/container';
import { getProducts } from '@/lib/actions/products-list';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { OrderNowButton } from '@/components/order-now-button';
import { generateProductUrl } from '@/lib/utils';

export const revalidate = 3600; // ISR: revalidate every hour

function formatPrice(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `TK ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default async function CollectionsPage() {
  const [newArrivals, bestSellers, trending] = await Promise.all([
    getProducts({ collection: 'NEW_ARRIVAL', take: 8 }),
    getProducts({ collection: 'BEST_SELL', take: 8 }),
    getProducts({ collection: 'TRENDING', take: 8 }),
  ]);

  const collections = [
    {
      key: 'NEW_ARRIVAL',
      title: 'New Arrivals',
      description: 'Discover our latest additions to the collection',
      products: newArrivals.products,
      total: newArrivals.total,
    },
    {
      key: 'BEST_SELL',
      title: 'Best Sellers',
      description: 'Our most loved pieces, tried and trusted',
      products: bestSellers.products,
      total: bestSellers.total,
    },
    {
      key: 'TRENDING',
      title: 'Trending Now',
      description: 'What everyone is talking about',
      products: trending.products,
      total: trending.total,
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-12 pt-8">
      <Container>
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Our Collections
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our curated collections of authentic Punjabi ethnic wear
          </p>
        </div>

        <div className="space-y-16">
          {collections.map((collection) => (
            <section key={collection.key} className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {collection.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {collection.description}
                  </p>
                </div>
                <Link
                  href={`/shop?collection=${collection.key}`}
                  className="hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-muted sm:inline-flex"
                >
                  View all ({collection.total})
                </Link>
              </div>

              {collection.products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                    {collection.products.map((product) => (
                      <Link
                        key={product.id}
                        href={generateProductUrl(product.slug)}
                        className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg"
                      >
                        <div className="relative aspect-3/4 overflow-hidden bg-muted">
                          {product.featuredImage ? (
                            <Image
                              src={product.featuredImage}
                              alt={product.name}
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 50vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                          {product.comparePrice &&
                            Number(product.comparePrice) >
                              Number(product.price) && (
                              <div className="absolute right-3 top-3 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-white">
                                Sale
                              </div>
                            )}
                        </div>

                        <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-2 sm:p-4">
                          <h3 className="line-clamp-2 text-sm font-medium leading-tight sm:text-base">
                            {product.name}
                          </h3>

                          <div className="mt-auto flex items-baseline gap-1 sm:gap-2">
                            <span className="text-base font-semibold sm:text-lg">
                              {formatPrice(product.price.toString())}
                            </span>
                            {product.comparePrice &&
                              Number(product.comparePrice) >
                                Number(product.price) && (
                                <span className="text-xs text-muted-foreground line-through sm:text-sm">
                                  {formatPrice(product.comparePrice.toString())}
                                </span>
                              )}
                          </div>

                          <div className="mt-2 flex gap-2 sm:mt-3">
                            <AddToCartButton
                              product={{
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                price: product.price.toString(),
                                featuredImage: product.featuredImage,
                                stock: product.stock,
                                categoryName: product.category?.name,
                              }}
                              variant="compact"
                              className="flex-1"
                            />
                            <OrderNowButton
                              product={{
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                price: product.price.toString(),
                                featuredImage: product.featuredImage,
                                stock: product.stock,
                                categoryName: product.category?.name,
                              }}
                              variant="compact"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile "View all" button */}
                  <div className="flex justify-center sm:hidden">
                    <Link
                      href={`/shop?collection=${collection.key}`}
                      className="inline-flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      View all {collection.title} ({collection.total})
                    </Link>
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No products in this collection yet
                </p>
              )}
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
