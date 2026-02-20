import { HeroSlider } from '@/components/hero-slider';
import { Container } from '@/components/container';
import { ProductsGrid } from '@/components/products-grid';
import { CollectionFilter } from '@/components/collection-filter';
import HomeShowcaseReviewsSection from '@/components/home-showcase-reviews-section';
import { getHeroSlides } from '@/lib/actions/sliders';
import { getProducts } from '@/lib/actions/products-list';

// Revalidate this page every 1 hour (ISR)
export const revalidate = 3600;

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    collection?: 'NEW_ARRIVAL' | 'BEST_SELL' | 'TRENDING';
    search?: string;
    sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc';
    skip?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const { category, collection, search, sort, skip } = params;

  const [slides, productsData] = await Promise.all([
    getHeroSlides(),
    getProducts({
      categoryId: category,
      collection,
      search,
      sortBy: sort,
      skip: skip ? parseInt(skip) : 0,
      take: 20,
    }),
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
    <main className="min-h-screen bg-background text-foreground">
      <HeroSlider slides={slides} />

      {/* Products Section */}
      <section id="products" className="md:py-12 py-8">
        <Container>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Shop All Products
            </h2>
            <p className="mt-2 text-muted-foreground">
              Discover our complete collection of authentic Punjabi ethnic wear
            </p>
          </div>

          {/* Collection Filter */}
          <div className="mb-6">
            <CollectionFilter />
          </div>

          {/* Products Grid */}
          <ProductsGrid
            initialProducts={mappedProducts}
            initialTotal={productsData.total}
            initialHasMore={productsData.hasMore}
          />
        </Container>
      </section>

      {/* Reviews Section */}
      <HomeShowcaseReviewsSection />
    </main>
  );
}
