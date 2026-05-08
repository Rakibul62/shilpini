"use server";

import { prisma } from "../prisma";
import { ProductCollection } from "../../generated/prisma/client";

type CollectionKey = keyof typeof ProductCollection;

export interface ProductFilters {
  categoryId?: string;
  collection?: CollectionKey;
  search?: string;
  sortBy?: "newest" | "oldest" | "price-asc" | "price-desc";
  skip?: number;
  take?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const {
    categoryId,
    collection,
    search,
    sortBy = "newest",
    skip = 0,
    take = 20,
  } = filters;

  // Build where clause
  const where: {
    isActive: boolean;
    categoryId?: string;
    collections?: { has: ProductCollection };
    OR?: Array<{ name: { contains: string; mode: "insensitive" } }>;
  } = {
    isActive: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (collection) {
    where.collections = {
      has: ProductCollection[collection],
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build orderBy clause
  let orderBy:
    | { createdAt: "asc" | "desc" }
    | { price: "asc" | "desc" } = { createdAt: "desc" };
  switch (sortBy) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    hasMore: skip + take < total,
  };
}

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  });

  return categories;
}
