# 🔧 Backend Architecture & Implementation

## 📌 Overview

Backend, **Express.js** + **TypeScript** (Hybrid) + **Prisma ORM** ile PostgreSQL database üzerine kurulmuştur.

**Tech Stack:**
- **Runtime**: Node.js 22.13.0
- **Framework**: Express.js 4.21.1
- **Language**: TypeScript 5.9.3 + JavaScript (Hybrid mode)
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL 16.10
- **Auth**: JWT (jsonwebtoken 9.0.2)
- **Validation**: express-validator
- **Password**: bcryptjs

---

## 🏗️ Project Structure

```
backend/
├── server.js                    # 🔹 Main entry point (JS)
├── package.json
├── tsconfig.json               # TypeScript config
├── .env                        # Environment variables
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js                # Seed data script
│   └── migrations/            # DB migration files
│       ├── 20251201183956_init/
│       ├── 20250904135214_add_gym_and_user_models/
│       ├── 20250904142101_add_super_admin_role/
│       ├── 20250904150529_make_gymid_nullable_for_superadmin/
│       ├── 20251211202458_add_program_visibility/
│       └── migration_lock.toml
└── src/
    ├── config/
    │   └── database.js        # 🔹 Prisma client connection (JS)
    ├── middleware/
    │   ├── auth.middleware.ts          # 🟢 JWT authentication (TS)
    │   ├── rbac.middleware.ts          # 🟢 Role-based access control (TS)
    │   ├── gymIsolation.middleware.ts  # 🟢 Multi-tenant isolation (TS)
    │   ├── errorHandler.js             # 🔹 Global error handler (JS)
    │   └── validation.middleware.js    # 🔹 Validation error handler (JS)
    ├── controllers/           # 🟢 All request handlers (TypeScript)
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── trainerMatch.controller.ts
    │   ├── exercise.controller.ts
    │   ├── program.controller.ts
    │   ├── programExercise.controller.ts
    │   ├── workoutLog.controller.ts
    │   ├── equipment.controller.ts
    │   ├── product.controller.ts
    │   └── order.controller.ts
    ├── routes/               # 🔹 API route definitions (JS)
    │   ├── index.js          # Route aggregator
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── trainerMatch.routes.ts
    │   ├── exercise.routes.ts
    │   ├── program.routes.ts
    │   ├── workoutLog.routes.ts
    │   ├── equipment.routes.ts
    │   ├── product.routes.ts
    │   └── order.routes.ts
    ├── utils/
    │   ├── jwt.ts            # 🟢 JWT helpers (TS)
    │   ├── response.js       # 🔹 Response helpers (JS)
    │   ├── errors.js         # 🔹 Custom error classes (JS)
    │   └── asyncHandler.js   # 🔹 Async wrapper (JS)
    └── types/
        └── index.ts          # 🟢 TypeScript type definitions (TS)
```

**Legend:**
- 🔹 **JavaScript** - Mevcut kod, değişmeyecek
- 🟢 **TypeScript** - Yeni kod veya dönüştürülmüş

---

## 🔐 Authentication & Authorization

### ⭐ Trainer-Specific Permissions System

**Problem:** Trainer rolü varsayılan olarak bazı izinlere sahip, ancak GymOwner bazı trainerlara **ek yetkiler** vermek isteyebilir.

**Çözüm:** User tablosunda `customPermissions` JSONB field (TODO - Phase 8)

**Örnek:**
```typescript
// Default Trainer permissions (role.permissions)
{
  "exercises": { "create": true, "read": true, "update": true },
  "programs": { "create": true, "read": true, "update": true }
}

// GymOwner bir trainera ekstra yetki verebilir (user.customPermissions)
{
  "products": { "create": true, "update": true, "delete": true },
  "orders": { "update": true }
}

// Final permissions = role.permissions + user.customPermissions (merged)
```

**Uygulama:**
- Frontend: Owner → Settings → Users → Trainer seç → Extra Permissions modal
- Backend: `rbac.middleware.ts` içinde `user.customPermissions` check eklenecek
- Database: `users` tablosuna `customPermissions JSONB` eklenecek

**Kullanım:**
```typescript
// Middleware check
const hasPermission = (
  user.role.permissions[resource]?.[action] ||
  user.customPermissions?.[resource]?.[action]
);
```

---

### JWT Implementation (`src/utils/jwt.ts`)

```typescript
// Token Yapısı
interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  gymId: string | null;
}

// Token Üretimi
generateToken(payload: JWTPayload): string
  - Expires: 7 days
  - Algorithm: HS256
  - Secret: process.env.JWT_SECRET

generateRefreshToken(payload: JWTPayload): string
  - Expires: 30 days
  - Used for token renewal

// Token Doğrulama
verifyToken(token: string): JWTPayload | null
  - Returns payload if valid
  - Returns null if expired/invalid

// Token Çıkarma
extractTokenFromHeader(authHeader: string): string | null
  - Extracts from "Bearer <token>"
```

### Auth Middleware (`src/middleware/auth.middleware.ts`)

```typescript
// 1. authenticate() - Required Auth
- Header: "Authorization: Bearer <token>"
- Verifies JWT token
- Injects req.user = { userId, email, roleId, gymId }
- Returns 401 if no token or invalid

// 2. optionalAuth() - Optional Auth
- Checks token if present
- Continues if no token
- Used for public/private hybrid endpoints
```

### Auth Controller (`src/controllers/auth.controller.ts`)

**Endpoints:**

1. **POST /api/auth/register**
   ```typescript
   Body: {
     email, password, firstName, lastName,
     phone?, gymId, roleId
   }

   Response: {
     user: { id, email, firstName, lastName, role, gym },
     token: "jwt-access-token",
     refreshToken: "jwt-refresh-token"
   }

   Logic:
   - Email uniqueness check
   - Password bcrypt hash (10 rounds)
   - Create user in DB
   - Generate JWT tokens
   ```

2. **POST /api/auth/login**
   ```typescript
   Body: { email, password }

   Response: { user, token, refreshToken }

   Logic:
   - Find user by email
   - Compare password hash
   - Check gym is_active
   - Generate tokens
   ```

3. **GET /api/auth/me** (Protected)
   ```typescript
   Headers: { Authorization: Bearer <token> }

   Response: {
     user: { id, email, firstName, lastName, role, gym }
   }

   Logic:
   - Verify JWT (middleware)
   - Fetch user with relations
   ```

4. **POST /api/auth/refresh** (Protected)
   ```typescript
   Body: { refreshToken }

   Response: { token: "new-access-token" }

   Logic:
   - Verify refresh token
   - Generate new access token
   ```

---

## 🛡️ Authorization System (RBAC)

### Permission Structure

**Format:** `resource.action`

**Examples:**
- `users.create` - Can create users
- `exercises.update` - Can update exercises
- `orders.delete` - Can delete orders

**Storage:** `roles.permissions` (JSONB)
```json
{
  "users": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "exercises": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  }
}
```

### RBAC Middleware (`src/middleware/rbac.middleware.ts`)

```typescript
// 1. requirePermission(permission: string)
Example: requirePermission('users.create')
- Checks if user's role has permission
- Returns 403 Forbidden if not allowed

// 2. requireAnyPermission(permissions: string[])
Example: requireAnyPermission(['users.read', 'users.create'])
- OR logic: needs at least ONE permission

// 3. requireAllPermissions(permissions: string[])
Example: requireAllPermissions(['users.read', 'users.update'])
- AND logic: needs ALL permissions

// 4. requireRole(roles: string[])
Example: requireRole(['GymOwner', 'SuperAdmin'])
- Simple role name check
```

### Default Role Permissions

#### Student
```typescript
✓ Can:
- View exercises, programs, equipment, products
- Create/view/cancel own orders (pending only)
- Log own workouts
- View own measurements

✗ Cannot:
- Create exercises, programs, equipment
- Manage other users
- Update order status
- Access other users' data
```

#### Trainer
```typescript
✓ All Student permissions PLUS:
- Create/update exercises (own only)
- Create/assign workout programs
- Manage trainer-student matches (own only)
- View matched students' workout logs
- Create/manage equipment
- Manage products
- Update order status

✗ Cannot:
- Manage gym settings
- Manage roles/permissions
- Access other gym's data
```

#### GymOwner
```typescript
✓ All permissions for their gym:
- Full CRUD on all resources
- User management
- Trainer-student matching
- Analytics & reports

✗ Cannot:
- Access other gym's data
- Manage system roles (SuperAdmin only)
```

#### SuperAdmin
```typescript
✓ Full system access:
- All GymOwner permissions
- Cross-gym access
- Role permission management
- System-wide analytics
```

---

## 🏢 Multi-Tenant Isolation

### Gym Isolation Middleware (`src/middleware/gymIsolation.middleware.ts`)

```typescript
// 1. enforceGymIsolation()
Purpose: Auto-filter all queries by gym_id
Usage: Apply to all routes that access gym-scoped data

Logic:
- Injects req.gymId from req.user.gymId
- SuperAdmin can bypass with req.query.gymId

// 2. verifyResourceGymOwnership(model: string, paramName: string)
Purpose: Verify resource belongs to user's gym
Example: verifyResourceGymOwnership('workoutProgram', 'id')

Logic:
- Fetch resource by ID from param
- Compare resource.gymId with req.gymId
- Return 403 if mismatch

// 3. verifySameGymUser(userIdParam: string)
Purpose: Verify target user belongs to same gym
Example: verifySameGymUser('studentId')

Logic:
- Fetch user by ID from param
- Compare user.gymId with req.gymId
- Return 403 if different gym

// 4. allowSuperAdminBypass()
Purpose: Allow SuperAdmin to access all gyms
Logic:
- Sets req.isSuperAdmin = true if role is SuperAdmin
- Used in combination with enforceGymIsolation
```

### Isolation Pattern

**Every Controller Method MUST:**

```typescript
// ❌ BAD: No gym filtering
const exercises = await prisma.exercise.findMany();

// ✅ GOOD: Gym filtered
const exercises = await prisma.exercise.findMany({
  where: {
    gymId: req.user.gymId,
    deletedAt: null
  }
});
```

---

## 📦 Database Layer (Prisma ORM)

### Schema Highlights (`prisma/schema.prisma`)

**Key Features:**
- ✅ UUID primary keys (`@default(uuid())`)
- ✅ Soft delete (`deleted_at DateTime?`)
- ✅ Audit timestamps (`created_at`, `updated_at`)
- ✅ JSONB support (`permissions Json`)
- ✅ Foreign keys with CASCADE

**Important Models:**

```prisma
model User {
  id            String   @id @default(uuid())
  gymId         String?  @map("gym_id") @db.Uuid
  roleId        String   @map("role_id") @db.Uuid
  email         String   @unique
  passwordHash  String   @map("password_hash")
  firstName     String   @map("first_name")
  lastName      String   @map("last_name")

  gym           Gym?     @relation("GymUsers", fields: [gymId])
  role          Role     @relation("UserRole", fields: [roleId])

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  @@map("users")
}

model Role {
  id          String @id @default(uuid())
  name        String
  permissions Json   // 🔑 JSONB for flexible RBAC

  @@map("roles")
}

model WorkoutProgram {
  id             String  @id @default(uuid())
  gymId          String  @map("gym_id") @db.Uuid
  creatorId      String  @map("creator_id") @db.Uuid
  assignedUserId String? @map("assigned_user_id") @db.Uuid
  isPublic       Boolean @default(false) @map("is_public")

  gym            Gym     @relation(fields: [gymId])
  creator        User    @relation("ProgramCreator", fields: [creatorId])
  assignedUser   User?   @relation("AssignedPrograms", fields: [assignedUserId])

  @@map("workout_programs")
}
```

### Prisma Client Setup (`src/config/database.js`)

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty'
});

module.exports = { prisma };
```

### Migration Commands

```bash
# Create migration
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio (DB GUI)
npx prisma studio
```

---

## 🔄 Response Standardization

### Response Helpers (`src/utils/response.js`)

```javascript
// Success Response
successResponse(res, data, message, statusCode)
→ { success: true, message, data }

// Error Response
errorResponse(res, message, statusCode, errors)
→ { success: false, message, errors }

// Paginated Response
paginatedResponse(res, data, pagination)
→ {
    success: true,
    data: { items: [...], pagination: {...} }
  }

// Pagination Structure
{
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

### Error Handling

**Custom Errors (`src/utils/errors.js`):**

```javascript
class ValidationError extends Error {
  statusCode = 400
}

class NotFoundError extends Error {
  statusCode = 404
}

class UnauthorizedError extends Error {
  statusCode = 401
}

class ForbiddenError extends Error {
  statusCode = 403
}
```

**Global Error Handler (`src/middleware/errorHandler.js`):**

```javascript
Handles:
- ✅ Prisma errors (unique constraint, foreign key, etc.)
- ✅ JWT errors (expired, invalid)
- ✅ Validation errors (express-validator)
- ✅ Custom errors (ValidationError, NotFoundError, etc.)
- ✅ Generic 500 errors

Response Format:
{
  success: false,
  message: "Error message",
  errors: [{ field, message }] // For validation
}
```

---

## 🛠️ Utility Functions

### Async Handler (`src/utils/asyncHandler.js`)

```javascript
// Wraps async functions to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get('/users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  successResponse(res, users);
}));
```

---

## 🔌 API Routes Structure

### Route Aggregator (`src/routes/index.js`)

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trainer-matches', trainerMatchRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/orders', orderRoutes);
```

### Route Pattern Example

```typescript
// src/routes/exercise.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import * as controller from '../controllers/exercise.controller';

const router = Router();

// List exercises (public/authenticated)
router.get(
  '/',
  authenticate,
  controller.getExercises
);

// Create exercise
router.post(
  '/',
  authenticate,
  requirePermission('exercises.create'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('targetMuscleGroup').notEmpty()
  ],
  handleValidationErrors,
  controller.createExercise
);

// Update exercise
router.put(
  '/:id',
  authenticate,
  requirePermission('exercises.update'),
  [param('id').isUUID()],
  handleValidationErrors,
  controller.updateExercise
);

export default router;
```

---

## 📊 Controller Pattern

### Standard Controller Structure

```typescript
// src/controllers/exercise.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Get exercises with filtering
 * GET /api/exercises?page=1&limit=20&search=bench
 */
export const getExercises = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    // Build WHERE clause
    const where: any = {
      gymId,
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Execute query
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exercise.count({ where })
    ]);

    return successResponse(res, {
      items: exercises,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get exercises error:', error);
    return errorResponse(res, 'Failed to fetch exercises', 500);
  }
};

/**
 * Create new exercise
 * POST /api/exercises
 */
export const createExercise = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { name, description, targetMuscleGroup } = req.body;

    const exercise = await prisma.exercise.create({
      data: {
        gymId,
        createdBy: userId,
        name,
        description,
        targetMuscleGroup
      }
    });

    return successResponse(res, exercise, 'Exercise created', 201);
  } catch (error: any) {
    console.error('Create exercise error:', error);
    return errorResponse(res, 'Failed to create exercise', 500);
  }
};
```

---

## 🧪 Testing

### Test File: `test-full-system.js`

**Coverage:**
- ✅ 54/54 tests passing (100%)
- All CRUD operations
- Permission checks
- Gym isolation verification
- Error cases
- Edge cases

### Running Tests

```bash
# Run all tests
node test-full-system.js

# Test specific module
node test-auth.js
```

---

## 🚀 Server Startup

### Main Server (`server.js`)

```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', require('./src/routes'));

// Error Handler
app.use(require('./src/middleware/errorHandler'));

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### npm Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only server.js",
    "start": "node server.js",
    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio",
    "db:seed": "node prisma/seed.js"
  }
}
```

---

## 📝 Environment Variables

### `.env` File

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gymapp"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=development

# CORS
ALLOWED_ORIGINS="http://localhost:3002,http://localhost:3000"
```

---

## 🔄 Data Flow Example

### Create Workout Program Flow

```
1. Client Request
   POST /api/programs
   Headers: { Authorization: Bearer <token> }
   Body: { name, description, difficultyLevel, isPublic }

2. Middleware Chain
   ↓ authenticate() → Verify JWT, inject req.user
   ↓ requirePermission('programs.create') → Check RBAC
   ↓ handleValidationErrors() → Validate request body

3. Controller
   ↓ Extract gymId, userId from req.user
   ↓ Create program in DB with Prisma
   ↓ Return successResponse with created program

4. Response
   200 OK
   { success: true, message: "Program created", data: {...} }
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Problem:** Frontend can't connect to backend

**Solution:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

### Issue 2: JWT Token Expired
**Problem:** 401 Unauthorized after 7 days

**Solution:**
```typescript
// Use refresh token endpoint
POST /api/auth/refresh
Body: { refreshToken }
```

### Issue 3: Gym Isolation Not Working
**Problem:** Users seeing other gym's data

**Solution:**
```typescript
// ALWAYS filter by gymId
const where = {
  gymId: req.user.gymId,
  deletedAt: null
};
```

---

## 📚 Best Practices

1. **Always use gym isolation** - Every query MUST filter by gymId
2. **Use UUID for IDs** - Never use auto-increment
3. **Soft delete** - Set deletedAt, don't hard delete
4. **Permission check** - Use RBAC middleware on protected routes
5. **Validate input** - Use express-validator
6. **Type safety** - Write new code in TypeScript
7. **Error handling** - Use try-catch and global error handler
8. **Response format** - Use successResponse/errorResponse helpers
9. **Pagination** - Always paginate list endpoints
10. **Migrations** - Use Prisma migrate, never manual SQL

---

**Last Updated:** 12 Aralık 2025
**Status:** ✅ Production Ready (API layer complete)
