import { getHomeCollectionProducts } from '@/lib/actions/products';
import { HomeCollectionsTabs } from '@/components/home-collections-tabs';

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  featuredImage: string | null;
  price: string;
  categoryName: string | null;
};

export default async function HomeCollectionsSection() {
  const data = await getHomeCollectionProducts();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapProducts = (items: any[]): ProductCard[] =>
    items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      featuredImage: p.featuredImage,
      price: p.price.toString(),
      categoryName: p.category?.name ?? null,
    }));

  const newArrivals = mapProducts(data.newArrivals);
  const bestSell = mapProducts(data.bestSell);
  const trending = mapProducts(data.trending);

  return (
    <HomeCollectionsTabs
      newArrivals={newArrivals}
      bestSell={bestSell}
      trending={trending}
    />
  );
}
