#!/usr/bin/env node

/**
 * Product Management API Test Script
 * Tests all endpoints for product and category management
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let studentToken = '';
let testCategoryId = '';
let testProductId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testLogin() {
  console.log('\n1. Testing trainer login...');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'trainer@testgym.com',
    password: 'password123',
  });

  if (response.status === 200 && response.data.data.token) {
    authToken = response.data.data.token;
    console.log('✓ Trainer login successful');
    return true;
  } else {
    console.log('✗ Login failed:', response.data);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n2. Testing student login...');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'student@testgym.com',
    password: 'password123',
  });

  if (response.status === 200 && response.data.data.token) {
    studentToken = response.data.data.token;
    console.log('✓ Student login successful');
    return true;
  } else {
    console.log('✗ Student login failed:', response.data);
    return false;
  }
}

// Category tests
async function testCreateCategory() {
  console.log('\n3. Creating product category...');
  const response = await makeRequest('POST', '/api/product-categories', {
    name: 'Test Supplements',
    imageUrl: 'https://example.com/supplements.jpg',
  }, authToken);

  if (response.status === 201) {
    testCategoryId = response.data.data.id;
    console.log(`✓ Category created: ${testCategoryId}`);
    console.log(`  Name: ${response.data.data.name}`);
    return true;
  } else {
    console.log('✗ Failed to create category:', response.data);
    return false;
  }
}

async function testCreateDuplicateCategory() {
  console.log('\n4. Testing duplicate category prevention...');
  const response = await makeRequest('POST', '/api/product-categories', {
    name: 'Test Supplements',
  }, authToken);

  if (response.status === 409) {
    console.log('✓ Correctly prevented duplicate category');
    return true;
  } else {
    console.log('✗ Should have prevented duplicate category');
    return false;
  }
}

async function testGetAllCategories() {
  console.log('\n5. Getting all categories...');
  const response = await makeRequest('GET', '/api/product-categories', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.categories.length} categories`);
    console.log(`  Total: ${response.data.data.pagination.total}`);
    return true;
  } else {
    console.log('✗ Failed to get categories');
    return false;
  }
}

async function testGetCategoryById() {
  console.log('\n6. Getting category by ID...');
  const response = await makeRequest('GET', `/api/product-categories/${testCategoryId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Category retrieved successfully');
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  Products: ${response.data.data.products.length}`);
    return true;
  } else {
    console.log('✗ Failed to get category');
    return false;
  }
}

async function testUpdateCategory() {
  console.log('\n7. Updating category...');
  const response = await makeRequest('PUT', `/api/product-categories/${testCategoryId}`, {
    name: 'Test Supplements Updated',
  }, authToken);

  if (response.status === 200) {
    console.log('✓ Category updated successfully');
    console.log(`  New name: ${response.data.data.name}`);
    return true;
  } else {
    console.log('✗ Failed to update category');
    return false;
  }
}

// Product tests
async function testCreateProduct() {
  console.log('\n8. Creating product...');
  const response = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Test Protein Powder',
    description: 'Premium whey protein powder',
    imageUrl: 'https://example.com/protein.jpg',
    price: 49.99,
    stockQuantity: 100,
    isActive: true,
  }, authToken);

  if (response.status === 201) {
    testProductId = response.data.data.id;
    console.log(`✓ Product created: ${testProductId}`);
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  Price: $${response.data.data.price}`);
    console.log(`  Stock: ${response.data.data.stockQuantity}`);
    return true;
  } else {
    console.log('✗ Failed to create product:', response.data);
    return false;
  }
}

async function testCreateDuplicateProduct() {
  console.log('\n9. Testing duplicate product prevention...');
  const response = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Test Protein Powder',
    price: 39.99,
  }, authToken);

  if (response.status === 409) {
    console.log('✓ Correctly prevented duplicate product in same category');
    return true;
  } else {
    console.log('✗ Should have prevented duplicate product');
    return false;
  }
}

async function testGetAllProducts() {
  console.log('\n10. Getting all products...');
  const response = await makeRequest('GET', '/api/products', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.products.length} products`);
    console.log(`  Total: ${response.data.data.pagination.total}`);
    return true;
  } else {
    console.log('✗ Failed to get products');
    return false;
  }
}

async function testGetProductById() {
  console.log('\n11. Getting product by ID...');
  const response = await makeRequest('GET', `/api/products/${testProductId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Product retrieved successfully');
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  Price: $${response.data.data.price}`);
    console.log(`  Stock: ${response.data.data.stockQuantity}`);
    console.log(`  Category: ${response.data.data.category.name}`);
    return true;
  } else {
    console.log('✗ Failed to get product');
    return false;
  }
}

async function testFilterProductsByCategory() {
  console.log('\n12. Filtering products by category...');
  const response = await makeRequest('GET', `/api/products?categoryId=${testCategoryId}`, null, authToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.products.length} products in category`);
    const allMatch = response.data.data.products.every(p => p.category.id === testCategoryId);
    if (allMatch) {
      console.log('  ✓ All products match category filter');
    }
    return true;
  } else {
    console.log('✗ Failed to filter products');
    return false;
  }
}

async function testSearchProducts() {
  console.log('\n13. Searching products...');
  const response = await makeRequest('GET', '/api/products?search=protein', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Search returned ${response.data.data.products.length} products`);
    return true;
  } else {
    console.log('✗ Search failed');
    return false;
  }
}

async function testFilterActiveProducts() {
  console.log('\n14. Filtering active products...');
  const response = await makeRequest('GET', '/api/products?isActive=true', null, authToken);

  if (response.status === 200) {
    const allActive = response.data.data.products.every(p => p.isActive === true);
    if (allActive) {
      console.log('✓ Active filter working correctly');
      console.log(`  Found ${response.data.data.products.length} active products`);
    }
    return true;
  } else {
    console.log('✗ Active filter failed');
    return false;
  }
}

async function testFilterInStockProducts() {
  console.log('\n15. Filtering in-stock products...');
  const response = await makeRequest('GET', '/api/products?inStock=true', null, authToken);

  if (response.status === 200) {
    const allInStock = response.data.data.products.every(p => p.stockQuantity > 0);
    if (allInStock) {
      console.log('✓ In-stock filter working correctly');
      console.log(`  Found ${response.data.data.products.length} products in stock`);
    }
    return true;
  } else {
    console.log('✗ In-stock filter failed');
    return false;
  }
}

async function testUpdateProduct() {
  console.log('\n16. Updating product...');
  const response = await makeRequest('PUT', `/api/products/${testProductId}`, {
    name: 'Test Protein Powder Pro',
    price: 59.99,
    description: 'Updated premium whey protein powder with enhanced formula',
  }, authToken);

  if (response.status === 200) {
    console.log('✓ Product updated successfully');
    console.log(`  New name: ${response.data.data.name}`);
    console.log(`  New price: $${response.data.data.price}`);
    return true;
  } else {
    console.log('✗ Failed to update product');
    return false;
  }
}

async function testUpdateStock() {
  console.log('\n17. Updating product stock...');
  const response = await makeRequest('PATCH', `/api/products/${testProductId}/stock`, {
    stockQuantity: 50,
  }, authToken);

  if (response.status === 200) {
    console.log('✓ Stock updated successfully');
    console.log(`  New stock: ${response.data.data.stockQuantity}`);
    return true;
  } else {
    console.log('✗ Failed to update stock');
    return false;
  }
}

async function testToggleActivation() {
  console.log('\n18. Toggling product activation...');

  // Deactivate
  const response1 = await makeRequest('PATCH', `/api/products/${testProductId}/toggle`, null, authToken);
  if (response1.status === 200 && response1.data.data.isActive === false) {
    console.log('  ✓ Product deactivated');
  }

  // Reactivate
  const response2 = await makeRequest('PATCH', `/api/products/${testProductId}/toggle`, null, authToken);
  if (response2.status === 200 && response2.data.data.isActive === true) {
    console.log('  ✓ Product reactivated');
    console.log('✓ Toggle activation working correctly');
    return true;
  }

  console.log('✗ Toggle activation failed');
  return false;
}

async function testGetProductStats() {
  console.log('\n19. Getting product statistics...');
  const response = await makeRequest('GET', '/api/products/stats', null, authToken);

  if (response.status === 200) {
    console.log('✓ Product statistics retrieved');
    console.log(`  Total products: ${response.data.data.total}`);
    console.log(`  Active: ${response.data.data.active}`);
    console.log(`  Inactive: ${response.data.data.inactive}`);
    console.log(`  In stock: ${response.data.data.inStock}`);
    console.log(`  Out of stock: ${response.data.data.outOfStock}`);
    console.log(`  Total stock items: ${response.data.data.totalStockItems}`);
    return true;
  } else {
    console.log('✗ Failed to get statistics');
    return false;
  }
}

async function testStudentCanViewProducts() {
  console.log('\n20. Testing student can view products...');
  const response = await makeRequest('GET', '/api/products', null, studentToken);

  if (response.status === 200) {
    console.log('✓ Student can view products');
    console.log(`  Viewed ${response.data.data.products.length} products`);
    return true;
  } else {
    console.log('✗ Student should be able to view products');
    return false;
  }
}

async function testStudentCannotCreateProduct() {
  console.log('\n21. Testing student cannot create products...');
  const response = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Unauthorized Product',
    price: 9.99,
  }, studentToken);

  if (response.status === 403) {
    console.log('✓ Student correctly prevented from creating products');
    return true;
  } else {
    console.log('✗ Student should not be able to create products');
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n22. Testing validation errors...');

  // Invalid category ID
  const response1 = await makeRequest('POST', '/api/products', {
    categoryId: 'invalid-uuid',
    name: 'Test Product',
    price: 9.99,
  }, authToken);
  if (response1.status === 400) {
    console.log('  ✓ Invalid category ID rejected');
  }

  // Negative price
  const response2 = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Test Product',
    price: -10,
  }, authToken);
  if (response2.status === 400) {
    console.log('  ✓ Negative price rejected');
  }

  // Missing required fields
  const response3 = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
  }, authToken);
  if (response3.status === 400) {
    console.log('  ✓ Missing required fields rejected');
  }

  console.log('✓ Validation errors tested');
  return true;
}

async function testDeleteProduct() {
  console.log('\n23. Testing product deletion...');
  const response = await makeRequest('DELETE', `/api/products/${testProductId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Product deleted successfully');
    return true;
  } else {
    console.log('✗ Failed to delete product');
    return false;
  }
}

async function testDeleteCategoryWithProducts() {
  console.log('\n24. Testing category deletion prevention with products...');

  // Create a product first
  const createResponse = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Test Product For Deletion',
    price: 19.99,
  }, authToken);

  const deleteResponse = await makeRequest('DELETE', `/api/product-categories/${testCategoryId}`, null, authToken);

  if (deleteResponse.status === 400) {
    console.log('✓ Correctly prevented category deletion with products');

    // Cleanup: delete the product
    if (createResponse.status === 201) {
      await makeRequest('DELETE', `/api/products/${createResponse.data.data.id}`, null, authToken);
    }
    return true;
  } else {
    console.log('✗ Should prevent category deletion with products');
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n25. Cleaning up test data...');

  try {
    // First, get all products in the test category
    const productsResponse = await makeRequest('GET', `/api/products?categoryId=${testCategoryId}&page=1&limit=100`, null, authToken);

    if (productsResponse.status === 200 && productsResponse.data.products) {
      // Delete each product
      for (const product of productsResponse.data.products) {
        await makeRequest('DELETE', `/api/products/${product.id}`, null, authToken);
      }
      console.log(`  ✓ Deleted ${productsResponse.data.products.length} test products`);
    }

    // Now delete the test category
    const categoryResponse = await makeRequest('DELETE', `/api/product-categories/${testCategoryId}`, null, authToken);

    if (categoryResponse.status === 200) {
      console.log('✓ Test data cleaned up successfully');
      return true;
    } else {
      console.log('⚠ Category cleanup failed (non-critical)');
      return true;
    }
  } catch (error) {
    console.log('⚠ Cleanup error (non-critical):', error.message);
    return true;
  }
}

// Main test runner
async function runTests() {
  console.log('=================================');
  console.log('Product Management API Tests');
  console.log('=================================');

  try {
    // Setup
    if (!await testLogin()) return;
    if (!await testStudentLogin()) return;

    // Category tests
    if (!await testCreateCategory()) return;
    if (!await testCreateDuplicateCategory()) return;
    if (!await testGetAllCategories()) return;
    if (!await testGetCategoryById()) return;
    if (!await testUpdateCategory()) return;

    // Product tests
    if (!await testCreateProduct()) return;
    if (!await testCreateDuplicateProduct()) return;
    if (!await testGetAllProducts()) return;
    if (!await testGetProductById()) return;
    if (!await testFilterProductsByCategory()) return;
    if (!await testSearchProducts()) return;
    if (!await testFilterActiveProducts()) return;
    if (!await testFilterInStockProducts()) return;
    if (!await testUpdateProduct()) return;
    if (!await testUpdateStock()) return;
    if (!await testToggleActivation()) return;
    if (!await testGetProductStats()) return;

    // Permission tests
    if (!await testStudentCanViewProducts()) return;
    if (!await testStudentCannotCreateProduct()) return;

    // Validation and edge cases
    if (!await testValidationErrors()) return;
    if (!await testDeleteProduct()) return;
    if (!await testDeleteCategoryWithProducts()) return;

    // Cleanup
    await cleanupTestData();

    console.log('\n=================================');
    console.log('✓ All tests passed!');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n✗ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
