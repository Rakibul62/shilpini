import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { generateProductUrl } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shilpini.com';

  // Get all active products
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}${generateProductUrl(product.name, product.id)}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...productEntries,
  ];
}
