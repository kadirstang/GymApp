const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete all test products first
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });

    // Delete all test categories
    const deletedCategories = await prisma.productCategory.deleteMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });

    console.log(`✓ Deleted ${deletedProducts.count} test products`);
    console.log(`✓ Deleted ${deletedCategories.count} test categories`);
    console.log('✓ Test data cleaned up successfully');
  } catch (error) {
    console.error('Cleanup error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
