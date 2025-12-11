# 📜 Development Rules & Best Practices

**Purpose:** Code quality, consistency, and maintainability guidelines

---

## 🏗️ Architecture Principles

### 1. Multi-Tenant Isolation
**⚠️ CRITICAL:** Every database query MUST include `gym_id` filtering

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
    deleted_at: null
  }
});
```

**Middleware:** Use `enforceGymIsolation` middleware on all routes that touch gym-specific data

```typescript
// routes/user.routes.ts
router.get('/users', authenticate, enforceGymIsolation, userController.listUsers);
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
  data: { deleted_at: new Date() }
});
```

**Query Pattern:** ALWAYS filter out deleted records

```typescript
where: {
  deleted_at: null,  // Always include this
  // ... other conditions
}
```

---

### 3. UUID Primary Keys
**Rule:** All IDs are UUIDs, not auto-increment integers

**Database:**
```prisma
model User {
  id    String @id @default(uuid())  // ✅ UUID
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

---

## 🔐 Security Rules

### 1. JWT Authentication
**Rule:** All protected routes MUST use `authenticate` middleware

```typescript
// routes/exercise.routes.ts
router.post('/exercises', authenticate, requirePermission('exercises.create'), createExercise);
//                         ^^^^^^^^^^^^  REQUIRED
```

**Token Validation:**
- Check expiration: 7 days access token, 30 days refresh token
- Verify signature with `JWT_SECRET`
- Extract payload: `userId`, `email`, `roleId`, `gymId`

---

### 2. Authorization (RBAC)
**Rule:** Use `requirePermission` or `requireRole` middleware

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

### 3. Password Hashing
**Rule:** NEVER store plain text passwords

```typescript
// Registration
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: {
    email,
    password: hashedPassword,  // ✅ Hashed
    // NOT: password: password  ❌ Plain text
  }
});

// Login validation
const isValid = await bcrypt.compare(password, user.password);
```

---

### 4. Input Validation
**Rule:** Validate ALL user inputs with `express-validator`

```typescript
// Example: Create exercise validation
import { body } from 'express-validator';

const validateExercise = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('targetMuscleGroup').isIn(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'])
    .withMessage('Invalid muscle group'),
  body('difficulty').isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid difficulty level'),
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
