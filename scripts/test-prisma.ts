import { prisma } from '../lib/prisma';

async function test() {
  try {
    console.log('Testing findUnique with slug...');
    // Use a dummy slug that doesn't exist
    const product = await prisma.product.findUnique({
      where: { slug: 'test-slug' },
      select: { id: true, name: true, slug: true },
    });
    console.log('Success (even if not found):', product);
  } catch (error) {
    console.error('Caught error:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

test();
