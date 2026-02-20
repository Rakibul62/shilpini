import { Container } from '@/components/container';
import { ProductFilters } from '@/components/product-filters';
import { ProductsGrid } from '@/components/products-grid';
import { ProductSearch } from '@/components/product-search';
import { getProducts, getAllCategories } from '@/lib/actions/products-list';

export const revalidate = 3600; // ISR: revalidate every hour

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    collection?: 'NEW_ARRIVAL' | 'BEST_SELL' | 'TRENDING';
    search?: string;
    sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc';
    skip?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const { category, collection, search, sort, skip } = params;

  const [productsData, categories] = await Promise.all([
    getProducts({
      categoryId: category,
      collection,
      search,
      sortBy: sort,
      skip: skip ? parseInt(skip) : 0,
      take: 20,
    }),
    getAllCategories(),
  ]);

  const mappedProducts = productsData.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price.toString(),
    comparePrice: p.comparePrice?.toString() ?? null,
    featuredImage: p.featuredImage,
    stock: p.stock,
    category: p.category,
  }));

  return (
    <main className="min-h-screen bg-background md:pb-8 pb-4 md:pt-20 pt-5 lg:pt-8">
      <Container>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Shop All Products
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover our complete collection of authentic Punjabi ethnic wear
          </p>
        </div>

        {/* Search Bar + Mobile Filter Button */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1">
            <ProductSearch />
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <ProductFilters categories={categories} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Filters</h2>
              <ProductFilters categories={categories} />
            </div>
          </aside>

          {/* Products Grid */}
          <div>
            <ProductsGrid
              initialProducts={mappedProducts}
              initialTotal={productsData.total}
              initialHasMore={productsData.hasMore}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
