# ✅ Task Tracking & Roadmap

**Last Updated:** 12 Aralık 2025

---

## 🎯 Current Sprint (Phase 7: Role Separation + Bug Fixes)

### 🔥 High Priority (This Week)

#### 1. My Students Page - Bug Fixes
**Status:** ⏳ In Progress

**Issues:**
- ❌ Detail page returns 404 error
- ❌ Student "Active/Inactive" status unclear
- ⚠️ Program assignment UX confusing

**Tasks:**
- [ ] Create `frontend-admin/src/app/my-students/[id]/page.tsx`
  - Display student profile (name, email, phone, birth date)
  - Show assigned program with exercises
  - List recent workout logs (last 10)
  - Show body measurements chart
  - Display order history
  - Add "Assign Program" button (opens modal)
- [ ] Fix isActive logic:
  - **Decision needed:** Based on trainer_matches.status OR last workout date OR manual flag?
  - Implement visual indicator (green badge = active, gray badge = inactive)
- [ ] Improve program assignment UX:
  - Add "Assign Program" button on each student row
  - Modal with program dropdown (own + public programs)
  - API call: `PUT /programs/:programId` with `assignedUserId`

**Files to Edit:**
- `frontend-admin/src/app/my-students/[id]/page.tsx` (CREATE)
- `frontend-admin/src/app/my-students/page.tsx` (UPDATE - isActive indicator)
- `backend/src/controllers/trainerMatch.controller.ts` (UPDATE - isActive logic)

---

#### 2. Products Page - Full Implementation
**Status:** ❌ Not Started

**Requirements:**
- ✅ Category-based filtering (dropdown + "All" option)
- ✅ Stock tracking with color indicators:
  - Red: stock < 10 (low stock alert)
  - Yellow: 10 <= stock < 50 (moderate)
  - Green: stock >= 50 (good)
- ✅ Photo upload (Cloudinary or local storage)
- ✅ Bulk price update (checkbox selection → modal)
- ✅ Active/Inactive toggle (individual + bulk action)

**Tasks:**
- [ ] Create `frontend-admin/src/app/products/page.tsx`
  - Data table with columns: Image, Name, Category, Price, Stock, Status, Actions
  - Search bar (name/description)
  - Category filter dropdown
  - Pagination (20 items per page)
  - Bulk actions toolbar (appears when items selected)
- [ ] Create `frontend-admin/src/app/products/new/page.tsx`
  - Form: categoryId, name, description, imageUrl, price, stockQuantity, isActive
  - Image upload: Drag & drop or URL input
  - Validation: All required fields
- [ ] Create `frontend-admin/src/app/products/[id]/edit/page.tsx`
  - Same form as create
  - Pre-populated with existing data
- [ ] Implement bulk actions:
  - Update Price modal: Percentage increase/decrease OR fixed amount
  - Toggle Status: Activate/Deactivate selected products
  - Delete Multiple (with confirmation)
- [ ] Add stock alert notification (if stock < 10, show badge on Sidebar)

**API Endpoints (Already Implemented):**
- GET `/products` ✅
- POST `/products` ✅
- PUT `/products/:id` ✅
- PATCH `/products/:id/stock` ✅
- PATCH `/products/:id/toggle` ✅
- DELETE `/products/:id` ✅

---

#### 3. Settings Page - Full Implementation
**Status:** ❌ Not Started

**Sections:**

**A. Profile Settings (All Roles)**
- [ ] Avatar upload/change (Cloudinary)
- [ ] Edit: First Name, Last Name, Phone
- [ ] Email (readonly - display only)
- [ ] Change Password form:
  - Current Password (validation: must match DB)
  - New Password (min 6 chars)
  - Confirm New Password (must match)
- [ ] Optional: Birth Date, Gender

**B. Gym Information (GymOwner Only)**
- [ ] Gym Name (text input)
- [ ] Address (textarea)
- [ ] Logo Upload (Cloudinary or local)
- [ ] Contact Phone, Email
- [ ] Website (optional URL)

**C. Roles & Permissions (GymOwner Only)**
- [ ] List all Trainers in gym
- [ ] "Manage Permissions" button per trainer
- [ ] Modal with permission checkboxes:
  ```
  Products: Create, Update, Delete
  Orders: Update, Delete
  Users: Read, Update, Delete
  Equipment: Create, Update, Delete
  ```
- [ ] Save → API: `PATCH /users/:trainerId/custom-permissions`
- [ ] Display current custom permissions (badge/icon)

**D. Notification Preferences (All Roles)**
- [ ] Email Notifications (toggle)
- [ ] Push Notifications (toggle - future mobile)
- [ ] Notification Types (checkboxes):
  - New order placed (Owner/Trainer)
  - Order status changed (Student)
  - New student assigned (Trainer)
  - Program assigned (Student)
  - Low stock alert (Owner/Trainer with products.read)

**Backend Changes Needed:**
- [ ] Add `users.customPermissions` JSONB field
  - Migration: `npx prisma migrate dev --name add_custom_permissions`
  - Schema: `customPermissions Json?`
- [ ] Update `rbac.middleware.ts`:
  - Merge `role.permissions` + `user.customPermissions`
  - Check combined permissions in `requirePermission`
- [ ] Create endpoint: `PATCH /users/:id/custom-permissions`
- [ ] Create endpoint: `PATCH /users/:id/profile` (update avatar, phone, etc.)
- [ ] Create endpoint: `PATCH /users/:id/password` (change password)
- [ ] Create endpoint: `PATCH /gyms/:id` (update gym info - Owner only)

---

### 🔄 Medium Priority (Next Week)

#### 4. Program Assignment Optimization
**Status:** ⏳ Ongoing (part of My Students fixes)

**Current Issues:**
- Workflow unclear (where to assign from?)
- No visual feedback after assignment
- Cannot unassign program

**Improvements:**
- [ ] Add "Assign Program" button on My Students page (per student row)
- [ ] Add "Assign to Student" dropdown on Program detail page
- [ ] Show current assignment clearly (badge/chip on program card)
- [ ] Add "Unassign" action (sets assignedUserId = null)
- [ ] Toast notification on successful assignment

---

#### 5. Docker Full Stack Setup
**Status:** ❌ Not Started

**Current State:**
- ✅ PostgreSQL runs in Docker container
- ❌ Backend runs locally (`npm run dev`)
- ❌ Frontend runs locally (`npm run dev`)

**Goal:** Dockerize entire stack for easy deployment

**Tasks:**
- [ ] Create `backend/Dockerfile`:
  ```dockerfile
  FROM node:22-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  RUN npx prisma generate
  EXPOSE 3001
  CMD ["npm", "run", "dev"]
  ```
- [ ] Create `frontend-admin/Dockerfile`:
  ```dockerfile
  FROM node:22-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  EXPOSE 3002
  CMD ["npm", "run", "dev"]
  ```
- [ ] Update `docker-compose.yml`:
  - Add `backend` service
  - Add `frontend-admin` service
  - Add `frontend-mobile` service (when ready)
  - Network configuration
  - Volume mounts for hot reload
- [ ] Test: `docker-compose up` should start all services
- [ ] Document: Update README with Docker setup instructions

**Note:** Şimdilik ertelenebilir, production deployment için gerekli

---

#### 6. Order History - Add Metadata JSONB
**Status:** ❌ Not Started

**Requirement:** Store extra order info (cancellation reasons, notes, etc.)

**Implementation:**
- [ ] Add `orders.metadata` JSONB field
  - Migration: `npx prisma migrate dev --name add_order_metadata`
  - Schema: `metadata Json?`
- [ ] Frontend: Order detail page
  - Show metadata fields (if present)
  - Add "Add Note" button (Owner/Trainer only)
  - Cancellation reason dropdown (if status = cancelled)
- [ ] Backend: Update order endpoints
  - Allow metadata in `POST /orders`
  - Allow metadata update in `PATCH /orders/:id/status`

**Example Metadata:**
```json
{
  "cancellationReason": "Customer changed mind",
  "internalNotes": "Refunded via cash",
  "deliveryNotes": "Handed to trainer on 2025-12-11",
  "paymentMethod": "Cash"
}
```

---

## 📦 Completed Tasks (Phase 1-6)

### ✅ Phase 1: Database Design (30 Kasım - 1 Aralık 2024)
- [x] Design 16-table schema with UUID PKs
- [x] Implement soft delete (deleted_at)
- [x] Add gym_id isolation to all tables
- [x] Create Prisma schema
- [x] Run initial migration

### ✅ Phase 2: Authentication & Authorization (2-3 Aralık 2024)
- [x] JWT authentication (7d access, 30d refresh)
- [x] Role-based permissions (JSONB in roles table)
- [x] Gym isolation middleware
- [x] Login/Register endpoints
- [x] /auth/me endpoint

### ✅ Phase 3: Core Backend APIs (4-6 Aralık 2024)
- [x] Users CRUD (GET, POST, PUT, DELETE)
- [x] Exercises CRUD with video URLs
- [x] Programs CRUD with assignments
- [x] Program Exercises (add/remove/reorder)
- [x] Workout Logs (start/end/log sets)
- [x] Equipment with QR generation
- [x] Products & Categories CRUD
- [x] Orders with status flow

### ✅ Phase 4: Advanced Features (7-8 Aralık 2024)
- [x] Trainer-Student matching system
- [x] Pagination for all list endpoints
- [x] Search & filtering
- [x] Statistics endpoints (workout stats, order stats)
- [x] Ownership checks (Trainer can only edit own exercises/programs)

### ✅ Phase 5: Testing & Documentation (9 Aralık 2024)
- [x] Write 54 integration tests (100% passing)
- [x] API documentation (API_DOCUMENTATION.md)
- [x] Postman collection (POSTMAN_TESTS.md)
- [x] Quick reference (API_ENDPOINTS_QUICK_REFERENCE.md)

### ✅ Phase 6: Frontend Dashboard (10-11 Aralık 2024)
- [x] Next.js 14 setup with App Router
- [x] Tailwind CSS styling
- [x] Authentication (login/register)
- [x] Protected routes
- [x] Sidebar with role-based navigation
- [x] Dashboard page (stats cards)
- [x] Users page (CRUD)
- [x] Exercises page (CRUD with video embeds)
- [x] Programs page (CRUD with exercise assignments)
- [x] Workout Logs page (view history)
- [x] Equipment page (QR code generation)
- [x] Orders page (status management)

### ✅ Phase 7: Role Separation (11-12 Aralık 2024)
- [x] Separate Trainer/Owner navigation (removed Users from Trainer, added My Students)
- [x] My Students page (Trainer-specific)
- [x] Student addition to trainer's list
- [x] Program visibility system (isPublic field)
- [x] Bug fix: isPublic not saving in backend
- [x] Bug fix: Student addition 404 (double /api prefix)
- [x] Documentation restructuring (AGENT folder)
  - [x] PROJECT.md (high-level overview)
  - [x] BACKEND.md (backend architecture)
  - [x] API.md (endpoint reference)
  - [x] FRONTEND-WEB.md (Next.js dashboard)
  - [x] TASKS.md (this file)
  - [ ] RULES.md (development guidelines)
  - [ ] FRONTEND-MOBILE.md (empty for now)

---

## 🔮 Future Phases (Phase 8+)

### Phase 8: Advanced Settings & Permissions (Est. 3-4 days)
**Goal:** Trainer-specific permissions, full settings page

- [ ] Implement `customPermissions` JSONB field
- [ ] Update RBAC middleware to merge role + custom permissions
- [ ] Build Settings page (Profile, Gym Info, Permissions, Notifications)
- [ ] Avatar upload (Cloudinary integration)
- [ ] Password change functionality

### Phase 9: Mobile App - React Native (Est. 2-3 weeks)
**Goal:** Student-focused mobile app

- [ ] React Native project setup
- [ ] Login/Register screens
- [ ] QR Scanner (equipment videos)
- [ ] My Program screen
- [ ] Workout Logger screen (sets/reps/weight input)
- [ ] Progress Charts (workout history, measurements)
- [ ] Order placement (products vitrin)
- [ ] Push notifications

### Phase 10: Analytics & Reporting (Est. 1 week)
**Goal:** Data visualization and insights

- [ ] Dashboard charts (recharts):
  - Revenue over time (line chart)
  - Orders by status (pie chart)
  - Workout completion rate (bar chart)
  - Top-selling products (bar chart)
- [ ] Advanced workout stats:
  - Volume progression (weight × reps × sets)
  - Frequency (workouts per week)
  - Exercise popularity
- [ ] Export to PDF/CSV:
  - Monthly reports
  - User progress reports
  - Order invoices

### Phase 11: Real-time Features (Est. 1 week)
**Goal:** WebSocket integration for live updates

- [ ] Socket.IO setup (backend + frontend)
- [ ] Real-time order status updates
- [ ] Live workout tracking (trainer sees student's live session)
- [ ] Chat system (Trainer ↔ Student messaging)
- [ ] Online presence indicators

### Phase 12: Advanced Workout Features (Est. 1 week)
**Goal:** Enhanced workout tracking

- [ ] Rest timer (countdown between sets)
- [ ] Auto-progression (suggest weight increase based on RPE)
- [ ] Superset/Circuit support
- [ ] Custom templates (Trainer creates workout templates)
- [ ] Video recording (Student records sets, Trainer reviews form)

### Phase 13: Marketplace Enhancements (Est. 3 days)
**Goal:** Better e-commerce features

- [ ] Product reviews & ratings
- [ ] Wishlist
- [ ] Discount codes/coupons
- [ ] Loyalty points system
- [ ] Product recommendations (based on order history)

### Phase 14: Multi-language Support (Est. 2 days)
**Goal:** Turkish + English

- [ ] i18n setup (next-i18next)
- [ ] Translate all strings
- [ ] Language switcher in settings
- [ ] RTL support (future: Arabic, Hebrew)

### Phase 15: Production Deployment (Est. 1 week)
**Goal:** Deploy to cloud (AWS/Vercel/Railway)

- [ ] Dockerize full stack (backend + frontend)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment setup (staging + production)
- [ ] Database backups (automated)
- [ ] Monitoring (Sentry, LogRocket)
- [ ] SSL certificates
- [ ] CDN for images (Cloudinary/S3)
- [ ] Load testing

---

## 🚨 Critical Blockers

**None currently** - All systems functional

---

## 📊 Progress Metrics

### Backend
- **Endpoints:** 67/67 implemented (100%)
- **Tests:** 54/54 passing (100%)
- **Database:** 16 tables, all migrated
- **Auth:** JWT working, RBAC working

### Frontend
- **Pages:** 8/10 implemented (80%)
- **Components:** Sidebar, Header, ProtectedRoute, Modal, Table
- **Missing:** Products page, Settings page
- **Bug Fixes:** 2 critical bugs fixed (isPublic, student addition)

### Documentation
- **AGENT Folder:** 5/7 files complete
  - ✅ PROJECT.md
  - ✅ BACKEND.md
  - ✅ API.md
  - ✅ FRONTEND-WEB.md
  - ✅ TASKS.md
  - ⏳ RULES.md (in progress)
  - ⏳ FRONTEND-MOBILE.md (empty - waiting for Phase 9)

---

## 🎯 This Week's Goals (Dec 12-18)

**Priority 1:** My Students bug fixes (detail page, isActive status)
**Priority 2:** Products page full implementation
**Priority 3:** Settings page (Profile + Gym Info sections)
**Priority 4:** RULES.md documentation

**Stretch Goal:** Docker Compose setup

---

**Last Updated:** 12 Aralık 2025
**Next Review:** 18 Aralık 2025
