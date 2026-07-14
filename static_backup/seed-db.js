const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno desde .env manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error("Error: No se encontró el archivo .env");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const baseUrl = env.SUPABASE_URL;
const dbKey = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;

if (!baseUrl || !dbKey) {
  console.error("Error: SUPABASE_URL o credenciales de Supabase no están definidas en el archivo .env");
  process.exit(1);
}

// Helper para hacer peticiones HTTP GET a Supabase
async function getData(table) {
  const url = `${baseUrl}/rest/v1/${table}?select=*`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': dbKey,
      'Authorization': `Bearer ${dbKey}`
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en GET ${table}: ${response.status} ${response.statusText} - ${errText}`);
  }
  return await response.json();
}

// Helper para hacer peticiones HTTP POST a Supabase
async function postData(table, data) {
  const url = `${baseUrl}/rest/v1/${table}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': dbKey,
      'Authorization': `Bearer ${dbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en POST ${table}: ${response.status} ${response.statusText} - ${errText}`);
  }
  return await response.json();
}

// Helper para limpiar tablas en orden correcto para evitar fallos de claves foráneas
async function deleteTable(table, pkColumn) {
  const url = `${baseUrl}/rest/v1/${table}?${pkColumn}=gt.0`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': dbKey,
      'Authorization': `Bearer ${dbKey}`
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    console.warn(`Advertencia al limpiar tabla ${table}: ${response.status} - ${errText}`);
  }
}

async function seed() {
  try {
    console.log("Iniciando la inserción de datos de prueba en Supabase...\n");

    // Limpiar tablas para garantizar un estado limpio (idempotencia)
    console.log("Limpiando datos existentes (evitando conflictos)...");
    await deleteTable('justificaciones', 'id_justificacion');
    await deleteTable('asistencias', 'id_asistencia');
    await deleteTable('estudiante_aula', 'id_estudiante_aula');
    await deleteTable('tarjetas_identificacion', 'id_tarjeta');
    await deleteTable('parentescos', 'id_parentesco');
    await deleteTable('datos_estudiante', 'id_datos_estudiante');
    await deleteTable('usuarios', 'id_usuario');
    await deleteTable('grados_secciones', 'id_aula');
    console.log("   Limpieza completada.");

    // 1. Obtener o insertar tipos de documento
    console.log("\n1. Verificando tipos de documento...");
    let tiposDoc = await getData('tipos_documento');
    if (tiposDoc.length === 0) {
      console.log("   No hay tipos de documento. Insertando...");
      tiposDoc = await postData('tipos_documento', [
        { nombre_documento: 'DNI' },
        { nombre_documento: 'Carnet de Extranjería' },
        { nombre_documento: 'Pasaporte' }
      ]);
      console.log("   Tipos de documento insertados con éxito.");
    } else {
      console.log(`   Se encontraron ${tiposDoc.length} tipos de documento existentes.`);
    }
    
    // Obtener los ids
    const dniId = tiposDoc.find(t => t.nombre_documento === 'DNI').id_tipo_doc;

    // 2. Obtener o insertar roles
    console.log("\n2. Verificando roles...");
    let roles = await getData('roles');
    if (roles.length === 0) {
      console.log("   No hay roles. Insertando...");
      roles = await postData('roles', [
        { nombre_rol: 'Administrativo' },
        { nombre_rol: 'Docente' },
        { nombre_rol: 'Estudiante' },
        { nombre_rol: 'Apoderado' }
      ]);
      console.log("   Roles insertados con éxito.");
    } else {
      console.log(`   Se encontraron ${roles.length} roles existentes.`);
    }

    // Obtener los ids
    const rolAdminId = roles.find(r => r.nombre_rol === 'Administrativo').id_rol;
    const rolDocenteId = roles.find(r => r.nombre_rol === 'Docente').id_rol;
    const rolEstudianteId = roles.find(r => r.nombre_rol === 'Estudiante').id_rol;
    const rolApoderadoId = roles.find(r => r.nombre_rol === 'Apoderado').id_rol;

    // 3. Insertar usuarios
    console.log("\n3. Insertando usuarios...");
    const usuariosToInsert = [
      // Administrador
      { id_tipo_doc: dniId, numero_documento: '12345678', nombres: 'José', apellidos: 'Calasanz', celular: '999888777', direccion: 'Av. Universitaria 123', correo: 'admin@colegio.edu.pe', password: 'admin', id_rol: rolAdminId },
      
      // Docentes
      { id_tipo_doc: dniId, numero_documento: '22222222', nombres: 'Ana', apellidos: 'Gómez', celular: '987654321', direccion: 'Calle Las Flores 456', correo: 'ana.gomez@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
      { id_tipo_doc: dniId, numero_documento: '33333333', nombres: 'Luis', apellidos: 'Pérez', celular: '987654322', direccion: 'Av. Larco 789', correo: 'luis.perez@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
      { id_tipo_doc: dniId, numero_documento: '44444444', nombres: 'Marta', apellidos: 'Soler', celular: '987654323', direccion: 'Calle Lima 101', correo: 'marta.soler@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
      
      // Estudiantes
      { id_tipo_doc: dniId, numero_documento: '55555551', nombres: 'Mateo', apellidos: 'Silva', celular: '955111222', direccion: 'Av. Arequipa 500', correo: 'mateo.silva@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
      { id_tipo_doc: dniId, numero_documento: '55555552', nombres: 'Valentina', apellidos: 'Rivas', celular: '955111223', direccion: 'Calle Tacna 600', correo: 'valentina.rivas@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
      { id_tipo_doc: dniId, numero_documento: '55555553', nombres: 'Joisina', apellidos: 'Limiter', celular: '955111224', direccion: 'Jr. Ica 700', correo: 'joisina.limiter@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
      { id_tipo_doc: dniId, numero_documento: '55555554', nombres: 'Aloya', apellidos: 'Caoma', celular: '955111225', direccion: 'Av. Grau 800', correo: 'aloya.caoma@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
      { id_tipo_doc: dniId, numero_documento: '55555555', nombres: 'Juisisa', apellidos: 'Pérez', celular: '955111226', direccion: 'Jr. Junín 900', correo: 'juisisa.perez@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
      
      // Apoderados
      { id_tipo_doc: dniId, numero_documento: '66666661', nombres: 'Pedro', apellidos: 'Silva', celular: '966111222', direccion: 'Av. Arequipa 500', correo: 'pedro.silva@gmail.com', password: 'password123', id_rol: rolApoderadoId },
      { id_tipo_doc: dniId, numero_documento: '66666662', nombres: 'María', apellidos: 'Rivas', celular: '966111223', direccion: 'Calle Tacna 600', correo: 'maria.rivas@gmail.com', password: 'password123', id_rol: rolApoderadoId }
    ];
    const usuarios = await postData('usuarios', usuariosToInsert);
    console.log(`   ${usuarios.length} Usuarios insertados con éxito.`);

    // Obtener los ids generados para los usuarios
    const mapUser = (numDoc) => usuarios.find(u => u.numero_documento === numDoc).id_usuario;

    const idPedro = mapUser('66666661');
    const idMaria = mapUser('66666662');
    const idMateo = mapUser('55555551');
    const idValentina = mapUser('55555552');
    const idJoisina = mapUser('55555553');
    const idAloya = mapUser('55555554');
    const idJuisisa = mapUser('55555555');

    // 4. Insertar datos_estudiante
    console.log("\n4. Insertando datos médicos de estudiantes...");
    await postData('datos_estudiante', [
      { id_usuario: idMateo, tipo_sangre: 'O+', seguro_medico: 'EsSalud', observaciones_medicas: 'Ninguna' },
      { id_usuario: idValentina, tipo_sangre: 'A+', seguro_medico: 'SIS', observaciones_medicas: 'Alérgica a la penicilina' },
      { id_usuario: idJoisina, tipo_sangre: 'O-', seguro_medico: 'Particular', observaciones_medicas: 'Ninguna' },
      { id_usuario: idAloya, tipo_sangre: 'B+', seguro_medico: 'EsSalud', observaciones_medicas: 'Ninguna' },
      { id_usuario: idJuisisa, tipo_sangre: 'AB+', seguro_medico: 'SIS', observaciones_medicas: 'Usa lentes de medida' }
    ]);
    console.log("   Datos médicos insertados.");

    // 5. Insertar parentescos
    console.log("\n5. Insertando parentescos (apoderado-estudiante)...");
    await postData('parentescos', [
      { id_apoderado: idPedro, id_estudiante: idMateo, parentesco: 'Padre' },
      { id_apoderado: idMaria, id_estudiante: idValentina, parentesco: 'Madre' }
    ]);
    console.log("   Parentescos insertados.");

    // 6. Insertar tarjetas_identificacion
    console.log("\n6. Insertando tarjetas de identificación...");
    await postData('tarjetas_identificacion', [
      { id_usuario: idMateo, codigo_barra: 'CAL-2026-0001', estado: true },
      { id_usuario: idValentina, codigo_barra: 'CAL-2026-0002', estado: true },
      { id_usuario: idJoisina, codigo_barra: 'CAL-2026-0003', estado: true },
      { id_usuario: idAloya, codigo_barra: 'CAL-2026-0004', estado: false }
    ]);
    console.log("   Tarjetas de identificación insertadas.");

    // 7. Insertar grados_secciones (Aulas)
    console.log("\n7. Insertando grados y secciones...");
    const aulas = await postData('grados_secciones', [
      { grado: '3º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
      { grado: '5º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 },
      { grado: '1º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 },
      { grado: '4º Secundaria', seccion: 'B', nivel: 'Secundaria', anio_academico: 2026 },
      { grado: '2º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 }
    ]);
    console.log("   Grados y secciones insertados.");

    const idAula3P = aulas.find(a => a.grado === '3º Primaria').id_aula;
    const idAula5S = aulas.find(a => a.grado === '5º Secundaria').id_aula;
    const idAula1S = aulas.find(a => a.grado === '1º Secundaria').id_aula;
    const idAula4S = aulas.find(a => a.grado === '4º Secundaria').id_aula;

    // 8. Asignar estudiantes a aulas (estudiante_aula)
    console.log("\n8. Asignando estudiantes a aulas...");
    await postData('estudiante_aula', [
      { id_estudiante: idMateo, id_aula: idAula3P },
      { id_estudiante: idAloya, id_aula: idAula3P },
      { id_estudiante: idValentina, id_aula: idAula5S },
      { id_estudiante: idJoisina, id_aula: idAula1S },
      { id_estudiante: idJuisisa, id_aula: idAula4S }
    ]);
    console.log("   Asignación de estudiantes completada.");

    // 9. Insertar asistencias (con todas las llaves consistentes para evitar error PGRST102)
    console.log("\n9. Insertando historial de asistencia...");
    await postData('asistencias', [
      { id_usuario: idMateo, fecha: '2026-07-09', hora_entrada: '08:05:00', hora_salida: '14:00:00', estado_entrada: 'Presente', time_note: null },
      { id_usuario: idValentina, fecha: '2026-07-09', hora_entrada: '08:12:00', hora_salida: '14:30:00', estado_entrada: 'Presente', time_note: null },
      { id_usuario: idJoisina, fecha: '2026-07-09', hora_entrada: '08:12:00', hora_salida: null, estado_entrada: 'Tardanza', time_note: '08:12' },
      
      { id_usuario: idMateo, fecha: '2026-07-08', hora_entrada: '08:02:00', hora_salida: '14:05:00', estado_entrada: 'Presente', time_note: null },
      { id_usuario: idValentina, fecha: '2026-07-08', hora_entrada: '08:15:00', hora_salida: '14:30:00', estado_entrada: 'Tardanza', time_note: '08:15' },
      { id_usuario: idJoisina, fecha: '2026-07-08', hora_entrada: '00:00:00', hora_salida: null, estado_entrada: 'Ausente', time_note: null },
      { id_usuario: idAloya, fecha: '2026-07-08', hora_entrada: '08:04:00', hora_salida: '14:00:00', estado_entrada: 'Presente', time_note: null },
      { id_usuario: idJuisisa, fecha: '2026-07-08', hora_entrada: '08:01:00', hora_salida: '14:30:00', estado_entrada: 'Presente', time_note: null },
      
      { id_usuario: idMateo, fecha: '2026-07-07', hora_entrada: '00:00:00', hora_salida: null, estado_entrada: 'Ausente', time_note: null },
      { id_usuario: idValentina, fecha: '2026-07-07', hora_entrada: '00:00:00', hora_salida: null, estado_entrada: 'Ausente', time_note: null },
      { id_usuario: idJoisina, fecha: '2026-07-07', hora_entrada: '00:00:00', hora_salida: null, estado_entrada: 'Ausente', time_note: null }
    ]);
    console.log("   Historial de asistencia insertado.");

    // 10. Insertar justificaciones
    console.log("\n10. Insertando justificaciones...");
    await postData('justificaciones', [
      { id_estudiante: idJoisina, id_apoderado: null, fecha_inasistencia: '2026-07-08', motivo: 'Cita médica dental programada.', estado: 'Pendiente' },
      { id_estudiante: idMateo, id_apoderado: idPedro, fecha_inasistencia: '2026-07-07', motivo: 'Fuerte gripe con fiebre.', estado: 'Aprobado' }
    ]);
    console.log("   Justificaciones insertadas.");

    console.log("\n¡Felicidades! Se han cargado exitosamente todos los datos de prueba en tu base de datos de Supabase.");
  } catch (error) {
    console.error("\nError durante la carga de datos:", error.message);
  }
}

seed();
