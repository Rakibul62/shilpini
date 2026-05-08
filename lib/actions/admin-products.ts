/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { ProductCollection } from '../../generated/prisma/client';

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
  variants?: {
    title?: string;
    sku?: string;
    price?: string;
    comparePrice?: string;
    stock: number;
    image?: string;
    images?: string[];
    isActive: boolean;
    order: number;
    selections: {
      optionName: string;
      value: string;
    }[];
  }[];
}

function ensureVariantsHaveAllSelections(data: ProductFormData) {
  const options = data.options || [];
  const variants = data.variants || [];
  if (options.length === 0 || variants.length === 0) return;

  for (const [index, variant] of variants.entries()) {
    const missing = options.filter((option) => {
      const selected = variant.selections.find(
        (selection) => selection.optionName.trim().toLowerCase() === option.name.trim().toLowerCase(),
      );
      return !selected?.value?.trim();
    });

    if (missing.length > 0) {
      throw new Error(
        `Variant ${index + 1} is missing selections for: ${missing
          .map((option) => option.name)
          .join(', ')}`,
      );
    }
  }
}

export async function createProduct(data: ProductFormData) {
  ensureVariantsHaveAllSelections(data);

  const product = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;
    const created = await tx.product.create({
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
      include: {
        options: true,
      },
    });

    if (data.variants?.length) {
      const optionByName = new Map(
        created.options.map((option) => [option.name.trim().toLowerCase(), option]),
      );

      for (const variant of data.variants) {
        const createdVariant = await txAny.productVariant.create({
          data: {
            productId: created.id,
            title: variant.title || null,
            sku: variant.sku || null,
            price: variant.price || null,
            comparePrice: variant.comparePrice || null,
            stock: variant.stock,
            image: variant.image || null,
            images: variant.images || [],
            isActive: variant.isActive,
            order: variant.order,
          },
        });

        const selectionsToCreate = variant.selections
          .map((selection) => {
            const option = optionByName.get(selection.optionName.trim().toLowerCase());
            if (!option || !selection.value) return null;
            return {
              variantId: createdVariant.id,
              optionId: option.id,
              value: selection.value,
            };
          })
          .filter(
            (selection): selection is { variantId: string; optionId: string; value: string } =>
              Boolean(selection),
          );

        if (selectionsToCreate.length > 0) {
          await txAny.productVariantSelection.createMany({ data: selectionsToCreate });
        }
      }
    }

    return created;
  });

  revalidatePath('/admin/products');
  revalidatePath('/(public)', 'layout');

  return { success: true, id: product.id };
}

export async function updateProduct(id: string, data: ProductFormData) {
  ensureVariantsHaveAllSelections(data);

  const product = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;
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

    await txAny.productVariant.deleteMany({
      where: { productId: id },
    });

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

    if (data.variants?.length) {
      const createdOptions = await tx.productOption.findMany({
        where: { productId: id },
      });

      const optionByName = new Map(
        createdOptions.map((option) => [option.name.trim().toLowerCase(), option]),
      );

      for (const variant of data.variants) {
        const createdVariant = await txAny.productVariant.create({
          data: {
            productId: id,
            title: variant.title || null,
            sku: variant.sku || null,
            price: variant.price || null,
            comparePrice: variant.comparePrice || null,
            stock: variant.stock,
            image: variant.image || null,
            images: variant.images || [],
            isActive: variant.isActive,
            order: variant.order,
          },
        });

        const selectionsToCreate = variant.selections
          .map((selection) => {
            const option = optionByName.get(selection.optionName.trim().toLowerCase());
            if (!option || !selection.value) return null;
            return {
              variantId: createdVariant.id,
              optionId: option.id,
              value: selection.value,
            };
          })
          .filter(
            (selection): selection is { variantId: string; optionId: string; value: string } =>
              Boolean(selection),
          );

        if (selectionsToCreate.length > 0) {
          await txAny.productVariantSelection.createMany({ data: selectionsToCreate });
        }
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
