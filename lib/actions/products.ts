"use server";

import { prisma } from "../prisma";
import { ProductCollection } from "../../generated/prisma/client";

type CollectionKey = keyof typeof ProductCollection;

export async function getProductsByCollection(
  collection: CollectionKey,
  opts?: { take?: number },
) {
  const take = opts?.take ?? 4;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      collections: {
        has: ProductCollection[collection],
      },
    },
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" },
    ],
    take,
    include: {
      category: true,
    },
  });

  return products;
}

export async function getHomeCollectionProducts() {
  const [newArrivals, bestSell, trending] = await Promise.all([
    getProductsByCollection("NEW_ARRIVAL", { take: 4 }),
    getProductsByCollection("BEST_SELL", { take: 4 }),
    getProductsByCollection("TRENDING", { take: 4 }),
  ]);

  return {
    newArrivals,
    bestSell,
    trending,
  };
}

