// Base de Datos Conectada a Supabase - Sistema de Asistencia Escolar

// Datos iniciales de fallback local por si falla la conexión
const INITIAL_STUDENTS = [
  { id: 'est-01', name: 'Mateo Silva', grade: '3º Primaria', photo: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150' },
  { id: 'est-02', name: 'Valentina Rivas', grade: '5º Secundaria', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
  { id: 'est-03', name: 'Joisina Limiter', grade: '1º Secundaria', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150' },
  { id: 'est-04', name: 'Aloya Caoma', grade: '3º Primaria', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { id: 'est-05', name: 'Juisisa Pérez', grade: '4º Secundaria', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' }
];

const INITIAL_TEACHERS = [
  { id: 'doc-01', name: 'Ana Gómez', subject: 'Matemáticas y Ciencias', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
  { id: 'doc-02', name: 'Luis Pérez', subject: 'Comunicación y Ciencias Sociales', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150' },
  { id: 'doc-03', name: 'Marta Soler', subject: 'Inglés', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150' }
];

const INITIAL_COURSES = [
  { id: 'cur-01', name: 'Matemáticas', grade: '3º Primaria', teacherId: 'doc-01', studentIds: ['est-01', 'est-04'] },
  { id: 'cur-02', name: 'Álgebra', grade: '5º Secundaria', teacherId: 'doc-02', studentIds: ['est-02'] },
  { id: 'cur-03', name: 'Comunicación', grade: '1º Secundaria', teacherId: 'doc-02', studentIds: ['est-03'] },
  { id: 'cur-04', name: 'Inglés Técnico', grade: '4º Secundaria', teacherId: 'doc-03', studentIds: ['est-05'] }
];

// Caches en memoria local sincronizados con Supabase
let students = [];
let teachers = [];
let courses = [];
let logs = [];
let justifications = [];
let cards = [];

let supabaseClient = null;
let useLocalFallback = false;

// 1. Cargar variables de entorno desde .env manualmente
async function loadEnvFromUrl() {
  const env = {};
  try {
    const res = await fetch('.env');
    if (!res.ok) return env;
    const text = await res.text();
    text.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
      }
    });
  } catch (e) {
    // Silencioso, usaremos fallback
  }
  return env;
}

// Cargar datos del almacenamiento local (si falla la conexión a Supabase)
function loadLocalFallbackData() {
  const getStorageData = (key, defaultValue) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  };
  
  students = getStorageData('school_students', INITIAL_STUDENTS);
  teachers = getStorageData('school_teachers', INITIAL_TEACHERS);
  courses = getStorageData('school_courses', INITIAL_COURSES);
  
  const INITIAL_ATTENDANCE_LOGS = [
    { id: 'log-01', date: '2026-07-09', time: '08:05', studentId: 'est-01', studentName: 'Mateo Silva', grade: '3º Primaria', course: 'Matemáticas', state: 'Presente', teacherId: 'doc-01', teacherName: 'Ana Gómez' }
  ];
  const INITIAL_JUSTIFICATIONS = [
    { id: 'just-01', studentId: 'est-03', studentName: 'Joisina Limiter', date: '2026-07-08', reason: 'Cita médica dental.', documentName: 'certificado.pdf', status: 'Pendiente' }
  ];
  const INITIAL_CARDS = [
    { id: 'card-01', studentId: 'est-01', codigo_barra: 'CAL-2026-0001', type: 'QR', date: '2026-03-01', estado: true }
  ];

  logs = getStorageData('school_attendance_logs', INITIAL_ATTENDANCE_LOGS);
  justifications = getStorageData('school_justifications', INITIAL_JUSTIFICATIONS);
  cards = getStorageData('school_cards', INITIAL_CARDS);
}

// Guardar en localStorage (modo fallback local)
function saveLocalFallbackData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Carga principal desde Supabase
async function loadDataFromSupabase() {
  const [
    { data: dbUsuarios, error: errU },
    { data: dbEstudianteAula, error: errEA },
    { data: dbGradosSecciones, error: errGS },
    { data: dbTarjetasIdentificacion, error: errTI },
    { data: dbAsistencias, error: errA },
    { data: dbJustificaciones, error: errJ },
    { data: dbRoles, error: errR }
  ] = await Promise.all([
    supabaseClient.from('usuarios').select('*'),
    supabaseClient.from('estudiante_aula').select('*'),
    supabaseClient.from('grados_secciones').select('*'),
    supabaseClient.from('tarjetas_identificacion').select('*'),
    supabaseClient.from('asistencias').select('*'),
    supabaseClient.from('justificaciones').select('*'),
    supabaseClient.from('roles').select('*')
  ]);

  if (errU || errEA || errGS || errTI || errA || errJ || errR) {
    throw new Error("Error al obtener tablas de Supabase");
  }

  const rolEstudianteId = dbRoles.find(r => r.nombre_rol === 'Estudiante')?.id_rol || 3;
  const rolDocenteId = dbRoles.find(r => r.nombre_rol === 'Docente')?.id_rol || 2;

  // 1. Mapear Estudiantes
  students = dbUsuarios
    .filter(u => u.id_rol === rolEstudianteId)
    .map(u => {
      const estAula = dbEstudianteAula.find(ea => ea.id_estudiante === u.id_usuario);
      const aula = estAula ? dbGradosSecciones.find(gs => gs.id_aula === estAula.id_aula) : null;
      const grade = aula ? `${aula.grado} ${aula.seccion}` : 'Sin Grado';
      return {
        id: 'est-' + u.id_usuario,
        name: `${u.nombres} ${u.apellidos}`,
        grade: grade,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombres + '+' + u.apellidos)}&background=3b82f6&color=fff`
      };
    });

  // 2. Mapear Docentes
  teachers = dbUsuarios
    .filter(u => u.id_rol === rolDocenteId)
    .map(u => {
      let subject = 'Docente';
      if (u.nombres.toLowerCase().includes('ana')) subject = 'Matemáticas y Ciencias';
      else if (u.nombres.toLowerCase().includes('luis')) subject = 'Comunicación y Ciencias Sociales';
      else if (u.nombres.toLowerCase().includes('marta')) subject = 'Inglés';
      return {
        id: 'doc-' + u.id_usuario,
        name: `${u.nombres} ${u.apellidos}`,
        subject: subject,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombres + '+' + u.apellidos)}&background=6b46c1&color=fff`
      };
    });

  // 3. Mapear Cursos (in memory)
  const teacherAna = teachers.find(t => t.name.toLowerCase().includes('ana')) || teachers[0];
  const teacherLuis = teachers.find(t => t.name.toLowerCase().includes('luis')) || teachers[1] || teachers[0];
  const teacherMarta = teachers.find(t => t.name.toLowerCase().includes('marta')) || teachers[2] || teachers[0];

  courses = [
    { id: 'cur-01', name: 'Matemáticas', grade: '3º Primaria', teacherId: teacherAna?.id || 'doc-2', studentIds: students.filter(s => s.grade.includes('3º Primaria')).map(s => s.id) },
    { id: 'cur-02', name: 'Álgebra', grade: '5º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: students.filter(s => s.grade.includes('5º Secundaria')).map(s => s.id) },
    { id: 'cur-03', name: 'Comunicación', grade: '1º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: students.filter(s => s.grade.includes('1º Secundaria')).map(s => s.id) },
    { id: 'cur-04', name: 'Inglés Técnico', grade: '4º Secundaria', teacherId: teacherMarta?.id || 'doc-4', studentIds: students.filter(s => s.grade.includes('4º Secundaria')).map(s => s.id) },
    { id: 'cur-05', name: 'Historia', grade: '2º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: students.filter(s => s.grade.includes('2º Secundaria')).map(s => s.id) }
  ];

  // 4. Mapear Tarjetas ID
  cards = dbTarjetasIdentificacion.map(t => {
    return {
      id: String(t.id_tarjeta),
      studentId: 'est-' + t.id_usuario,
      codigo_barra: t.codigo_barra,
      type: t.codigo_barra.startsWith('CAL-') ? 'Barcode' : 'QR',
      date: t.fecha_emision,
      estado: t.estado
    };
  });

  // 5. Mapear Asistencias (Logs)
  logs = dbAsistencias.map(a => {
    const student = students.find(s => s.id === 'est-' + a.id_usuario);
    const studentName = student ? student.name : 'Estudiante Desconocido';
    const grade = student ? student.grade : 'Sin Grado';
    
    let courseName = 'Matemáticas';
    let teacherName = teacherAna?.name || 'Ana Gómez';
    let teacherId = teacherAna?.id || 'doc-2';
    
    if (grade.includes('5º Secundaria')) {
      courseName = 'Álgebra';
      teacherName = teacherLuis?.name || 'Luis Pérez';
      teacherId = teacherLuis?.id || 'doc-3';
    } else if (grade.includes('1º Secundaria')) {
      courseName = 'Comunicación';
      teacherName = teacherLuis?.name || 'Luis Pérez';
      teacherId = teacherLuis?.id || 'doc-3';
    } else if (grade.includes('4º Secundaria')) {
      courseName = 'Inglés Técnico';
      teacherName = teacherMarta?.name || 'Marta Soler';
      teacherId = teacherMarta?.id || 'doc-4';
    } else if (grade.includes('2º Secundaria')) {
      courseName = 'Historia';
      teacherName = teacherLuis?.name || 'Luis Pérez';
      teacherId = teacherLuis?.id || 'doc-3';
    }
    
    const item = {
      id: String(a.id_asistencia),
      date: a.fecha,
      time: a.hora_entrada ? a.hora_entrada.substring(0, 5) : '08:00',
      studentId: 'est-' + a.id_usuario,
      studentName: studentName,
      grade: grade,
      course: courseName,
      state: a.estado_entrada,
      teacherId: teacherId,
      teacherName: teacherName
    };
    
    if (a.time_note) {
      item.timeNote = a.time_note;
    }
    return item;
  });

  // 6. Mapear Justificaciones
  justifications = dbJustificaciones.map(j => {
    const student = students.find(s => s.id === 'est-' + j.id_estudiante);
    const studentName = student ? student.name : 'Estudiante Desconocido';
    return {
      id: String(j.id_justificacion),
      studentId: 'est-' + j.id_estudiante,
      studentName: studentName,
      date: j.fecha_inasistencia,
      reason: j.motivo,
      documentName: j.evidencia_foto || 'evidencia.pdf',
      status: j.estado
    };
  });
}

// Sincronizar asistencias (logs) con Supabase
async function syncLogs(newLogs) {
  if (useLocalFallback) {
    saveLocalFallbackData('school_attendance_logs', newLogs);
    return;
  }
  try {
    // 1. Eliminar los borrados
    const deleted = logs.filter(l => !newLogs.some(nl => nl.id === l.id));
    for (const d of deleted) {
      if (!d.id.startsWith('log-')) {
        await supabaseClient.from('asistencias').delete().eq('id_asistencia', parseInt(d.id));
      }
    }
    
    // 2. Insertar / Actualizar
    for (const nl of newLogs) {
      const isNew = nl.id.startsWith('log-');
      const idUsuario = parseInt(nl.studentId.replace('est-', ''));
      
      const dbObj = {
        id_usuario: idUsuario,
        fecha: nl.date,
        hora_entrada: nl.time + ':00',
        hora_salida: nl.state === 'Ausente' ? null : '14:00:00',
        estado_entrada: nl.state,
        time_note: nl.timeNote || null
      };
      
      if (isNew) {
        const { data, error } = await supabaseClient.from('asistencias').insert(dbObj).select();
        if (error) throw error;
        if (data && data[0]) {
          nl.id = String(data[0].id_asistencia);
        }
      } else {
        const { error } = await supabaseClient.from('asistencias').update(dbObj).eq('id_asistencia', parseInt(nl.id));
        if (error) throw error;
      }
    }
    // Actualizar cache local
    logs = JSON.parse(JSON.stringify(newLogs));
  } catch (e) {
    console.error("Error al sincronizar logs con Supabase:", e);
    if (window.showToast) window.showToast("Error de sincronización con la base de datos", "error");
  }
}

// Sincronizar justificaciones con Supabase
async function syncJustifications(newJusts) {
  if (useLocalFallback) {
    saveLocalFallbackData('school_justifications', newJusts);
    return;
  }
  try {
    // 1. Eliminar borradas
    const deleted = justifications.filter(j => !newJusts.some(nj => nj.id === j.id));
    for (const d of deleted) {
      if (!d.id.startsWith('just-')) {
        await supabaseClient.from('justificaciones').delete().eq('id_justificacion', parseInt(d.id));
      }
    }
    
    // 2. Insertar / Actualizar
    for (const nj of newJusts) {
      const isNew = nj.id.startsWith('just-');
      const idEstudiante = parseInt(nj.studentId.replace('est-', ''));
      
      const dbObj = {
        id_estudiante: idEstudiante,
        fecha_inasistencia: nj.date,
        motivo: nj.reason,
        evidencia_foto: nj.documentName || null,
        estado: nj.status
      };
      
      if (isNew) {
        const { data, error } = await supabaseClient.from('justificaciones').insert(dbObj).select();
        if (error) throw error;
        if (data && data[0]) {
          nj.id = String(data[0].id_justificacion);
        }
      } else {
        const { error } = await supabaseClient.from('justificaciones').update(dbObj).eq('id_justificacion', parseInt(nj.id));
        if (error) throw error;
      }
    }
    justifications = JSON.parse(JSON.stringify(newJusts));
  } catch (e) {
    console.error("Error al sincronizar justificaciones:", e);
    if (window.showToast) window.showToast("Error de sincronización con la base de datos", "error");
  }
}

// Sincronizar tarjetas ID con Supabase
async function syncCards(newCards) {
  if (useLocalFallback) {
    saveLocalFallbackData('school_cards', newCards);
    return;
  }
  try {
    for (const nc of newCards) {
      const isNew = nc.id.startsWith('card-');
      const idUsuario = parseInt(nc.studentId.replace('est-', ''));
      
      const dbObj = {
        id_usuario: idUsuario,
        codigo_barra: nc.codigo_barra,
        estado: nc.estado
      };
      
      if (isNew) {
        const { data, error } = await supabaseClient.from('tarjetas_identificacion').insert(dbObj).select();
        if (error) throw error;
        if (data && data[0]) {
          nc.id = String(data[0].id_tarjeta);
        }
      } else {
        const { error } = await supabaseClient.from('tarjetas_identificacion').update(dbObj).eq('id_tarjeta', parseInt(nc.id));
        if (error) throw error;
      }
    }
    cards = JSON.parse(JSON.stringify(newCards));
  } catch (e) {
    console.error("Error al sincronizar tarjetas ID:", e);
  }
}

const AttendanceDB = {
  // Inicialización (llamado en el arranque de la app)
  init: async () => {
    try {
      if (typeof supabase === 'undefined') {
        throw new Error("SDK de Supabase no cargado.");
      }
      const env = await loadEnvFromUrl();
      const url = env.SUPABASE_URL || 'https://sokshbceuobwgkfamckr.supabase.co';
      // Fallback a la clave service_role para evitar bloqueos por RLS en desarrollo local
      const key = env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva3NoYmNldW9id2drZmFtY2tyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzcwNjA1MywiZXhwIjoyMDk5MjgyMDUzfQ.hf9UgSSAHNUbqHf1btuZc8sN5jsla2oHHIOxe7iaelM';
      
      supabaseClient = supabase.createClient(url, key);
      
      // Probar conexión seleccionando número de roles
      const { error } = await supabaseClient.from('roles').select('*', { count: 'estimated', head: true });
      if (error) throw error;
      
      console.log("Conectado a la base de datos de Supabase correctamente.");
      await loadDataFromSupabase();
    } catch (e) {
      console.warn("Fallo de conexión con Supabase. Usando almacenamiento local local (fallback):", e.message);
      useLocalFallback = true;
      loadLocalFallbackData();
    }
  },

  getStudents: () => students,
  saveStudents: (data) => {
    students = data;
    if (useLocalFallback) saveLocalFallbackData('school_students', data);
  },
  
  getTeachers: () => teachers,
  saveTeachers: (data) => {
    teachers = data;
    if (useLocalFallback) saveLocalFallbackData('school_teachers', data);
  },
  
  getCourses: () => courses,
  saveCourses: (data) => {
    courses = data;
    if (useLocalFallback) saveLocalFallbackData('school_courses', data);
  },
  
  getLogs: () => logs,
  saveLogs: (data) => {
    logs = data; // Actualización instantánea en memoria
    syncLogs(data); // Sync asincrónico con Supabase
  },
  
  getJustifications: () => justifications,
  saveJustifications: (data) => {
    justifications = data;
    syncJustifications(data);
  },
  
  getCards: () => cards,
  saveCards: (data) => {
    cards = data;
    syncCards(data);
  },
  
  authenticate: async (email, password) => {
    if (useLocalFallback) {
      if (email === 'admin@colegio.edu.pe' && password === 'admin') {
        return {
          id: 'admin-01',
          nombres: 'José',
          apellidos: 'Calasanz',
          correo: 'admin@colegio.edu.pe',
          id_rol: 1,
          role_name: 'admin'
        };
      }
      const student = students.find(s => s.name.toLowerCase().replace(' ', '.') + '@colegio.edu.pe' === email || s.id === 'est-01' && email === 'mateo.silva@colegio.edu.pe');
      if (student && password === 'password123') {
        return {
          id: student.id,
          nombres: student.name.split(' ')[0],
          apellidos: student.name.split(' ').slice(1).join(' '),
          correo: email,
          id_rol: 3,
          role_name: 'student'
        };
      }
      const teacher = teachers.find(t => t.name.toLowerCase().replace(' ', '.') + '@colegio.edu.pe' === email || t.id === 'doc-01' && email === 'ana.gomez@colegio.edu.pe');
      if (teacher && password === 'password123') {
        return {
          id: teacher.id,
          nombres: teacher.name.split(' ')[0],
          apellidos: teacher.name.split(' ').slice(1).join(' '),
          correo: email,
          id_rol: 2,
          role_name: 'teacher'
        };
      }
      return null;
    }

    try {
      const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('password', password);
      
      if (error) throw error;
      if (data && data.length > 0) {
        const u = data[0];
        let role_name = 'student';
        if (u.id_rol === 1) role_name = 'admin';
        else if (u.id_rol === 2) role_name = 'teacher';
        
        return {
          id: u.id_rol === 1 ? 'admin-01' : (u.id_rol === 2 ? 'doc-' + u.id_usuario : 'est-' + u.id_usuario),
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          id_rol: u.id_rol,
          role_name: role_name
        };
      }
      return null;
    } catch (e) {
      console.error("Error en la autenticación con Supabase:", e);
      return null;
    }
  },
  
  resetDatabase: async () => {
    if (useLocalFallback) {
      localStorage.removeItem('school_students');
      localStorage.removeItem('school_teachers');
      localStorage.removeItem('school_courses');
      localStorage.removeItem('school_attendance_logs');
      localStorage.removeItem('school_justifications');
      localStorage.removeItem('school_cards');
      location.reload();
      return;
    }

    try {
      if (confirm("¿Estás seguro de que deseas restablecer los datos en Supabase? Esto borrará el historial actual y restaurará los registros de prueba iniciales.")) {
        
        // Desactivar temporalmente los logs en UI para evitar colisiones
        console.log("Iniciando restauración de datos...");
        
        const pkTables = [
          { table: 'justificaciones', pk: 'id_justificacion' },
          { table: 'asistencias', pk: 'id_asistencia' },
          { table: 'estudiante_aula', pk: 'id_estudiante_aula' },
          { table: 'tarjetas_identificacion', pk: 'id_tarjeta' },
          { table: 'parentescos', pk: 'id_parentesco' },
          { table: 'datos_estudiante', pk: 'id_datos_estudiante' },
          { table: 'usuarios', pk: 'id_usuario' },
          { table: 'grados_secciones', pk: 'id_aula' }
        ];

        for (const item of pkTables) {
          await supabaseClient.from(item.table).delete().gt(item.pk, 0);
        }

        // Obtener roles y tipos de doc
        const { data: dbTiposDoc } = await supabaseClient.from('tipos_documento').select('*');
        const { data: dbRoles } = await supabaseClient.from('roles').select('*');
        
        const dniId = dbTiposDoc.find(t => t.nombre_documento === 'DNI')?.id_tipo_doc || 1;
        const rolAdminId = dbRoles.find(r => r.nombre_rol === 'Administrativo')?.id_rol || 1;
        const rolDocenteId = dbRoles.find(r => r.nombre_rol === 'Docente')?.id_rol || 2;
        const rolEstudianteId = dbRoles.find(r => r.nombre_rol === 'Estudiante')?.id_rol || 3;
        const rolApoderadoId = dbRoles.find(r => r.nombre_rol === 'Apoderado')?.id_rol || 4;

        // Re-insertar usuarios
        const { data: usuarios } = await supabaseClient.from('usuarios').insert([
          { id_tipo_doc: dniId, numero_documento: '12345678', nombres: 'José', apellidos: 'Calasanz', celular: '999888777', direccion: 'Av. Universitaria 123', correo: 'admin@colegio.edu.pe', password: 'admin', id_rol: rolAdminId },
          { id_tipo_doc: dniId, numero_documento: '22222222', nombres: 'Ana', apellidos: 'Gómez', celular: '987654321', direccion: 'Calle Las Flores 456', correo: 'ana.gomez@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
          { id_tipo_doc: dniId, numero_documento: '33333333', nombres: 'Luis', apellidos: 'Pérez', celular: '987654322', direccion: 'Av. Larco 789', correo: 'luis.perez@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
          { id_tipo_doc: dniId, numero_documento: '44444444', nombres: 'Marta', apellidos: 'Soler', celular: '987654323', direccion: 'Calle Lima 101', correo: 'marta.soler@colegio.edu.pe', password: 'password123', id_rol: rolDocenteId },
          { id_tipo_doc: dniId, numero_documento: '55555551', nombres: 'Mateo', apellidos: 'Silva', celular: '955111222', direccion: 'Av. Arequipa 500', correo: 'mateo.silva@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
          { id_tipo_doc: dniId, numero_documento: '55555552', nombres: 'Valentina', apellidos: 'Rivas', celular: '955111223', direccion: 'Calle Tacna 600', correo: 'valentina.rivas@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
          { id_tipo_doc: dniId, numero_documento: '55555553', nombres: 'Joisina', apellidos: 'Limiter', celular: '955111224', direccion: 'Jr. Ica 700', correo: 'joisina.limiter@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
          { id_tipo_doc: dniId, numero_documento: '55555554', nombres: 'Aloya', apellidos: 'Caoma', celular: '955111225', direccion: 'Av. Grau 800', correo: 'aloya.caoma@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
          { id_tipo_doc: dniId, numero_documento: '55555555', nombres: 'Juisisa', apellidos: 'Pérez', celular: '955111226', direccion: 'Jr. Junín 900', correo: 'juisisa.perez@colegio.edu.pe', password: 'password123', id_rol: rolEstudianteId },
          { id_tipo_doc: dniId, numero_documento: '66666661', nombres: 'Pedro', apellidos: 'Silva', celular: '966111222', direccion: 'Av. Arequipa 500', correo: 'pedro.silva@gmail.com', password: 'password123', id_rol: rolApoderadoId },
          { id_tipo_doc: dniId, numero_documento: '66666662', nombres: 'María', apellidos: 'Rivas', celular: '966111223', direccion: 'Calle Tacna 600', correo: 'maria.rivas@gmail.com', password: 'password123', id_rol: rolApoderadoId }
        ]).select();

        const mapUser = (numDoc) => usuarios.find(u => u.numero_documento === numDoc).id_usuario;
        const idPedro = mapUser('66666661');
        const idMaria = mapUser('66666662');
        const idMateo = mapUser('55555551');
        const idValentina = mapUser('55555552');
        const idJoisina = mapUser('55555553');
        const idAloya = mapUser('55555554');
        const idJuisisa = mapUser('55555555');

        await supabaseClient.from('datos_estudiante').insert([
          { id_usuario: idMateo, tipo_sangre: 'O+', seguro_medico: 'EsSalud', observaciones_medicas: 'Ninguna' },
          { id_usuario: idValentina, tipo_sangre: 'A+', seguro_medico: 'SIS', observaciones_medicas: 'Alérgica a la penicilina' },
          { id_usuario: idJoisina, tipo_sangre: 'O-', seguro_medico: 'Particular', observaciones_medicas: 'Ninguna' },
          { id_usuario: idAloya, tipo_sangre: 'B+', seguro_medico: 'EsSalud', observaciones_medicas: 'Ninguna' },
          { id_usuario: idJuisisa, tipo_sangre: 'AB+', seguro_medico: 'SIS', observaciones_medicas: 'Usa lentes de medida' }
        ]);

        await supabaseClient.from('parentescos').insert([
          { id_apoderado: idPedro, id_estudiante: idMateo, parentesco: 'Padre' },
          { id_apoderado: idMaria, id_estudiante: idValentina, parentesco: 'Madre' }
        ]);

        await supabaseClient.from('tarjetas_identificacion').insert([
          { id_usuario: idMateo, codigo_barra: 'CAL-2026-0001', estado: true },
          { id_usuario: idValentina, codigo_barra: 'CAL-2026-0002', estado: true },
          { id_usuario: idJoisina, codigo_barra: 'CAL-2026-0003', estado: true },
          { id_usuario: idAloya, codigo_barra: 'CAL-2026-0004', estado: false }
        ]);

        const { data: aulas } = await supabaseClient.from('grados_secciones').insert([
          { grado: '3º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
          { grado: '5º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 },
          { grado: '1º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 },
          { grado: '4º Secundaria', seccion: 'B', nivel: 'Secundaria', anio_academico: 2026 },
          { grado: '2º Secundaria', seccion: 'A', nivel: 'Secundaria', anio_academico: 2026 }
        ]).select();

        const idAula3P = aulas.find(a => a.grado === '3º Primaria').id_aula;
        const idAula5S = aulas.find(a => a.grado === '5º Secundaria').id_aula;
        const idAula1S = aulas.find(a => a.grado === '1º Secundaria').id_aula;
        const idAula4S = aulas.find(a => a.grado === '4º Secundaria').id_aula;

        await supabaseClient.from('estudiante_aula').insert([
          { id_estudiante: idMateo, id_aula: idAula3P },
          { id_estudiante: idAloya, id_aula: idAula3P },
          { id_estudiante: idValentina, id_aula: idAula5S },
          { id_estudiante: idJoisina, id_aula: idAula1S },
          { id_estudiante: idJuisisa, id_aula: idAula4S }
        ]);

        await supabaseClient.from('asistencias').insert([
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

        await supabaseClient.from('justificaciones').insert([
          { id_estudiante: idJoisina, id_apoderado: null, fecha_inasistencia: '2026-07-08', motivo: 'Cita médica dental programada.', estado: 'Pendiente' },
          { id_estudiante: idMateo, id_apoderado: idPedro, fecha_inasistencia: '2026-07-07', motivo: 'Fuerte gripe con fiebre.', estado: 'Aprobado' }
        ]);

        location.reload();
      }
    } catch (e) {
      console.error("Error al reiniciar la base de datos:", e);
      if (window.showToast) window.showToast("Error al reiniciar base de datos", "error");
    }
  }
};

window.AttendanceDB = AttendanceDB;
