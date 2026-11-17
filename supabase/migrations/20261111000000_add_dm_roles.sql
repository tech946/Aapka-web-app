INSERT INTO roles (id, name, display_name, level, is_active, created_at, updated_at)
VALUES
  (81, 'dm_admin', 'DM Admin', 3, true, NOW(), NOW()),
  (82, 'dm_executive', 'DM Executive', 4, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

UPDATE roles SET is_active = true, updated_at = NOW() WHERE id IN (81, 82);
