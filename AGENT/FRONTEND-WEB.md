# 🌐 Frontend Web Dashboard (Next.js)

**Framework:** Next.js 14.2.33 (App Router)
**Port:** 3002
**Tech Stack:** React 19.x + TypeScript + Tailwind CSS + Axios

---

## 📁 Project Structure

```
frontend-admin/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local                   # NEXT_PUBLIC_API_URL
├── public/                      # Static files
│   └── (images, icons)
└── src/
    ├── app/                     # App Router (Next.js 14)
    │   ├── layout.tsx          # Root layout (Sidebar + Header)
    │   ├── page.tsx            # Dashboard home
    │   ├── globals.css         # Global Tailwind styles
    │   ├── login/
    │   │   └── page.tsx        # Login page
    │   ├── register/
    │   │   └── page.tsx        # Register page
    │   ├── dashboard/
    │   │   └── page.tsx        # ✅ Main dashboard (stats cards)
    │   ├── users/
    │   │   ├── page.tsx        # ✅ Users list (CRUD)
    │   │   └── [id]/
    │   │       └── page.tsx    # User detail/edit
    │   ├── my-students/
    │   │   ├── page.tsx        # ✅ Trainer: My Students list
    │   │   └── [id]/
    │   │       └── page.tsx    # ⏳ Student detail (404 bug - NEEDS FIX)
    │   ├── exercises/
    │   │   ├── page.tsx        # ✅ Exercises list (CRUD)
    │   │   ├── new/
    │   │   │   └── page.tsx    # ✅ Create exercise
    │   │   └── [id]/
    │   │       ├── page.tsx    # Exercise detail
    │   │       └── edit/
    │   │           └── page.tsx # Edit exercise
    │   ├── programs/
    │   │   ├── page.tsx        # ✅ Programs list
    │   │   ├── new/
    │   │   │   └── page.tsx    # ✅ Create program (isPublic field working)
    │   │   └── [id]/
    │   │       ├── page.tsx    # ✅ Program detail
    │   │       └── edit/
    │   │           └── page.tsx # Edit program
    │   ├── workout-logs/
    │   │   ├── page.tsx        # ✅ Workout logs list
    │   │   └── [id]/
    │   │       └── page.tsx    # Workout log detail
    │   ├── equipment/
    │   │   ├── page.tsx        # ✅ Equipment list (QR codes)
    │   │   └── new/
    │   │       └── page.tsx    # Create equipment
    │   ├── products/
    │   │   └── page.tsx        # ❌ NOT IMPLEMENTED YET
    │   ├── orders/
    │   │   ├── page.tsx        # ✅ Orders list
    │   │   └── [id]/
    │   │       └── page.tsx    # Order detail
    │   └── settings/
    │       └── page.tsx        # ❌ NOT IMPLEMENTED YET
    ├── components/
    │   ├── Sidebar.tsx         # ✅ Role-based navigation
    │   ├── Header.tsx          # ✅ User profile + logout
    │   ├── ProtectedRoute.tsx  # ✅ Auth guard
    │   ├── LoadingSpinner.tsx  # Loading UI
    │   ├── Modal.tsx           # Reusable modal
    │   ├── Table.tsx           # Data table component
    │   └── (other UI components)
    ├── lib/
    │   ├── api.ts              # ✅ Axios client (interceptors)
    │   └── auth.ts             # ✅ Auth helpers (getToken, logout)
    ├── types/
    │   ├── api.ts              # ✅ API request/response types
    │   └── index.ts            # Common TypeScript types
    └── utils/
        ├── formatters.ts       # Date, currency formatters
        └── validators.ts       # Form validation helpers
```

---

## 🎨 Design System

### Color Palette (Tailwind)
```css
/* Primary */
bg-blue-600, text-blue-600      /* Main brand color */
bg-blue-700                     /* Hover states */

/* Success */
bg-green-600, text-green-600    /* Success messages */

/* Danger */
bg-red-600, text-red-600        /* Delete actions, errors */

/* Warning */
bg-yellow-600, text-yellow-600  /* Warnings */

/* Neutral */
bg-gray-100, bg-gray-200        /* Backgrounds */
text-gray-600, text-gray-900    /* Text colors */
```

### Component Patterns
- **Cards**: `bg-white shadow-md rounded-lg p-6`
- **Buttons**: `px-4 py-2 rounded-md font-medium transition-colors`
- **Forms**: `border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500`
- **Tables**: Striped rows, hover effects, responsive

---

## 🔐 Authentication Flow

### Login (`app/login/page.tsx`)

```typescript
const handleLogin = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });

  // Store tokens
  localStorage.setItem('token', response.data.data.token);
  localStorage.setItem('refreshToken', response.data.data.refreshToken);
  localStorage.setItem('user', JSON.stringify(response.data.data.user));

  // Redirect to dashboard
  router.push('/dashboard');
};
```

### Protected Routes (`components/ProtectedRoute.tsx`)

```typescript
'use client';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) return <LoadingSpinner />;
  return <>{children}</>;
}
```

### Axios Interceptor (`lib/api.ts`)

```typescript
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧩 Key Components

### Sidebar (`components/Sidebar.tsx`)

**Features:**
- ✅ Role-based navigation (Student/Trainer/Owner see different menus)
- ✅ Active route highlighting
- ✅ Responsive (mobile hamburger menu)

**Navigation Structure:**

```typescript
// GymOwner Menu
const ownerMenu = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Exercises', href: '/exercises', icon: DumbbellIcon },
  { name: 'Programs', href: '/programs', icon: ClipboardIcon },
  { name: 'Workout Logs', href: '/workout-logs', icon: ChartIcon },
  { name: 'Equipment', href: '/equipment', icon: WrenchIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Trainer Menu (removed Users, added My Students)
const trainerMenu = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Students', href: '/my-students', icon: UsersIcon },
  { name: 'Exercises', href: '/exercises', icon: DumbbellIcon },
  { name: 'Programs', href: '/programs', icon: ClipboardIcon },
  { name: 'Workout Logs', href: '/workout-logs', icon: ChartIcon },
  { name: 'Equipment', href: '/equipment', icon: WrenchIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Student Menu (minimal)
const studentMenu = [
  { name: 'My Program', href: '/my-program', icon: ClipboardIcon },
  { name: 'My Workouts', href: '/my-workouts', icon: ChartIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];
```

---

### Header (`components/Header.tsx`)

**Features:**
- User profile display (name, role, gym)
- Logout button
- Mobile menu toggle

```typescript
const Header = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold">GymOS</h1>
        <div className="flex items-center gap-4">
          <span>{user.firstName} {user.lastName}</span>
          <span className="text-sm text-gray-500">{user.role?.name}</span>
          <button onClick={handleLogout} className="btn-danger">Logout</button>
        </div>
      </div>
    </header>
  );
};
```

---

## 📄 Implemented Pages

### 1. Dashboard (`app/dashboard/page.tsx`)

**Status:** ✅ Implemented

**Features:**
- Stats cards (Total Users, Active Programs, Today's Workouts, Pending Orders)
- Role-based content (Owner sees all, Trainer sees own students)
- Quick actions (Create Program, Add Exercise, View Reports)

**API Calls:**
```typescript
useEffect(() => {
  Promise.all([
    api.get('/users?limit=1'),           // Get total users count
    api.get('/programs?limit=1'),        // Get programs count
    api.get('/workout-logs?limit=1'),    // Get today's workouts
    api.get('/orders?status=pending_approval&limit=1'), // Pending orders
  ]).then(([users, programs, workouts, orders]) => {
    setStats({
      totalUsers: users.data.data.pagination.total,
      activePrograms: programs.data.data.pagination.total,
      todaysWorkouts: workouts.data.data.pagination.total,
      pendingOrders: orders.data.data.pagination.total,
    });
  });
}, []);
```

---

### 2. Users (`app/users/page.tsx`)

**Status:** ✅ Implemented (GymOwner only)

**Features:**
- User list with pagination
- Search by name/email
- Filter by role (Student, Trainer)
- Create new user (opens modal)
- Edit/Delete actions

**Table Columns:**
- Name
- Email
- Role
- Phone
- Status (Active/Inactive)
- Actions (Edit, Delete)

---

### 3. My Students (`app/my-students/page.tsx`)

**Status:** ✅ Implemented (Trainer only) - **BUG: Detail page 404**

**Features:**
- List matched students
- Show assigned program
- Show last workout date
- Show monthly workout count
- Add new student (dropdown + assign button)

**API Calls:**
```typescript
// Fetch my students
const { data } = await api.get('/trainer-matches/my-students');
setStudents(data.data.items);

// Add new student
await api.post('/trainer-matches', {
  trainerId: currentUser.id,
  studentId: selectedStudentId,
});
```

**🐛 Known Bug:**
- Clicking student detail → 404 error
- URL: `/my-students/[studentId]`
- Needs: `app/my-students/[id]/page.tsx` implementation
- Should show: Student profile, assigned program, workout history, measurements

**⏳ To Fix:**
```typescript
// app/my-students/[id]/page.tsx (CREATE THIS FILE)
export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { data } = await api.get(`/trainer-matches/my-students/${params.id}`);

  return (
    <div>
      <h1>{data.firstName} {data.lastName}</h1>
      {/* Student profile */}
      {/* Assigned program */}
      {/* Workout logs */}
      {/* Measurements */}
    </div>
  );
}
```

---

### 4. Exercises (`app/exercises/page.tsx`)

**Status:** ✅ Fully Implemented

**Features:**
- Exercise library with search
- Filter by muscle group (Chest, Back, Legs, etc.)
- Filter by difficulty (Beginner, Intermediate, Advanced)
- Video URL display
- Create/Edit/Delete

**Create Form Fields:**
- Name (required)
- Description
- Target Muscle Group (dropdown)
- Difficulty Level (dropdown)
- Equipment (text)
- Video URL (YouTube embed)

---

### 5. Programs (`app/programs/page.tsx`)

**Status:** ✅ Fully Implemented

**Features:**
- Program list (shows own + public programs)
- Public/Private toggle (✅ **FIXED** - isPublic now saves correctly)
- Assign to student (dropdown)
- Add exercises to program
- Reorder exercises (drag & drop - TODO)

**Create Form Fields:**
- Name (required)
- Description
- Difficulty Level (Beginner, Intermediate, Advanced)
- Duration Weeks (number)
- Is Public (checkbox) ✅ **WORKING**
- Assign to User (dropdown, optional)

**Program Detail:**
- Exercise list with sets/reps/rest
- Add exercise modal (search exercises)
- Edit exercise details (inline)
- Delete exercise from program

---

### 6. Workout Logs (`app/workout-logs/page.tsx`)

**Status:** ✅ Implemented

**Features:**
- Workout history (Owner sees all, Trainer sees students, Student sees own)
- Filter by date range
- Filter by program
- View workout details (sets, reps, weight, RPE)

**Workout Detail:**
- Program name
- Start/End time
- Duration
- Exercise list with all sets
- Notes

---

### 7. Equipment (`app/equipment/page.tsx`)

**Status:** ✅ Implemented

**Features:**
- Equipment list
- QR code generation (download PNG)
- Status management (active, maintenance, broken)
- Video URL for usage instructions

**Table Columns:**
- Name
- Status (badge with color)
- QR Code (button to view/download)
- Video (link icon)
- Actions (Edit, Delete)

---

### 8. Orders (`app/orders/page.tsx`)

**Status:** ✅ Implemented

**Features:**
- Order list with status badges
- Filter by status (pending_approval, prepared, completed, cancelled)
- Update status (Owner/Trainer only)
- View order items

**Order Detail:**
- Order number (ORD-2025-001234)
- Customer info
- Items list (product name, quantity, unit price)
- Total amount
- Status history
- Update status buttons

---

## ❌ NOT IMPLEMENTED Pages

### 9. Products (`app/products/page.tsx`)

**Status:** ❌ NOT STARTED

**Required Features:**
- ✅ Category-based filtering
- ✅ Stock tracking (real-time)
- ✅ Photo upload (image URL or file upload)
- ✅ Bulk price update (select multiple → update modal)
- ✅ Active/Inactive toggle (batch action)

**Table Columns:**
- Image (thumbnail)
- Name
- Category
- Price (TRY)
- Stock Quantity (colored: red if < 10, yellow if < 50, green if >= 50)
- Status (Active/Inactive toggle)
- Actions (Edit, Delete, Duplicate)

**Create/Edit Form:**
```typescript
interface ProductForm {
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;      // Can be file upload or URL input
  price: number;
  stockQuantity: number;
  isActive: boolean;
}
```

**Bulk Actions:**
- Select multiple products (checkboxes)
- Update Price: Open modal → percentage increase/decrease or fixed amount
- Toggle Status: Activate/Deactivate selected
- Delete Multiple

**API Endpoints:**
- GET `/products` (with pagination, search, categoryId filter)
- POST `/products` (create)
- PUT `/products/:id` (update)
- PATCH `/products/:id/stock` (update stock)
- PATCH `/products/:id/toggle` (toggle active status)
- DELETE `/products/:id` (soft delete)

---

### 10. Settings (`app/settings/page.tsx`)

**Status:** ❌ NOT STARTED

**Required Sections:**

#### A. Profile Settings (All Roles)
- Avatar upload/change
- First Name, Last Name
- Email (readonly - cannot change)
- Phone
- Change Password (current password + new password + confirm)
- Birth Date, Gender (optional)

#### B. Gym Information (GymOwner Only)
- Gym Name
- Address (text area)
- Logo Upload
- Contact Phone
- Email
- Website (optional)

#### C. Roles & Permissions (GymOwner Only)
**⭐ IMPORTANT: Trainer-Specific Permissions**

**UI Flow:**
1. List all Trainers in gym
2. Click Trainer → "Manage Permissions" button
3. Open modal with permission checkboxes:

```typescript
interface TrainerPermissions {
  products: {
    create: boolean;
    read: boolean;      // Always true (default)
    update: boolean;
    delete: boolean;
  };
  orders: {
    read: boolean;      // Always true (default)
    update: boolean;    // Approve/prepare orders
    delete: boolean;    // Cancel orders
  };
  users: {
    read: boolean;      // See all users (not just students)
    update: boolean;    // Edit user profiles
    delete: boolean;    // Delete users
  };
  equipment: {
    create: boolean;
    update: boolean;
    delete: boolean;    // Owner-only by default
  };
}
```

4. Save → API: `PATCH /users/:trainerId/custom-permissions`
5. Backend merges `role.permissions` + `user.customPermissions`

**Implementation:**
```typescript
// Settings page: Roles & Permissions section
const [trainers, setTrainers] = useState([]);

useEffect(() => {
  api.get('/users?role=Trainer').then(res => setTrainers(res.data.data.items));
}, []);

const openPermissionsModal = (trainer) => {
  setSelectedTrainer(trainer);
  setCustomPermissions(trainer.customPermissions || {});
  setModalOpen(true);
};

const savePermissions = async () => {
  await api.patch(`/users/${selectedTrainer.id}/custom-permissions`, {
    customPermissions: customPermissions,
  });
  toast.success('Permissions updated');
};
```

**Note:** Rol değiştirme YOK! Kayıt sırasında belirlenen rol asla değişmez. Sadece Trainer'lara **ekstra yetkiler** verilebilir.

#### D. Notification Preferences (All Roles)
- Email Notifications (on/off)
- Push Notifications (on/off - future mobile app)
- Notification Types:
  - New order placed (Owner/Trainer)
  - Order status changed (Student)
  - New student assigned (Trainer)
  - Program assigned (Student)
  - Low stock alert (Owner/Trainer with products.read)

---

## 🎯 Role-Based UI Differences

### GymOwner Dashboard
```typescript
- See: All users, all programs, all workouts, all orders
- Create: Users, Exercises, Programs, Equipment, Products
- Delete: Everything
- Special: Gym settings, Trainer permissions management
```

### Trainer Dashboard
```typescript
- See: Own students, own exercises/programs, students' workouts, students' orders
- Create: Exercises, Programs, Equipment (if granted), Products (if granted)
- Delete: Own exercises/programs only
- Special: My Students page, custom permissions (if granted by owner)
```

### Student Dashboard (Future - Mobile App Primary)
```typescript
- See: Own program, own workouts, own orders
- Create: Workout logs, Orders
- Delete: Own pending orders
- Special: QR scanner, workout timer, progress charts
```

---

## 🐛 Known Issues & Fixes Needed

### 1. My Students Detail Page - 404 Error
**Location:** `/my-students/[id]`

**Problem:** File doesn't exist

**Solution:**
```bash
mkdir -p frontend-admin/src/app/my-students/[id]
# Create page.tsx with student detail view
```

**Should Display:**
- Student profile (name, email, phone, birth date)
- Assigned program (with exercises)
- Workout logs (last 10)
- Body measurements (weight, body fat %)
- Order history
- Actions: Assign/Change Program, View Full Workout History

---

### 2. Student Active/Inactive Status
**Location:** `/my-students/page.tsx`

**Problem:** "Pasif gözüküyor" - Unclear what determines active/inactive

**Current Logic (needs clarification):**
```typescript
// Option 1: Based on trainer_matches.status
isActive = trainerMatch.status === 'active'

// Option 2: Based on recent workout activity
isActive = lastWorkoutDate < 30 days ago

// Option 3: Manual flag in users table (users.isActive)
```

**Solution:** Decide on logic, then implement UI indicator:
```typescript
<span className={`px-2 py-1 rounded text-xs ${
  student.isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800'
}`}>
  {student.isActive ? 'Active' : 'Inactive'}
</span>
```

---

### 3. Program Assignment UX
**Location:** `/my-students/page.tsx` and `/programs/[id]/page.tsx`

**Problem:** Unclear workflow for assigning programs to students

**Improved UX:**
1. From My Students page:
   - Click "Assign Program" button on student row
   - Modal opens with program dropdown (own + public programs)
   - Select program → Save
   - API: `PUT /programs/:programId` with `assignedUserId`

2. From Program page:
   - "Assign to Student" dropdown
   - Shows matched students only
   - Select student → Auto-save

---

## 🚀 Performance Optimizations

### 1. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={200}
  height={200}
  loading="lazy"
/>
```

### 2. API Call Debouncing (Search)
```typescript
import { useDebounce } from 'use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch] = useDebounce(searchTerm, 500);

useEffect(() => {
  api.get(`/users?search=${debouncedSearch}`).then(/* ... */);
}, [debouncedSearch]);
```

### 3. Pagination State Persistence
```typescript
// Save page state to URL params
const router = useRouter();
const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';

const handlePageChange = (newPage: number) => {
  router.push(`/users?page=${newPage}`);
};
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Test Files:**
- `components/__tests__/Sidebar.test.tsx`
- `components/__tests__/Header.test.tsx`
- `lib/__tests__/api.test.ts`

### E2E Tests (Playwright - Future)
```bash
npm install --save-dev @playwright/test
```

**Test Scenarios:**
- Login flow
- Create exercise
- Create program
- Assign program to student
- Create order
- Update order status

---

## 📦 Dependencies

**Core:**
- `next@14.2.33` - React framework
- `react@19.x` - UI library
- `react-dom@19.x` - React DOM

**Styling:**
- `tailwindcss@3.x` - Utility-first CSS
- `@tailwindcss/forms` - Form styling
- `postcss` - CSS processing
- `autoprefixer` - Vendor prefixes

**Data Fetching:**
- `axios@1.7.x` - HTTP client
- `swr` (optional) - Data fetching hooks

**Forms:**
- `react-hook-form@7.x` - Form state management
- `zod@3.x` - Schema validation

**UI Components:**
- `@headlessui/react` - Unstyled accessible components
- `@heroicons/react` - Icon library
- `react-hot-toast` - Notifications

**Utilities:**
- `date-fns` - Date formatting
- `clsx` - Conditional class names

---

## 🌐 Environment Variables

**File:** `.env.local`

```bash
# API URL (Backend)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Optional: Image upload service (Cloudinary, S3, etc.)
NEXT_PUBLIC_CLOUDINARY_URL=https://api.cloudinary.com/v1_1/your-cloud-name/upload
NEXT_PUBLIC_CLOUDINARY_PRESET=your-preset

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🔮 Future Enhancements

### Phase 8: Advanced Features
- **Real-time Updates**: WebSocket integration for live order status
- **Advanced Analytics**: Charts (recharts), workout trends, revenue graphs
- **Export Features**: PDF reports, CSV exports
- **Multi-language**: i18n support (TR/EN)
- **Dark Mode**: Theme switcher
- **PWA**: Progressive Web App for offline support

### Phase 9: Mobile Responsiveness
- **Mobile-first redesign**: Better UX on phones/tablets
- **Touch gestures**: Swipe actions, pull to refresh
- **Responsive tables**: Horizontal scroll, card view on mobile

---

**Last Updated:** 12 Aralık 2025
**Status:** 8/10 pages complete
**Next Priority:** Products page → Settings page → My Students detail fix
