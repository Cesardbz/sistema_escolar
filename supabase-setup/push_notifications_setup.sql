-- 1. Agregar columna push_token a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Crear una tabla para almacenar el historial de notificaciones enviadas (opcional)
CREATE TABLE IF NOT EXISTS notificaciones_enviadas (
  id SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Habilitar la extensión de solicitudes HTTP en Supabase si no está habilitada
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Nota de integración:
-- Para automatizar las notificaciones de asistencia, puedes configurar un Webhook en la sección
-- Database -> Webhooks de Supabase. Este webhook debe apuntar a la URL de tu Edge Function
-- (ej: https://[YOUR-PROJECT-ID].supabase.co/functions/v1/send-push-notification)
-- y dispararse ante inserciones (INSERT) en la tabla 'asistencias'.
