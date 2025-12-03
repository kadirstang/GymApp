# Gym Management System - Proje Görev Listesi

## Proje Özeti
SaaS tabanlı Gym Yönetim Sistemi - Multi-tenant mimarisi ile her spor salonu için izole veri yönetimi.

**Teknoloji Stack:**
- Backend: Node.js + Express (JavaScript + TypeScript hibrit)
- Database: PostgreSQL (UUID primary keys)
- Web Admin: Next.js (TypeScript)
- Mobile: React Native (TypeScript)
- DevOps: Docker + Docker Compose

**Not:** Backend'de hibrit yaklaşım kullanılacak:
- Mevcut temel dosyalar (server.js, config, middleware): JavaScript
- Yeni feature'lar (controllers, services, routes): TypeScript
- `allowJs: true` ile her ikisi de aynı anda çalışır

---

## Faz 1: Altyapı Kurulumu

### 1.1 Geliştirme Ortamı
- [x] Docker ve Docker Compose yapılandırması
- [x] PostgreSQL container kurulumu
- [x] Node.js backend container kurulumu
- [x] Geliştirme için volume mapping yapılandırması

### 1.2 Backend Temel Yapı
- [x] Node.js + Express projesi oluşturma
- [x] Prisma ORM kurulumu ve yapılandırması
- [x] Environment variables (.env) yapılandırması
- [x] Temel klasör yapısı (routes, controllers, middleware, utils)
- [x] Error handling middleware
- [x] CORS yapılandırması

### 1.3 Database Schema
- [x] Prisma schema dosyası oluşturma (context.md'deki schema'ya göre)
- [x] UUID kullanımı için yapılandırma
- [x] Soft delete için deleted_at alanları
- [x] Timestamp alanları (created_at, updated_at)
- [x] İlk migration oluşturma ve uygulama
- [x] Seed data hazırlama (test için örnek gym, roller, kullanıcılar)

### 1.4 TypeScript Setup (Hibrit Yaklaşım)
- [x] TypeScript kurulumu ve tsconfig.json
- [x] Type definitions kurulumu (@types/node, @types/express)
- [x] allowJs: true yapılandırması
- [x] Build script'leri (ts-node-dev veya tsx)
- [x] Yeni dosyalar için .ts şablonları

---

## Faz 2: Temel Modüller

**Başlamadan Önce:**
- [ ] context.md dosyasını oku ve gereksinimleri kontrol et

### 2.1 Authentication & Authorization ✅
- [x] JWT token sistemi
- [x] Kullanıcı kaydı (register)
- [x] Kullanıcı girişi (login)
- [x] Token refresh mekanizması
- [x] Password hashing (bcrypt)
- [x] Auth middleware (token doğrulama)
- [x] Role-based access control (RBAC) middleware
- [x] gym_id bazlı data isolation middleware

### 2.2 User Management ✅
- [x] Kullanıcı CRUD endpoints
- [x] Role atama/güncelleme
- [x] Kullanıcı profil güncelleme
- [x] Avatar upload işlemi (multer ile multipart/form-data)
- [x] User measurements CRUD (boy, kilo, vücut yağ oranı)
- [x] Kullanıcı listesi filtreleme (role, gym bazlı)

### 2.3 Gym Management ✅
- [x] Gym CRUD endpoints
- [x] Gym slug unique kontrolü
- [x] Gym activation/deactivation
- [x] Gym logo upload
- [x] Gym statistics endpoint
- [x] Permission-based access control (RBAC)

### 2.4 Role Management ✅
- [x] Role CRUD endpoints
- [x] Permission yapısı (JSONB)
- [x] Default roller oluşturma (GymOwner, Trainer, Student)
- [x] Role templates (5 template: GymOwner, Trainer, Student, Receptionist, Assistant Trainer)
- [x] Create role from template
- [x] System role protection (cannot rename/delete)
- [x] Role assignment validation (cannot delete role with users)

---

## Faz 3: Training System

**Başlamadan Önce:**
- [x] context.md dosyasını oku ve training system gereksinimlerini kontrol et

### 3.1 Trainer-Student Matching ✅
- [x] Trainer-Student eşleştirme endpoints
- [x] Eşleştirme durumu yönetimi (active, pending, ended)
- [x] Trainer'ın öğrencilerini listeleme
- [x] Student'ın trainer'ını görüntüleme
- [x] Match validation (trainer ve student rolü kontrolü)
- [x] Duplicate match prevention

### 3.2 Exercise Library ✅
- [x] Exercise CRUD endpoints
- [x] Gym bazlı exercise yönetimi
- [x] Video URL ekleme
- [x] Muscle group filtreleme
- [x] Equipment association
- [x] Search functionality
- [x] Pagination support
- [x] Duplicate name prevention
- [x] Exercise statistics endpoint

### 3.3 Workout Programs ✅
- [x] Program CRUD endpoints
- [x] Program atama (trainer -> student)
- [x] Difficulty level filtreleme
- [x] Program kopyalama (template özelliği)
- [x] Search functionality (name, description)
- [x] Filter by creator and assigned user
- [x] Program statistics endpoint
- [x] Pagination support
- [x] Soft delete with gym isolation

### 3.4 Program Exercises ✅
- [x] Program içine exercise ekleme
- [x] Set, rep, rest time yapılandırması
- [x] Exercise sıralama (order_index)
- [x] Notlar ekleme
- [x] Duplicate exercise prevention
- [x] Automatic order index management
- [x] Bulk reorder functionality
- [x] Individual order update with auto-shift
- [x] Soft delete with order rebalancing
- [x] Reps support for ranges (e.g., "10-12")

### 3.5 Workout Logging ✅
- [x] Workout başlatma/bitirme
- [x] Set bazlı veri girişi (weight, reps, RPE)
- [x] Geçmiş workout logları görüntüleme
- [x] Progress tracking ve grafikler için veri hazırlama
- [x] Active workout prevention
- [x] Validation for workout operations
- [x] Exercise verification in program
- [x] Workout statistics endpoint
- [x] Filter workout logs by program
- [x] Set entry CRUD operations

---

## Faz 4: Equipment & QR System

**Başlamadan Önce:**
- [x] context.md dosyasını oku ve equipment/QR system gereksinimlerini kontrol et

### 4.1 Equipment Management ✅
- [x] Equipment CRUD endpoints
- [x] QR code UUID üretimi (auto-generated on creation)
- [x] Equipment status yönetimi (active, maintenance, broken)
- [x] Video URL ekleme
- [x] Search and filtering by status
- [x] Pagination support
- [x] Duplicate name prevention
- [x] Soft delete with exercise relationship check
- [x] Equipment statistics endpoint
- [x] QR code scanning endpoint

### 4.2 QR Code Integration ✅
- [x] QR scan endpoint (UUID ile equipment bilgisi döndürme)
- [x] Video URL ve açıklama döndürme
- [x] QR code görsel oluşturma (qrcode library - PNG base64 data URL)
- [x] Status-based warnings (maintenance/broken)
- [x] Invalid QR code handling
- [x] QR code UUID consistency
- [x] Student role permissions for QR scanning

---

## Faz 5: Marketplace (Pre-Order System)

**Başlamadan Önce:**
- [ ] context.md dosyasını oku ve marketplace/ödeme akışını kontrol et

### 5.1 Product Management
- [ ] Category CRUD endpoints
- [ ] Product CRUD endpoints
- [ ] Stock quantity yönetimi
- [ ] Product activation/deactivation
- [ ] Product image upload

### 5.2 Order System
- [ ] Order oluşturma
- [ ] Order item ekleme
- [ ] Stock kontrolü
- [ ] Order status yönetimi (pending_approval, prepared, completed, cancelled)
- [ ] Order number unique generation
- [ ] User order history
- [ ] Admin order management (approval, status update)

---

## Faz 6: Frontend - Admin Dashboard (Next.js)

**Başlamadan Önce:**
- [ ] context.md dosyasını oku ve admin dashboard gereksinimlerini kontrol et
- [ ] Backend API endpoint'lerinin hazır olduğunu doğrula

### 6.1 Temel Yapı
- [ ] Next.js projesi oluşturma (TypeScript)
- [ ] Tailwind CSS veya UI kütüphanesi entegrasyonu
- [ ] API client yapılandırması (axios/fetch)
- [ ] Authentication state management (Context/Zustand/Redux)
- [ ] Protected routes
- [ ] Layout yapısı (sidebar, navbar)

### 6.2 Auth Pages
- [ ] Login sayfası
- [ ] Register sayfası (sadece GymOwner için veya invite sistemi)
- [ ] Forgot password (optional)

### 6.3 Dashboard Pages
- [ ] Ana dashboard (özet istatistikler)
- [ ] Kullanıcı yönetimi sayfası
- [ ] Trainer-Student matching sayfası
- [ ] Exercise library sayfası
- [ ] Workout program oluşturma/düzenleme sayfası
- [ ] Equipment yönetimi sayfası
- [ ] Marketplace (ürün & sipariş yönetimi) sayfası
- [ ] Settings sayfası

---

## Faz 7: Mobile App (React Native)

**Başlamadan Önce:**
- [ ] context.md dosyasını oku ve mobile app gereksinimlerini kontrol et
- [ ] Backend API endpoint'lerinin hazır olduğunu doğrula

### 7.1 Temel Yapı
- [ ] React Native projesi oluşturma (TypeScript)
- [ ] Navigation yapılandırması (React Navigation)
- [ ] API client yapılandırması
- [ ] Authentication state management
- [ ] UI component library (Native Base / React Native Paper)

### 7.2 Auth Screens
- [ ] Login ekranı
- [ ] Register ekranı

### 7.3 Student Screens
- [ ] Ana ekran (bugünkü program)
- [ ] Profil & measurements ekranı
- [ ] Atanan programlar listesi
- [ ] Workout başlatma ekranı
- [ ] Set logging ekranı (weight, reps, RPE)
- [ ] Progress tracking (grafikler)
- [ ] Marketplace (ürünler, sipariş verme)
- [ ] QR Scanner ekranı (equipment video görüntüleme)

### 7.4 Trainer Screens (optional - başlangıçta sadece web üzerinden)
- [ ] Öğrenci listesi
- [ ] Program atama ekranı
- [ ] Öğrenci progress takibi

---

## Faz 8: Testing & Deployment

**Başlamadan Önce:**
- [ ] Tüm önceki fazların tamamlandığını doğrula
- [ ] Production gereksinimleri için context.md'yi kontrol et

### 8.1 Backend Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] API endpoint tests
- [ ] Postman/Thunder Client collection

### 8.2 Frontend Testing
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (optional - Cypress)

### 8.3 Deployment
- [ ] Production Docker Compose yapılandırması
- [ ] Environment variables production ayarları
- [ ] SSL/TLS yapılandırması
- [ ] Database backup stratejisi
- [ ] Logging ve monitoring (optional - PM2, Winston)

---

## Bonus Features (İleriye Yönelik)

- [ ] Push notifications (workout reminder, order updates)
- [ ] Social features (student-student messaging)
- [ ] Nutrition tracking
- [ ] Payment gateway entegrasyonu (Stripe/iyzico)
- [ ] Real-time chat (Socket.io)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Analytics dashboard (charts, reports)
- [ ] Mobile app için offline support
- [ ] Exercise video player improvements
- [ ] AI-powered workout recommendations

---

## Notlar

### Kritik Noktalar:
1. **Data Isolation:** Her API çağrısında gym_id kontrolü ŞART
2. **UUID Kullanımı:** Tüm primary key'ler UUID olmalı
3. **Soft Delete:** Tüm tablolarda deleted_at ile soft delete
4. **Timestamps:** Tüm tablolarda created_at ve updated_at
5. **QR System:** qr_code_uuid unique olmalı ve equipment'a bağlı video URL döndürülmeli
6. **Marketplace:** Ödeme entegrasyonu yok, sadece sipariş takibi ve admin onayı

### Geliştirme Sırası Önceliği:
1. Backend + Database (Faz 1-2)
2. Training System (Faz 3) - Core feature
3. Admin Dashboard (Faz 6) - Trainer'ların kullanması için
4. Mobile App (Faz 7) - Student'ların kullanması için
5. Equipment & Marketplace (Faz 4-5) - Ek özellikler
