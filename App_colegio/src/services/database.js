// Mock database mirroring the web application database structure
export const MOCK_USERS = [
  {
    id: 'est-55555551',
    email: 'mateo.silva@colegio.edu.pe',
    password: 'password123',
    name: 'Mateo Silva',
    role: 'student',
    grade: '3º Primaria A',
    document: '55555551',
    celular: '955111222',
    direccion: 'Av. Arequipa 500',
    bloodType: 'O+',
    insurance: 'EsSalud',
    allergies: 'Ninguna',
    observations: 'Ninguna',
    guardianName: 'Juan Silva Rivas',
    guardianPhone: '988555111',
    guardianRelation: 'Padre',
    photo: 'https://ui-avatars.com/api/?name=Mateo+Silva&background=3b82f6&color=fff',
    barcode: 'CAL-2026-0001'
  },
  {
    id: 'est-55555552',
    email: 'valentina.rivas@colegio.edu.pe',
    password: 'password123',
    name: 'Valentina Rivas',
    role: 'student',
    grade: '5º Secundaria A',
    document: '55555552',
    celular: '955111223',
    direccion: 'Calle Tacna 600',
    bloodType: 'A+',
    insurance: 'SIS',
    allergies: 'Alérgica a la penicilina',
    observations: 'Ninguna',
    guardianName: 'Sofía Rivas Castro',
    guardianPhone: '988555222',
    guardianRelation: 'Madre',
    photo: 'https://ui-avatars.com/api/?name=Valentina+Rivas&background=3b82f6&color=fff',
    barcode: 'CAL-2026-0002'
  },
  {
    id: 'est-55555553',
    email: 'joisina.limiter@colegio.edu.pe',
    password: 'password123',
    name: 'Joisina Limiter',
    role: 'student',
    grade: '1º Secundaria A',
    document: '55555553',
    celular: '955111224',
    direccion: 'Jr. Ica 700',
    bloodType: 'O-',
    insurance: 'Particular',
    allergies: 'Ninguna',
    observations: 'Ninguna',
    guardianName: 'Ricardo Limiter Soto',
    guardianPhone: '988555333',
    guardianRelation: 'Padre',
    photo: 'https://ui-avatars.com/api/?name=Joisina+Limiter&background=3b82f6&color=fff',
    barcode: 'CAL-2026-0003'
  }
];

export const MOCK_COURSES = {
  'est-55555551': [ // Mateo (3º Primaria)
    { id: 'c1', name: 'Matemáticas', teacher: 'Dra. Ana Gómez', room: 'Aula 101', schedule: 'Lunes y Miércoles 08:00 - 09:30' },
    { id: 'c2', name: 'Comunicación', teacher: 'Lic. Luis Pérez', room: 'Aula 101', schedule: 'Martes y Jueves 08:00 - 09:30' },
    { id: 'c3', name: 'Ciencia y Tecnología', teacher: 'Dra. Ana Gómez', room: 'Laboratorio', schedule: 'Viernes 08:00 - 10:00' },
    { id: 'c4', name: 'Educación Física', teacher: 'Prof. Carlos Diaz', room: 'Patio Principal', schedule: 'Lunes 10:00 - 11:30' }
  ],
  'est-55555552': [ // Valentina (5º Secundaria)
    { id: 'c5', name: 'Álgebra', teacher: 'Lic. Luis Pérez', room: 'Aula 302', schedule: 'Lunes y Miércoles 10:00 - 11:30' },
    { id: 'c6', name: 'Física Elemental', teacher: 'Dra. Ana Gómez', room: 'Laboratorio', schedule: 'Martes y Jueves 10:00 - 11:30' },
    { id: 'c7', name: 'Inglés Técnico', teacher: 'Miss Marta Soler', room: 'Aula 302', schedule: 'Lunes y Miércoles 08:00 - 09:30' },
    { id: 'c8', name: 'Historia del Perú', teacher: 'Lic. Luis Pérez', room: 'Aula 302', schedule: 'Viernes 10:00 - 12:00' }
  ],
  'est-55555553': [ // Joisina (1º Secundaria)
    { id: 'c9', name: 'Comunicación', teacher: 'Lic. Luis Pérez', room: 'Aula 201', schedule: 'Lunes y Miércoles 08:00 - 09:30' },
    { id: 'c10', name: 'Aritmética', teacher: 'Dra. Ana Gómez', room: 'Aula 201', schedule: 'Martes y Jueves 08:00 - 09:30' },
    { id: 'c11', name: 'Historia', teacher: 'Lic. Luis Pérez', room: 'Aula 201', schedule: 'Viernes 08:00 - 10:00' }
  ]
};

export const MOCK_SCHEDULES = {
  'est-55555551': [
    { day: 'Lunes', items: [{ time: '08:00 - 09:30', subject: 'Matemáticas', room: 'Aula 101' }, { time: '10:00 - 11:30', subject: 'Educación Física', room: 'Patio' }] },
    { day: 'Martes', items: [{ time: '08:00 - 09:30', subject: 'Comunicación', room: 'Aula 101' }] },
    { day: 'Miércoles', items: [{ time: '08:00 - 09:30', subject: 'Matemáticas', room: 'Aula 101' }] },
    { day: 'Jueves', items: [{ time: '08:00 - 09:30', subject: 'Comunicación', room: 'Aula 101' }] },
    { day: 'Viernes', items: [{ time: '08:00 - 10:00', subject: 'Ciencia y Tec.', room: 'Laboratorio' }] }
  ],
  'est-55555552': [
    { day: 'Lunes', items: [{ time: '08:00 - 09:30', subject: 'Inglés Técnico', room: 'Aula 302' }, { time: '10:00 - 11:30', subject: 'Álgebra', room: 'Aula 302' }] },
    { day: 'Martes', items: [{ time: '10:00 - 11:30', subject: 'Física Elemental', room: 'Laboratorio' }] },
    { day: 'Miércoles', items: [{ time: '08:00 - 09:30', subject: 'Inglés Técnico', room: 'Aula 302' }, { time: '10:00 - 11:30', subject: 'Álgebra', room: 'Aula 302' }] },
    { day: 'Jueves', items: [{ time: '10:00 - 11:30', subject: 'Física Elemental', room: 'Laboratorio' }] },
    { day: 'Viernes', items: [{ time: '10:00 - 12:00', subject: 'Historia del Perú', room: 'Aula 302' }] }
  ],
  'est-55555553': [
    { day: 'Lunes', items: [{ time: '08:00 - 09:30', subject: 'Comunicación', room: 'Aula 201' }] },
    { day: 'Martes', items: [{ time: '08:00 - 09:30', subject: 'Aritmética', room: 'Aula 201' }] },
    { day: 'Miércoles', items: [{ time: '08:00 - 09:30', subject: 'Comunicación', room: 'Aula 201' }] },
    { day: 'Jueves', items: [{ time: '08:00 - 09:30', subject: 'Aritmética', room: 'Aula 201' }] },
    { day: 'Viernes', items: [{ time: '08:00 - 10:00', subject: 'Historia', room: 'Aula 201' }] }
  ]
};

export const MOCK_BIRTHDAYS = [
  { name: 'Mateo Silva', day: '12 Jul', role: 'Estudiante', isMe: true },
  { name: 'Dra. Ana Gómez', day: '18 Jul', role: 'Docente', isMe: false },
  { name: 'Sofía Castro', day: '22 Jul', role: 'Compañera', isMe: false },
  { name: 'Lucas Mendoza', day: '29 Jul', role: 'Compañero', isMe: false },
  { name: 'Valentina Rivas', day: '05 Ago', role: 'Estudiante', isMe: false }
];

export const MOCK_LINKS = [
  { title: 'Aula Virtual', desc: 'Acceso a tareas y materiales', url: 'https://colegio.edu.pe/aula-virtual', icon: 'school' },
  { title: 'Intranet de Pagos', desc: 'Consulta de pensiones y recibos', url: 'https://colegio.edu.pe/pagos', icon: 'payment' },
  { title: 'Reglamento Interno', desc: 'Normas de convivencia 2026', url: 'https://colegio.edu.pe/reglamento', icon: 'description' },
  { title: 'Soporte Técnico', desc: 'Ayuda con cuentas y credenciales', url: 'https://colegio.edu.pe/soporte', icon: 'support-agent' }
];

export const MOCK_CALENDAR = [
  { id: '1', date: '2026-07-15', title: 'Exámenes Parciales', desc: 'Inicio del rol de exámenes del segundo trimestre', type: 'academic' },
  { id: '2', date: '2026-07-24', title: 'Día de las Américas', desc: 'Actuación escolar en el patio de honor', type: 'event' },
  { id: '3', date: '2026-07-27', title: 'Vacaciones de Medio Año', desc: 'Inicio del receso escolar (hasta el 10 de Agosto)', type: 'holiday' },
  { id: '4', date: '2026-08-11', title: 'Reinicio de Clases', desc: 'Retorno a las labores académicas presenciales', type: 'academic' }
];

export const MOCK_ATTENDANCE = {
  'est-55555551': [
    { date: '2026-07-09', time: '08:05', status: 'Presente' },
    { date: '2026-07-08', time: '08:02', status: 'Presente' },
    { date: '2026-07-07', time: '--:--', status: 'Ausente' }
  ],
  'est-55555552': [
    { date: '2026-07-09', time: '08:12', status: 'Presente' },
    { date: '2026-07-08', time: '08:15', status: 'Tardanza' },
    { date: '2026-07-07', time: '--:--', status: 'Ausente' }
  ],
  'est-55555553': [
    { date: '2026-07-09', time: '08:12', status: 'Tardanza' },
    { date: '2026-07-08', time: '--:--', status: 'Ausente' },
    { date: '2026-07-07', time: '--:--', status: 'Ausente' }
  ]
};

export const loginUser = (email, password) => {
  const user = MOCK_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  return user || null;
};
