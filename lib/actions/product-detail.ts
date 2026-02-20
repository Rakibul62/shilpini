'use server';

import { prisma } from '../prisma';

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      options: true,
    },
  });

  return product;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      options: true,
    },
  });

  return product;
}

export async function getProductReviews(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      isApproved: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return reviews;
}

export async function getRelatedProducts(
  categoryId: string | null,
  currentProductId: string,
  take: number = 4,
) {
  if (!categoryId) return [];

  const products = await prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: {
        not: currentProductId,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take,
    include: {
      category: true,
    },
  });

  return products;
}
