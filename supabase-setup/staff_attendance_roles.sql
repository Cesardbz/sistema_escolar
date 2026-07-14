-- 1. Insertar nuevos roles si no existen
INSERT INTO roles (id_rol, nombre_rol) VALUES
  (5, 'Docente Primaria'),
  (6, 'Docente Secundaria'),
  (7, 'Auxiliar'),
  (8, 'Limpieza')
ON CONFLICT (id_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol;

-- 2. Actualizar el rol 'Docente' general para mapear a los existentes (o mantenerlos y darles una de las nuevas clasificaciones)
-- En el reset de la BD de la web se asignaba id_rol = 2 a los docentes Ana, Luis y Marta.
-- Vamos a asignar:
-- Ana Gómez (id_rol 2 -> 5: Docente Primaria)
-- Luis Pérez (id_rol 2 -> 6: Docente Secundaria)
-- Marta Soler (id_rol 2 -> 6: Docente Secundaria)
UPDATE usuarios SET id_rol = 5 WHERE correo = 'ana.gomez@colegio.edu.pe';
UPDATE usuarios SET id_rol = 6 WHERE correo IN ('luis.perez@colegio.edu.pe', 'marta.soler@colegio.edu.pe');

-- 3. Crear usuarios de prueba para Administrativo, Auxiliar y Limpieza
-- Nota: Primero obtenemos el id_tipo_doc para DNI (suele ser 1).
INSERT INTO usuarios (id_tipo_doc, numero_documento, nombres, apellidos, celular, correo, password, id_rol) VALUES
  (1, '77777771', 'Carlos', 'Administrativo de Prueba', '977111222', 'carlos.admin@colegio.edu.pe', 'password123', 1),
  (1, '77777772', 'Lucía', 'Auxiliar de Patio', '977111223', 'lucia.auxiliar@colegio.edu.pe', 'password123', 7),
  (1, '77777773', 'Roberto', 'Personal de Limpieza', '977111224', 'roberto.limpieza@colegio.edu.pe', 'password123', 8)
ON CONFLICT (numero_documento) DO NOTHING;

-- 4. Asignar Tarjetas de Identificación (Credenciales de barra) para el nuevo personal
INSERT INTO tarjetas_identificacion (id_usuario, codigo_barra, estado)
SELECT id_usuario, 'CAL-STAFF-' || numero_documento, true
FROM usuarios
WHERE numero_documento IN ('77777771', '77777772', '77777773')
ON CONFLICT (codigo_barra) DO NOTHING;

-- También asignamos tarjetas a los profesores que no tuvieran:
INSERT INTO tarjetas_identificacion (id_usuario, codigo_barra, estado)
SELECT id_usuario, 'CAL-STAFF-' || numero_documento, true
FROM usuarios
WHERE correo IN ('ana.gomez@colegio.edu.pe', 'luis.perez@colegio.edu.pe', 'marta.soler@colegio.edu.pe')
ON CONFLICT (codigo_barra) DO NOTHING;
