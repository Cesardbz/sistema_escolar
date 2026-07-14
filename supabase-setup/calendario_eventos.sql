-- Script para crear la tabla de eventos escolares en Supabase
CREATE TABLE IF NOT EXISTS eventos_escolares (
    id_evento SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Feriado', 'Examen', 'Reunion', 'Festividad', 'Otro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar permisos de lectura/escritura
ALTER TABLE eventos_escolares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" 
ON eventos_escolares 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
