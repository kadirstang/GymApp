UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{workoutLogs}',
  '{"create": true, "read": true, "update": true, "delete": true}'::jsonb
)
WHERE name = 'GymOwner';

UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{workoutLogs}',
  '{"create": true, "read": true, "update": true, "delete": false}'::jsonb
)
WHERE name = 'Trainer';

SELECT name, permissions FROM roles WHERE name IN ('GymOwner', 'Trainer');
