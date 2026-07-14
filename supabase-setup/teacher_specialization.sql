-- 1. Agregar las nuevas columnas para soportar especialización y tutorías
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS materia_especialidad TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_aula_tutor INT REFERENCES grados_secciones(id_aula) ON DELETE SET NULL;

-- 2. Asignar datos de especialidad y tutoría a los docentes de prueba actuales
-- Buscamos el ID de la clase "3º Primaria A" para asignarla a la profesora Ana Gómez
DO $$
DECLARE
  aula_3p_id INT;
BEGIN
  SELECT id_aula INTO aula_3p_id FROM grados_secciones WHERE grado = '3º Primaria' AND seccion = 'A' LIMIT 1;
  
  -- Ana Gómez (Docente Primaria) -> Asignarle "3º Primaria A"
  IF aula_3p_id IS NOT NULL THEN
    UPDATE usuarios 
    SET id_rol = 5, id_aula_tutor = aula_3p_id, materia_especialidad = NULL 
    WHERE correo = 'ana.gomez@colegio.edu.pe';
  END IF;
END $$;

-- Luis Pérez (Docente Secundaria) -> Asignarle especialidad "Matemáticas y Ciencias Sociales"
UPDATE usuarios 
SET id_rol = 6, materia_especialidad = 'Comunicación y Ciencias Sociales', id_aula_tutor = NULL 
WHERE correo = 'luis.perez@colegio.edu.pe';

-- Marta Soler (Docente Secundaria) -> Asignarle especialidad "Inglés"
UPDATE usuarios 
SET id_rol = 6, materia_especialidad = 'Inglés', id_aula_tutor = NULL 
WHERE correo = 'marta.soler@colegio.edu.pe';
