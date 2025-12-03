# Gym Management System - Backend API

Multi-tenant SaaS platform for gym management with comprehensive training, user management, and marketplace features.

## 📋 Table of Contents
- [Project Structure](#-project-structure)
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security & Authentication](#-security--authentication)
- [Development Guide](#-development-guide)

---

## 🏗️ Project Structure

```
backend/
├── server.js                    # Application entry point
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── seed.js                 # Database seeding script
│   └── migrations/             # Database migration history
├── src/
│   ├── config/
│   │   └── database.js         # Prisma client & connection
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT authentication
│   │   ├── rbac.middleware.ts         # Role-based access control
│   │   ├── gymIsolation.middleware.ts # Multi-tenant data isolation
│   │   ├── validation.middleware.ts   # Express-validator wrapper
│   │   ├── upload.middleware.ts       # Multer file upload config
│   │   └── errorHandler.js            # Global error handler
│   ├── controllers/
│   │   ├── auth.controller.ts         # Authentication logic
│   │   ├── user.controller.ts         # User CRUD operations
│   │   ├── gym.controller.ts          # Gym management
│   │   ├── role.controller.ts         # Role & permissions
│   │   ├── trainerMatch.controller.ts # Trainer-student matching
│   │   ├── avatar.controller.ts       # User avatar upload
│   │   └── gymLogo.controller.ts      # Gym logo upload
│   ├── routes/
│   │   ├── index.js                   # Route aggregator
│   │   ├── auth.routes.ts             # /api/auth
│   │   ├── user.routes.ts             # /api/users
│   │   ├── gym.routes.ts              # /api/gyms
│   │   ├── role.routes.ts             # /api/roles
│   │   └── trainerMatch.routes.ts     # /api/trainer-matches
│   ├── utils/
│   │   ├── response.js         # Standard API response helpers
│   │   ├── errors.js           # Custom error classes
│   │   ├── jwt.ts              # JWT token utilities
│   │   └── asyncHandler.js     # Async error wrapper
│   └── types/
│       └── index.ts            # TypeScript type definitions
└── uploads/                     # User-generated content
    ├── avatars/                # User profile pictures
    └── gym-logos/              # Gym branding assets
```

---

## 🎯 Architecture Overview

### Design Principles

1. **Multi-Tenancy by Design**
   - Every table includes `gym_id` for data isolation
   - Middleware enforces tenant-scoping on all queries
   - No cross-gym data leakage possible

2. **Hybrid TypeScript + JavaScript**
   - Controllers, routes, middleware: TypeScript (`.ts`)
   - Utilities, config, error handling: JavaScript (`.js`)
   - Gradual migration path without breaking changes

3. **Layered Architecture**
   ```
   Routes → Middleware → Controllers → Prisma ORM → PostgreSQL
   ```

4. **Role-Based Access Control (RBAC)**
   - JSONB permissions structure: `{ "resource": { "action": true } }`
   - Granular control: `users.create`, `roles.delete`, etc.
   - 5 default role templates: GymOwner, Trainer, Student, Receptionist, Assistant Trainer

---

## 🚀 Key Features

### ✅ Implemented (Faz 1-3.1)

#### Authentication & Authorization (Faz 2.1)
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (10 salt rounds)
- Token expiry: 7 days (access), 30 days (refresh)
- Protected routes with `authenticate` middleware

#### User Management (Faz 2.2)
- CRUD operations with pagination & search
- Avatar upload (max 5MB, jpg/png/gif)
- Body measurements tracking (weight, height, body fat, muscle mass)
- Password change with current password verification
- Role-based filtering

#### Gym Management (Faz 2.3)
- Multi-gym support with unique slugs
- Logo upload (max 5MB)
- Gym statistics (user count, exercise count, equipment count, products)
- Activation/deactivation controls
- Permission-based access

#### Role Management (Faz 2.4)
- Dynamic role creation with JSONB permissions
- 5 pre-defined role templates
- System role protection (cannot delete GymOwner, Trainer, Student)
- Custom role support for specific gym needs

#### Trainer-Student Matching (Faz 3.1) ⭐ NEW
- Create matches between trainers and students
- Status management (active, pending, ended)
- Duplicate prevention via unique constraint
- Role validation (prevents non-trainer/student matches)
- Bidirectional queries:
  - Get all students for a trainer
  - Get active trainer for a student
- Soft delete preserves history

### 🔜 Planned Features

#### Faz 3.2 - Exercise Library
- Exercise CRUD with video URLs
- Muscle group & equipment associations
- Gym-scoped exercise management

#### Faz 3.3 - Workout Programs
- Program templates with difficulty levels
- Assignment to specific students
- Program cloning & versioning

#### Faz 3.4 - Program Exercises
- Exercise ordering within programs
- Sets, reps, rest time configuration
- Exercise-specific notes

#### Faz 3.5 - Workout Logging
- Start/end workout sessions
- Log sets with weight, reps, RPE
- Progress tracking & history

#### Faz 4 - Equipment & QR System
- QR code generation for equipment
- Link equipment to exercise videos
- Equipment status tracking

#### Faz 5 - Marketplace
- Product catalog with categories
- Pre-order system (no payment gateway)
- Stock management
- Order approval workflow

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22.13.0+
- PostgreSQL 16.10+ (Docker recommended)
- npm 10.9.2+

### Installation

1. **Clone & Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Required `.env` variables:
   ```env
   DATABASE_URL="postgresql://gymuser:gympassword@localhost:5432/gymapp"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL (Docker)
   docker-compose up -d

   # Run migrations
   npm run prisma:migrate

   # Seed initial data
   npm run prisma:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:3000`

### Test Users (After Seeding)
```
GymOwner:
  Email: owner@testgym.com
  Password: password123

Trainer:
  Email: trainer@testgym.com
  Password: password123

Student:
  Email: student@testgym.com
  Password: password123
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Authentication Endpoints

#### `POST /api/auth/register`
Create new user account.

**Request:**
```json
{
  "email": "newuser@gym.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+905551234567",
  "roleId": "uuid-of-role",
  "gymId": "uuid-of-gym"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### `POST /api/auth/login`
Authenticate user.

**Request:**
```json
{
  "email": "user@gym.com",
  "password": "password123"
}
```

**Response:** `200 OK`

#### `POST /api/auth/refresh`
Refresh access token.

**Headers:**
```
Authorization: Bearer <refresh-token>
```

**Response:** `200 OK` (new access token)

#### `GET /api/auth/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

---

### User Endpoints

#### `GET /api/users`
List all users (paginated).

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` (searches name/email)
- `roleId` (filter by role)

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@gym.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "name": "Student" }
    }
  ],
  "pagination": { ... }
}
```

#### `GET /api/users/:id`
Get user by ID.

#### `PUT /api/users/:id`
Update user profile.

**Request:**
```json
{
  "firstName": "Updated",
  "phone": "+905559876543",
  "birthDate": "1990-01-15",
  "gender": "Male"
}
```

#### `DELETE /api/users/:id`
Soft delete user.

#### `POST /api/users/:id/avatar`
Upload user avatar.

**Content-Type:** `multipart/form-data`
**Field:** `avatar` (max 5MB, jpg/png/gif)

#### `POST /api/users/:id/measurements`
Add body measurement.

**Request:**
```json
{
  "weight": 75.5,
  "height": 180,
  "bodyFatPercentage": 15.2,
  "muscleMass": 35.8
}
```

#### `GET /api/users/:id/measurements`
Get measurement history.

#### `PUT /api/users/:id/password`
Change password.

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

### Gym Endpoints

#### `GET /api/gyms`
List all gyms.

**Permissions:** `gyms.read`

#### `GET /api/gyms/:id`
Get gym details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Test Gym",
    "slug": "test-gym",
    "isActive": true,
    "_count": {
      "users": 7,
      "exercises": 4,
      "equipments": 2,
      "products": 4
    }
  }
}
```

#### `GET /api/gyms/:id/stats`
Get gym statistics.

#### `PUT /api/gyms/:id`
Update gym details.

**Request:**
```json
{
  "name": "Updated Gym Name",
  "slug": "updated-gym-slug",
  "address": "New Address",
  "contactPhone": "+905551234567"
}
```

#### `POST /api/gyms/:id/logo`
Upload gym logo.

**Content-Type:** `multipart/form-data`
**Field:** `logo` (max 5MB, jpg/png/gif)

#### `PATCH /api/gyms/:id/toggle-active`
Activate/deactivate gym.

---

### Role Endpoints

#### `GET /api/roles`
List all roles for current gym.

**Permissions:** `roles.read`

#### `GET /api/roles/templates`
Get available role templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "GymOwner",
      "description": "Full access to all features",
      "permissions": { ... }
    },
    {
      "name": "Trainer",
      "description": "Manage students and programs",
      "permissions": { ... }
    }
  ]
}
```

#### `POST /api/roles/from-template`
Create role from template.

**Request:**
```json
{
  "templateName": "Trainer"
}
```

#### `POST /api/roles`
Create custom role.

**Request:**
```json
{
  "name": "Front Desk Staff",
  "description": "Reception duties",
  "permissions": {
    "users": { "read": true, "create": true },
    "orders": { "read": true, "update": true }
  }
}
```

#### `PUT /api/roles/:id`
Update role.

#### `DELETE /api/roles/:id`
Delete role (system roles protected).

---

### Trainer-Student Match Endpoints

#### `POST /api/trainer-matches`
Create trainer-student match.

**Permissions:** `trainers.create`

**Request:**
```json
{
  "trainerId": "uuid-of-trainer",
  "studentId": "uuid-of-student"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Trainer-student match created successfully",
  "data": {
    "id": "uuid",
    "trainerId": "...",
    "studentId": "...",
    "status": "active",
    "trainer": { ... },
    "student": { ... }
  }
}
```

**Validations:**
- Trainer must have "Trainer" role
- Student must have "Student" role
- No duplicate matches (unique constraint)
- Both users must be in same gym

#### `GET /api/trainer-matches`
List all matches (paginated).

**Query Params:**
- `page`, `limit` (pagination)
- `status` (active/pending/ended)
- `trainerId` (filter by trainer)
- `studentId` (filter by student)

**Permissions:** `trainers.read`

#### `GET /api/trainer-matches/:id`
Get match details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "trainer": {
      "id": "...",
      "firstName": "Mike",
      "lastName": "Trainer",
      "role": { "name": "Trainer" }
    },
    "student": {
      "id": "...",
      "firstName": "Alice",
      "lastName": "Student",
      "role": { "name": "Student" }
    }
  }
}
```

#### `PATCH /api/trainer-matches/:id/status`
Update match status.

**Request:**
```json
{
  "status": "pending"
}
```

**Allowed values:** `active`, `pending`, `ended`

#### `DELETE /api/trainer-matches/:id`
End match (soft delete).

#### `GET /api/trainer-matches/trainer/:trainerId/students`
Get all students for a trainer.

**Query Params:**
- `status` (optional filter)

**Response:**
```json
{
  "success": true,
  "data": {
    "trainerId": "uuid",
    "status": "active",
    "totalStudents": 5,
    "students": [
      {
        "matchId": "...",
        "matchStatus": "active",
        "id": "...",
        "firstName": "Alice",
        "lastName": "Student",
        "email": "alice@gym.com"
      }
    ]
  }
}
```

#### `GET /api/trainer-matches/student/:studentId/trainer`
Get trainer for a student.

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "hasTrainer": true,
    "matchId": "...",
    "trainer": {
      "id": "...",
      "firstName": "Mike",
      "lastName": "Trainer"
    }
  }
}
```

Returns `hasTrainer: false` if no active match exists.

---

## 🗄️ Database Schema

### Key Tables

#### `gyms` (Tenant Table)
```sql
id            UUID PRIMARY KEY
name          VARCHAR NOT NULL
slug          VARCHAR UNIQUE NOT NULL
address       TEXT
contact_phone VARCHAR
logo_url      VARCHAR
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ
deleted_at    TIMESTAMPTZ
```

#### `roles`
```sql
id          UUID PRIMARY KEY
gym_id      UUID → gyms.id
name        VARCHAR NOT NULL
description TEXT
permissions JSONB NOT NULL
is_system   BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ
```

**Permissions Structure:**
```json
{
  "users": { "read": true, "create": true, "update": true, "delete": false },
  "roles": { "read": true },
  "trainers": { "read": true, "create": true }
}
```

#### `users`
```sql
id            UUID PRIMARY KEY
gym_id        UUID → gyms.id
role_id       UUID → roles.id
email         VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
first_name    VARCHAR NOT NULL
last_name     VARCHAR NOT NULL
phone         VARCHAR
avatar_url    VARCHAR
birth_date    DATE
gender        VARCHAR
created_at    TIMESTAMPTZ
```

#### `user_measurements`
```sql
id                   UUID PRIMARY KEY
user_id              UUID → users.id
weight               FLOAT
height               FLOAT
body_fat_percentage  FLOAT
muscle_mass          FLOAT
measured_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `trainer_matches`
```sql
id         UUID PRIMARY KEY
gym_id     UUID → gyms.id
trainer_id UUID → users.id
student_id UUID → users.id
status     ENUM ('active', 'pending', 'ended')
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ

UNIQUE (trainer_id, student_id) WHERE deleted_at IS NULL
```

---

## 🔒 Security & Authentication

### JWT Token Structure
```javascript
{
  userId: "uuid",
  email: "user@gym.com",
  gymId: "gym-uuid",
  roleId: "role-uuid",
  iat: 1234567890,
  exp: 1234567890
}
```

### Middleware Chain
```
Request → authenticate → requirePermission → controller
```

1. **authenticate**: Verifies JWT token, attaches `req.user`
2. **requirePermission**: Checks if user has required permission
3. **controller**: Business logic execution

### Multi-Tenant Isolation
All queries automatically filtered by `gym_id`:
```javascript
// Automatic in all controllers
const users = await prisma.user.findMany({
  where: {
    gymId: req.user.gymId,  // From JWT token
    // ... other filters
  }
});
```

### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum 6 characters (enforced by validation)
- Password never returned in API responses

### File Upload Security
- Max file size: 5MB
- Allowed types: jpg, jpeg, png, gif
- Unique filenames: `<timestamp>-<random>.<ext>`
- Stored in `uploads/avatars/` or `uploads/gym-logos/`

---

## 🛠️ Development Guide

### Running Tests

Test scripts are in `backend/` root:

```bash
# Test authentication
node test-auth.js

# Test user management
node test-user-management.js

# Test gym management
node test-gym-management.js

# Test role management
node test-role-management.js

# Test trainer matching (NEW)
node test-trainer-matching.js
```

### Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### TypeScript Compilation

The project uses `ts-node-dev` for hot-reloading:
```bash
npm run dev  # TypeScript files compiled on-the-fly
```

For production build:
```bash
npm run build  # Compiles to /dist
npm start      # Runs compiled JS
```

### Adding New Endpoints

1. **Create Controller** (`src/controllers/newFeature.controller.ts`)
   ```typescript
   import { Request, Response } from 'express';
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   export const getItems = async (req: Request, res: Response) => {
     const { gymId } = req.user;
     const items = await prisma.item.findMany({
       where: { gymId }
     });
     res.json({ success: true, data: items });
   };
   ```

2. **Create Routes** (`src/routes/newFeature.routes.ts`)
   ```typescript
   import express from 'express';
   import { authenticate } from '../middleware/auth.middleware';
   import { requirePermission } from '../middleware/rbac.middleware';
   import { getItems } from '../controllers/newFeature.controller';

   const router = express.Router();

   router.get('/',
     authenticate,
     requirePermission('items.read'),
     getItems
   );

   export default router;
   ```

3. **Mount Routes** (`src/routes/index.js`)
   ```javascript
   const newFeatureRoutes = require('./newFeature.routes').default;
   router.use('/items', newFeatureRoutes);
   ```

### Code Style Guidelines

- **Controllers**: TypeScript, named exports
- **Routes**: TypeScript, default export
- **Middleware**: TypeScript for auth/rbac, JS for utilities
- **Always** include `gymId` filtering in queries
- **Always** use `successResponse`/`errorResponse` utilities
- **Always** add input validation with express-validator

---

## 📊 Current Status

### Completed Phases
- ✅ **Faz 1**: Infrastructure (Docker, PostgreSQL, Express, Prisma)
- ✅ **Faz 2.1**: Authentication & Authorization (8/8 tests)
- ✅ **Faz 2.2**: User Management (8/8 tests)
- ✅ **Faz 2.3**: Gym Management (9/9 tests)
- ✅ **Faz 2.4**: Role Management (core features working)
- ✅ **Faz 3.1**: Trainer-Student Matching (14/14 tests) ⭐

### Test Coverage
- **Total Tests**: 47
- **Passing**: 47/47 ✅
- **Latest Test Results**: All Faz 3.1 tests passing

### Next Steps
- 🔜 **Faz 3.2**: Exercise Library
- 🔜 **Faz 3.3**: Workout Programs
- 🔜 **Faz 3.4**: Program Exercises
- 🔜 **Faz 3.5**: Workout Logging

---

## 🐛 Troubleshooting

### "Route not found" errors
- Check if TypeScript files are compiled
- Verify routes are mounted in `src/routes/index.js`
- Restart server with `pkill -9 node && npm run dev`

### "Permission denied" errors
- Check user role has required permission
- Verify JSONB permissions structure in database
- Use Prisma Studio to inspect role permissions

### Database connection issues
- Ensure Docker container is running: `docker ps`
- Check `.env` DATABASE_URL is correct
- Test connection: `npm run prisma:studio`

### TypeScript errors
- Regenerate Prisma client: `npm run prisma:generate`
- Install missing types: `npm install --save-dev @types/package-name`
- Clear build cache: `rm -rf node_modules/.cache`

---

## 📝 License
MIT

## 👥 Contributors
- Backend API development
- Database schema design
- Multi-tenant architecture implementation
