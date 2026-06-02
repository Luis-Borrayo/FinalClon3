-- ============================================================
-- Migración: mover User y Role de grupo5_parqueo → auth
-- Ejecutar UNA VEZ en Neon SQL Editor
-- ============================================================

-- 1. Crear schema auth si no existe
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Mover la tabla User al schema auth
ALTER TABLE IF EXISTS grupo5_parqueo."User" SET SCHEMA auth;

-- 3. Mover la secuencia/enum Role si existe como tipo
-- (PostgreSQL mueve los enums con su tabla automáticamente en la mayoría de casos)
-- Si el enum Role existe en grupo5_parqueo, recrearlo en auth:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'auth' AND t.typname = 'Role') THEN
    CREATE TYPE auth."Role" AS ENUM ('ADMIN', 'SECURITY', 'TEACHER', 'STUDENT', 'VISITOR');
  END IF;
END$$;

-- 4. Verificar resultado
SELECT schemaname, tablename FROM pg_tables
WHERE tablename = 'User'
ORDER BY schemaname;
