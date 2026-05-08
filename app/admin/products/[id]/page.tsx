import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getAllCategoriesForForm } from '@/lib/actions/admin-products';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        options: true,
        variants: {
          include: {
            selections: {
              include: {
                option: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    }),
    getAllCategoriesForForm(),
  ]);

  if (!product) {
    notFound();
  }

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() || '',
    sku: product.sku || '',
    stock: product.stock,
    categoryId: product.categoryId || '',
    tags: [...product.tags],
    featuredImage: product.featuredImage || '',
    images: [...product.images],
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    collections: [...product.collections],
    order: product.order,
    options: product.options.map((opt) => ({
      name: opt.name,
      values: opt.values,
    })),
    variants: product.variants.map((variant) => ({
      title: variant.title || '',
      sku: variant.sku || '',
      price: variant.price?.toString() || '',
      comparePrice: variant.comparePrice?.toString() || '',
      stock: variant.stock,
      image: variant.image || '',
      images: [...variant.images],
      isActive: variant.isActive,
      order: variant.order,
      selections: variant.selections.map((selection) => ({
        optionName: selection.option.name,
        value: selection.value,
      })),
    })),
  };

  return (
    <div className=" max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Edit Product
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Update product details
        </p>
      </div>

      <ProductForm
        initialData={initialData}
        categories={categories}
        mode="edit"
        productId={id}
      />
    </div>
  );
}
