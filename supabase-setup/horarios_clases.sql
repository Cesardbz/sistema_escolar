-- Script para crear la tabla de horarios de clases en Supabase
CREATE TABLE IF NOT EXISTS horarios_clases (
    id_horario SERIAL PRIMARY KEY,
    id_aula INT NOT NULL REFERENCES grados_secciones(id_aula) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL, -- 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    materia VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar permisos de lectura/escritura
ALTER TABLE horarios_clases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" 
ON horarios_clases 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
