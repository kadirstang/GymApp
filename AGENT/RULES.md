# 📜 GymOS - Development Rules & Standards

**Last Updated:** 14 Aralık 2025
**Purpose:** Comprehensive code standards, conventions, and best practices

---

## 📋 İçindekiler

1. [Architecture Principles](#architecture-principles)
2. [Code Standards](#code-standards)
3. [Naming Conventions](#naming-conventions)
4. [Database Rules](#database-rules)
5. [API Design](#api-design)
6. [Frontend Standards](#frontend-standards)
7. [Git Workflow](#git-workflow)
8. [Security Best Practices](#security-best-practices)
9. [Testing Guidelines](#testing-guidelines)
10. [Performance Best Practices](#performance-best-practices)

---

## 🏗️ Architecture Principles

### 1. Multi-Tenant Isolation
**⚠️ CRITICAL:** Every database query MUST include `gymId` filtering

**Bad:**
```typescript
// ❌ WRONG - Returns all gyms' users
const users = await prisma.user.findMany({
  where: { roleId: trainerId }
});
```

**Good:**
```typescript
// ✅ CORRECT - Only current gym's users
const users = await prisma.user.findMany({
  where: {
    roleId: trainerId,
    gymId: req.user.gymId,
    deletedAt: null
  }
});
```

**Controller Pattern:**
```typescript
// Always destructure gymId from req.user
export const getUsers = async (req: Request, res: Response) => {
  const gymId = req.user.gymId; // Extract once

  const users = await prisma.user.findMany({
    where: {
      gymId, // MUST HAVE
      deletedAt: null,
    }
  });
};
```

**Middleware:** Use `authenticate` on all protected routes

```typescript
// routes/user.routes.ts
router.get('/users', authenticate, userController.listUsers);
```

---

### 2. Soft Delete Pattern
**Rule:** NEVER use Prisma's `.delete()` - ALWAYS use soft delete

**Bad:**
```typescript
// ❌ WRONG - Permanently deletes
await prisma.user.delete({ where: { id } });
```

**Good:**
```typescript
// ✅ CORRECT - Soft delete
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

**Query Pattern:** ALWAYS filter out deleted records

```typescript
where: {
  deletedAt: null,  // Always include this
  // ... other conditions
}
```

**Why Soft Delete?**
- Audit trail: Track historical data
- Recovery: Restore accidentally deleted records
- Compliance: Required for GDPR, data retention policies
- Referential integrity: Avoid breaking foreign key relationships

---

### 3. UUID Primary Keys
**Rule:** All IDs are UUIDs, not auto-increment integers

**Database:**
```prisma
model User {
  id String @id @default(uuid()) @db.Uuid  // ✅ UUID
  // NOT: id Int @id @default(autoincrement())  ❌
}
```

**Frontend:**
```typescript
// ✅ CORRECT
interface User {
  id: string;  // UUID string
}

// ❌ WRONG
interface User {
  id: number;  // Auto-increment integer
}
```

**Why UUIDs?**
- Security: No sequential IDs (prevents enumeration attacks)
- Distributed systems: Can generate offline without DB
- Multi-tenant: No ID conflicts between gyms

---

## 🎨 Code Standards

### Backend Structure
```
backend/
├── server.js              # App entry point
├── middleware/
│   └── auth.js           # JWT auth, RBAC
├── prisma/
│   └── schema.prisma     # Database schema
└── __tests__/
    └── api.test.js       # API tests
```

### Controller Pattern
```typescript
// ✅ GOOD: Proper structure
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const gymId = req.user.gymId; // Always extract

    const users = await prisma.user.findMany({
      where: {
        gymId, // MUST HAVE
        roleId: role ? { equals: role } : undefined,
        deletedAt: null, // MUST HAVE
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({
      where: {
        gymId,
        roleId: role ? { equals: role } : undefined,
        deletedAt: null,
      }
    });

    res.json({
      success: true,
      data: {
        items: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ❌ BAD: No gymId filter, no soft delete check, no pagination
export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany(); // WRONG!
  res.json(users);
};
```

### Error Handling
```typescript
// ✅ GOOD: Proper error handling
try {
  // ... business logic
} catch (error) {
  console.error('Operation failed:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({
    success: false,
    message,
  });
}

// ❌ BAD: Generic error handling
catch (error) {
  res.status(500).json({ error }); // Exposes stack traces!
}
```

---

### Frontend Structure
```
frontend-admin/src/
├── app/                    # Next.js pages (App Router)
│   ├── login/
│   ├── dashboard/
│   ├── my-students/
│   ├── programs/
│   └── settings/
├── components/
│   ├── ProtectedRoute.tsx  # Auth wrapper
│   └── DashboardLayout.tsx # Layout
├── contexts/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── lib/
│   └── api-client.ts       # Typed API client
└── types/
    └── api.ts              # TypeScript types
```

### Component Pattern
```tsx
// ✅ GOOD: Well-structured component
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers({ page: 1, limit: 20 });
      setUsers(response.data?.items || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load';
      toast?.showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>{/* Component content */}</div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

### API Client Usage
```typescript
// ✅ CORRECT: Use typed methods
const response = await apiClient.getUsers({ page: 1, limit: 20 });
const user = await apiClient.getUserById(userId);
await apiClient.createProduct(data);
await apiClient.updateProgram(id, data);

// ❌ WRONG: Generic HTTP methods don't exist
const response = await apiClient.get('/users'); // Error!
await apiClient.post('/products', data); // Error!
```

### Toast Usage
```typescript
// ✅ CORRECT: Type first, message second
toast?.showToast('success', 'Operation completed');
toast?.showToast('error', 'Failed to save');
toast?.showToast('info', 'Processing...');

// ❌ WRONG: Message first
toast?.showToast('Operation completed', 'success'); // Type error!
```

---

## 🔐 Security Best Practices

### 1. Authentication
```typescript
// ✅ GOOD: Always verify JWT
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;

// ❌ BAD: Trust client data
req.user = JSON.parse(req.headers['x-user']); // NEVER!
```

### 2. Authorization (RBAC)
```typescript
// ✅ GOOD: Check permissions
const userPermissions = req.user.role.permissions;
if (!userPermissions.users?.create) {
  return res.status(403).json({
    success: false,
    message: 'Bu işlem için yetkiniz yok'
  });
}

// ❌ BAD: Role-based only (inflexible)
if (req.user.role.name !== 'Owner') {
  return res.status(403).json({ message: 'Forbidden' });
}
```

**Permission Format:** `resource.action`
- Examples: `exercises.create`, `programs.update`, `users.delete`

**Middleware Usage:**
```typescript
// Option 1: Check specific permission
router.post('/exercises',
  authenticate,
  requirePermission('exercises.create'),  // ✅
  createExercise
);

// Option 2: Check role
router.get('/users',
  authenticate,
  requireRole(['GymOwner', 'Trainer']),  // ✅
  listUsers
);
```

**Ownership Check (Trainer):**
- Trainers can only edit **own** exercises/programs
- Implement in controller:

```typescript
// Example: Update exercise
const exercise = await prisma.exercise.findFirst({
  where: {
    id,
    gymId: req.user.gymId,
    deleted_at: null
  }
});

if (!exercise) {
  return res.status(404).json({ success: false, message: 'Exercise not found' });
}

// Check ownership if user is Trainer
if (req.user.role.name === 'Trainer' && exercise.createdBy !== req.user.userId) {
  return res.status(403).json({
    success: false,
    message: 'You can only edit your own exercises'
  });
}

// Proceed with update...
```

---

### 3. Input Validation
```typescript
// ✅ GOOD: Sanitize & validate
const email = req.body.email.trim().toLowerCase();
if (!email || !email.includes('@')) {
  return res.status(400).json({
    success: false,
    message: 'Geçerli bir email adresi girin'
  });
}

// ❌ BAD: Trust raw input
const user = await prisma.user.create({ data: req.body }); // SQL injection risk!
```

### 4. Password Handling
```typescript
// ✅ GOOD: Hash with bcrypt
import bcrypt from 'bcryptjs';

// Registration
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
  }
});

// Login validation
const isValid = await bcrypt.compare(password, user.password);

// ❌ BAD: Store plain text
data: { password: req.body.password } // NEVER!
```

### 5. Environment Variables
```typescript
// ✅ GOOD: Use env vars
const secret = process.env.JWT_SECRET;
const dbUrl = process.env.DATABASE_URL;

// ❌ BAD: Hardcode secrets
const secret = 'my-secret-key-123'; // NEVER!
```

### 6. CORS Configuration
```typescript
// ✅ GOOD: Specific origin (production)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// ✅ OK: Development only
app.use(cors({ origin: '*' })); // Only for local development!
```

---

## 🏷️ Naming Conventions

### Database (Prisma Schema)

#### Table Names
- **PascalCase** for models
- Singular form (User, not Users)

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  firstName String   @map("first_name")
  createdAt DateTime @default(now()) @map("created_at")
}
```

#### Field Names
- **camelCase** in Prisma models
- **snake_case** in database (use @map)

```prisma
// ✅ GOOD
model WorkoutProgram {
  difficultyLevel String  @map("difficulty_level")
  assignedUserId  String? @map("assigned_user_id")
}

// ❌ BAD
model workout_program {  // Wrong: should be PascalCase
  difficulty_level String // Wrong: should use camelCase + @map
}
```

### Backend API

#### Route Names
- **kebab-case**, plural nouns
- `/api/users`, `/api/workout-programs`, `/api/trainer-matches`

#### Endpoint Patterns
```
GET    /api/users              # List all
GET    /api/users/:id          # Get one
POST   /api/users              # Create
PUT    /api/users/:id          # Update (full replace)
PATCH  /api/users/:id          # Update (partial)
DELETE /api/users/:id          # Delete (soft delete)
```

#### Function Names
```typescript
// Controllers: action + Resource
getUserById
createUser
updateUser
deleteUser
getTrainerStudents

// Middleware: descriptive verb
authenticate
requirePermission
validateRequest

// Utils: verb + Object
hashPassword
generateToken
formatDate
```

### Frontend

#### Component Files
- **PascalCase** for components: `UserList.tsx`, `DashboardLayout.tsx`
- **camelCase** for utilities: `api-client.ts`, `auth-utils.ts`
- **kebab-case** for pages: `my-students/page.tsx`

#### Component Names
```tsx
// ✅ GOOD
export default function UserListPage() {}
function UserCard({ user }: Props) {}
const DashboardLayout = ({ children }) => {};

// ❌ BAD
export default function usersPage() {}  // Wrong case
function user_card() {}                 // Wrong case
```

#### Hook Names
- Always start with `use`: `useAuth`, `useToast`, `useFetch`

#### State Variables
```typescript
// ✅ GOOD: Descriptive pairs
const [users, setUsers] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);

// ❌ BAD: Unclear names
const [data, setData] = useState([]);
const [flag, setFlag] = useState(false);
```

---

## 💾 Database Rules

### 1. Always Use Soft Delete
```prisma
model User {
  deletedAt DateTime? @map("deleted_at")
}
```
```typescript
// Delete
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// Query
where: { deletedAt: null }
```

### 2. Multi-Tenant Isolation
```typescript
// ✅ ALWAYS include gymId in queries
where: {
  gymId: req.user.gymId,
  deletedAt: null,
}

// ✅ ALWAYS include gymId in creates
data: {
  ...input,
  gymId: req.user.gymId,
}
```

### 3. UUID Primary Keys
```prisma
id String @id @default(uuid()) @db.Uuid
```

### 4. Timestamps (Required)
```prisma
createdAt DateTime  @default(now()) @map("created_at")
updatedAt DateTime  @updatedAt @map("updated_at")
deletedAt DateTime? @map("deleted_at")
```

### 5. Foreign Keys with Cascade
```prisma
// ✅ GOOD: Proper relations
model WorkoutProgram {
  createdBy     String @map("created_by")
  createdByUser User   @relation("CreatedPrograms", fields: [createdBy], references: [id])
}

// Define inverse relation
model User {
  createdPrograms WorkoutProgram[] @relation("CreatedPrograms")
}
```

### 6. Indexes for Performance
```prisma
@@index([gymId])
@@index([createdBy])
@@index([deleted_at])
@@unique([gymId, email])
```

---

## 🌐 API Design

### Response Format (Standard)
```typescript
// ✅ SUCCESS Response
{
  "success": true,
  "message": "Operation completed",
  "data": {
    "user": {...},
    "token": "..."
  }
}

// ✅ ERROR Response
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Email is required", "Password too short"]
}

// ✅ LIST Response (Paginated)
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

### Query Parameters
```typescript
// ✅ GOOD: Consistent naming
GET /api/users?page=1&limit=20&search=john&role=Student&sortBy=createdAt&order=desc

// Standard parameters:
// - page: number (default: 1)
// - limit: number (default: 20, max: 100)
// - search: string
// - sortBy: string (field name)
// - order: 'asc' | 'desc'
```

### Authentication Header
```typescript
// Header format
Authorization: Bearer <JWT_TOKEN>

// Token payload
{
  userId: string,
  email: string,
  gymId: string,
  roleId: string,
  role: string,
  iat: number,
  exp: number
}
```

---

## 🎨 Frontend Standards

### 1. Import Order
```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { Search, Plus, Edit } from 'lucide-react';

// 3. Internal components
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

// 4. Contexts & hooks
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

// 5. Utils & API
import { apiClient } from '@/lib/api-client';

// 6. Types
import type { User, WorkoutProgram } from '@/types/api';
```

### 2. Protected Routes (Always)
```tsx
export default function SecurePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Page content */}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

### 3. Loading & Error States
```tsx
// ✅ GOOD: Handle all states
{loading ? (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
    <p className="text-gray-500 mt-4">Yükleniyor...</p>
  </div>
) : error ? (
  <div className="text-center py-12">
    <p className="text-red-600">{error}</p>
    <button onClick={retry}>Tekrar Dene</button>
  </div>
) : data.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-gray-500">Veri bulunamadı</p>
  </div>
) : (
  <div>{/* Render data */}</div>
)}
```

### 4. Form Validation
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Client-side validation
  if (!formData.name || !formData.email) {
    toast?.showToast('error', 'Lütfen tüm alanları doldurun');
    return;
  }

  try {
    await apiClient.createUser(formData);
    toast?.showToast('success', 'Kullanıcı oluşturuldu');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İşlem başarısız';
    toast?.showToast('error', message);
  }
};
```

---

## 🔧 Git Workflow

### Branch Naming
```bash
# Feature branches
feature/user-profile-page
feature/program-assignment

# Bug fixes
fix/login-redirect-issue
fix/soft-delete-query

# Documentation
docs/update-readme
docs/api-documentation

# Refactoring
refactor/auth-middleware
refactor/api-client-types
```

### Commit Messages
```bash
# ✅ GOOD: Clear, descriptive
git commit -m "feat: Add program assignment to My Students page"
git commit -m "fix: Correct soft delete query in user controller"
git commit -m "refactor: Extract common validation logic to middleware"
git commit -m "docs: Update API documentation with new endpoints"
git commit -m "chore: Update dependencies"

# ❌ BAD: Vague, unclear
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `style:` Code formatting (no logic change)
- `test:` Add/update tests
- `chore:` Build, dependencies, tooling

### Git Flow
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Work on feature
git add .
git commit -m "feat: Implement new feature"

# 3. Keep updated with main
git checkout main
git pull origin main
git checkout feature/new-feature
git merge main

# 4. Push and create PR
git push origin feature/new-feature
# Create Pull Request on GitHub

# 5. After review, merge to main
# Delete feature branch
git branch -d feature/new-feature
```

---

## 🧪 Testing Guidelines

### Backend Tests (Jest + Supertest)
```typescript
describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        roleId: studentRoleId
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('john@test.com');
  });

  it('should return 403 if user lacks permission', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ /* data */ });

    expect(response.status).toBe(403);
  });
});
```

### Testing Best Practices
1. **AAA Pattern**: Arrange, Act, Assert
2. **Test isolation**: Each test should be independent
3. **Clean up**: Delete test data after tests
4. **Mock external services**: Don't call real APIs
5. **Edge cases**: Test error scenarios, not just happy path

---

## 📊 Performance Best Practices

### Database Queries
```typescript
// ✅ GOOD: Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true
  }
});

// ❌ BAD: Fetch all fields
const users = await prisma.user.findMany(); // Includes all relations!
```

### Pagination (Always)
```typescript
// ✅ GOOD: Paginate large datasets
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// ❌ BAD: Fetch everything
const users = await prisma.user.findMany(); // Could be 10,000+ records!
```

### N+1 Query Problem
```typescript
// ✅ GOOD: Use include to eager load
const programs = await prisma.workoutProgram.findMany({
  include: {
    createdByUser: true,
    assignedUser: true,
    programExercises: {
      include: { exercise: true }
    }
  }
});

// ❌ BAD: Multiple queries in loop
const programs = await prisma.workoutProgram.findMany();
for (const program of programs) {
  program.creator = await prisma.user.findUnique({ where: { id: program.createdBy } });
}
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Backend
1. **Forgetting gymId filter** → Cross-gym data leakage
2. **Using hard delete** → Data loss
3. **Not checking deletedAt** → Showing deleted records
4. **Trusting client input** → Security vulnerabilities
5. **Generic error messages** → Exposing stack traces

### ❌ Frontend
1. **Using wrong apiClient methods** → Runtime errors
2. **Wrong toast parameter order** → Type errors
3. **Not handling loading states** → Poor UX
4. **Missing ProtectedRoute wrapper** → Unauthorized access
5. **Hardcoding API URLs** → Environment issues

### ❌ Database
1. **Missing indexes** → Slow queries
2. **No foreign key constraints** → Data integrity issues
3. **Wrong field types** → Type conversion errors
4. **Missing timestamps** → Audit trail problems
5. **No unique constraints** → Duplicate data

---

## ✅ Pre-Commit Checklist

Before committing code, verify:

- [ ] Multi-tenant: All queries have `gymId` filter
- [ ] Soft delete: Using `deletedAt` not `.delete()`
- [ ] Soft delete: Queries filter `deletedAt: null`
- [ ] Auth: Protected routes use `authenticate` middleware
- [ ] Validation: User input is validated
- [ ] Error handling: Try-catch blocks present
- [ ] Types: TypeScript types defined
- [ ] Naming: Follows naming conventions
- [ ] Comments: Complex logic is documented
- [ ] Tests: New features have tests (if applicable)
- [ ] Lint: No ESLint errors
- [ ] Format: Code is properly formatted
- [ ] Environment: No hardcoded secrets
- [ ] Git: Commit message is descriptive

---

**Last Updated:** 14 Aralık 2025
**Maintained By:** Development Team
**Questions?** Check AGENT folder documentation or ask in team chat.
  body('videoUrl').optional().isURL().withMessage('Invalid video URL'),
];

router.post('/exercises', authenticate, validateExercise, validationHandler, createExercise);
//                                       ^^^^^^^^^^^^^^^^^  REQUIRED
```

---

## 📊 Database Rules (Prisma)

### 1. Schema Conventions

**Naming:**
- Models: PascalCase (e.g., `WorkoutLog`, `TrainerMatch`)
- Fields: camelCase (e.g., `createdAt`, `gymId`)
- Relations: Descriptive names (e.g., `user` not `u`, `gym` not `g`)

**Required Fields:**
```prisma
model User {
  id         String    @id @default(uuid())
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deleted_at DateTime?
  gymId      String?
  gym        Gym?      @relation(fields: [gymId], references: [id])
}
```

---

### 2. Migrations
**Rule:** NEVER edit migration files manually

**Workflow:**
1. Edit `schema.prisma`
2. Run: `npx prisma migrate dev --name descriptive_name`
3. Commit both schema.prisma and migration files

**Naming Convention:**
- Use snake_case: `add_custom_permissions`, `fix_gym_constraint`
- Be descriptive: `add_is_public_to_programs` not `update_programs`

**Rollback:**
```bash
# ❌ DON'T manually delete migration folders
# ✅ DO use Prisma commands
npx prisma migrate reset  # Dev only - drops DB
```

---

### 3. Query Optimization

**Always include relations you need:**
```typescript
// ❌ BAD - N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const gym = await prisma.gym.findUnique({ where: { id: user.gymId } });  // N queries
}

// ✅ GOOD - Single query with join
const users = await prisma.user.findMany({
  include: {
    gym: true,
    role: true,
  }
});
```

**Use `select` for large tables:**
```typescript
// ❌ BAD - Returns all fields (including large JSONB)
const users = await prisma.user.findMany();

// ✅ GOOD - Only necessary fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: { select: { name: true } }
  }
});
```

---

### 4. Transactions
**Rule:** Use transactions for multi-table operations

```typescript
// Example: Create order + deduct stock
await prisma.$transaction(async (tx) => {
  // 1. Create order
  const order = await tx.order.create({
    data: { userId, totalAmount, status: 'pending_approval' }
  });

  // 2. Create order items + deduct stock
  for (const item of items) {
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }
    });

    // 3. Update product stock
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } }
    });
  }

  return order;
});
```

---

## 🎨 Frontend Rules (Next.js + React)

### 1. Component Structure

**File Naming:**
- Components: PascalCase (e.g., `Sidebar.tsx`, `UserCard.tsx`)
- Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)
- Utils: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)

**Component Pattern:**
```typescript
'use client';  // If using hooks/state

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Props {
  userId: string;
}

export default function UserProfile({ userId }: Props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      setUser(data.data);
    } catch (error) {
      console.error('Fetch user failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <div>User not found</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2>{user.firstName} {user.lastName}</h2>
      {/* ... */}
    </div>
  );
}
```

---

### 2. State Management

**Use React hooks for local state:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
```

**Avoid prop drilling - use Context for global state:**
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

### 3. API Calls

**Always use the configured `api` client:**
```typescript
// ✅ CORRECT
import api from '@/lib/api';

const { data } = await api.get('/users');  // Auth header auto-added

// ❌ WRONG
import axios from 'axios';
const { data } = await axios.get('http://localhost:3001/api/users');  // No auth
```

**Error Handling:**
```typescript
try {
  const { data } = await api.post('/exercises', exerciseData);
  toast.success('Exercise created!');
  router.push('/exercises');
} catch (error) {
  if (error.response?.status === 401) {
    toast.error('Session expired. Please login again.');
    router.push('/login');
  } else {
    toast.error(error.response?.data?.message || 'An error occurred');
  }
}
```

---

### 4. TypeScript Types

**Always define interfaces:**
```typescript
// types/api.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  gym: Gym;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  gymId: string;
}

// Usage in component
import { User } from '@/types/api';

const [users, setUsers] = useState<User[]>([]);
```

---

### 5. Tailwind CSS

**Use utility classes, avoid inline styles:**
```typescript
// ✅ CORRECT
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Save
</button>

// ❌ WRONG
<button style={{ padding: '8px 16px', backgroundColor: '#3b82f6' }}>
  Save
</button>
```

**Consistent spacing:**
- Use `gap-4` instead of `space-x-4` for flex/grid
- Use `p-4`, `p-6` for padding (not arbitrary values like `p-[17px]`)
- Use `mt-4`, `mb-6` for margins

**Responsive:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## 🧪 Testing Rules

### 1. Backend Tests
**Location:** `backend/test-full-system.js`

**Test Structure:**
```javascript
describe('Exercise API', () => {
  let token;
  let exerciseId;

  before(async () => {
    // Login and get token
    const res = await request(app).post('/api/auth/login').send({
      email: 'trainer@testgym.com',
      password: 'password123'
    });
    token = res.body.data.token;
  });

  it('should create exercise', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bench Press',
        targetMuscleGroup: 'Chest',
        difficulty: 'Intermediate',
      });

    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    exerciseId = res.body.data.id;
  });

  it('should list exercises', async () => {
    const res = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.data.items).to.be.an('array');
  });
});
```

**Run Tests:**
```bash
cd backend
npm test
```

---

### 2. Frontend Tests (Future)
**Location:** `frontend-admin/__tests__/`

**Tools:** Jest + React Testing Library

**Example:**
```typescript
// components/__tests__/Sidebar.test.tsx
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  it('shows owner menu for GymOwner role', () => {
    const user = { role: { name: 'GymOwner' } };
    render(<Sidebar user={user} />);

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.queryByText('My Students')).not.toBeInTheDocument();
  });

  it('shows trainer menu for Trainer role', () => {
    const user = { role: { name: 'Trainer' } };
    render(<Sidebar user={user} />);

    expect(screen.getByText('My Students')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });
});
```

---

## 📝 Code Style

### 1. TypeScript/JavaScript

**Formatting:**
- Indent: 2 spaces
- Semicolons: Yes (always)
- Quotes: Single quotes for strings
- Trailing commas: Yes (multi-line)

**Example:**
```typescript
const user = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',  // ✅ Trailing comma
};

const fetchUsers = async (gymId: string): Promise<User[]> => {
  const users = await prisma.user.findMany({
    where: { gymId, deleted_at: null },
    include: { role: true, gym: true },
  });
  return users;
};
```

---

### 2. Comments

**When to comment:**
- Complex business logic
- Non-obvious workarounds
- TODO items

**Bad Comments:**
```typescript
// ❌ Obvious - unnecessary
// Get user by ID
const user = await prisma.user.findUnique({ where: { id } });

// ❌ Redundant - code is self-explanatory
// Loop through users
for (const user of users) { }
```

**Good Comments:**
```typescript
// ✅ Explains WHY, not WHAT
// We use soft delete to maintain order history integrity
await prisma.user.update({
  where: { id },
  data: { deleted_at: new Date() }
});

// ✅ Marks incomplete work
// TODO: Add email notification when order status changes

// ✅ Explains business rule
// Trainers can only see students they are matched with (via trainer_matches table)
const students = await prisma.user.findMany({
  where: {
    id: { in: matchedStudentIds },  // Not all students in gym
    deleted_at: null,
  }
});
```

---

### 3. Naming Conventions

**Variables:**
- Use descriptive names: `userName` not `un`
- Boolean: `isActive`, `hasPermission`, `canEdit`
- Arrays: Plural (e.g., `users`, `exercises`)
- Single item: Singular (e.g., `user`, `exercise`)

**Functions:**
- Use verbs: `fetchUsers`, `createExercise`, `validateInput`
- Async: Prefix with `fetch`, `load`, or use `async` suffix
- Event handlers: Prefix with `handle` (e.g., `handleClick`, `handleSubmit`)

**Constants:**
- UPPER_SNAKE_CASE: `MAX_FILE_SIZE`, `API_BASE_URL`

---

## 🚀 Git Workflow

### 1. Commit Messages

**Format:** `type(scope): message`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build tasks, dependencies

**Examples:**
```bash
feat(exercises): add video URL field to exercise form
fix(my-students): resolve 404 error on detail page
docs(api): update authentication documentation
refactor(auth): extract JWT validation to middleware
```

---

### 2. Branching Strategy

**Main Branches:**
- `main`: Production-ready code
- `develop`: Integration branch

**Feature Branches:**
- Format: `feature/description` (e.g., `feature/products-page`)
- Branch from: `develop`
- Merge to: `develop`

**Hotfix Branches:**
- Format: `hotfix/description` (e.g., `hotfix/student-addition-bug`)
- Branch from: `main`
- Merge to: `main` AND `develop`

**Workflow:**
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/products-page

# Work on feature
git add .
git commit -m "feat(products): implement products list page"

# Push and create PR
git push origin feature/products-page
```

---

## 📚 Resources

**Prisma:**
- Docs: https://www.prisma.io/docs
- Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization

**Next.js:**
- Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

**Tailwind CSS:**
- Docs: https://tailwindcss.com/docs

---

## ❌ Common Mistakes to Avoid

1. **Forgetting gym_id filter** → Multi-tenant isolation breach
2. **Using `.delete()` instead of soft delete** → Data loss
3. **Not validating inputs** → Security vulnerabilities
4. **Missing auth middleware** → Unauthorized access
5. **Hardcoding URLs** → Breaks in different environments
6. **Not handling errors** → Poor UX, difficult debugging
7. **Prop drilling** → Unmanageable code
8. **Large components** → Hard to maintain
9. **Inline styles** → Inconsistent design
10. **Committing `.env` files** → Security breach

---

**Last Updated:** 12 Aralık 2025
**Maintained By:** Development Team
**Review Schedule:** Monthly
