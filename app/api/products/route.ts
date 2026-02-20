import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/actions/products-list';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get('category') || undefined;
    const collection = searchParams.get('collection') as
      | 'NEW_ARRIVAL'
      | 'BEST_SELL'
      | 'TRENDING'
      | undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') as
      | 'newest'
      | 'oldest'
      | 'price-asc'
      | 'price-desc'
      | undefined;
    const skip = parseInt(searchParams.get('skip') || '0');

    const data = await getProducts({
      categoryId: category,
      collection,
      search,
      sortBy: sort,
      skip,
      take: 20,
    });

    const mappedProducts = data.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() ?? null,
      featuredImage: p.featuredImage,
      stock: p.stock,
      category: p.category,
    }));

    return NextResponse.json({
      products: mappedProducts,
      total: data.total,
      hasMore: data.hasMore,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}
