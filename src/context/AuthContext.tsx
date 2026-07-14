'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  id_rol: number;
  role_name: 'admin' | 'teacher' | 'student';
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  photo: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  photo: string;
  roleId: number;
  roleName: string;
  materiaEspecialidad?: string;
  idAulaTutor?: number;
  aulaTutorName?: string;
}

export interface Staff {
  id: string;
  name: string;
  roleId: number;
  roleName: string;
  photo: string;
}

export interface Course {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  studentIds: string[];
}

export interface AttendanceLog {
  id: string;
  date: string;
  time: string;
  timeOut?: string;
  studentId: string;
  studentName: string;
  grade: string;
  course: string;
  state: 'Presente' | 'Tardanza' | 'Ausente' | 'Justificado';
  timeNote?: string;
  teacherId: string;
  teacherName: string;
}

export interface Justification {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  reason: string;
  documentName: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

export interface Classroom {
  id_aula: number;
  grado: string;
  seccion: string;
  nivel: string;
  anio_academico: number;
}

export interface IDCard {
  id: string;
  studentId: string;
  codigo_barra: string;
  type: 'Barcode' | 'QR';
  date: string;
  estado: boolean;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: 'Feriado' | 'Examen' | 'Reunion' | 'Festividad' | 'Otro';
}

export interface ClassSchedule {
  id: string;
  classroomId: number;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subject: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  courses: Course[];
  logs: AttendanceLog[];
  justifications: Justification[];
  cards: IDCard[];
  classrooms: Classroom[];
  events: SchoolEvent[];
  schedules: ClassSchedule[];
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  saveLogs: (newLogs: AttendanceLog[]) => Promise<void>;
  saveJustifications: (newJusts: Justification[]) => Promise<void>;
  saveCards: (newCards: IDCard[]) => Promise<void>;
  saveEvents: (newEvents: SchoolEvent[]) => Promise<void>;
  saveSchedules: (newSchedules: ClassSchedule[]) => Promise<void>;
  saveStudent: (studentData: any) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveTeacher: (teacherData: any) => Promise<void>;
  deleteTeacher: (teacherId: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [cards, setCards] = useState<IDCard[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);

  // Cargar sesión guardada en el cliente
  useEffect(() => {
    const cached = sessionStorage.getItem('sessionUser');
    if (cached) {
      try {
        const u = JSON.parse(cached) as User;
        setUser(u);
      } catch (e) {
        console.error("Error al cargar sesión de sessionStorage:", e);
      }
    }
  }, []);

  // Cargar datos de Supabase cuando hay un usuario autenticado
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: dbUsuarios, error: errU },
        { data: dbEstudianteAula, error: errEA },
        { data: dbGradosSecciones, error: errGS },
        { data: dbTarjetasIdentificacion, error: errTI },
        { data: dbAsistencias, error: errA },
        { data: dbJustificaciones, error: errJ },
        { data: dbRoles, error: errR }
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('estudiante_aula').select('*'),
        supabase.from('grados_secciones').select('*'),
        supabase.from('tarjetas_identificacion').select('*'),
        supabase.from('asistencias').select('*'),
        supabase.from('justificaciones').select('*'),
        supabase.from('roles').select('*')
      ]);

      if (errU || errEA || errGS || errTI || errA || errJ || errR) {
        throw new Error("Error al obtener datos de Supabase");
      }

      const rawUsuarios = dbUsuarios || [];
      const rawEstudianteAula = dbEstudianteAula || [];
      const rawGrados = dbGradosSecciones || [];
      const rawTarjetas = dbTarjetasIdentificacion || [];
      const rawAsistencias = dbAsistencias || [];
      const rawJustificaciones = dbJustificaciones || [];
      const rawRoles = dbRoles || [];

      const rolEstudianteId = rawRoles.find(r => r.nombre_rol === 'Estudiante')?.id_rol || 3;
      const rolDocenteId = rawRoles.find(r => r.nombre_rol === 'Docente')?.id_rol || 2;

      // 1. Mapear Estudiantes
      const mappedStudents = rawUsuarios
        .filter(u => u.id_rol === rolEstudianteId)
        .map(u => {
          const estAula = rawEstudianteAula.find(ea => ea.id_estudiante === u.id_usuario);
          const aula = estAula ? rawGrados.find(gs => gs.id_aula === estAula.id_aula) : null;
          const grade = aula ? `${aula.grado} ${aula.seccion}` : 'Sin Grado';
          return {
            id: 'est-' + u.id_usuario,
            name: `${u.nombres} ${u.apellidos}`,
            grade: grade,
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombres + '+' + u.apellidos)}&background=3b82f6&color=fff`
          };
        });
      setStudents(mappedStudents);
      setClassrooms(rawGrados);

      // 2. Mapear Docentes
      const mappedTeachers = rawUsuarios
        .filter(u => [2, 5, 6].includes(u.id_rol))
        .map(u => {
          let roleId = u.id_rol;
          
          // Compatibilidad: si el rol es el docente genérico antiguo (2), inferir la especialización para demostración
          if (roleId === 2) {
            if (u.nombres.toLowerCase().includes('ana')) {
              roleId = 5; // Asignar a Primaria
            } else {
              roleId = 6; // Asignar a Secundaria
            }
          }

          let subject = u.materia_especialidad || 'Docente';
          let roleName = 'Docente';
          let aulaTutorName = undefined;
          
          if (roleId === 5) {
            roleName = 'Docente Primaria';
            // Buscar salón asignado en DB o asignar 3º Primaria de respaldo
            const tutorId = u.id_aula_tutor || rawGrados.find(gs => gs.grado.includes('3º Primaria'))?.id_aula;
            const aula = rawGrados.find(gs => gs.id_aula === tutorId);
            aulaTutorName = aula ? `${aula.grado} ${aula.seccion}` : 'Sin salón asignado';
            subject = `Tutor de ${aulaTutorName}`;
          } else if (roleId === 6) {
            roleName = 'Docente Secundaria';
            // Asignar especialidad de respaldo basada en el docente
            if (!u.materia_especialidad) {
              if (u.nombres.toLowerCase().includes('luis')) subject = 'Comunicación y Ciencias Sociales';
              else if (u.nombres.toLowerCase().includes('marta')) subject = 'Inglés';
              else subject = 'Matemáticas y Ciencias';
            } else {
              subject = u.materia_especialidad;
            }
          }

          return {
            id: 'doc-' + u.id_usuario,
            name: `${u.nombres} ${u.apellidos}`,
            subject: subject,
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombres + '+' + u.apellidos)}&background=6b46c1&color=fff`,
            roleId: roleId,
            roleName: roleName,
            materiaEspecialidad: u.materia_especialidad || undefined,
            idAulaTutor: u.id_aula_tutor || undefined,
            aulaTutorName: aulaTutorName
          };
        });
      setTeachers(mappedTeachers);

      // 2.5 Mapear Personal Auxiliar, Limpieza, Administrativo
      const mappedStaff = rawUsuarios
        .filter(u => [1, 7, 8].includes(u.id_rol))
        .map(u => {
          let roleName = 'Administrativo';
          if (u.id_rol === 7) roleName = 'Auxiliar';
          else if (u.id_rol === 8) roleName = 'Limpieza';
          
          return {
            id: 'staff-' + u.id_usuario,
            name: `${u.nombres} ${u.apellidos}`,
            roleId: u.id_rol,
            roleName: roleName,
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombres + '+' + u.apellidos)}&background=0f4c9c&color=fff`
          };
        });
      setStaff(mappedStaff);

      // 3. Mapear Cursos (in memory)
      const teacherAna = mappedTeachers.find(t => t.name.toLowerCase().includes('ana')) || mappedTeachers[0];
      const teacherLuis = mappedTeachers.find(t => t.name.toLowerCase().includes('luis')) || mappedTeachers[1] || mappedTeachers[0];
      const teacherMarta = mappedTeachers.find(t => t.name.toLowerCase().includes('marta')) || mappedTeachers[2] || mappedTeachers[0];

      const mappedCourses = [
        { id: 'cur-01', name: 'Matemáticas', grade: '3º Primaria', teacherId: teacherAna?.id || 'doc-2', studentIds: mappedStudents.filter(s => s.grade.includes('3º Primaria')).map(s => s.id) },
        { id: 'cur-02', name: 'Álgebra', grade: '5º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: mappedStudents.filter(s => s.grade.includes('5º Secundaria')).map(s => s.id) },
        { id: 'cur-03', name: 'Comunicación', grade: '1º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: mappedStudents.filter(s => s.grade.includes('1º Secundaria')).map(s => s.id) },
        { id: 'cur-04', name: 'Inglés Técnico', grade: '4º Secundaria', teacherId: teacherMarta?.id || 'doc-4', studentIds: mappedStudents.filter(s => s.grade.includes('4º Secundaria')).map(s => s.id) },
        { id: 'cur-05', name: 'Historia', grade: '2º Secundaria', teacherId: teacherLuis?.id || 'doc-3', studentIds: mappedStudents.filter(s => s.grade.includes('2º Secundaria')).map(s => s.id) }
      ];
      setCourses(mappedCourses);

      // 4. Mapear Tarjetas ID
      const mappedCards = rawTarjetas.map(t => {
        const belongsToUser = rawUsuarios.find(u => u.id_usuario === t.id_usuario);
        let prefix = 'est-';
        if (belongsToUser) {
          if ([2, 5, 6].includes(belongsToUser.id_rol)) prefix = 'doc-';
          else if ([1, 7, 8].includes(belongsToUser.id_rol)) prefix = 'staff-';
        }
        return {
          id: String(t.id_tarjeta),
          studentId: prefix + t.id_usuario,
          codigo_barra: t.codigo_barra,
          type: t.codigo_barra.startsWith('CAL-') ? 'Barcode' as const : 'QR' as const,
          date: t.fecha_emision,
          estado: t.estado
        };
      });
      setCards(mappedCards);

      // 5. Mapear Asistencias (Logs)
      const mappedLogs = rawAsistencias.map(a => {
        const student = mappedStudents.find(s => s.id === 'est-' + a.id_usuario);
        const teacher = mappedTeachers.find(t => t.id === 'doc-' + a.id_usuario);
        const staffMem = mappedStaff.find(s => s.id === 'staff-' + a.id_usuario);
        
        let targetName = 'Usuario Desconocido';
        let grade = 'Personal';
        
        if (student) {
          targetName = student.name;
          grade = student.grade;
        } else if (teacher) {
          targetName = teacher.name;
          grade = teacher.roleName;
        } else if (staffMem) {
          targetName = staffMem.name;
          grade = staffMem.roleName;
        }
        
        let courseName = 'Matemáticas';
        let teacherName = teacherAna?.name || 'Ana Gómez';
        let teacherId = teacherAna?.id || 'doc-2';
        
        if (grade.includes('5º Secundaria') || grade.includes('Secundaria')) {
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
        
        return {
          id: String(a.id_asistencia),
          date: a.fecha,
          time: a.hora_entrada ? a.hora_entrada.substring(0, 5) : '08:00',
          timeOut: a.hora_salida ? a.hora_salida.substring(0, 5) : undefined,
          studentId: student ? 'est-' + a.id_usuario : (teacher ? 'doc-' + a.id_usuario : 'staff-' + a.id_usuario),
          studentName: targetName,
          grade,
          course: student ? courseName : 'Asistencia Personal',
          state: a.estado_entrada as any,
          timeNote: a.time_note || undefined,
          teacherId: student ? teacherId : 'doc-admin',
          teacherName: student ? teacherName : 'Control de Personal'
        };
      });
      setLogs(mappedLogs);

      // 6. Mapear Justificaciones
      const mappedJustifications = rawJustificaciones.map(j => {
        const student = mappedStudents.find(s => s.id === 'est-' + j.id_estudiante);
        const studentName = student ? student.name : 'Estudiante Desconocido';
        return {
          id: String(j.id_justificacion),
          studentId: 'est-' + j.id_estudiante,
          studentName,
          date: j.fecha_inasistencia,
          reason: j.motivo,
          documentName: j.evidencia_foto || 'evidencia.pdf',
          status: j.estado as any
        };
      });
      setJustifications(mappedJustifications);

      // 7. Cargar Eventos Escolares con Fallback
      let dbEventos: any[] = [];
      try {
        const { data, error } = await supabase.from('eventos_escolares').select('*');
        if (!error && data) {
          dbEventos = data;
        } else {
          throw new Error("Tabla eventos no disponible o vacía");
        }
      } catch (evtErr) {
        console.warn("Usando fallback de localStorage/Mock para eventos escolares");
        const cached = localStorage.getItem('schoolEvents');
        if (cached) {
          dbEventos = JSON.parse(cached);
        } else {
          // Eventos semilla por defecto para que no empiece vacío
          dbEventos = [
            { id: 'evt-1', titulo: 'Día de la Independencia', descripcion: 'Feriado Nacional - Sin clases', fecha: '2026-07-28', hora: null, tipo: 'Feriado' },
            { id: 'evt-2', titulo: 'Exámenes Bimestrales', descripcion: 'Evaluación del segundo periodo', fecha: '2026-07-15', hora: '08:00:00', tipo: 'Examen' },
            { id: 'evt-3', titulo: 'Reunión General de Padres', descripcion: 'Entrega de libretas de notas', fecha: '2026-07-18', hora: '16:00:00', tipo: 'Reunion' }
          ];
          localStorage.setItem('schoolEvents', JSON.stringify(dbEventos));
        }
      }

      const mappedEvents = dbEventos.map((e: any) => ({
        id: e.id_evento ? String(e.id_evento) : e.id,
        title: e.titulo || e.title,
        description: e.descripcion || e.description || '',
        date: e.fecha || e.date,
        time: e.hora ? e.hora.substring(0, 5) : e.time || '',
        type: e.tipo || e.type
      }));
      setEvents(mappedEvents);

      // 8. Cargar Horarios de Clases con Fallback
      let dbHorarios: any[] = [];
      try {
        const { data, error } = await supabase.from('horarios_clases').select('*');
        if (!error && data) {
          dbHorarios = data;
        } else {
          throw new Error("Tabla horarios no disponible o vacía");
        }
      } catch (horErr) {
        console.warn("Usando fallback de localStorage/Mock para horarios de clases");
        const cached = localStorage.getItem('classSchedules');
        if (cached) {
          dbHorarios = JSON.parse(cached);
        } else {
          // Obtener la primera aula (de Ana Gómez, 3º Primaria) para semillas
          const firstAulaId = rawGrados[0]?.id_aula || 1;
          const secondAulaId = rawGrados[1]?.id_aula || 2;
          
          dbHorarios = [
            // Horario 3º Primaria (Ana)
            { id: 'sch-1', classroomId: firstAulaId, dayOfWeek: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas' },
            { id: 'sch-2', classroomId: firstAulaId, dayOfWeek: 'Lunes', startTime: '10:00', endTime: '11:30', subject: 'Comunicación' },
            { id: 'sch-3', classroomId: firstAulaId, dayOfWeek: 'Martes', startTime: '08:00', endTime: '09:30', subject: 'Ciencia y Tecnología' },
            { id: 'sch-4', classroomId: firstAulaId, dayOfWeek: 'Martes', startTime: '10:00', endTime: '11:30', subject: 'Inglés' },
            { id: 'sch-5', classroomId: firstAulaId, dayOfWeek: 'Miércoles', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas' },
            { id: 'sch-6', classroomId: firstAulaId, dayOfWeek: 'Miércoles', startTime: '10:00', endTime: '11:30', subject: 'Personal Social' },
            { id: 'sch-7', classroomId: firstAulaId, dayOfWeek: 'Jueves', startTime: '08:00', endTime: '09:30', subject: 'Comunicación' },
            { id: 'sch-8', classroomId: firstAulaId, dayOfWeek: 'Jueves', startTime: '10:00', endTime: '11:30', subject: 'Educación Física' },
            { id: 'sch-9', classroomId: firstAulaId, dayOfWeek: 'Viernes', startTime: '08:00', endTime: '09:30', subject: 'Arte y Cultura' },
            { id: 'sch-10', classroomId: firstAulaId, dayOfWeek: 'Viernes', startTime: '10:00', endTime: '11:30', subject: 'Tutoría' },

            // Horario 4º Primaria (Luis)
            { id: 'sch-11', classroomId: secondAulaId, dayOfWeek: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Comunicación' },
            { id: 'sch-12', classroomId: secondAulaId, dayOfWeek: 'Lunes', startTime: '10:00', endTime: '11:30', subject: 'Matemáticas' }
          ];
          localStorage.setItem('classSchedules', JSON.stringify(dbHorarios));
        }
      }

      const mappedSchedules = dbHorarios.map((s: any) => ({
        id: s.id_horario ? String(s.id_horario) : s.id,
        classroomId: s.id_aula ? s.id_aula : s.classroomId,
        dayOfWeek: s.dia_semana ? s.dia_semana : s.dayOfWeek,
        startTime: s.hora_inicio ? s.hora_inicio.substring(0, 5) : s.startTime,
        endTime: s.hora_fin ? s.hora_fin.substring(0, 5) : s.endTime,
        subject: s.materia ? s.materia : s.subject
      }));
      setSchedules(mappedSchedules);

    } catch (e) {
      console.error("Error al cargar datos desde Supabase:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email.trim())
        .eq('password', password.trim());

      if (error) throw error;
      if (data && data.length > 0) {
        const u = data[0];
        let role_name: 'admin' | 'teacher' | 'student' = 'student';
        if (u.id_rol === 1) role_name = 'admin';
        else if ([2, 5, 6].includes(u.id_rol)) role_name = 'teacher';

        const sessionUser: User = {
          id: u.id_rol === 1 ? 'admin-01' : ([2, 5, 6].includes(u.id_rol) ? 'doc-' + u.id_usuario : 'est-' + u.id_usuario),
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          id_rol: u.id_rol,
          role_name
        };

        sessionStorage.setItem('sessionUser', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return sessionUser;
      }
      return null;
    } catch (e) {
      console.error("Error de autenticación:", e);
      throw e;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('sessionUser');
    setUser(null);
    setStudents([]);
    setTeachers([]);
    setCourses([]);
    setLogs([]);
    setJustifications([]);
    setCards([]);
  };

  const saveLogs = async (newLogs: AttendanceLog[]) => {
    try {
      // 1. Eliminar borrados
      const deleted = logs.filter(l => !newLogs.some(nl => nl.id === l.id));
      for (const d of deleted) {
        if (!d.id.startsWith('log-')) {
          await supabase.from('asistencias').delete().eq('id_asistencia', parseInt(d.id));
        }
      }

      // 2. Insertar / Actualizar únicamente los registros nuevos o modificados
      const updatedLogs = [...newLogs];
      for (const nl of updatedLogs) {
        const isNew = nl.id.startsWith('log-');
        const localLog = logs.find(l => l.id === nl.id);

        // Si el log ya existía localmente y no ha cambiado ninguno de sus campos clave, omitimos la consulta
        if (!isNew && localLog &&
            localLog.state === nl.state &&
            localLog.time === nl.time &&
            localLog.timeOut === nl.timeOut &&
            localLog.timeNote === nl.timeNote) {
          continue;
        }

        const idUsuario = parseInt(nl.studentId.replace('est-', '').replace('doc-', '').replace('staff-', ''));

        const dbObj = {
          id_usuario: idUsuario,
          fecha: nl.date,
          hora_entrada: nl.time + ':00',
          hora_salida: nl.state === 'Ausente' ? null : (nl.timeOut ? nl.timeOut + ':00' : '14:00:00'),
          estado_entrada: nl.state,
          time_note: nl.timeNote || null
        };

        if (isNew) {
          const { data, error } = await supabase.from('asistencias').insert(dbObj).select();
          if (error) throw error;
          if (data && data[0]) {
            nl.id = String(data[0].id_asistencia);
          }
        } else {
          const { error } = await supabase.from('asistencias').update(dbObj).eq('id_asistencia', parseInt(nl.id));
          if (error) throw error;
        }
      }
      setLogs(updatedLogs);
    } catch (e) {
      console.error("Error al guardar asistencias:", e);
      throw e;
    }
  };

  const saveJustifications = async (newJusts: Justification[]) => {
    try {
      const deleted = justifications.filter(j => !newJusts.some(nj => nj.id === j.id));
      for (const d of deleted) {
        if (!d.id.startsWith('just-')) {
          await supabase.from('justificaciones').delete().eq('id_justificacion', parseInt(d.id));
        }
      }

      const updatedJusts = [...newJusts];
      for (const nj of updatedJusts) {
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
          const { data, error } = await supabase.from('justificaciones').insert(dbObj).select();
          if (error) throw error;
          if (data && data[0]) {
            nj.id = String(data[0].id_justificacion);
          }
        } else {
          const { error } = await supabase.from('justificaciones').update(dbObj).eq('id_justificacion', parseInt(nj.id));
          if (error) throw error;
        }
      }
      setJustifications(updatedJusts);
    } catch (e) {
      console.error("Error al guardar justificaciones:", e);
      throw e;
    }
  };

  const saveCards = async (newCards: IDCard[]) => {
    try {
      const updatedCards = [...newCards];
      for (const nc of updatedCards) {
        const isNew = nc.id.startsWith('card-');
        const idUsuario = parseInt(nc.studentId.replace('est-', ''));

        const dbObj = {
          id_usuario: idUsuario,
          codigo_barra: nc.codigo_barra,
          estado: nc.estado
        };

        if (isNew) {
          const { data, error } = await supabase.from('tarjetas_identificacion').insert(dbObj).select();
          if (error) throw error;
          if (data && data[0]) {
            nc.id = String(data[0].id_tarjeta);
          }
        } else {
          const { error } = await supabase.from('tarjetas_identificacion').update(dbObj).eq('id_tarjeta', parseInt(nc.id));
          if (error) throw error;
        }
      }
      setCards(updatedCards);
    } catch (e) {
      console.error("Error al guardar tarjetas ID:", e);
      throw e;
    }
  };

  const saveEvents = async (newEvents: SchoolEvent[]) => {
    try {
      const deleted = events.filter(e => !newEvents.some(ne => ne.id === e.id));
      for (const d of deleted) {
        if (!d.id.startsWith('evt-')) {
          await supabase.from('eventos_escolares').delete().eq('id_evento', parseInt(d.id));
        }
      }

      const updatedEvents = [...newEvents];
      for (const ne of updatedEvents) {
        const isNew = ne.id.startsWith('evt-');
        const dbObj = {
          titulo: ne.title,
          descripcion: ne.description || null,
          fecha: ne.date,
          hora: ne.time ? ne.time + ':00' : null,
          tipo: ne.type
        };

        if (isNew) {
          try {
            const { data, error } = await supabase.from('eventos_escolares').insert(dbObj).select();
            if (error) throw error;
            if (data && data[0]) {
              ne.id = String(data[0].id_evento);
            }
          } catch (err) {
            console.warn("Fallo al guardar evento en Supabase, se mantiene local:", err);
          }
        } else {
          try {
            const { error } = await supabase.from('eventos_escolares').update(dbObj).eq('id_evento', parseInt(ne.id));
            if (error) throw error;
          } catch (err) {
            console.warn("Fallo al actualizar evento en Supabase, se mantiene local:", err);
          }
        }
      }
      localStorage.setItem('schoolEvents', JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
    } catch (e) {
      console.error("Error al guardar eventos:", e);
      localStorage.setItem('schoolEvents', JSON.stringify(newEvents));
      setEvents(newEvents);
    }
  };

  const saveSchedules = async (newSchedules: ClassSchedule[]) => {
    try {
      const deleted = schedules.filter(s => !newSchedules.some(ns => ns.id === s.id));
      for (const d of deleted) {
        if (!d.id.startsWith('sch-')) {
          await supabase.from('horarios_clases').delete().eq('id_horario', parseInt(d.id));
        }
      }

      const updatedSchedules = [...newSchedules];
      for (const ns of updatedSchedules) {
        const isNew = ns.id.startsWith('sch-');
        const dbObj = {
          id_aula: ns.classroomId,
          dia_semana: ns.dayOfWeek,
          hora_inicio: ns.startTime + ':00',
          hora_fin: ns.endTime + ':00',
          materia: ns.subject
        };

        if (isNew) {
          try {
            const { data, error } = await supabase.from('horarios_clases').insert(dbObj).select();
            if (error) throw error;
            if (data && data[0]) {
              ns.id = String(data[0].id_horario);
            }
          } catch (err) {
            console.warn("Fallo al guardar horario en Supabase, se mantiene local:", err);
          }
        } else {
          try {
            const { error } = await supabase.from('horarios_clases').update(dbObj).eq('id_horario', parseInt(ns.id));
            if (error) throw error;
          } catch (err) {
            console.warn("Fallo al actualizar horario en Supabase, se mantiene local:", err);
          }
        }
      }
      localStorage.setItem('classSchedules', JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
    } catch (e) {
      console.error("Error al guardar horarios:", e);
      localStorage.setItem('classSchedules', JSON.stringify(newSchedules));
      setSchedules(newSchedules);
    }
  };

  const saveStudent = async (data: any) => {
    try {
      const isNew = !data.id || !data.id.startsWith('est-');
      const docTypeDni = 1;

      const userObj = {
        id_tipo_doc: docTypeDni,
        numero_documento: data.numero_documento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        celular: data.celular || null,
        direccion: data.direccion || null,
        correo: data.correo,
        password: data.password || 'password123',
        id_rol: 3
      };

      let userId: number;
      if (isNew) {
        const { data: dbUser, error: errU } = await supabase.from('usuarios').insert(userObj).select();
        if (errU) throw errU;
        if (!dbUser || dbUser.length === 0) throw new Error("No se pudo crear el estudiante en usuarios");
        userId = dbUser[0].id_usuario;

        const cardObj = {
          id_usuario: userId,
          codigo_barra: 'CAL-2026-' + String(Math.floor(1000 + Math.random() * 9000)),
          estado: true
        };
        await supabase.from('tarjetas_identificacion').insert(cardObj);
      } else {
        userId = parseInt(data.id.replace('est-', ''));
        const { error: errU } = await supabase.from('usuarios').update(userObj).eq('id_usuario', userId);
        if (errU) throw errU;
      }

      let obsValue = data.observaciones_medicas || null;
      if (data.apoderado_nombre || data.apoderado_telefono || data.apoderado_parentesco) {
        obsValue = JSON.stringify({
          apoderado_nombre: data.apoderado_nombre || '',
          apoderado_telefono: data.apoderado_telefono || '',
          apoderado_parentesco: data.apoderado_parentesco || '',
          nota: data.observaciones_medicas || ''
        });
      }

      const medObj = {
        id_usuario: userId,
        tipo_sangre: data.tipo_sangre || 'O+',
        seguro_medico: data.seguro_medico || 'EsSalud',
        alergias: data.alergias || null,
        observaciones_medicas: obsValue
      };
      
      const { data: extMed } = await supabase.from('datos_estudiante').select('*').eq('id_usuario', userId);
      if (extMed && extMed.length > 0) {
        await supabase.from('datos_estudiante').update(medObj).eq('id_usuario', userId);
      } else {
        await supabase.from('datos_estudiante').insert(medObj);
      }

      const aulaObj = {
        id_estudiante: userId,
        id_aula: parseInt(data.id_aula)
      };

      const { data: extAula } = await supabase.from('estudiante_aula').select('*').eq('id_estudiante', userId);
      if (extAula && extAula.length > 0) {
        await supabase.from('estudiante_aula').update(aulaObj).eq('id_estudiante', userId);
      } else {
        await supabase.from('estudiante_aula').insert(aulaObj);
      }

      await loadData();
    } catch (e) {
      console.error("Error al guardar estudiante:", e);
      throw e;
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      const userId = parseInt(studentId.replace('est-', ''));
      
      await supabase.from('estudiante_aula').delete().eq('id_estudiante', userId);
      await supabase.from('datos_estudiante').delete().eq('id_usuario', userId);
      await supabase.from('tarjetas_identificacion').delete().eq('id_usuario', userId);
      await supabase.from('asistencias').delete().eq('id_usuario', userId);
      await supabase.from('justificaciones').delete().eq('id_estudiante', userId);
      await supabase.from('usuarios').delete().eq('id_usuario', userId);

      await loadData();
    } catch (e) {
      console.error("Error al eliminar estudiante:", e);
      throw e;
    }
  };

  const saveTeacher = async (data: any) => {
    try {
      const isNew = !data.id || !data.id.startsWith('doc-');
      const docTypeDni = 1;

      const userObj = {
        id_tipo_doc: docTypeDni,
        numero_documento: data.numero_documento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        celular: data.celular || null,
        direccion: data.direccion || null,
        correo: data.correo,
        password: data.password || 'password123',
        id_rol: data.id_rol || 5,
        materia_especialidad: data.id_rol === 6 ? data.materia_especialidad : null,
        id_aula_tutor: data.id_rol === 5 ? data.id_aula_tutor : null
      };

      if (isNew) {
        await supabase.from('usuarios').insert(userObj);
      } else {
        const userId = parseInt(data.id.replace('doc-', ''));
        await supabase.from('usuarios').update(userObj).eq('id_usuario', userId);
      }

      await loadData();
    } catch (e) {
      console.error("Error al guardar docente:", e);
      throw e;
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    try {
      const userId = parseInt(teacherId.replace('doc-', ''));
      await supabase.from('asistencias').delete().eq('id_usuario', userId);
      await supabase.from('usuarios').delete().eq('id_usuario', userId);
      await loadData();
    } catch (e) {
      console.error("Error al eliminar docente:", e);
      throw e;
    }
  };

  const resetDatabase = async () => {
    try {
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
        const { error } = await supabase.from(item.table).delete().gt(item.pk, 0);
        if (error) {
          console.error(`Error deleting from table ${item.table}:`, error);
        }
      }

      // Asegurar que existan todos los roles en la base de datos
      const requiredRoles = [
        { id_role: 1, nombre_rol: 'Administrativo' },
        { id_role: 2, nombre_rol: 'Docente' },
        { id_role: 3, nombre_rol: 'Estudiante' },
        { id_role: 4, nombre_rol: 'Apoderado' },
        { id_role: 5, nombre_rol: 'Docente Primaria' },
        { id_role: 6, nombre_rol: 'Docente Secundaria' },
        { id_role: 7, nombre_rol: 'Auxiliar' },
        { id_role: 8, nombre_rol: 'Limpieza' }
      ];
      for (const role of requiredRoles) {
        const rolePayload = { id_rol: role.id_role, nombre_rol: role.nombre_rol };
        const { error } = await supabase.from('roles').upsert(rolePayload);
        if (error) console.error("Error upserting role:", role, error);
      }

      // Asegurar que exista el tipo de documento DNI
      const requiredTipos = [
        { id_tipo_doc: 1, nombre_documento: 'DNI' }
      ];
      for (const t of requiredTipos) {
        const { error } = await supabase.from('tipos_documento').upsert(t);
        if (error) console.error("Error upserting document type:", t, error);
      }

      // Obtener roles y tipos de doc actualizados
      const { data: dbTiposDoc } = await supabase.from('tipos_documento').select('*');
      const { data: dbRoles } = await supabase.from('roles').select('*');
      
      const rawTipos = dbTiposDoc || [];
      const rawRoles = dbRoles || [];

      const dniId = rawTipos.find(t => t.nombre_documento === 'DNI')?.id_tipo_doc || 1;
      const rolAdminId = rawRoles.find(r => r.nombre_rol === 'Administrativo')?.id_rol || 1;
      const rolDocenteId = rawRoles.find(r => r.nombre_rol === 'Docente')?.id_rol || 2;
      const rolEstudianteId = rawRoles.find(r => r.nombre_rol === 'Estudiante')?.id_rol || 3;
      const rolApoderadoId = rawRoles.find(r => r.nombre_rol === 'Apoderado')?.id_rol || 4;

      // 1. Crear grados_secciones de primaria
      const { data: dbAulas, error: aulasErr } = await supabase.from('grados_secciones').insert([
        { grado: '1º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
        { grado: '2º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
        { grado: '3º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
        { grado: '4º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
        { grado: '5º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 },
        { grado: '6º Primaria', seccion: 'A', nivel: 'Primaria', anio_academico: 2026 }
      ]).select();
      if (aulasErr) console.error("Error inserting aulas:", aulasErr);

      const rawAulas = dbAulas || [];

      // Roles adicionales
      const rolDocentePrimariaId = rawRoles.find(r => r.nombre_rol.includes('Primaria'))?.id_rol || 5;

      // Re-insertar usuarios
      // Admin
      const { data: adminCreated, error: adminErr } = await supabase.from('usuarios').insert([
        { id_tipo_doc: dniId, numero_documento: '12345678', nombres: 'José', apellidos: 'Calasanz', celular: '999888777', direccion: 'Av. Universitaria 123', correo: 'admin@colegio.edu.pe', password: 'admin', id_rol: rolAdminId }
      ]).select();
      if (adminErr) console.error("Error creating admin:", adminErr);

      // Insertar docentes tutores (6 profesores, uno para cada salón de primaria)
      const teachersToInsert = [
        { nombres: 'Ana', apellidos: 'Gómez', numero: '22222201', correo: 'ana.gomez@colegio.edu.pe', aulaIndex: 0 },
        { nombres: 'Luis', apellidos: 'Pérez', numero: '22222202', correo: 'luis.perez@colegio.edu.pe', aulaIndex: 1 },
        { nombres: 'Marta', apellidos: 'Soler', numero: '22222203', correo: 'marta.soler@colegio.edu.pe', aulaIndex: 2 },
        { nombres: 'Carlos', apellidos: 'Mendoza', numero: '22222204', correo: 'carlos.mendoza@colegio.edu.pe', aulaIndex: 3 },
        { nombres: 'Elena', apellidos: 'Rojas', numero: '22222205', correo: 'elena.rojas@colegio.edu.pe', aulaIndex: 4 },
        { nombres: 'Roberto', apellidos: 'Castro', numero: '22222206', correo: 'roberto.castro@colegio.edu.pe', aulaIndex: 5 }
      ];

      const docentesUsers = teachersToInsert.map(t => {
        const aulaId = rawAulas[t.aulaIndex]?.id_aula || null;
        return {
          id_tipo_doc: dniId,
          numero_documento: t.numero,
          nombres: t.nombres,
          apellidos: t.apellidos,
          celular: '98765430' + t.aulaIndex,
          direccion: 'Calle Principal ' + (100 * (t.aulaIndex + 1)),
          correo: t.correo,
          password: 'password123',
          id_rol: rolDocentePrimariaId,
          id_aula_tutor: aulaId
        };
      });

      const { data: dbTeachersCreated } = await supabase.from('usuarios').insert(docentesUsers).select();
      const rawTeachersCreated = dbTeachersCreated || [];

      // Generar 16 estudiantes por grado. 6 grados = 96 estudiantes.
      const firstNames = ['Santiago', 'Mateo', 'Juan', 'Matías', 'Lucas', 'Benjamín', 'Felipe', 'Sofía', 'María', 'Valentina', 'Isabella', 'Camila', 'Mariana', 'Gabriela', 'Alejandro', 'Daniel', 'David', 'Emma', 'Lucía', 'Martina', 'Diego', 'Nicolás', 'Sebastian', 'Victoria', 'Zoe', 'Mia'];
      const lastNames = ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Silva', 'Castro', 'Mendoza', 'Rojas', 'Guerrero', 'Medina', 'Cortéz', 'Herrera', 'Castillo'];
      const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'AB+'];
      const medicalInsurances = ['EsSalud', 'SIS', 'Rimac', 'Pacifico', 'Particular'];

      const studentsToInsert = [];
      const studentAulaAssignments = [];
      
      let studentIndex = 1;
      for (let aulaIdx = 0; aulaIdx < 6; aulaIdx++) {
        const aula = rawAulas[aulaIdx];
        if (!aula) continue;

        for (let sIdx = 1; sIdx <= 16; sIdx++) {
          const docNum = '5555' + String(studentIndex).padStart(4, '0');
          const firstName = firstNames[studentIndex % firstNames.length];
          const lastName1 = lastNames[(studentIndex * 3) % lastNames.length];
          const lastName2 = lastNames[(studentIndex * 7 + 1) % lastNames.length];
          
          studentsToInsert.push({
            id_tipo_doc: dniId,
            numero_documento: docNum,
            nombres: firstName,
            apellidos: `${lastName1} ${lastName2}`,
            celular: '955' + String(100000 + studentIndex),
            direccion: `Av. Estudiante #${studentIndex}`,
            correo: `alumno.${studentIndex}@colegio.edu.pe`,
            password: 'password123',
            id_rol: rolEstudianteId
          });

          studentAulaAssignments.push({
            docNum,
            id_aula: aula.id_aula,
            gradeName: aula.grado,
            sIdx,
            aulaIdx
          });

          studentIndex++;
        }
      }

      // Insertar estudiantes en la base de datos
      const { data: dbStudentsCreated } = await supabase.from('usuarios').insert(studentsToInsert).select();
      const rawStudentsCreated = dbStudentsCreated || [];

      // Mapear asociaciones
      const mappedStudentsList = studentAulaAssignments.map(assignment => {
        const userObj = rawStudentsCreated.find(u => u.numero_documento === assignment.docNum);
        return {
          ...assignment,
          id_usuario: userObj ? userObj.id_usuario : null,
          nombres: userObj ? userObj.nombres : '',
          apellidos: userObj ? userObj.apellidos : ''
        };
      }).filter(s => s.id_usuario !== null);

      // Insertar datos_estudiante
      const dbDatosEstudiantes = mappedStudentsList.map((s, idx) => ({
        id_usuario: s.id_usuario,
        tipo_sangre: bloodTypes[idx % bloodTypes.length],
        seguro_medico: medicalInsurances[idx % medicalInsurances.length],
        observaciones_medicas: idx % 10 === 0 ? 'Alergia al polvo' : 'Ninguna'
      }));
      await supabase.from('datos_estudiante').insert(dbDatosEstudiantes);

      // Insertar tarjetas de identificación
      const dbCards = mappedStudentsList.map(s => {
        const gradeNum = s.aulaIdx + 1;
        const padIdx = String(s.sIdx).padStart(2, '0');
        // Código: CAL-2026-0001 a CAL-2026-0096
        const code = `CAL-2026-${String(s.sIdx + s.aulaIdx * 16).padStart(4, '0')}`;
        return {
          id_usuario: s.id_usuario,
          codigo_barra: code,
          estado: s.sIdx !== 13 // Bloquear el alumno 13 de cada clase como caso de prueba
        };
      });

      // Tarjetas para docentes
      rawTeachersCreated.forEach((teacherObj, idx) => {
        dbCards.push({
          id_usuario: teacherObj.id_usuario,
          codigo_barra: `CAL-2026-D00${idx + 1}`,
          estado: true
        });
      });

      await supabase.from('tarjetas_identificacion').insert(dbCards);

      // Insertar estudiante_aula
      const dbEstudianteAula = mappedStudentsList.map(s => ({
        id_estudiante: s.id_usuario,
        id_aula: s.id_aula
      }));
      await supabase.from('estudiante_aula').insert(dbEstudianteAula);

      // Generar asistencias de simulación (Días 2026-07-08 y 2026-07-09)
      const logsToInsert: any[] = [];
      const dates = ['2026-07-08', '2026-07-09'];

      dates.forEach(date => {
        mappedStudentsList.forEach(s => {
          // Determinar estado de forma determinista
          const seed = s.id_usuario + (date === '2026-07-09' ? 5 : 12);
          const rand = seed % 16;
          
          if (rand === 0) {
            // Ausente
            logsToInsert.push({
              id_usuario: s.id_usuario,
              fecha: date,
              hora_entrada: '00:00:00',
              hora_salida: null,
              estado_entrada: 'Ausente',
              time_note: null
            });
          } else if (rand === 1 || rand === 2) {
            // Tardanza
            const min = 1 + (seed % 15);
            const entryTime = `08:${String(min).padStart(2, '0')}:00`;
            logsToInsert.push({
              id_usuario: s.id_usuario,
              fecha: date,
              hora_entrada: entryTime,
              hora_salida: '12:45:00',
              estado_entrada: 'Tardanza',
              time_note: `08:${String(min).padStart(2, '0')}`
            });
          } else {
            // Presente
            const min = 15 + (seed % 40);
            const entryTime = `07:${String(min).padStart(2, '0')}:00`;
            logsToInsert.push({
              id_usuario: s.id_usuario,
              fecha: date,
              hora_entrada: entryTime,
              hora_salida: '12:45:00',
              estado_entrada: 'Presente',
              time_note: null
            });
          }
        });

        // Registrar asistencia de los profesores
        rawTeachersCreated.forEach((teacherObj, idx) => {
          const seed = teacherObj.id_usuario + (date === '2026-07-09' ? 3 : 7);
          const isTardy = seed % 6 === 0;
          
          const entryTime = isTardy 
            ? `07:12:00` 
            : `06:${String(45 + (seed % 14)).padStart(2, '0')}:00`;
            
          logsToInsert.push({
            id_usuario: teacherObj.id_usuario,
            fecha: date,
            hora_entrada: entryTime,
            hora_salida: '13:00:00',
            estado_entrada: isTardy ? 'Tardanza' : 'Presente',
            time_note: isTardy ? '07:12' : null
          });
        });
      });

      const { error: logsErr } = await supabase.from('asistencias').insert(logsToInsert);
      if (logsErr) console.error("Error inserting simulated logs:", logsErr);

      // Justificación de ejemplo para una ausencia
      const idApoderadoMock = adminCreated?.[0]?.id_usuario || null;
      const studentWithAbsence = mappedStudentsList?.[0]?.id_usuario;
      if (studentWithAbsence) {
        const { error: justErr } = await supabase.from('justificaciones').insert([
          { id_estudiante: studentWithAbsence, id_apoderado: idApoderadoMock, fecha_inasistencia: '2026-07-08', motivo: 'Cita odontológica de urgencia.', estado: 'Pendiente' }
        ]);
        if (justErr) console.error("Error inserting test justification:", justErr);
      }

      await loadData();

      // Actualizar la sesión del usuario actual en el context y sessionStorage para usar el nuevo id_usuario generado
      if (adminCreated?.[0]) {
        const u = adminCreated[0];
        const mappedUser: User = {
          id: String(u.id_usuario),
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          id_rol: u.id_rol,
          role_name: 'admin'
        };
        setUser(mappedUser);
        sessionStorage.setItem('sessionUser', JSON.stringify(mappedUser));
      }
    } catch (e) {
      console.error("Error al reiniciar base de datos:", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      students,
      teachers,
      staff,
      courses,
      logs,
      justifications,
      cards,
      classrooms,
      events,
      schedules,
      login,
      logout,
      saveLogs,
      saveJustifications,
      saveCards,
      saveEvents,
      saveSchedules,
      saveStudent,
      deleteStudent,
      saveTeacher,
      deleteTeacher,
      resetDatabase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
