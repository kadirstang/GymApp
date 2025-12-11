# 🏋️ GymOS - Gym Management SaaS Platform

## 📌 Proje Özeti

**GymOS**, spor salonları için kapsamlı bir SaaS yönetim platformudur. Multi-tenant mimari ile her spor salonu kendi izole ortamında çalışır.

**Hedef Kullanıcılar:**
- 🏢 **Gym Owner**: Salon sahibi (tam yetki)
- 👨‍🏫 **Trainer**: Antrenör (öğrenci yönetimi + içerik oluşturma)
- 🏃 **Student**: Üye (mobil uygulama ile antrenman takibi)

---

## 🎯 Ana Özellikler

### 1. Çok Rollü Kullanıcı Sistemi
- **Role-Based Access Control (RBAC)**: JSON permission system
- **Gym İzolasyonu**: Her salon kendi verilerini görür
- **Trainer-Student Eşleştirme**: Özel ders takibi

### 2. Antrenman Yönetim Sistemi
- **Egzersiz Kütüphanesi**: Video destekli egzersiz veritabanı
- **Program Builder**: Sets, Reps, RPE, Rest time ile esnek program oluşturma
- **Workout Logging**: Gerçek zamanlı antrenman kaydı
- **Progress Tracking**: Vücut ölçümleri ve gelişim takibi

### 3. Ekipman & QR Sistemi
- **QR Code**: Her ekipman için QR kod oluşturma
- **Video Eğitim**: QR taraması ile nasıl kullanılır videosu
- **Durum Takibi**: active, maintenance, broken

### 4. Dahili Marketplace (Ön Sipariş Sistemi)
- **⭐ ÖNEMLİ**: Sanal POS YOK! Sadece ön sipariş + elden teslimat
- **Ürün Vitrin**: Supplement, ekipman, aksesuar
- **Kategori Yönetimi**: Ürün kategorileri
- **Stok Takibi**: Gerçek zamanlı stok güncelleme
- **Sipariş Akışı**: pending_approval → prepared → completed (elden teslim)
- **Ödeme**: Salon içinde nakit/kart (online ödeme YOK)

---

## 🏗️ Teknik Mimari

### Tech Stack
```
├── DevOps
│   ├── Docker (PostgreSQL container)
│   └── ⚠️ TODO: Backend + Frontend Dockerization
│       └── Şu anda: Local development (npm run dev)
│       └── Gelecek: Docker Compose ile full stack
├── Database
│   └── PostgreSQL 16.10 (Alpine)
│       ├── JSONB support (roles.permissions)
│       ├── JSONB planned (order metadata, workout analytics)
│       └── UUID primary keys
├── Backend
│   ├── Node.js 22.13.0
│   ├── Express.js 4.21.1
│   ├── TypeScript 5.9.3 (Hybrid JS/TS)
│   ├── Prisma ORM 5.22.0
│   └── JWT Authentication
├── Frontend Web (Admin Dashboard)
│   ├── Next.js 14.2.33 (App Router)
│   ├── React 19.x
│   ├── TypeScript 5.x
│   ├── Tailwind CSS 3.x
│   └── Axios (API client)
└── Frontend Mobile (Member App)
    ├── React Native (Planned)
    ├── Expo (Planned)
    └── Mobil workout tracking
```

### Klasör Yapısı
```
gymapp/
├── backend/                 # Express + TypeScript backend
│   ├── server.js           # Main server (JS)
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # DB migrations
│   └── src/
│       ├── controllers/    # Request handlers (TS)
│       ├── middleware/     # Auth, RBAC, validation
│       ├── routes/         # API routes
│       ├── utils/          # Helpers
│       └── types/          # TypeScript types
├── frontend-admin/         # Next.js web dashboard
│   └── src/
│       ├── app/           # Next.js pages
│       ├── components/    # React components
│       ├── contexts/      # Auth, Toast contexts
│       ├── lib/          # API client, utils
│       └── types/        # TypeScript types
├── frontend-mobile/        # React Native app (Planned)
│   └── GymOS/
└── AGENT/                 # 🎯 Documentation (you are here)
    ├── PROJECT.md         # Bu dosya
    ├── BACKEND.md         # Backend architecture
    ├── API.md             # API endpoints
    ├── FRONTEND-WEB.md    # Web dashboard
    ├── FRONTEND-MOBILE.md # Mobile app (planned)
    ├── TASKS.md           # Current & future tasks
    └── RULES.md           # Development rules
```

---

## 🗄️ Database Schema

### Core Tables (16 total)

#### A. User & Auth
- `gyms` - Tenant table (multi-tenant root)
- `roles` - GymOwner, Trainer, Student + JSONB permissions
- `users` - User accounts (linked to gym + role)
- `user_measurements` - Body stats over time

#### B. Training System
- `trainer_matches` - Trainer-Student relationships
- `exercises` - Exercise library (video_url, muscle_group)
- `workout_programs` - Program definitions
- `program_exercises` - Sets/reps per exercise in program
- `workout_logs` - Workout session records
- `workout_log_entries` - Actual lifted weights per set

#### C. Equipment
- `equipments` - Physical machines with QR codes

#### D. Marketplace
- `product_categories` - Product categorization
- `products` - Products with stock and price
- `orders` - Order headers
- `order_items` - Order line items

**Key Features:**
- ✅ UUID primary keys (scalability, security)
- ✅ Soft delete (`deleted_at` timestamp)
- ✅ Audit timestamps (`created_at`, `updated_at`)
- ✅ JSONB for flexible data (`roles.permissions`)
- ✅ Foreign key constraints with CASCADE
- ✅ Multi-tenant isolation (`gym_id` on all tables)

---

## 🔐 Güvenlik & İzolasyon

### 1. Authentication
- **JWT Tokens**: Access (7d) + Refresh (30d)
- **bcrypt**: Password hashing (10 rounds)
- **Token Invalidation**: Logout blacklist

### 2. Authorization (RBAC)
- **Permission Format**: `resource.action` (e.g., `users.create`)
- **Role-Based**: JSON permission check
- **Middleware**: `requirePermission()`, `requireRole()`

### 3. Data Isolation
- **Gym Scoping**: Every query filters by `gym_id`
- **Middleware**: `enforceGymIsolation()`
- **Cross-Gym Prevention**: Resource ownership verification

### 4. Validation
- **express-validator**: Request validation
- **Prisma**: Schema-level constraints
- **Custom Errors**: ValidationError, NotFoundError, ForbiddenError

---

## 🚀 Tamamlanan Fazlar

### ✅ Faz 1: Altyapı (1 Aralık 2025)
- Docker + PostgreSQL setup
- Backend temel yapı (Express + Prisma)
- Database schema + migrations
- TypeScript hybrid setup (JS/TS mix)
- Seed data (3 test users)

### ✅ Faz 2: Temel Modüller (1-2 Aralık 2025)
- JWT authentication system
- Role-based authorization (RBAC)
- Gym isolation middleware
- User management
- Trainer-student matching

### ✅ Faz 3-5: Core Features (2-3 Aralık 2025)
- Exercise library (CRUD + search)
- Workout programs (builder)
- Program exercises (nested CRUD)
- Workout logging (real-time tracking)
- Equipment management (QR generation)
- Product + Categories (marketplace)
- Order system (status lifecycle)

### ✅ Faz 6: Frontend Web Dashboard (3-11 Aralık 2025)
- Next.js 14 project setup
- Authentication UI (login, protected routes)
- Dashboard layout (sidebar navigation)
- Role-based UI (GymOwner vs Trainer menus)
- Pages: Dashboard, Exercises, Programs, Users, My Students
- API client with Axios
- TypeScript type definitions

---

## 🎯 Aktif Geliştirme (11-12 Aralık 2025)

### 🔄 Devam Eden: Role Separation
**Hedef:** GymOwner ve Trainer rollerini UI'da net ayırma

**Tamamlanan:**
- ✅ Backend: Exercise.createdBy field
- ✅ Backend: Program visibility system (isPublic)
- ✅ Frontend: Role-based navigation (Products gizli for Trainer)
- ✅ Frontend: Permission-based edit buttons
- ✅ Frontend: My Students page (Trainer için)
- ✅ Frontend: Add student modal (trainer-student matching)
- ✅ Frontend: Program assignment modal

**Sorunlar Çözüldü:**
- ✅ Program isPublic backend'de işlenmiyordu → Düzeltildi
- ✅ My Students sayfası öğrenci ekleyemiyordu → Düzeltildi
- ✅ Fetch URL'de /api/api double prefix → Düzeltildi

**Optimizasyon Gerekiyor:**
- ⏳ My Students program assignment flow
- ⏳ Filtering performance

### 📋 Sıradaki Görevler (Öncelik Sırasına Göre)

1. **Program Atama Optimizasyonu**
   - My Students sayfası UX iyileştirme
   - Program seçim dropdown filtering
   - Performance optimization

2. **Ürünler Sayfası (Products)**
   - CRUD operations UI
   - Kategori filtreleme
   - Stok takibi
   - Fotoğraf upload
   - Aktif/Pasif toggle

3. **Ayarlar Sayfası (Settings)**
   - Profil düzenleme (avatar, password)
   - Gym bilgileri (name, address, logo)
   - Roller & Yetkiler yönetimi (GymOwner only)
   - Bildirim tercihleri

4. **Dashboard İyileştirmeleri**
   - Gerçek zamanlı istatistikler
   - Chart/graph entegrasyonu
   - Quick actions fonksiyonellik

---

## 🔮 Gelecek Özellikler (Roadmap)

### Frontend Mobile (React Native)
- Student workout tracking
- QR code scanner (equipment videos)
- Progress tracking (measurements, photos)
- Order management (marketplace)
- Trainer messaging

### Backend Enhancements
- WebSocket (real-time notifications)
- File upload (S3 integration for images)
- Email notifications (workout reminders)
- Analytics dashboard (charts, reports)
- Export functionality (PDF reports)

### PostgreSQL NoSQL Features (İleride)
1. **Order Metadata** (JSONB):
   - İptal nedenleri
   - Ödeme notları
   - Teslimat detayları

2. **Workout Analytics** (JSONB):
   - Set başarı oranları
   - Form notları
   - Tempo tracking

3. **User Settings** (JSONB):
   - Bildirim tercihleri
   - Tema (dark/light)
   - Dil seçimi

---

## 📊 Sistem Durumu

### Backend
- ✅ **API Endpoints**: 54/54 çalışıyor
- ✅ **Test Coverage**: 100% (54 test passing)
- ✅ **Database**: 16 table, migration applied
- ✅ **Auth**: JWT working
- ✅ **RBAC**: Permission system active
- ✅ **Gym Isolation**: Multi-tenant working

### Frontend Web
- ✅ **Pages**: 8/15 tamamlandı
- ✅ **Auth Flow**: Login, protected routes
- ✅ **API Integration**: Axios client ready
- ✅ **Type Safety**: Full TypeScript
- ⏳ **Role Separation**: 80% complete
- ⏳ **CRUD UI**: 60% complete

### Frontend Mobile
- ⏳ **Planned**: Henüz başlanmadı

---

## 🤝 Katkı & Geliştirme Kuralları

Detaylı kurallar için: `AGENT/RULES.md`

**Kısa Özet:**
1. TypeScript strict mode (yeni kod için)
2. Prisma migrations always
3. Gym isolation her query'de
4. Permission check her endpoint'te
5. UUID kullan, auto-increment kullanma
6. Soft delete (`deleted_at`)
7. API response standardı: `{ success, message, data }`

---

## 📞 İletişim & Dokümantasyon

**Ana Kaynaklar:**
- `AGENT/BACKEND.md` - Backend architecture, middleware, utils
- `AGENT/API.md` - Complete API documentation
- `AGENT/FRONTEND-WEB.md` - Next.js dashboard details
- `AGENT/TASKS.md` - Aktif ve gelecek görevler

**Test Kullanıcıları:**
```
GymOwner: owner@testgym.com / password123
Trainer:  trainer@testgym.com / password123
Student:  student@testgym.com / password123
```

**Portlar:**
```
PostgreSQL: 5432
Backend:    3001
Frontend:   3002
```

---

**Son Güncelleme:** 12 Aralık 2025
**Durum:** 🟢 Aktif Geliştirme
**Versiyon:** 0.6.0 (Frontend Web - Role Separation Phase)
