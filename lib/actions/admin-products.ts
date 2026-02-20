'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { ProductCollection } from '../../generated/prisma/enums';

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  price: string;
  comparePrice?: string;
  sku?: string;
  stock: number;
  categoryId?: string;
  tags: string[];
  featuredImage?: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  collections: ProductCollection[];
  order: number;
  options?: {
    name: string;
    values: string[];
  }[];
}

export async function createProduct(data: ProductFormData) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      comparePrice: data.comparePrice || null,
      sku: data.sku || null,
      stock: data.stock,
      categoryId: data.categoryId || null,
      tags: data.tags,
      featuredImage: data.featuredImage || null,
      images: data.images,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      collections: data.collections,
      order: data.order,
      options: {
        create: data.options?.map((opt) => ({
          name: opt.name,
          values: opt.values,
        })),
      },
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/(public)', 'layout');

  return { success: true, id: product.id };
}

export async function updateProduct(id: string, data: ProductFormData) {
  // Use transaction to ensure options are updated correctly
  const product = await prisma.$transaction(async (tx) => {
    // 1. Update basic product info
    const updated = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        comparePrice: data.comparePrice || null,
        sku: data.sku || null,
        stock: data.stock,
        categoryId: data.categoryId || null,
        tags: data.tags,
        featuredImage: data.featuredImage || null,
        images: data.images,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        collections: data.collections,
        order: data.order,
      },
    });

    // 2. Handle options: Delete existing and create new
    if (data.options) {
      await tx.productOption.deleteMany({
        where: { productId: id },
      });

      if (data.options.length > 0) {
        await tx.productOption.createMany({
          data: data.options.map((opt) => ({
            productId: id,
            name: opt.name,
            values: opt.values,
          })),
        });
      }
    }

    return updated;
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/(public)', 'layout');

  return { success: true, id: product.id };
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id },
  });

  revalidatePath('/admin/products');
  revalidatePath('/(public)', 'layout');

  return { success: true };
}

export async function getAllCategoriesForForm() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  return categories;
}
