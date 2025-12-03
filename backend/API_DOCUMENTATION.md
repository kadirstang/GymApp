# GymOS Backend API Documentation

**Base URL:** `http://localhost:3000/api`

**Authentication:** Most endpoints require JWT Bearer token in Authorization header: `Authorization: Bearer <token>`

---

## 📝 Authentication & Authorization

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+905551234567",
  "role": "Student", // "Student", "Trainer", or "GymOwner"
  "gymId": "uuid" // Required for Student/Trainer
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "id": "uuid", "name": "Student" }
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "id": "uuid", "name": "Student" },
      "gymId": "uuid"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### POST /auth/logout
Logout and invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 Trainer-Student Matching

### POST /trainer-matches
Create a trainer-student match.

**Permission:** `trainer_matches.create`

**Request Body:**
```json
{
  "trainerId": "uuid",
  "studentId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Trainer-student match created",
  "data": {
    "id": "uuid",
    "trainerId": "uuid",
    "studentId": "uuid",
    "status": "pending",
    "createdAt": "2025-12-02T20:00:00.000Z"
  }
}
```

### GET /trainer-matches
List trainer-student matches with filtering.

**Permission:** `trainer_matches.read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): active | pending | ended
- `trainerId` (optional): UUID
- `studentId` (optional): UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "uuid",
        "status": "active",
        "startedAt": "2025-12-01T00:00:00.000Z",
        "trainer": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Trainer",
          "email": "trainer@gym.com"
        },
        "student": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Student",
          "email": "student@gym.com"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### GET /trainer-matches/:id
Get single match by ID.

**Permission:** `trainer_matches.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "startedAt": "2025-12-01T00:00:00.000Z",
    "endedAt": null,
    "trainer": { /* user object */ },
    "student": { /* user object */ }
  }
}
```

### PATCH /trainer-matches/:id/status
Update match status.

**Permission:** `trainer_matches.update`

**Request Body:**
```json
{
  "status": "active" // active | pending | ended
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Match status updated",
  "data": { /* updated match */ }
}
```

### DELETE /trainer-matches/:id
Delete a match (soft delete).

**Permission:** `trainer_matches.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Match deleted successfully"
}
```

---

## 🏋️ Exercise Library

### POST /exercises
Create a new exercise.

**Permission:** `exercises.create`

**Request Body:**
```json
{
  "name": "Bench Press",
  "description": "Compound chest exercise",
  "videoUrl": "https://youtube.com/watch?v=xxxxx",
  "targetMuscleGroup": "Chest",
  "difficulty": "Intermediate", // Beginner | Intermediate | Advanced
  "equipment": "Barbell"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Exercise created successfully",
  "data": {
    "id": "uuid",
    "name": "Bench Press",
    "description": "Compound chest exercise",
    "videoUrl": "https://youtube.com/watch?v=xxxxx",
    "targetMuscleGroup": "Chest",
    "difficulty": "Intermediate",
    "equipment": "Barbell",
    "createdBy": "uuid",
    "gymId": "uuid"
  }
}
```

### GET /exercises
List all exercises with filtering and search.

**Permission:** `exercises.read`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search in name/description
- `targetMuscleGroup` (optional): Filter by muscle group
- `difficulty` (optional): Beginner | Intermediate | Advanced
- `equipment` (optional): Filter by equipment

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "id": "uuid",
        "name": "Bench Press",
        "targetMuscleGroup": "Chest",
        "difficulty": "Intermediate",
        "equipment": "Barbell"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### GET /exercises/:id
Get single exercise by ID.

**Permission:** `exercises.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Bench Press",
    "description": "Compound chest exercise",
    "videoUrl": "https://youtube.com/watch?v=xxxxx",
    "targetMuscleGroup": "Chest",
    "difficulty": "Intermediate",
    "equipment": "Barbell",
    "createdBy": "uuid",
    "gymId": "uuid",
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

### PUT /exercises/:id
Update an exercise.

**Permission:** `exercises.update`

**Request Body:** (all fields optional)
```json
{
  "name": "Incline Bench Press",
  "description": "Upper chest exercise",
  "difficulty": "Advanced"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exercise updated successfully",
  "data": { /* updated exercise */ }
}
```

### DELETE /exercises/:id
Delete an exercise (soft delete).

**Permission:** `exercises.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

---

## 📋 Workout Programs

### POST /programs
Create a workout program.

**Permission:** `programs.create`

**Request Body:**
```json
{
  "name": "Beginner Full Body",
  "description": "3x per week full body workout",
  "difficultyLevel": "Beginner", // Beginner | Intermediate | Advanced
  "durationWeeks": 12,
  "assignedUserId": "uuid" // Optional: assign to specific user
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "id": "uuid",
    "name": "Beginner Full Body",
    "description": "3x per week full body workout",
    "difficultyLevel": "Beginner",
    "durationWeeks": 12,
    "createdBy": "uuid",
    "assignedUserId": "uuid",
    "gymId": "uuid"
  }
}
```

### GET /programs
List workout programs.

**Permission:** `programs.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `difficultyLevel`: Filter by difficulty
- `assignedUserId`: Filter by assigned user

**Response (200):**
```json
{
  "success": true,
  "data": {
    "programs": [
      {
        "id": "uuid",
        "name": "Beginner Full Body",
        "difficultyLevel": "Beginner",
        "durationWeeks": 12,
        "assignedUser": { "id": "uuid", "firstName": "John", "lastName": "Doe" }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /programs/:id
Get single program with exercises.

**Permission:** `programs.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Beginner Full Body",
    "description": "3x per week full body workout",
    "difficultyLevel": "Beginner",
    "durationWeeks": 12,
    "programExercises": [
      {
        "id": "uuid",
        "orderIndex": 1,
        "sets": 3,
        "reps": "8-12",
        "restTimeSeconds": 90,
        "notes": "Focus on form",
        "exercise": {
          "id": "uuid",
          "name": "Bench Press",
          "targetMuscleGroup": "Chest"
        }
      }
    ],
    "assignedUser": { /* user object */ },
    "createdBy": { /* user object */ }
  }
}
```

### PUT /programs/:id
Update a program.

**Permission:** `programs.update`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Program Name",
  "description": "New description",
  "durationWeeks": 16
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Program updated successfully",
  "data": { /* updated program */ }
}
```

### DELETE /programs/:id
Delete a program (soft delete).

**Permission:** `programs.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Program deleted successfully"
}
```

---

## 📝 Program Exercises (Nested under Programs)

### POST /programs/:programId/exercises
Add exercise to a program.

**Permission:** `programExercises.create`

**Request Body:**
```json
{
  "exerciseId": "uuid",
  "orderIndex": 1,
  "sets": 3,
  "reps": "8-12",
  "restTimeSeconds": 90,
  "notes": "Focus on form"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Exercise added to program",
  "data": {
    "id": "uuid",
    "programId": "uuid",
    "exerciseId": "uuid",
    "orderIndex": 1,
    "sets": 3,
    "reps": "8-12",
    "restTimeSeconds": 90,
    "notes": "Focus on form"
  }
}
```

### GET /programs/:programId/exercises
List exercises in a program.

**Permission:** `programExercises.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "id": "uuid",
        "orderIndex": 1,
        "sets": 3,
        "reps": "8-12",
        "restTimeSeconds": 90,
        "exercise": { /* exercise details */ }
      }
    ]
  }
}
```

### PUT /programs/:programId/exercises/:id
Update a program exercise.

**Permission:** `programExercises.update`

**Request Body:** (all fields optional)
```json
{
  "sets": 4,
  "reps": "6-8",
  "restTimeSeconds": 120,
  "notes": "Increase weight"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Program exercise updated",
  "data": { /* updated program exercise */ }
}
```

### DELETE /programs/:programId/exercises/:id
Remove exercise from program.

**Permission:** `programExercises.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Exercise removed from program"
}
```

### POST /programs/:programId/exercises/reorder
Reorder exercises in a program.

**Permission:** `programExercises.update`

**Request Body:**
```json
{
  "exerciseIds": ["uuid1", "uuid2", "uuid3"] // New order
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exercises reordered successfully"
}
```

---

## 📊 Workout Logging

### POST /workout-logs/start
Start a new workout session.

**Permission:** `workoutLogs.create`

**Request Body:**
```json
{
  "programId": "uuid",
  "notes": "Feeling strong today" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workout started",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "programId": "uuid",
    "startTime": "2025-12-02T18:00:00.000Z",
    "status": "in_progress"
  }
}
```

### PUT /workout-logs/:id/end
End/finish a workout session.

**Permission:** `workoutLogs.update`

**Request Body:**
```json
{
  "notes": "Great workout!" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workout completed",
  "data": {
    "id": "uuid",
    "startTime": "2025-12-02T18:00:00.000Z",
    "endTime": "2025-12-02T19:30:00.000Z",
    "duration": 90, // minutes
    "status": "completed"
  }
}
```

### POST /workout-logs/:workoutLogId/sets
Log a set during workout.

**Permission:** `workoutLogs.update`

**Request Body:**
```json
{
  "exerciseId": "uuid",
  "setNumber": 1,
  "weightKg": 80.5,
  "repsCompleted": 10,
  "rpe": 7, // Rate of Perceived Exertion (1-10)
  "notes": "Good form" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Set logged successfully",
  "data": {
    "id": "uuid",
    "workoutLogId": "uuid",
    "exerciseId": "uuid",
    "setNumber": 1,
    "weightKg": 80.5,
    "repsCompleted": 10,
    "rpe": 7,
    "notes": "Good form"
  }
}
```

### GET /workout-logs
List workout logs with filtering.

**Permission:** `workoutLogs.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `userId` (optional): Filter by user (trainers can view students)
- `programId` (optional): Filter by program
- `status` (optional): in_progress | completed | cancelled
- `startDate`, `endDate` (optional): Date range filter

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "startTime": "2025-12-02T18:00:00.000Z",
        "endTime": "2025-12-02T19:30:00.000Z",
        "duration": 90,
        "status": "completed",
        "user": { "id": "uuid", "firstName": "John", "lastName": "Doe" },
        "program": { "id": "uuid", "name": "Beginner Full Body" }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /workout-logs/:id
Get single workout log with all sets.

**Permission:** `workoutLogs.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startTime": "2025-12-02T18:00:00.000Z",
    "endTime": "2025-12-02T19:30:00.000Z",
    "duration": 90,
    "status": "completed",
    "notes": "Great workout!",
    "user": { /* user object */ },
    "program": { /* program object */ },
    "entries": [
      {
        "id": "uuid",
        "setNumber": 1,
        "weightKg": 80.5,
        "repsCompleted": 10,
        "rpe": 7,
        "exercise": { "id": "uuid", "name": "Bench Press" }
      }
    ]
  }
}
```

### GET /workout-logs/active
Get currently active workout (in_progress).

**Permission:** `workoutLogs.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startTime": "2025-12-02T18:00:00.000Z",
    "status": "in_progress",
    "program": { /* program details */ }
  }
}
```

### GET /workout-logs/stats
Get workout statistics.

**Permission:** `workoutLogs.read`

**Query Parameters:**
- `userId` (optional): Stats for specific user

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalWorkouts": 45,
    "totalDuration": 4500, // minutes
    "averageDuration": 100, // minutes
    "thisWeek": 3,
    "thisMonth": 12,
    "totalSets": 450,
    "totalReps": 4500
  }
}
```

---

## 🔧 Equipment & QR Codes

### POST /equipment
Create new equipment.

**Permission:** `equipment.create`

**Request Body:**
```json
{
  "name": "Treadmill #1",
  "description": "Cardio machine in main area",
  "videoUrl": "https://youtube.com/watch?v=xxxxx", // Optional
  "status": "active" // active | maintenance | broken
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Equipment created successfully",
  "data": {
    "id": "uuid",
    "name": "Treadmill #1",
    "description": "Cardio machine in main area",
    "videoUrl": "https://youtube.com/watch?v=xxxxx",
    "status": "active",
    "qrCodeUuid": "uuid", // Automatically generated
    "gymId": "uuid"
  }
}
```

### GET /equipment
List all equipment with filtering.

**Permission:** `equipment.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `status`: active | maintenance | broken

**Response (200):**
```json
{
  "success": true,
  "data": {
    "equipment": [
      {
        "id": "uuid",
        "name": "Treadmill #1",
        "status": "active",
        "qrCodeUuid": "uuid"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /equipment/:id
Get single equipment details.

**Permission:** `equipment.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Treadmill #1",
    "description": "Cardio machine in main area",
    "videoUrl": "https://youtube.com/watch?v=xxxxx",
    "status": "active",
    "qrCodeUuid": "uuid",
    "gymId": "uuid",
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

### PUT /equipment/:id
Update equipment details.

**Permission:** `equipment.update`

**Request Body:** (all fields optional)
```json
{
  "name": "Treadmill #1 - Updated",
  "description": "New description",
  "status": "maintenance"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Equipment updated successfully",
  "data": { /* updated equipment */ }
}
```

### DELETE /equipment/:id
Delete equipment (soft delete).

**Permission:** `equipment.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Equipment deleted successfully"
}
```

### GET /equipment/:id/qr-code
Generate QR code image for equipment.

**Permission:** `equipment.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCodeImage": "data:image/png;base64,iVBORw0KG...", // Base64 QR code
    "qrCodeUuid": "uuid"
  }
}
```

### GET /equipment/qr/:qrCodeUuid
Get equipment by scanning QR code.

**Permission:** `equipment.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Treadmill #1",
    "description": "Cardio machine in main area",
    "videoUrl": "https://youtube.com/watch?v=xxxxx",
    "status": "active"
  }
}
```

### GET /equipment/stats
Get equipment statistics.

**Permission:** `equipment.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "active": 45,
      "maintenance": 3,
      "broken": 2
    }
  }
}
```

---

## 🛒 Product Management

### POST /product-categories
Create product category.

**Permission:** `productCategories.create`

**Request Body:**
```json
{
  "name": "Supplements",
  "description": "Protein, pre-workout, etc." // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Supplements",
    "description": "Protein, pre-workout, etc.",
    "gymId": "uuid"
  }
}
```

### GET /product-categories
List all product categories.

**Permission:** `productCategories.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Supplements",
        "description": "Protein, pre-workout, etc.",
        "productCount": 15
      }
    ]
  }
}
```

### POST /products
Create a product.

**Permission:** `products.create`

**Request Body:**
```json
{
  "categoryId": "uuid",
  "name": "Whey Protein",
  "description": "High quality whey protein powder",
  "price": 49.99,
  "stockQuantity": 100,
  "imageUrl": "https://example.com/image.jpg", // Optional
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Whey Protein",
    "description": "High quality whey protein powder",
    "price": "49.99",
    "stockQuantity": 100,
    "imageUrl": "https://example.com/image.jpg",
    "isActive": true,
    "gymId": "uuid"
  }
}
```

### GET /products
List products with filtering.

**Permission:** `products.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `categoryId`: Filter by category
- `isActive`: true | false
- `minPrice`, `maxPrice`: Price range
- `inStock`: true (only products with stock > 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Whey Protein",
        "price": "49.99",
        "stockQuantity": 100,
        "isActive": true,
        "category": { "id": "uuid", "name": "Supplements" }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /products/:id
Get single product details.

**Permission:** `products.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Whey Protein",
    "description": "High quality whey protein powder",
    "price": "49.99",
    "stockQuantity": 100,
    "imageUrl": "https://example.com/image.jpg",
    "isActive": true,
    "category": { "id": "uuid", "name": "Supplements" },
    "gymId": "uuid",
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

### PUT /products/:id
Update a product.

**Permission:** `products.update`

**Request Body:** (all fields optional)
```json
{
  "name": "Premium Whey Protein",
  "price": 59.99,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": { /* updated product */ }
}
```

### PATCH /products/:id/stock
Update product stock quantity.

**Permission:** `products.update`

**Request Body:**
```json
{
  "stockQuantity": 150
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": "uuid",
    "stockQuantity": 150
  }
}
```

### PATCH /products/:id/toggle
Toggle product active status.

**Permission:** `products.update`

**Response (200):**
```json
{
  "success": true,
  "message": "Product status toggled",
  "data": {
    "id": "uuid",
    "isActive": false
  }
}
```

### DELETE /products/:id
Delete a product (soft delete).

**Permission:** `products.delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 📦 Order System

### POST /orders
Create a new order.

**Permission:** `orders.create`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    },
    {
      "productId": "uuid",
      "quantity": 1
    }
  ],
  "notes": "Please deliver to front desk" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20251202-00001",
    "userId": "uuid",
    "status": "pending_approval",
    "totalAmount": "149.97",
    "notes": "Please deliver to front desk",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": "49.99",
        "subtotal": "99.98"
      }
    ],
    "createdAt": "2025-12-02T20:00:00.000Z"
  }
}
```

### GET /orders
List orders with filtering.

**Permission:** `orders.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: pending_approval | prepared | completed | cancelled
- `userId`: Filter by user (trainers see all, students see own)
- `search`: Search in order number
- `startDate`, `endDate`: Date range

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20251202-00001",
        "status": "pending_approval",
        "totalAmount": "149.97",
        "user": { "id": "uuid", "firstName": "John", "lastName": "Doe" },
        "createdAt": "2025-12-02T20:00:00.000Z"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /orders/:id
Get single order details.

**Permission:** `orders.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20251202-00001",
    "userId": "uuid",
    "status": "pending_approval",
    "totalAmount": "149.97",
    "notes": "Please deliver to front desk",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "items": [
      {
        "id": "uuid",
        "quantity": 2,
        "unitPrice": "49.99",
        "subtotal": "99.98",
        "product": {
          "id": "uuid",
          "name": "Whey Protein",
          "imageUrl": "https://example.com/image.jpg"
        }
      }
    ],
    "createdAt": "2025-12-02T20:00:00.000Z"
  }
}
```

### PATCH /orders/:id/status
Update order status (Trainer/Owner only).

**Permission:** `orders.update`

**Request Body:**
```json
{
  "status": "prepared" // pending_approval → prepared → completed | cancelled
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20251202-00001",
    "status": "prepared",
    "updatedAt": "2025-12-02T20:30:00.000Z"
  }
}
```

### DELETE /orders/:id
Cancel/delete an order.

**Permission:** `orders.delete`

**Rules:**
- Students can only delete their own pending orders
- Trainers/Owners can delete any order
- Cannot delete completed orders
- Stock is restored on deletion

**Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

### GET /orders/stats
Get order statistics.

**Permission:** `orders.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "pending_approval": 10,
      "prepared": 5,
      "completed": 130,
      "cancelled": 5
    },
    "totalRevenue": "14999.50",
    "avgOrderValue": "99.99"
  }
}
```

---

## 👤 User Management

### GET /users
List users with filtering.

**Permission:** `users.read`

**Query Parameters:**
- `page`, `limit`: Pagination
- `role`: Student | Trainer | GymOwner
- `search`: Search in name/email
- `gymId`: Filter by gym

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+905551234567",
        "role": { "id": "uuid", "name": "Student" },
        "gym": { "id": "uuid", "name": "Gold's Gym" }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /users/:id
Get single user details.

**Permission:** `users.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+905551234567",
    "role": { "id": "uuid", "name": "Student" },
    "gym": { "id": "uuid", "name": "Gold's Gym" },
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

### PUT /users/:id
Update user details.

**Permission:** `users.update`

**Request Body:** (all fields optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+905559876543"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user */ }
}
```

---

## 🏢 Gym Management

### GET /gyms
List all gyms.

**Permission:** `gyms.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gyms": [
      {
        "id": "uuid",
        "name": "Gold's Gym",
        "address": "123 Main St",
        "phone": "+905551234567",
        "memberCount": 150
      }
    ]
  }
}
```

### GET /gyms/:id
Get single gym details.

**Permission:** `gyms.read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Gold's Gym",
    "address": "123 Main St",
    "phone": "+905551234567",
    "email": "info@goldsgym.com",
    "website": "https://goldsgym.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 🔐 Role-Based Permissions

### Permission Structure

Each role has permissions in nested format:
```json
{
  "resource": {
    "action": true/false
  }
}
```

### Available Resources & Actions

- **users**: read, update
- **trainer_matches**: create, read, update, delete
- **exercises**: create, read, update, delete
- **programs**: create, read, update, delete
- **programExercises**: create, read, update, delete
- **workoutLogs**: create, read, update, delete
- **equipment**: create, read, update, delete
- **productCategories**: create, read, update, delete
- **products**: create, read, update, delete
- **orders**: create, read, update, delete

### Default Role Permissions

**Student:**
- workoutLogs: create, read, update, delete (own)
- programs: read (assigned)
- exercises: read
- equipment: read
- products: read
- orders: create, read, delete (own pending)

**Trainer:**
- All student permissions plus:
- trainer_matches: create, read, update, delete
- exercises: create, read, update, delete
- programs: create, read, update, delete
- programExercises: create, read, update, delete
- equipment: create, read, update, delete
- productCategories: create, read, update, delete
- products: create, read, update, delete
- orders: create, read, update, delete

**GymOwner:**
- All permissions (full access)

---

## 📊 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  }
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Pagination Format
```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## 🔑 HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation error, invalid input
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (e.g., email exists)
- **500 Internal Server Error**: Server error

---

## 🎯 Best Practices for Frontend

1. **Authentication Flow:**
   - Store token in localStorage/sessionStorage
   - Include in all requests: `Authorization: Bearer <token>`
   - Handle 401 responses (redirect to login)
   - Refresh token before expiry

2. **Error Handling:**
   - Display validation errors next to form fields
   - Show user-friendly error messages
   - Log errors to console for debugging

3. **Pagination:**
   - Default limit: 20 items per page
   - Max limit: 100 items per page
   - Always check `totalPages` for pagination UI

4. **Data Isolation:**
   - All data is automatically scoped to user's gym
   - No need to filter by gymId in frontend
   - Students see only their own data by default

5. **Real-time Updates:**
   - Refresh lists after create/update/delete
   - Optimistic UI updates recommended
   - Show loading states during operations

6. **File Uploads:**
   - Not yet implemented (coming in future phases)
   - Currently only URLs for images/videos

---

## 🧪 Testing

All endpoints tested with comprehensive integration tests:
- ✅ 54/54 tests passing (100%)
- Full coverage of CRUD operations
- Permission checks validated
- Error cases handled

Test file: `backend/test-full-system.js`

---

**Last Updated:** December 2, 2025
**API Version:** 1.0.0
**Server:** Node.js 22.13.0 + Express 4.21.1 + TypeScript 5.9.3
