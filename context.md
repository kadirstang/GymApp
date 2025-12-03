# Project: Gym Management System (SaaS)

## 1. System Overview
**Tech Stack:**
* **Devops:** Docker
* **Database:** PostgreSQL
* **Backend:** Node.js
* **Web:** Next.js (Admin/Trainer dashboard)
* **Mobile:** React Native (Member app)

**Core Modules:**
1.  **User System:** Multi-role support (Admin, Trainer, Student) scoped to specific Gyms.
2.  **Training System:**
    * Trainer-Student matching.
    * Flexible Program Builder (Sets, Reps, RPE, Rest).
    * Execution & Progress Tracking (Logging actual weights lifted).
3.  **Marketplace (Internal):** Pre-order system for gym supplements/gear (No payment gateway, stock tracking only).
4.  **Equipment & QR:** QR codes on machines link to "How-to" videos.

---

## 2. Database Schema Architecture

*Note: All tables use `UUID` for Primary Keys to ensure scalability and security, rather than auto-increment integers. All tables include `created_at`, `updated_at`, and `deleted_at` for audit and soft-deletion.*

### A. Core & User Management

#### `gyms`
*The tenant table. All other data links back to this.*
* `id` (UUID, PK)
* `name` (VARCHAR)
* `slug` (VARCHAR, Unique - for custom URLs)
* `address` (TEXT)
* `contact_phone` (VARCHAR)
* `logo_url` (VARCHAR)
* `is_active` (BOOLEAN)
* `timestamps`

#### `roles`
*Standard roles: 'GymOwner', 'Trainer', 'Student'.*
* `id` (UUID, PK)
* `name` (VARCHAR)
* `gym_id` (UUID, FK -> gyms.id)
* `permissions` (JSONB) - *For granular access control*

#### `users`
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `role_id` (UUID, FK -> roles.id)
* `email` (VARCHAR, Unique)
* `password_hash` (VARCHAR)
* `first_name` (VARCHAR)
* `last_name` (VARCHAR)
* `phone` (VARCHAR)
* `avatar_url` (VARCHAR)
* `birth_date` (DATE)
* `gender` (VARCHAR)
* `timestamps`

#### `user_measurements`
*Tracks body stats over time (Progress Tracking).*
* `id` (UUID, PK)
* `user_id` (UUID, FK -> users.id)
* `weight` (FLOAT)
* `height` (FLOAT)
* `body_fat_percentage` (FLOAT)
* `muscle_mass` (FLOAT)
* `measured_at` (TIMESTAMPTZ, Default: Now)

### B. Training & Workout System

#### `trainer_matches`
*Links a student to a trainer.*
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `trainer_id` (UUID, FK -> users.id)
* `student_id` (UUID, FK -> users.id)
* `status` (ENUM: 'active', 'pending', 'ended')
* `timestamps`

#### `exercises`
*The library of available movements (e.g., "Bench Press", "Treadmill").*
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `name` (VARCHAR)
* `description` (TEXT)
* `video_url` (VARCHAR) - *YouTube link*
* `target_muscle_group` (VARCHAR)
* `equipment_needed_id` (UUID, FK -> equipments.id, Nullable)
* `timestamps`

#### `workout_programs`
*The "Folder" holding the routine (e.g., "Hypertrophy Week 1").*
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `creator_id` (UUID, FK -> users.id) - *Trainer who made it*
* `assigned_user_id` (UUID, FK -> users.id, Nullable) - *If assigned to specific student*
* `name` (VARCHAR)
* `description` (TEXT)
* `difficulty_level` (ENUM: 'Beginner', 'Intermediate', 'Advanced')
* `timestamps`

#### `program_exercises`
*The "Recipe". Defines 3 sets of 10 reps for Bench Press in this specific program.*
* `id` (UUID, PK)
* `program_id` (UUID, FK -> workout_programs.id)
* `exercise_id` (UUID, FK -> exercises.id)
* `order_index` (INTEGER) - *To sort exercises (1st, 2nd, 3rd)*
* `sets` (INTEGER)
* `reps` (VARCHAR) - *String allowed for ranges like "10-12"*
* `rest_time_seconds` (INTEGER)
* `notes` (TEXT) - *Specific instructions like "Drop set on last"*

#### `workout_logs`
*Records when a user actually performs a workout.*
* `id` (UUID, PK)
* `user_id` (UUID, FK -> users.id)
* `program_id` (UUID, FK -> workout_programs.id)
* `started_at` (TIMESTAMPTZ)
* `ended_at` (TIMESTAMPTZ)
* `notes` (TEXT)

#### `workout_log_entries`
*The granular data of what was lifted.*
* `id` (UUID, PK)
* `workout_log_id` (UUID, FK -> workout_logs.id)
* `exercise_id` (UUID, FK -> exercises.id)
* `set_number` (INTEGER)
* `weight_kg` (FLOAT)
* `reps_completed` (INTEGER)
* `rpe` (INTEGER) - *Rate of Perceived Exertion (1-10)*

### C. Equipment & QR System

#### `equipments`
*Physical machines in the gym.*
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `name` (VARCHAR)
* `description` (TEXT)
* `qr_code_uuid` (UUID, Unique) - *The string stored in the QR code*
* `video_url` (VARCHAR) - *The video shown when scanned*
* `status` (ENUM: 'active', 'maintenance', 'broken')
* `timestamps`

### D. Marketplace (Pre-Order) System

#### `product_categories`
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `name` (VARCHAR)
* `image_url` (VARCHAR)

#### `products`
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `category_id` (UUID, FK -> product_categories.id)
* `name` (VARCHAR)
* `description` (TEXT)
* `image_url` (VARCHAR)
* `price` (DECIMAL)
* `stock_quantity` (INTEGER)
* `is_active` (BOOLEAN)
* `timestamps`

#### `orders`
* `id` (UUID, PK)
* `gym_id` (UUID, FK -> gyms.id)
* `user_id` (UUID, FK -> users.id)
* `order_number` (VARCHAR, Unique)
* `total_amount` (DECIMAL)
* `status` (ENUM: 'pending_approval', 'prepared', 'completed', 'cancelled')
* `timestamps`

#### `order_items`
* `id` (UUID, PK)
* `order_id` (UUID, FK -> orders.id)
* `product_id` (UUID, FK -> products.id)
* `quantity` (INTEGER)
* `unit_price` (DECIMAL) - *Freezes price at time of order*

---

## 3. Key Relationships & Logic
1.  **Strict Data Isolation:** Every query from the Backend MUST filter by `gym_id` to prevent users seeing data from other gyms.
2.  **Flexible Workouts:** By separating `Exercises` (Generic) from `ProgramExercises` (Specific instructions), trainers can reuse the same library entry for High Reps, Low Reps, or HIIT variants without duplication.
3.  **QR Logic:** When Mobile App scans a QR -> API looks up `equipments` by `qr_code_uuid` -> Returns `video_url` and `description`.
4.  **Marketplace:** Since there is no payment gateway, the `Orders` status flow is critical. The Admin dashboard must allow Gym Owners to manually mark an order as "Completed" when the user pays cash/card at the desk and picks up the item.
