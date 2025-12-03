# API Endpoints Quick Reference

**Base URL:** `http://localhost:3000/api`

## 🔐 Authentication (Public)
```
POST   /auth/register          - Create new user account
POST   /auth/login             - Login with email/password
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - Logout (requires auth)
```

## 👥 Trainer-Student Matching (trainer_matches.*)
```
POST   /trainer-matches                    - Create match
GET    /trainer-matches                    - List matches (paginated, filtered)
GET    /trainer-matches/:id                - Get match by ID
PATCH  /trainer-matches/:id/status         - Update match status
DELETE /trainer-matches/:id                - Delete match
```

## 🏋️ Exercise Library (exercises.*)
```
POST   /exercises              - Create exercise
GET    /exercises              - List exercises (paginated, searchable)
GET    /exercises/:id          - Get exercise by ID
PUT    /exercises/:id          - Update exercise
DELETE /exercises/:id          - Delete exercise
```

## 📋 Workout Programs (programs.*)
```
POST   /programs               - Create program
GET    /programs               - List programs (paginated, filtered)
GET    /programs/:id           - Get program with exercises
PUT    /programs/:id           - Update program
DELETE /programs/:id           - Delete program
```

## 📝 Program Exercises (programExercises.*)
```
POST   /programs/:programId/exercises              - Add exercise to program
GET    /programs/:programId/exercises              - List program exercises
GET    /programs/:programId/exercises/:id          - Get program exercise
PUT    /programs/:programId/exercises/:id          - Update program exercise
DELETE /programs/:programId/exercises/:id          - Remove exercise from program
POST   /programs/:programId/exercises/reorder      - Reorder exercises
```

## 📊 Workout Logging (workoutLogs.*)
```
POST   /workout-logs/start                 - Start workout session
PUT    /workout-logs/:id/end               - End workout session
POST   /workout-logs/:workoutLogId/sets    - Log a set
GET    /workout-logs                       - List workout logs (paginated)
GET    /workout-logs/:id                   - Get workout log with sets
GET    /workout-logs/active                - Get active workout
GET    /workout-logs/stats                 - Get workout statistics
PUT    /workout-logs/:workoutLogId/sets/:entryId   - Update set entry
DELETE /workout-logs/:workoutLogId/sets/:entryId   - Delete set entry
```

## 🔧 Equipment & QR (equipment.*)
```
POST   /equipment                      - Create equipment
GET    /equipment                      - List equipment (paginated, filtered)
GET    /equipment/:id                  - Get equipment by ID
PUT    /equipment/:id                  - Update equipment
DELETE /equipment/:id                  - Delete equipment
GET    /equipment/:id/qr-code          - Generate QR code image
GET    /equipment/qr/:qrCodeUuid       - Get equipment by QR scan
GET    /equipment/stats                - Equipment statistics
```

## 🏷️ Product Categories (productCategories.*)
```
POST   /product-categories         - Create category
GET    /product-categories         - List all categories
GET    /product-categories/:id     - Get category by ID
PUT    /product-categories/:id     - Update category
DELETE /product-categories/:id     - Delete category
```

## 🛒 Products (products.*)
```
POST   /products                   - Create product
GET    /products                   - List products (paginated, searchable)
GET    /products/:id               - Get product by ID
PUT    /products/:id               - Update product
PATCH  /products/:id/stock         - Update stock quantity
PATCH  /products/:id/toggle        - Toggle active status
DELETE /products/:id               - Delete product
```

## 📦 Orders (orders.*)
```
POST   /orders                 - Create order
GET    /orders                 - List orders (paginated, filtered)
GET    /orders/:id             - Get order by ID
PATCH  /orders/:id/status      - Update order status (trainer only)
DELETE /orders/:id             - Cancel/delete order
GET    /orders/stats           - Order statistics
```

## 👤 Users (users.*)
```
GET    /users              - List users (paginated, filtered)
GET    /users/:id          - Get user by ID
PUT    /users/:id          - Update user
```

## 🏢 Gyms (gyms.*)
```
GET    /gyms               - List all gyms
GET    /gyms/:id           - Get gym by ID
```

## 🔐 Roles (SuperAdmin only)
```
GET    /roles              - List all roles
GET    /roles/:id          - Get role with permissions
PUT    /roles/:id          - Update role permissions
```

---

## 📊 Query Parameters (Common)

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Filtering:**
- `search` - Text search
- `status` - Status filter (varies by resource)
- `userId` - Filter by user
- `gymId` - Filter by gym (SuperAdmin only)
- `startDate`, `endDate` - Date range

**Sorting:**
- `sortBy` - Field to sort by
- `sortOrder` - asc | desc

---

## 🔑 Permission Required by Role

### Student
✓ Can Do:
- View exercises, programs, equipment, products
- Create/view/cancel own orders (pending only)
- Log own workouts
- View own workout history

✗ Cannot Do:
- Create/edit exercises, programs, equipment, products
- Manage trainer matches
- View other users' data
- Update order status

### Trainer
✓ All Student permissions PLUS:
- Create/manage exercises
- Create/assign workout programs
- Manage trainer-student matches
- View student workout logs
- Create/manage equipment
- Manage products and orders
- Update order status

✗ Cannot Do:
- Manage gyms
- Manage roles/permissions
- Access other gym's data

### GymOwner
✓ All permissions for their gym
- Full access to all features
- Cannot access other gyms' data
- Cannot manage system roles

### SuperAdmin
✓ Full system access
- All GymOwner permissions
- Can access all gyms
- Can manage roles and permissions
- System-wide statistics

---

## 📝 Request Headers

**All Authenticated Requests:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Public Endpoints (login/register):**
```http
Content-Type: application/json
```

---

## 🎯 Response Structure

**Success (200/201):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "statusCode": 400,
    "status": "fail"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

---

## 🔄 Common Status Flows

**Trainer Match:**
`pending` → `active` → `ended`

**Order:**
`pending_approval` → `prepared` → `completed`
                   ↓
              `cancelled`

**Workout Log:**
`in_progress` → `completed` | `cancelled`

**Equipment:**
`active` ↔ `maintenance` ↔ `broken`

---

## 🧪 Testing URLs

**Local Development:**
```
http://localhost:3000/api
```

**Test Users:**
```
Trainer: trainer@testgym.com / password123
Student: student@testgym.com / password123
```

**Health Check:**
```
GET http://localhost:3000/api/test
```

---

**Last Updated:** December 2, 2025
