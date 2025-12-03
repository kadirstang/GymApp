const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let studentToken = '';
let testCategoryId = '';
let testProductId = '';
let testOrderId = '';
let testOrderNumber = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
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
    console.log('✗ Trainer login failed');
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
    console.log('✗ Student login failed');
    return false;
  }
}

async function setupTestProduct() {
  console.log('\n3. Setting up test product...');

  // Create category
  const categoryResponse = await makeRequest('POST', '/api/product-categories', {
    name: 'Test Order Category',
  }, authToken);

  if (categoryResponse.status !== 201) {
    console.log('✗ Failed to create test category');
    return false;
  }

  testCategoryId = categoryResponse.data.data.id;
  console.log(`  ✓ Category created: ${testCategoryId}`);

  // Create product
  const productResponse = await makeRequest('POST', '/api/products', {
    categoryId: testCategoryId,
    name: 'Test Order Product',
    description: 'Product for order testing',
    price: 25.00,
    stockQuantity: 50,
    isActive: true,
  }, authToken);

  if (productResponse.status === 201) {
    testProductId = productResponse.data.data.id;
    console.log(`  ✓ Product created: ${testProductId}`);
    console.log(`  Stock: ${productResponse.data.data.stockQuantity}`);
    return true;
  } else {
    console.log('✗ Failed to create test product');
    return false;
  }
}

async function testCreateOrder() {
  console.log('\n4. Creating order as student...');
  const response = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 3,
      },
    ],
  }, studentToken);

  if (response.status === 201) {
    testOrderId = response.data.data.id;
    testOrderNumber = response.data.data.orderNumber;
    console.log('✓ Order created successfully');
    console.log(`  Order Number: ${testOrderNumber}`);
    console.log(`  Total Amount: $${response.data.data.totalAmount}`);
    console.log(`  Status: ${response.data.data.status}`);
    console.log(`  Items: ${response.data.data.items.length}`);
    return true;
  } else {
    console.log('✗ Failed to create order:', response.data);
    return false;
  }
}

async function testCreateOrderMultipleItems() {
  console.log('\n5. Creating order with multiple items...');
  const response = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 2,
      },
      {
        productId: testProductId,
        quantity: 1,
      },
    ],
  }, studentToken);

  if (response.status === 201) {
    console.log('✓ Multi-item order created successfully');
    console.log(`  Total Amount: $${response.data.data.totalAmount}`);
    console.log(`  Total Items: ${response.data.data.items.length}`);
    return true;
  } else {
    console.log('✗ Failed to create multi-item order:', response.data);
    return false;
  }
}

async function testInsufficientStock() {
  console.log('\n6. Testing insufficient stock prevention...');
  const response = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 1000, // Way more than available
      },
    ],
  }, studentToken);

  if (response.status === 400 && response.data.message.includes('Insufficient stock')) {
    console.log('✓ Correctly prevented order with insufficient stock');
    return true;
  } else {
    console.log('✗ Failed to prevent insufficient stock order');
    return false;
  }
}

async function testGetAllOrders() {
  console.log('\n7. Getting all orders (trainer view)...');
  const response = await makeRequest('GET', '/api/orders?page=1&limit=10', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.orders.length} orders`);
    console.log(`  Total: ${response.data.data.pagination.total}`);
    return true;
  } else {
    console.log('✗ Failed to get orders');
    return false;
  }
}

async function testGetOrderById() {
  console.log('\n8. Getting order by ID...');
  const response = await makeRequest('GET', `/api/orders/${testOrderId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Order retrieved successfully');
    console.log(`  Order Number: ${response.data.data.orderNumber}`);
    console.log(`  Status: ${response.data.data.status}`);
    console.log(`  Customer: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
    return true;
  } else {
    console.log('✗ Failed to get order by ID');
    return false;
  }
}

async function testStudentCanOnlySeeOwnOrders() {
  console.log('\n9. Testing student can only see their own orders...');
  const response = await makeRequest('GET', '/api/orders', null, studentToken);

  if (response.status === 200) {
    const allOwnOrders = response.data.data.orders.every(order =>
      order.user.email === 'student@testgym.com'
    );

    if (allOwnOrders) {
      console.log('✓ Student correctly sees only their own orders');
      console.log(`  Orders count: ${response.data.data.orders.length}`);
      return true;
    } else {
      console.log('✗ Student can see other users\' orders');
      return false;
    }
  } else {
    console.log('✗ Failed to get student orders');
    return false;
  }
}

async function testFilterByStatus() {
  console.log('\n10. Testing filter by status...');
  const response = await makeRequest('GET', '/api/orders?status=pending_approval', null, authToken);

  if (response.status === 200) {
    const allPending = response.data.data.orders.every(order =>
      order.status === 'pending_approval'
    );

    if (allPending) {
      console.log('✓ Status filter working correctly');
      console.log(`  Pending orders: ${response.data.data.orders.length}`);
      return true;
    } else {
      console.log('✗ Status filter not working');
      return false;
    }
  } else {
    console.log('✗ Failed to filter by status');
    return false;
  }
}

async function testUpdateOrderStatus() {
  console.log('\n11. Updating order status (trainer)...');

  // Update to prepared
  const preparedResponse = await makeRequest('PATCH', `/api/orders/${testOrderId}/status`, {
    status: 'prepared',
  }, authToken);

  if (preparedResponse.status !== 200) {
    console.log('✗ Failed to update to prepared');
    return false;
  }
  console.log('  ✓ Updated to prepared');

  // Update to completed
  const completedResponse = await makeRequest('PATCH', `/api/orders/${testOrderId}/status`, {
    status: 'completed',
  }, authToken);

  if (completedResponse.status === 200) {
    console.log('  ✓ Updated to completed');
    console.log('✓ Order status update working correctly');
    return true;
  } else {
    console.log('✗ Failed to update to completed');
    return false;
  }
}

async function testStudentCannotUpdateStatus() {
  console.log('\n12. Testing student cannot update order status...');
  const response = await makeRequest('PATCH', `/api/orders/${testOrderId}/status`, {
    status: 'completed',
  }, studentToken);

  if (response.status === 403) {
    console.log('✓ Student correctly prevented from updating order status');
    return true;
  } else {
    console.log('✗ Student was able to update order status');
    return false;
  }
}

async function testCancelOrder() {
  console.log('\n13. Testing order cancellation with stock restoration...');

  // First, create a new order
  const createResponse = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 5,
      },
    ],
  }, studentToken);

  if (createResponse.status !== 201) {
    console.log('✗ Failed to create order for cancellation test');
    return false;
  }

  const newOrderId = createResponse.data.data.id;
  console.log(`  ✓ Created order for cancellation: ${newOrderId}`);

  // Get stock before cancellation
  const productBefore = await makeRequest('GET', `/api/products/${testProductId}`, null, authToken);
  const stockBefore = productBefore.data.data.stockQuantity;
  console.log(`  Stock before cancel: ${stockBefore}`);

  // Cancel the order
  const cancelResponse = await makeRequest('PATCH', `/api/orders/${newOrderId}/status`, {
    status: 'cancelled',
  }, authToken);

  if (cancelResponse.status !== 200) {
    console.log('✗ Failed to cancel order');
    return false;
  }
  console.log('  ✓ Order cancelled');

  // Check stock after cancellation
  const productAfter = await makeRequest('GET', `/api/products/${testProductId}`, null, authToken);
  const stockAfter = productAfter.data.data.stockQuantity;
  console.log(`  Stock after cancel: ${stockAfter}`);

  if (stockAfter === stockBefore + 5) {
    console.log('✓ Stock correctly restored after cancellation');
    return true;
  } else {
    console.log('✗ Stock not restored correctly');
    return false;
  }
}

async function testDeleteOrder() {
  console.log('\n14. Testing order deletion (soft delete)...');

  // Create a pending order
  const createResponse = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 2,
      },
    ],
  }, studentToken);

  if (createResponse.status !== 201) {
    console.log('✗ Failed to create order for deletion test');
    return false;
  }

  const orderToDelete = createResponse.data.data.id;

  // Delete the order
  const deleteResponse = await makeRequest('DELETE', `/api/orders/${orderToDelete}`, null, studentToken);

  if (deleteResponse.status === 200) {
    console.log('✓ Order deleted successfully');

    // Verify it's not in the list anymore
    const listResponse = await makeRequest('GET', '/api/orders', null, studentToken);
    const exists = listResponse.data.data.orders.some(order => order.id === orderToDelete);

    if (!exists) {
      console.log('  ✓ Order not in active list');
      return true;
    } else {
      console.log('  ✗ Order still in active list');
      return false;
    }
  } else {
    console.log('✗ Failed to delete order');
    return false;
  }
}

async function testCannotDeleteCompletedOrder() {
  console.log('\n15. Testing cannot delete completed order...');

  // testOrderId is already completed from earlier test
  const response = await makeRequest('DELETE', `/api/orders/${testOrderId}`, null, authToken);

  if (response.status === 400 && response.data.message.includes('Cannot delete completed')) {
    console.log('✓ Correctly prevented deletion of completed order');
    return true;
  } else {
    console.log('✗ Was able to delete completed order');
    return false;
  }
}

async function testGetOrderStats() {
  console.log('\n16. Getting order statistics...');
  const response = await makeRequest('GET', '/api/orders/stats', null, authToken);

  if (response.status === 200) {
    console.log('✓ Order statistics retrieved');
    console.log(`  Total orders: ${response.data.data.totalOrders}`);
    console.log(`  Pending: ${response.data.data.byStatus.pending}`);
    console.log(`  Prepared: ${response.data.data.byStatus.prepared}`);
    console.log(`  Completed: ${response.data.data.byStatus.completed}`);
    console.log(`  Cancelled: ${response.data.data.byStatus.cancelled}`);
    console.log(`  Total revenue: $${response.data.data.totalRevenue}`);
    return true;
  } else {
    console.log('✗ Failed to get order statistics');
    return false;
  }
}

async function testSearchOrders() {
  console.log('\n17. Testing order search...');
  const response = await makeRequest('GET', `/api/orders?search=${testOrderNumber}`, null, authToken);

  if (response.status === 200 && response.data.data.orders.length > 0) {
    console.log('✓ Search returned results');
    console.log(`  Found ${response.data.data.orders.length} order(s)`);
    return true;
  } else {
    console.log('✗ Search failed');
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n18. Testing validation errors...');

  // Empty items array
  const emptyItemsResponse = await makeRequest('POST', '/api/orders', {
    items: [],
  }, studentToken);

  if (emptyItemsResponse.status !== 400) {
    console.log('  ✗ Did not reject empty items');
    return false;
  }
  console.log('  ✓ Empty items rejected');

  // Invalid product ID
  const invalidProductResponse = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: 'invalid-uuid',
        quantity: 1,
      },
    ],
  }, studentToken);

  if (invalidProductResponse.status !== 400) {
    console.log('  ✗ Did not reject invalid product ID');
    return false;
  }
  console.log('  ✓ Invalid product ID rejected');

  // Zero quantity
  const zeroQuantityResponse = await makeRequest('POST', '/api/orders', {
    items: [
      {
        productId: testProductId,
        quantity: 0,
      },
    ],
  }, studentToken);

  if (zeroQuantityResponse.status !== 400) {
    console.log('  ✗ Did not reject zero quantity');
    return false;
  }
  console.log('  ✓ Zero quantity rejected');

  console.log('✓ Validation errors tested');
  return true;
}

async function cleanupTestData() {
  console.log('\n19. Cleaning up test data...');

  try {
    // Delete all test orders (will be soft deleted)
    const ordersResponse = await makeRequest('GET', '/api/orders?limit=100', null, authToken);

    if (ordersResponse.status === 200 && ordersResponse.data.data.orders) {
      for (const order of ordersResponse.data.data.orders) {
        if (order.status !== 'completed') {
          await makeRequest('DELETE', `/api/orders/${order.id}`, null, authToken);
        }
      }
      console.log(`  ✓ Cleaned up orders`);
    }

    // Delete test product
    if (testProductId) {
      await makeRequest('DELETE', `/api/products/${testProductId}`, null, authToken);
      console.log('  ✓ Deleted test product');
    }

    // Delete test category
    if (testCategoryId) {
      await makeRequest('DELETE', `/api/product-categories/${testCategoryId}`, null, authToken);
      console.log('  ✓ Deleted test category');
    }

    console.log('✓ Test data cleaned up successfully');
    return true;
  } catch (error) {
    console.log('⚠ Cleanup error (non-critical):', error.message);
    return true;
  }
}

// Main test runner
async function runTests() {
  console.log('=================================');
  console.log('Order Management API Tests');
  console.log('=================================');

  try {
    // Setup
    if (!await testLogin()) return;
    if (!await testStudentLogin()) return;
    if (!await setupTestProduct()) return;

    // Order creation tests
    if (!await testCreateOrder()) return;
    if (!await testCreateOrderMultipleItems()) return;
    if (!await testInsufficientStock()) return;

    // Order retrieval tests
    if (!await testGetAllOrders()) return;
    if (!await testGetOrderById()) return;
    if (!await testStudentCanOnlySeeOwnOrders()) return;
    if (!await testFilterByStatus()) return;
    if (!await testSearchOrders()) return;

    // Order status management
    if (!await testUpdateOrderStatus()) return;
    if (!await testStudentCannotUpdateStatus()) return;
    if (!await testCancelOrder()) return;

    // Order deletion
    if (!await testDeleteOrder()) return;
    if (!await testCannotDeleteCompletedOrder()) return;

    // Statistics
    if (!await testGetOrderStats()) return;

    // Validation
    if (!await testValidationErrors()) return;

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
