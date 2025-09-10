-- 🔒 Gym Role Constraint
-- SuperAdmin kullanıcılar gymId'ye sahip olamaz
-- Diğer tüm roller gymId'ye sahip olmalı

-- Constraint ekle
ALTER TABLE users
ADD CONSTRAINT check_gym_role_consistency
CHECK (
  (role = 'SUPER_ADMIN' AND "gymId" IS NULL) OR
  (role != 'SUPER_ADMIN' AND "gymId" IS NOT NULL)
);
