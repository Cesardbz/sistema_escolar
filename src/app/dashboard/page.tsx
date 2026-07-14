'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth, User, Student, Teacher, Course, AttendanceLog, Justification, IDCard } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, loading, students, teachers, courses, logs, justifications, cards, saveLogs, saveJustifications, saveCards } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Estados de control de Toasts
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const [toastActive, setToastActive] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastText(text);
    setToastType(type);
    setToastActive(true);
    setTimeout(() => {
      setToastActive(false);
    }, 4000);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (user) {
      const autoKiosk = localStorage.getItem('kiosk_mode_auto_lock');
      if (autoKiosk === 'true' && user.role_name === 'admin') {
        setCurrentView('admin-scan-station');
        setIsLocked(true);
      } else {
        // Establecer vista inicial basada en rol
        if (user.role_name === 'admin') setCurrentView('admin-dashboard');
        else if (user.role_name === 'teacher') setCurrentView('teacher-dashboard');
        else if (user.role_name === 'student') setCurrentView('student-dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !currentView) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-[var(--primary)]"></i>
          <p className="text-sm font-semibold text-[var(--text-muted)]">Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="app-container">
      {/* Barra lateral */}
      {!isLocked && (
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
          isActive={isSidebarOpen}
        />
      )}

      {/* Contenido principal */}
      <main className={isLocked ? "main-content w-full !pl-0" : "main-content"}>
        {!isLocked && <Topbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />}

        {/* Notificación Toast */}
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 z-[9999] ${toastActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} ${toastType === 'success' ? 'bg-[#ecfdf5] border border-[#10b981]/20 text-[#10b981]' : toastType === 'error' ? 'bg-[#fef2f2] border border-[#ef4444]/20 text-[#ef4444]' : 'bg-[#eff6ff] border border-[#3b82f6]/20 text-[#3b82f6]'}`}>
          <i className={`fa-solid ${toastType === 'success' ? 'fa-circle-check' : toastType === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
          <span className="text-sm font-semibold">{toastText}</span>
        </div>

        {/* Renderizado de Sub-vistas */}
        <div className="view-panel active">
          {currentView === 'admin-dashboard' && <AdminDashboardView showToast={showToast} />}
          {currentView === 'admin-scan-station' && (
            <AdminScanStationView 
              showToast={showToast} 
              isLocked={isLocked}
              setIsLocked={setIsLocked}
            />
          )}
          {currentView === 'admin-logs' && <AdminLogsView showToast={showToast} />}
          {currentView === 'admin-classroom-attendance' && <AdminClassroomAttendanceView showToast={showToast} />}
          {currentView === 'admin-staff-logs' && <AdminStaffLogsView showToast={showToast} />}
          {currentView === 'admin-justifications' && <AdminJustificationsView showToast={showToast} />}
          {currentView === 'admin-announcements' && <AdminAnnouncementsView showToast={showToast} />}
          {currentView === 'admin-calendar' && <AdminCalendarView showToast={showToast} />}
          {currentView === 'admin-schedule' && <TimetableScheduleView showToast={showToast} isAdminView={true} />}
          {currentView === 'admin-students' && <AdminStudentsView showToast={showToast} />}
          {currentView === 'admin-teachers' && <AdminTeachersView showToast={showToast} />}
          {currentView === 'admin-cards' && <AdminCardsView showToast={showToast} />}
          
          {currentView === 'teacher-dashboard' && <TeacherDashboardView />}
          {currentView === 'teacher-register' && <TeacherRegisterView showToast={showToast} />}
          {currentView === 'teacher-schedule' && <TimetableScheduleView showToast={showToast} isAdminView={false} />}
          
          {currentView === 'student-dashboard' && <StudentDashboardView showToast={showToast} />}
        </div>
      </main>
    </div>
  );
}

// ==========================================================================
// SUB-VISTA: ADMIN - DASHBOARD PRINCIPAL
// ==========================================================================
interface SubViewProps {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const AdminDashboardView: React.FC<SubViewProps> = ({ showToast }) => {
  const { students, teachers, staff, logs, justifications, saveJustifications, saveLogs } = useAuth();
  
  const totalStudents = students.length;
  const todayStr = '2026-07-09'; // Fecha fija de simulación
  
  const todayLogs = logs.filter(l => l.date === todayStr);
  const presentToday = todayLogs.filter(l => l.studentId.startsWith('est-') && l.state === 'Presente').length;
  const tardyToday = todayLogs.filter(l => l.studentId.startsWith('est-') && l.state === 'Tardanza').length;
  const pendingJustsList = justifications.filter(j => j.status === 'Pendiente');
  const pendingJustifications = pendingJustsList.length;

  const attendanceRate = totalStudents > 0 ? Math.round(((presentToday + tardyToday) / totalStudents) * 100) : 0;

  // --- 1. LÓGICA DE ASISTENCIA DEL PERSONAL ---
  const todayPersonalLogs = todayLogs.filter(l => !l.studentId.startsWith('est-'));
  
  const totalTeachers = teachers.length;
  const presentTeachers = todayPersonalLogs.filter(l => l.studentId.startsWith('doc-') && (l.state === 'Presente' || l.state === 'Tardanza')).length;
  
  const totalStaff = staff.length;
  const presentStaff = todayPersonalLogs.filter(l => l.studentId.startsWith('staff-') && (l.state === 'Presente' || l.state === 'Tardanza')).length;

  const totalAux = staff.filter(s => s.roleId === 7).length;
  const presentAux = todayPersonalLogs.filter(l => {
    const s = staff.find(st => st.id === l.studentId);
    return s && s.roleId === 7 && (l.state === 'Presente' || l.state === 'Tardanza');
  }).length;

  const totalLim = staff.filter(s => s.roleId === 8).length;
  const presentLim = todayPersonalLogs.filter(l => {
    const s = staff.find(st => st.id === l.studentId);
    return s && s.roleId === 8 && (l.state === 'Presente' || l.state === 'Tardanza');
  }).length;


  // --- 3. LÓGICA DE APROBACIÓN RÁPIDA DE JUSTIFICACIONES ---
  const handleApproveJustification = async (id: string, studentId: string, date: string) => {
    try {
      showToast('Procesando aprobación...', 'info');
      // Actualizar estado de la justificación
      const updatedJusts = justifications.map(j => j.id === id ? { ...j, status: 'Aprobado' as const } : j);
      await saveJustifications(updatedJusts);
      
      // Actualizar automáticamente el registro de asistencia del alumno a 'Justificado' en cascada
      const updatedLogs = logs.map(l => {
        if (l.studentId === studentId && l.date === date) {
          return { ...l, state: 'Justificado' as const, timeNote: 'Justificado' };
        }
        return l;
      });
      await saveLogs(updatedLogs);
      showToast('Justificación aprobada y asistencia justificada.', 'success');
    } catch (e) {
      showToast('Error al aprobar la justificación', 'error');
    }
  };

  const handleRejectJustification = async (id: string) => {
    try {
      showToast('Procesando rechazo...', 'info');
      const updatedJusts = justifications.map(j => j.id === id ? { ...j, status: 'Rechazado' as const } : j);
      await saveJustifications(updatedJusts);
      showToast('Justificación rechazada.', 'success');
    } catch (e) {
      showToast('Error al rechazar la justificación', 'error');
    }
  };

  // --- 4. LÓGICA DE ALERTA DE INASISTENCIAS CRÓNICAS (SEMÁFORO) ---
  const getChronicAlerts = () => {
    const studentStats: { [key: string]: { name: string, grade: string, absences: number, tardies: number } } = {};
    
    logs.forEach(log => {
      if (log.studentId.startsWith('est-')) {
        if (!studentStats[log.studentId]) {
          studentStats[log.studentId] = {
            name: log.studentName,
            grade: log.grade,
            absences: 0,
            tardies: 0
          };
        }
        if (log.state === 'Ausente') {
          studentStats[log.studentId].absences += 1;
        } else if (log.state === 'Tardanza') {
          studentStats[log.studentId].tardies += 1;
        }
      }
    });

    const alerts: { name: string, grade: string, count: number, type: 'critical' | 'warning', message: string }[] = [];
    Object.values(studentStats).forEach(s => {
      if (s.absences >= 2) {
        alerts.push({
          name: s.name,
          grade: s.grade,
          count: s.absences,
          type: 'critical',
          message: `${s.absences} Ausencias en el mes`
        });
      } else if (s.tardies >= 2) {
        alerts.push({
          name: s.name,
          grade: s.grade,
          count: s.tardies,
          type: 'warning',
          message: `${s.tardies} Tardanzas en el mes`
        });
      }
    });

    return alerts.sort((a, b) => b.count - a.count).slice(0, 4);
  };
  
  const chronicAlerts = getChronicAlerts();

  const handleExportPersonal = () => {
    const BOM = '\uFEFF';
    let csvContent = "Rol,Asistencia,Total,Porcentaje\n";
    csvContent += `Docentes,${presentTeachers},${totalTeachers},${totalTeachers > 0 ? Math.round((presentTeachers / totalTeachers) * 100) : 0}%\n`;
    csvContent += `Personal de Limpieza,${presentLim},${totalLim},${totalLim > 0 ? Math.round((presentLim / totalLim) * 100) : 0}%\n`;
    csvContent += `Auxiliares,${presentAux},${totalAux},${totalAux > 0 ? Math.round((presentAux / totalAux) * 100) : 0}%\n`;
    csvContent += `Total Personal,${presentStaff + presentTeachers},${totalStaff + totalTeachers},${(totalStaff + totalTeachers) > 0 ? Math.round(((presentStaff + presentTeachers) / (totalStaff + totalTeachers)) * 100) : 0}%\n`;

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_personal_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de personal descargado con éxito', 'success');
  };

  const handleExportChronic = () => {
    const BOM = '\uFEFF';
    let csvContent = "Estudiante,Grado,Alerta,Detalle\n";
    chronicAlerts.forEach(c => {
      csvContent += `"${c.name}","${c.grade}","${c.type === 'critical' ? 'Critico' : 'Advertencia'}","${c.message}"\n`;
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_inasistencias_cronicas_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de inasistencias crónicas descargado con éxito', 'success');
  };

  // Datos del gráfico (Asistencia por grado en 3º Primaria, 5º Secundaria y 1º Secundaria)
  const grades = ['3º Primaria', '5º Secundaria', '1º Secundaria'];
  const gradeStats = grades.map(g => {
    const totalInGrade = students.filter(s => s.grade.includes(g)).length;
    const presentInGrade = todayLogs.filter(l => l.grade.includes(g) && (l.state === 'Presente' || l.state === 'Tardanza')).length;
    const rate = totalInGrade > 0 ? Math.round((presentInGrade / totalInGrade) * 100) : 0;
    return { name: g, rate, total: totalInGrade, present: presentInGrade };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="panel-header">
        <h1 className="panel-title">Resumen Escolar</h1>
        <p className="panel-subtitle">Panel general de estadísticas diarias y control de personal</p>
      </div>

      {/* Stats Grid: Estudiantes */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><i className="fa-solid fa-graduation-cap"></i></div>
          <div className="stat-info">
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-label">Total Alumnos</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><i className="fa-solid fa-circle-check"></i></div>
          <div className="stat-info">
            <span className="stat-value">{attendanceRate}%</span>
            <span className="stat-label">Asistencia Hoy ({presentToday + tardyToday}/{totalStudents})</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><i className="fa-solid fa-clock"></i></div>
          <div className="stat-info">
            <span className="stat-value">{tardyToday}</span>
            <span className="stat-label">Tardanzas Hoy</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon"><i className="fa-solid fa-file-invoice"></i></div>
          <div className="stat-info">
            <span className="stat-value">{pendingJustifications}</span>
            <span className="stat-label">Justificaciones Pendientes</span>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN: CONTROL DE ASISTENCIA DEL PERSONAL --- */}
      <div className="card">
        <div className="card-header border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="card-title"><i className="fa-solid fa-briefcase text-blue-600"></i> Control de Asistencia del Personal</h3>
            <span className="card-subtitle">Personal activo registrado hoy ({todayPersonalLogs.length} en total)</span>
          </div>
          <button className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg" onClick={handleExportPersonal}>
            <i className="fa-solid fa-file-excel text-green-600"></i> Exportar
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-1">
            <span className="text-xs text-blue-700 font-bold uppercase tracking-wider">Docentes</span>
            <span className="text-2xl font-black text-blue-900">{presentTeachers} <span className="text-sm font-normal text-blue-500">de {totalTeachers}</span></span>
            <div className="w-full bg-blue-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${totalTeachers > 0 ? (presentTeachers / totalTeachers) * 100 : 0}%` }}></div>
            </div>
          </div>
          
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-1">
            <span className="text-xs text-green-700 font-bold uppercase tracking-wider">Auxiliares</span>
            <span className="text-2xl font-black text-green-900">{presentAux} <span className="text-sm font-normal text-green-500">de {totalAux}</span></span>
            <div className="w-full bg-green-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-green-600 h-full rounded-full" style={{ width: `${totalAux > 0 ? (presentAux / totalAux) * 100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-1">
            <span className="text-xs text-purple-700 font-bold uppercase tracking-wider">Limpieza</span>
            <span className="text-2xl font-black text-purple-900">{presentLim} <span className="text-sm font-normal text-purple-500">de {totalLim}</span></span>
            <div className="w-full bg-purple-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${totalLim > 0 ? (presentLim / totalLim) * 100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col gap-1">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Administrativo</span>
            <span className="text-2xl font-black text-amber-900">{presentStaff - presentAux - presentLim} <span className="text-sm font-normal text-amber-500">de {totalStaff - totalAux - totalLim}</span></span>
            <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: `${(totalStaff - totalAux - totalLim) > 0 ? ((presentStaff - presentAux - presentLim) / (totalStaff - totalAux - totalLim)) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-col">
          {/* Gráfico SVG Personalizado */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-chart-simple"></i> Tasa de Asistencia por Aula</h3>
              <span className="card-subtitle">Hoy - 9 de Julio, 2026</span>
            </div>
            <div className="flex flex-col gap-6 py-4">
              {gradeStats.map(stat => (
                <div key={stat.name} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{stat.name}</span>
                    <span className="text-[var(--primary)]">{stat.rate}% ({stat.present} de {stat.total} alumnos)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--info)] transition-all duration-500 rounded-full"
                      style={{ width: `${stat.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-col">
          {/* Alertas del Día */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-triangle-exclamation"></i> Alertas de Asistencia Hoy</h3>
              <span className="card-subtitle">Tardanzas y Ausencias</span>
            </div>
            <div className="alert-list">
              {todayLogs.filter(l => l.studentId.startsWith('est-') && (l.state === 'Tardanza' || l.state === 'Ausente')).length === 0 ? (
                <p className="text-sm text-center py-6 text-[var(--text-muted)]">No hay alertas de asistencia hoy.</p>
              ) : (
                todayLogs
                  .filter(l => l.studentId.startsWith('est-') && (l.state === 'Tardanza' || l.state === 'Ausente'))
                  .slice(0, 4)
                  .map(log => (
                    <div key={log.id} className="alert-item">
                      <div className="alert-user">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                          {log.studentName.substring(0, 2)}
                        </div>
                        <div>
                          <span className="alert-name block">{log.studentName}</span>
                          <span className="alert-desc block">{log.grade}</span>
                        </div>
                      </div>
                      <span className={`alert-badge ${log.state === 'Ausente' ? 'danger' : 'warning'}`}>
                        {log.state === 'Ausente' ? 'Ausente' : `Tardanza (${log.timeNote || log.time})`}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN INFERIOR: JUSTIFICACIONES Y ALERTAS CRÓNICAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* APROBADOR RÁPIDO DE JUSTIFICACIONES */}
        <div className="card">
          <div className="card-header border-b border-gray-100 pb-3 mb-4">
            <h3 className="card-title"><i className="fa-solid fa-check-double text-teal-600"></i> Aprobación Rápida</h3>
            <span className="card-subtitle">Solicitudes de inasistencia pendientes</span>
          </div>
          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
            {pendingJustifications === 0 ? (
              <p className="text-sm text-center py-10 text-[var(--text-muted)] italic">No hay justificaciones pendientes.</p>
            ) : (
              pendingJustsList.slice(0, 3).map(just => (
                <div key={just.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{just.studentName}</span>
                      <span className="text-[10px] text-gray-400 block">Inasistencia: {just.date}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-bold uppercase rounded">Pendiente</span>
                  </div>
                  <p className="text-xs text-gray-500 italic bg-white p-2 rounded border border-gray-100">
                    "{just.reason}"
                  </p>
                  <div className="flex gap-2 justify-end mt-1">
                    <button 
                      className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 border-none rounded text-[10px] font-bold cursor-pointer"
                      onClick={() => handleRejectJustification(just.id)}
                    >
                      Rechazar
                    </button>
                    <button 
                      className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 border-none rounded text-[10px] font-bold cursor-pointer"
                      onClick={() => handleApproveJustification(just.id, just.studentId, just.date)}
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEMÁFORO DE ALERTA DE INASISTENCIAS CRÓNICAS */}
        <div className="card">
          <div className="card-header border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="card-title"><i className="fa-solid fa-traffic-light text-red-600"></i> Semáforo de Inasistencias</h3>
              <span className="card-subtitle">Alumnos en riesgo acumulado en el mes</span>
            </div>
            <button className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg" onClick={handleExportChronic}>
              <i className="fa-solid fa-file-excel text-green-600"></i> Exportar
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {chronicAlerts.length === 0 ? (
              <p className="text-sm text-center py-10 text-[var(--text-muted)] italic">No se detectan alumnos en riesgo de asistencia.</p>
            ) : (
              chronicAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${alert.type === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{alert.name}</span>
                      <span className="text-[10px] text-gray-400 block">{alert.grade}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${alert.type === 'critical' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {alert.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ENVIAR COMUNICADOS MÓVILES
// ==========================================================================
const AdminAnnouncementsView: React.FC<SubViewProps> = ({ showToast }) => {
  const [pushAudience, setPushAudience] = useState<'Todos' | 'Primaria' | 'Secundaria'>('Todos');
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [sendingPush, setSendingPush] = useState(false);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) {
      showToast('Por favor escribe el título y el mensaje del comunicado.', 'error');
      return;
    }
    setSendingPush(true);
    setTimeout(() => {
      setSendingPush(false);
      showToast(`Comunicado push enviado a: ${pushAudience}`, 'success');
      setPushTitle('');
      setPushMessage('');
    }, 1200);
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h1 className="panel-title">Comunicados Móviles</h1>
        <p className="panel-subtitle">Envía notificaciones push en tiempo real a los teléfonos móviles de los apoderados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Formulario */}
        <div className="card lg:col-span-2 flex flex-col">
          <div className="card-header border-b border-gray-100 pb-3 mb-4">
            <h3 className="card-title"><i className="fa-solid fa-paper-plane text-indigo-600"></i> Nuevo Comunicado</h3>
            <span className="card-subtitle">Redacta el aviso para la audiencia seleccionada</span>
          </div>
          
          <form onSubmit={handleSendPush} className="flex flex-col gap-4 flex-1">
            <div className="form-group">
              <label className="text-xs font-bold text-gray-500 uppercase">Audiencia / Destinatarios</label>
              <select 
                className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-3 py-1.5 outline-none focus:border-blue-500 focus:bg-white transition-all w-full mt-1" 
                value={pushAudience} 
                onChange={(e) => setPushAudience(e.target.value as any)}
              >
                <option value="Todos">Todos los Apoderados</option>
                <option value="Primaria">Solo Nivel Primaria</option>
                <option value="Secundaria">Solo Nivel Secundaria</option>
              </select>
            </div>
            <div className="form-group">
              <label className="text-xs font-bold text-gray-500 uppercase">Título del Aviso</label>
              <input 
                type="text" 
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all mt-1" 
                placeholder="Ej: Reunión Urgente de APAFA" 
                value={pushTitle} 
                onChange={(e) => setPushTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Mensaje o Cuerpo</label>
              <textarea 
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all resize-none mt-1" 
                rows={6}
                placeholder="Escribe los detalles del comunicado..." 
                value={pushMessage} 
                onChange={(e) => setPushMessage(e.target.value)}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={sendingPush}>
              {sendingPush ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paper-plane mr-2"></i>}
              {sendingPush ? 'Enviando Comunicado...' : 'Enviar Notificación Push'}
            </button>
          </form>
        </div>

        {/* Simulador */}
        <div className="card flex flex-col items-center justify-center bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase mb-4"><i className="fa-solid fa-mobile-screen-button mr-1"></i> Vista Previa en Vivo</span>
          
          <div className="w-[240px] h-[410px] bg-black rounded-[40px] p-3 shadow-xl border-[4px] border-gray-800 relative overflow-hidden flex flex-col select-none">
            {/* Notch */}
            <div className="w-24 h-4 bg-gray-800 rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-black/40"></div>
            </div>

            {/* Screen */}
            <div className="flex-1 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] rounded-[28px] p-3 text-white flex flex-col justify-start relative z-10 overflow-hidden">
              {/* Status Bar */}
              <div className="flex justify-between items-center text-[9px] text-white/60 mb-10 pt-1">
                <span>12:00</span>
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-signal"></i>
                  <i className="fa-solid fa-wifi"></i>
                  <i className="fa-solid fa-battery-full"></i>
                </div>
              </div>

              {/* Clock */}
              <div className="text-center mb-8">
                <span className="text-2xl font-light block">12:00</span>
                <span className="text-[8px] text-white/50 block uppercase tracking-wider">Lunes, 13 de Julio</span>
              </div>

              {/* Push Notification */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl shadow-lg flex flex-col gap-1 transition-all duration-300 transform scale-95 origin-top">
                <div className="flex justify-between items-center text-[8px] text-white/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-blue-600 flex items-center justify-center text-[7px] font-bold text-white shadow-sm">
                      <i className="fa-solid fa-school"></i>
                    </div>
                    <span className="font-bold">Calasanz Móvil</span>
                  </div>
                  <span>ahora</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-[10px] font-bold text-white block truncate">
                    {pushTitle || "Título del Aviso"}
                  </span>
                  <p className="text-[9px] text-white/80 line-clamp-4 leading-relaxed break-words">
                    {pushMessage || "Escribe un título y cuerpo de mensaje en el formulario para previsualizar aquí la notificación push."}
                  </p>
                </div>
              </div>

              {/* Home bar */}
              <div className="w-16 h-0.5 bg-white/40 rounded-full absolute bottom-1.5 left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ESTACIÓN DE ESCANEO (SIMULADOR EN TIEMPO REAL)
// ==========================================================================
interface ScanStationProps extends SubViewProps {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

const AdminScanStationView: React.FC<ScanStationProps> = ({ showToast, isLocked, setIsLocked }) => {
  const { students, teachers, staff, cards, logs, saveLogs } = useAuth();
  
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [inputCode, setInputCode] = useState('');
  
  // Estado del resultado del escaneo
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'blocked' | 'idle';
    message: string;
    studentName?: string;
    action?: 'Ingreso' | 'Salida';
    time?: string;
  }>({ status: 'idle', message: '' });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const lastScanned = useRef<{ [code: string]: number }>({});

  const [pinInput, setPinInput] = useState('');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const LOCK_PIN = '1234';

  // Perfil del usuario escaneado para mostrar su carné en tiempo real
  const [scannedPerson, setScannedPerson] = useState<any>(null);
  const [scannedCardCode, setScannedCardCode] = useState<string>('');

  // Iniciar/detener el escáner de cámara
  useEffect(() => {
    let html5QrCode: any = null;
    let isActive = true;
    
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isActive) return;
        
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            return { width: Math.min(width * 0.8, 265), height: Math.min(height * 0.5, 165) };
          },
          aspectRatio: 1.333333
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            handleScan(decodedText);
          },
          (errorMessage: string) => {
            // Ignorar errores ordinarios
          }
        );
      } catch (err) {
        console.error("Error al iniciar el escaneo con cámara:", err);
        showToast("No se pudo iniciar la cámara o permisos denegados", "error");
        setIsCameraActive(false);
      }
    };

    if (isCameraActive) {
      startScanner();
    }

    return () => {
      isActive = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e: any) => console.error("Error al detener cámara en cleanup:", e));
      }
    };
  }, [isCameraActive]);

  // Reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-PE', { hour12: false }));
      setDateStr(now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (code: string) => {
    if (!code.trim()) return;

    // Prevenir escaneos duplicados accidentales en menos de 5 segundos
    const nowTime = Date.now();
    if (lastScanned.current[code] && nowTime - lastScanned.current[code] < 5000) {
      return;
    }
    lastScanned.current[code] = nowTime;
    
    // Buscar la tarjeta
    const cardObj = cards.find(c => c.codigo_barra.toUpperCase() === code.trim().toUpperCase());
    
    if (!cardObj) {
      setScannedPerson(null);
      setScannedCardCode(code.trim().toUpperCase());
      setScanResult({
        status: 'error',
        message: 'Código de Credencial No Registrado'
      });
      setTimeout(() => {
        setScanResult({ status: 'idle', message: '' });
        setScannedPerson(null);
        setScannedCardCode('');
        setInputCode('');
      }, 2000);
      return;
    }

    const student = students.find(s => s.id === cardObj.studentId);
    const teacher = teachers.find(t => t.id === cardObj.studentId);
    const staffMem = staff.find(s => s.id === cardObj.studentId);
    
    const person = student || teacher || staffMem;

    if (!person) {
      setScannedPerson(null);
      setScannedCardCode(cardObj.codigo_barra);
      setScanResult({
        status: 'error',
        message: 'Usuario no encontrado en el sistema'
      });
      setTimeout(() => {
        setScanResult({ status: 'idle', message: '' });
        setScannedPerson(null);
        setScannedCardCode('');
        setInputCode('');
      }, 4000);
      return;
    }

    const personGrade = student ? student.grade : (teacher ? teacher.roleName : (staffMem ? staffMem.roleName : 'Personal'));
    
    // Guardar información del perfil escaneado
    setScannedPerson({
      id: person.id,
      name: person.name,
      grade: personGrade,
      photo: person.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6b46c1&color=fff`,
      roleName: student ? 'ESTUDIANTE' : (teacher ? 'DOCENTE' : 'PERSONAL')
    });
    setScannedCardCode(cardObj.codigo_barra);

    // Verificar si la tarjeta está bloqueada
    if (!cardObj.estado) {
      setScanResult({
        status: 'blocked',
        message: 'CREDENCIAL BLOQUEADA - ACCESO DENEGADO',
        studentName: person.name
      });
      setTimeout(() => {
        setScanResult({ status: 'idle', message: '' });
        setScannedPerson(null);
        setScannedCardCode('');
        setInputCode('');
      }, 4000);
      return;
    }

    // Fecha y hora del registro
    const now = new Date();
    const todayStr = '2026-07-09'; // Fecha fija de simulación del dashboard
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentHHMM = `${hh}:${mm}`;
    
    // Determinar si ya tiene asistencia hoy
    const existingLog = logs.find(l => l.studentId === person.id && l.date === todayStr);

    const hour = now.getHours();
    const minute = now.getMinutes();

    const isTeacher = !!teacher;
    const isStudent = !!student;
    const isPrimary = isStudent && student.grade.toLowerCase().includes('primaria');
    const isSecondary = isStudent && student.grade.toLowerCase().includes('secundaria');

    let isTardy = false;
    let actionLabel: 'Ingreso' | 'Salida' = 'Ingreso';
    let newLogs = [...logs];

    if (!existingLog) {
      // Registrar Ingreso
      if (isTeacher) {
        // Profesores: ingreso es a las 7:00 am
        if (hour > 7 || (hour === 7 && minute > 0)) {
          isTardy = true;
        }
      } else {
        // Estudiantes (o personal general): ingreso es de 7:00 a 8:00 am. Después de eso se considera tardanza.
        if (hour > 8 || (hour === 8 && minute > 0)) {
          isTardy = true;
        }
      }

      const logObj: AttendanceLog = {
        id: 'log-' + Date.now(),
        date: todayStr,
        time: currentHHMM,
        studentId: person.id,
        studentName: person.name,
        grade: personGrade,
        course: student ? 'Matemáticas' : 'Asistencia Personal',
        state: isTardy ? 'Tardanza' : 'Presente',
        timeNote: isTardy ? currentHHMM : undefined,
        teacherId: 'doc-admin',
        teacherName: student ? 'Estación de Entrada' : 'Control de Personal'
      };
      newLogs.push(logObj);
      actionLabel = 'Ingreso';
    } else {
      // Registrar Salida
      // Validaciones de salida para estudiantes
      if (isStudent) {
        if (isPrimary) {
          // Primaria sale a las 12:45 pm
          const isEarly = hour < 12 || (hour === 12 && minute < 45);
          if (isEarly) {
            setScanResult({
              status: 'blocked',
              message: 'SALIDA DENEGADA - Nivel Primaria sale a las 12:45 PM',
              studentName: person.name
            });
            setTimeout(() => {
              setScanResult({ status: 'idle', message: '' });
              setScannedPerson(null);
              setScannedCardCode('');
              setInputCode('');
            }, 1800);
            return;
          }
        } else if (isSecondary) {
          // Secundaria sale a las 3:30 pm (15:30)
          const isEarly = hour < 15 || (hour === 15 && minute < 30);
          if (isEarly) {
            setScanResult({
              status: 'blocked',
              message: 'SALIDA DENEGADA - Nivel Secundaria sale a las 3:30 PM',
              studentName: person.name
            });
            setTimeout(() => {
              setScanResult({ status: 'idle', message: '' });
              setScannedPerson(null);
              setScannedCardCode('');
              setInputCode('');
            }, 1800);
            return;
          }
        }
      }

      // Registrar Salida (actualizando el log existente)
      newLogs = newLogs.map(l => {
        if (l.studentId === person.id && l.date === todayStr) {
          return { ...l, timeOut: currentHHMM }; 
        }
        return l;
      });
      actionLabel = 'Salida';
    }

    try {
      await saveLogs(newLogs);
      setScanResult({
        status: 'success',
        action: actionLabel,
        studentName: person.name,
        time: currentHHMM,
        message: actionLabel === 'Ingreso' 
          ? (isTardy ? '¡Tardanza Registrada!' : '¡Ingreso Autorizado!')
          : '¡Salida Registrada! Adiós'
      });
      showToast(`${actionLabel} de ${person.name} registrado con éxito`, 'success');
    } catch (e) {
      setScanResult({
        status: 'error',
        message: 'Error al registrar asistencia en el servidor'
      });
    }

    // Limpiar pantalla de resultado después de 1.8 segundos
    setTimeout(() => {
      setScanResult({ status: 'idle', message: '' });
      setInputCode('');
      setScannedPerson(null);
      setScannedCardCode('');
    }, 1800);
  };

  const renderBarcode = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lines = [];
    lines.push({ x: 5, w: 1 });
    lines.push({ x: 7, w: 1 });
    let currentX = 10;
    for (let i = 0; i < 45; i++) {
      const val = Math.abs(Math.sin(hash + i * 23.45)) * 10;
      const width = (Math.floor(val) % 3) + 1;
      const gap = (Math.floor(val * 1.5) % 3) + 1;
      lines.push({ x: currentX, w: width });
      currentX += width + gap;
      if (currentX >= 90) break;
    }
    lines.push({ x: 92, w: 1 });
    lines.push({ x: 94, w: 1 });
    return (
      <svg className="w-full h-8 max-w-[180px]" stroke="currentColor" viewBox="0 0 100 20">
        <rect width="100" height="20" fill="white" />
        {lines.map((line, idx) => (
          <line key={idx} x1={line.x} y1="2" x2={line.x} y2="18" stroke="black" strokeWidth={line.w} />
        ))}
      </svg>
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(inputCode);
  };

  return (
    <div className={isLocked ? "fixed inset-0 bg-[#f8fafc] z-[9999] p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center min-h-screen" : ""}>
      <div className={`panel-header flex flex-col ${isLocked ? 'text-center items-center mb-2' : 'mb-4'}`}>
        <h1 className="panel-title !text-xl md:!text-2xl">Estación de Escaneo</h1>
        <p className="panel-subtitle">Registro en tiempo real para terminales de asistencia física y cámara web</p>
      </div>

      <div className={`max-w-xl mx-auto flex flex-col gap-6 w-full ${isLocked ? '' : 'mt-6'}`}>
        
        {/* Reloj y Estado del Terminal Centrado */}
        <div className="flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow-sm">
          <span className="text-3xl font-extrabold font-mono tracking-widest text-[var(--primary-dark)]">{timeStr || '00:00:00'}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Terminal Activo - {dateStr}
          </span>
          
          {/* Input invisible para lector de pistola (mantiene foco para recibir escaneos) */}
          <form onSubmit={handleFormSubmit} className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden">
            <input 
              type="text" 
              ref={(el) => { if (el) el.focus(); }}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onBlur={(e) => {
                // Forzar que nunca pierda el foco si no está en cámara
                if (!isCameraActive) {
                  setTimeout(() => e?.target?.focus(), 100);
                }
              }}
            />
          </form>
        </div>

        {/* Visor de Cámara Web o Credencial */}
        <div className="card flex flex-col items-center justify-center p-8 min-h-[460px] relative overflow-hidden transition-all duration-500 bg-gray-50/50 border-dashed border-2 border-gray-200">
          
          {scanResult.status === 'idle' ? (
            // Visor de Cámara (Opciones)
            isCameraActive ? (
              <div className="flex flex-col items-center gap-6 w-full max-w-md animate-fadeIn">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>Cámara en Vivo</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">Coloca el código QR o código de barras centrado en el visor.</p>
                </div>
                
                {/* Contenedor de la cámara */}
                {/* Contenedor de la cámara con mira y láser */}
                <div 
                  className="relative w-full bg-black rounded-2xl overflow-hidden border border-gray-200 shadow-lg aspect-video"
                  style={{ minHeight: '260px' }}
                >
                  {/* Visor de Escaneo */}
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-[80%] h-[75%] border border-white/20 rounded-lg relative">
                      {/* Esquinas del visor */}
                      <div className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl"></div>
                      <div className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr"></div>
                      <div className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl"></div>
                      <div className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-[3px] border-r-[3px] border-blue-500 rounded-br"></div>
                      
                      {/* Láser de Escaneo */}
                      <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_#ef4444] animate-[scanLaser_2.5s_ease-in-out_infinite]"></div>
                    </div>
                  </div>

                  <div id="reader" className="w-full h-full"></div>

                  <style>{`
                    @keyframes scanLaser {
                      0% { top: 5%; }
                      50% { top: 95%; }
                      100% { top: 5%; }
                    }
                  `}</style>
                </div>
                
                <button 
                  type="button" 
                  className="btn-secondary !bg-red-50 !text-red-600 !border-red-100 hover:!bg-red-100 w-full"
                  onClick={() => setIsCameraActive(false)}
                >
                  <i className="fa-solid fa-ban mr-2"></i> Detener Cámara
                </button>
              </div>
            ) : (
              // Estado de Espera (Permitir Encender Cámara)
              <div className="flex flex-col items-center gap-2 text-center animate-fadeIn">
                <style>{`
                  .scanner-preview-box {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    border-radius: 20px;
                    background: #f4faf9;
                    border: 1px solid #e2ecea;
                    box-shadow: 0 10px 30px rgba(0, 60, 50, 0.08);
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s ease, border-color 0.3s ease;
                  }
                  .scanner-preview-box:hover {
                    transform: scale(1.03);
                    border-color: #00b89c;
                  }
                  .grid-bg-preview {
                    position: absolute;
                    inset: 0;
                    background-image:
                      linear-gradient(rgba(0, 150, 130, 0.07) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 150, 130, 0.07) 1px, transparent 1px);
                    background-size: 20px 20px;
                    background-position: center;
                  }
                  .glow-core-preview {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(0, 200, 175, 0.12) 0%, transparent 65%);
                  }
                  .corner-preview {
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    border: 3px solid #00b89c;
                    filter: drop-shadow(0 0 4px rgba(0, 184, 156, 0.4));
                  }
                  .corner-preview.tl { top: 10px; left: 10px; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
                  .corner-preview.tr { top: 10px; right: 10px; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
                  .corner-preview.bl { bottom: 10px; left: 10px; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
                  .corner-preview.br { bottom: 10px; right: 10px; border-left: none; border-top: none; border-bottom-right-radius: 8px; }
                  .scan-line-preview {
                    position: absolute;
                    left: 6%;
                    width: 88%;
                    height: 3px;
                    border-radius: 2px;
                    background: linear-gradient(90deg, transparent, #00c2a0 20%, #00c2a0 80%, transparent);
                    box-shadow:
                      0 0 6px 1px rgba(0, 194, 160, 0.8),
                      0 0 18px 4px rgba(0, 194, 160, 0.25);
                    animation: sweepPreview 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                  }
                  .scan-line-preview::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: -30px;
                    height: 30px;
                    background: linear-gradient(to bottom, transparent, rgba(0, 194, 160, 0.08));
                  }
                  @keyframes sweepPreview {
                    0%   { top: 8%; }
                    50%  { top: 92%; }
                    100% { top: 8%; }
                  }
                  .pulse-dot-preview {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #00c2a0;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 8px 2px rgba(0, 194, 160, 0.5);
                    animation: pulsePreview 2s ease-in-out infinite;
                  }
                  @keyframes pulsePreview {
                    0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.8); }
                    50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.3); }
                  }
                  .status-preview {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #4a6360;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                    margin-top: 15px;
                  }
                  .status-dot-preview {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #00b89c;
                    box-shadow: 0 0 5px 1px rgba(0, 194, 160, 0.6);
                    animation: blinkPreview 1.4s ease-in-out infinite;
                  }
                  @keyframes blinkPreview {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.25; }
                  }
                `}</style>

                <h3 className="text-lg font-bold text-[#0f2a2a] tracking-wide">Escaneo de Código</h3>
                <p className="text-xs text-[#7a8a8a] mb-4 max-w-xs">Coloca el código dentro del recuadro para registrar la asistencia.</p>

                <div className="scanner-preview-box" onClick={() => setIsCameraActive(true)}>
                  <div className="grid-bg-preview"></div>
                  <div className="glow-core-preview"></div>
                  <div className="corner-preview tl"></div>
                  <div className="corner-preview tr"></div>
                  <div className="corner-preview bl"></div>
                  <div className="corner-preview br"></div>
                  <div className="pulse-dot-preview"></div>
                  <div className="scan-line-preview"></div>
                </div>

                <div className="status-preview">
                  <span className="status-dot-preview"></span>
                  <span>Esperando código para escanear...</span>
                </div>

                {showManualInput ? (
                  <form onSubmit={handleFormSubmit} className="flex gap-2 w-full max-w-xs mt-4 justify-center animate-fadeIn">
                    <input 
                      type="text" 
                      className="form-control text-center font-mono font-bold tracking-wider"
                      placeholder="Ej: CAL-2026-0001"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      autoFocus
                      required
                    />
                    <button type="submit" className="btn-primary !bg-[#00b89c] hover:!bg-[#009e86] border-none flex items-center justify-center p-2.5 rounded-lg text-white">
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <button type="button" className="btn-secondary !bg-gray-100 hover:!bg-gray-200 border-none flex items-center justify-center p-2.5 rounded-lg text-gray-600" onClick={() => { setShowManualInput(false); setInputCode(''); }} title="Ocultar">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </form>
                ) : (
                  <button 
                    type="button" 
                    className="text-xs text-gray-400 hover:text-gray-600 underline border-none bg-transparent cursor-pointer mt-3"
                    onClick={() => setShowManualInput(true)}
                  >
                    Ingresar código manualmente
                  </button>
                )}

                <button 
                  type="button" 
                  className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 mt-4 !bg-[#00b89c] hover:!bg-[#009e86] border-none shadow-md rounded-lg"
                  onClick={() => setIsCameraActive(true)}
                >
                  <i className="fa-solid fa-camera"></i>
                  <span>Activar Lector de Cámara</span>
                </button>
              </div>
            )
          ) : (
            // Mostrar la Credencial Visual (Carné) Escaneada
            scannedPerson ? (
              <div className="flex flex-col items-center gap-6 animate-fadeIn">
                {/* Sello de Estado */}
                <div className="text-center animate-bounce">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${
                    scanResult.status === 'success' 
                      ? (scanResult.action === 'Ingreso' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200') 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {scanResult.status === 'success' 
                      ? `${scanResult.action} Registrado` 
                      : 'Acceso Denegado'}
                  </span>
                </div>

                {/* Carné Escolar Estilizado */}
                <div 
                  className="id-card-badge animate-scaleUp relative" 
                  style={{ 
                    background: scannedPerson.roleName === 'ESTUDIANTE' 
                      ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' 
                      : (scannedPerson.roleName === 'DOCENTE' ? 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)' : 'linear-gradient(135deg, #0f172a 0%, #475569 100%)'),
                    width: '280px',
                    height: '420px',
                    padding: '20px'
                  }}
                >
                  <div className="id-card-inner-header flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                    <div className="id-card-logo w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <i className="fa-solid fa-graduation-cap text-sm"></i>
                    </div>
                    <div className="id-card-school-info text-left">
                      <h4 className="text-[10px] font-black text-white leading-tight uppercase">Colegio San José</h4>
                      <p className="text-[7px] text-white/60 leading-none">de Calasanz</p>
                    </div>
                  </div>
                  
                  <div className="id-card-body flex flex-col items-center text-center mt-2">
                    <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-md bg-white overflow-hidden flex items-center justify-center font-bold text-xl text-[var(--primary)] mb-3">
                      <img 
                        src={scannedPerson.photo} 
                        alt={scannedPerson.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <h3 className="text-white text-sm font-bold truncate max-w-full">{scannedPerson.name}</h3>
                    <span className="id-card-title-label text-[8px] bg-white/10 px-2 py-0.5 rounded text-white font-bold uppercase tracking-widest mt-1">
                      {scannedPerson.roleName}
                    </span>
                    
                    <div className="id-card-details mt-4 bg-white/5 border border-white/10 rounded-xl p-3 w-full text-[10px] flex flex-col gap-1.5 text-left text-white/80">
                      <div className="flex justify-between">
                        <span className="opacity-60">Grado/Rol:</span>
                        <span className="text-white font-semibold">{scannedPerson.grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">Código:</span>
                        <span className="text-white font-semibold font-mono">{scannedCardCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="id-card-footer mt-auto bg-white rounded-lg p-2 flex flex-col items-center justify-center text-black w-full shadow-inner">
                    <span className="text-[7px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">Credencial de Acceso</span>
                    <div className="flex items-center justify-center w-full py-0.5">
                      {renderBarcode(scannedCardCode || '00000000')}
                    </div>
                    <span className="text-[8px] font-mono font-bold tracking-widest mt-1 text-gray-500">{scannedCardCode}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Error genérico sin persona
              <div className="flex flex-col items-center gap-6 text-center animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-3xl text-yellow-500">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{scanResult.message}</h3>
                  <p className="text-xs text-gray-500 mt-1">El código escaneado ({scannedCardCode}) no corresponde a ningún usuario.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Floating Unlock Button */}
      {isLocked && (
        <button 
          className="fixed top-6 right-6 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center border-none shadow-lg z-[10000] cursor-pointer"
          onClick={() => setIsUnlockModalOpen(true)}
          title="Desbloquear navegación"
        >
          <i className="fa-solid fa-lock-open"></i>
        </button>
      )}

      {/* Modal Desbloqueo PIN */}
      {isUnlockModalOpen && (
        <div className="modal-overlay active z-[10001]">
          <div className="modal-box max-w-xs">
            <div className="modal-header">
              <h3 className="modal-title">Desbloquear Terminal</h3>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <p className="text-xs text-gray-500">Ingrese el PIN de seguridad (1234) para desbloquear la navegación del dashboard:</p>
              <input 
                type="password" 
                maxLength={4}
                className="form-control text-center text-xl font-bold tracking-widest"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
            </div>
            <div className="modal-footer flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => { setIsUnlockModalOpen(false); setPinInput(''); }}>Cancelar</button>
              <button 
                className="btn-primary flex-1" 
                onClick={() => {
                  if (pinInput === LOCK_PIN) {
                    setIsLocked(false);
                    setIsUnlockModalOpen(false);
                    setPinInput('');
                    showToast('Terminal desbloqueado con éxito', 'success');
                  } else {
                    showToast('PIN incorrecto', 'error');
                    setPinInput('');
                  }
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ASISTENCIA DIARIA (TABLA COMPLETA)
// ==========================================================================
const AdminLogsView: React.FC<SubViewProps> = ({ showToast }) => {
  const { students, logs, courses, teachers, saveLogs } = useAuth();
  
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterState, setFilterState] = useState('');

  const [page, setPage] = useState(1);
  const limit = 8;

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes.");
      return;
    }

    const rowsHtml = filteredLogs.map(log => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${log.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${log.time}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${log.studentName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${log.grade} - ${log.course}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${log.state}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-style: italic;">${log.teacherName}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Asistencia - Colegio San José de Calasanz</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px solid #0f4c9c; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #0a2d5c; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; color: #4a5568; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 10px; }
            th { background-color: #0f4c9c; color: white; padding: 12px 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Colegio San José de Calasanz</h1>
            <p>Reporte de Control de Asistencia</p>
          </div>
          <div class="meta">
            <div>
              <strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-PE')} <br/>
              <strong>Registros Exportados:</strong> ${filteredLogs.length}
            </div>
            <div>
              <strong>Filtros Aplicados:</strong> <br/>
              Grado/Sección: ${filterGrade || 'Todos'} | Estado: ${filterState || 'Todos'}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estudiante</th>
                <th>Grado y Curso</th>
                <th>Estado</th>
                <th>Registrado Por</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay registros de asistencia para mostrar.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            S.C.A. Colegio San José de Calasanz - Sistema de Control de Asistencia Digital 2026. Todos los derechos reservados.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    // BOM UTF-8 para soporte de tildes/ñ en Excel
    const BOM = '\uFEFF';
    
    // Encabezados de columnas
    let csvContent = "Fecha,Hora,Estudiante,Grado,Curso,Estado,Observación,Registrado Por\n";
    
    // Filas
    filteredLogs.forEach(log => {
      const row = [
        `"${log.date}"`,
        `"${log.time}"`,
        `"${log.studentName.replace(/"/g, '""')}"`,
        `"${log.grade.replace(/"/g, '""')}"`,
        `"${log.course.replace(/"/g, '""')}"`,
        `"${log.state}"`,
        `"${(log.timeNote || '').replace(/"/g, '""')}"`,
        `"${log.teacherName.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_asistencia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte Excel (CSV) descargado con éxito', 'success');
  };

  // Estado del Modal de Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [modalStudentId, setModalStudentId] = useState('');
  const [modalCourse, setModalCourse] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [modalState, setModalState] = useState('Presente');
  const [modalTimeNote, setModalTimeNote] = useState('');

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = log.studentName.toLowerCase().includes(search.toLowerCase()) || 
                            log.teacherName.toLowerCase().includes(search.toLowerCase()) || 
                            log.course.toLowerCase().includes(search.toLowerCase());
      const matchesDate = !filterDate || log.date === filterDate;
      const matchesGrade = !filterGrade || log.grade.includes(filterGrade);
      const matchesState = !filterState || log.state === filterState;
      return matchesSearch && matchesDate && matchesGrade && matchesState;
    })
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  const totalEntries = filteredLogs.length;
  const totalPages = Math.ceil(totalEntries / limit) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * limit, page * limit);

  // Abrir Modal de Edición / Nuevo
  const openModal = (logId = '') => {
    if (logId) {
      // Editar
      const log = logs.find(l => l.id === logId);
      if (log) {
        setEditId(logId);
        setModalStudentId(log.studentId);
        setModalCourse(log.course);
        setModalDate(log.date);
        setModalTime(log.time);
        setModalState(log.state);
        setModalTimeNote(log.timeNote || '');
      }
    } else {
      // Nuevo
      setEditId('');
      setModalStudentId(students[0]?.id || '');
      setModalCourse('Matemáticas');
      setModalDate('2026-07-09');
      setModalTime('08:00');
      setModalState('Presente');
      setModalTimeNote('');
    }
    setIsModalOpen(true);
  };

  // Guardar Registro de Asistencia
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === modalStudentId);
    if (!student) return;

    // Buscar profesor del grado/curso
    const courseObj = courses.find(c => c.name === modalCourse && c.grade === student.grade) || courses.find(c => c.name === modalCourse);
    let teacherName = 'Personal Admin';
    let teacherId = 'doc-admin';
    if (courseObj) {
      const teacherObj = teachers.find(t => t.id === courseObj.teacherId);
      if (teacherObj) {
        teacherName = teacherObj.name;
        teacherId = teacherObj.id;
      }
    }

    const logObj: AttendanceLog = {
      id: editId || 'log-' + Date.now(),
      date: modalDate,
      time: modalTime,
      studentId: modalStudentId,
      studentName: student.name,
      grade: student.grade,
      course: modalCourse,
      state: modalState as any,
      timeNote: modalState === 'Tardanza' && modalTimeNote ? modalTimeNote : undefined,
      teacherId,
      teacherName
    };

    let newLogs = [...logs];
    if (editId) {
      const idx = newLogs.findIndex(l => l.id === editId);
      if (idx >= 0) newLogs[idx] = logObj;
    } else {
      newLogs.push(logObj);
    }

    try {
      await saveLogs(newLogs);
      showToast(editId ? 'Registro actualizado' : 'Nuevo registro creado', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast('Error al guardar asistencia', 'error');
    }
  };

  // Eliminar Registro
  const handleDeleteLog = async (logId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
      const newLogs = logs.filter(l => l.id !== logId);
      try {
        await saveLogs(newLogs);
        showToast('Registro eliminado', 'success');
      } catch (e) {
        showToast('Error al eliminar registro', 'error');
      }
    }
  };

  return (
    <div>
      <div className="panel-header flex justify-between items-center">
        <div>
          <h1 className="panel-title">Asistencia Diaria</h1>
          <p className="panel-subtitle">Historial de registros y control de asistencia</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <i className="fa-solid fa-file-excel text-green-700"></i> Exportar Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <i className="fa-solid fa-file-pdf"></i> Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <i className="fa-solid fa-plus"></i> Nuevo Registro
          </button>
        </div>
      </div>

      <div className="card table-card">
        <div className="filters-row">
          <div className="search-wrapper">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Buscar estudiante, profesor o curso..."
              className="search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <input
            type="date"
            className="filter-date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
          />
          <select
            className="filter-select"
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setPage(1); }}
          >
            <option value="">Todos los Grados</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
          <select
            className="filter-select"
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setPage(1); }}
          >
            <option value="">Todos los Estados</option>
            <option value="Presente">Presente</option>
            <option value="Tardanza">Tardanza</option>
            <option value="Ausente">Ausente</option>
            <option value="Justificado">Justificado</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estudiante</th>
                <th>Grado - Curso</th>
                <th>Estado</th>
                <th>Registrado Por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.time}</td>
                    <td>
                      <div className="student-cell">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                          {log.studentName.substring(0, 2)}
                        </div>
                        <span>{log.studentName}</span>
                      </div>
                    </td>
                    <td>{log.grade} - {log.course}</td>
                    <td>
                      {log.state === 'Tardanza' && log.timeNote ? (
                        <span className="status-badge tardanza">Tardanza ({log.timeNote})</span>
                      ) : (
                        <span className={`status-badge ${log.state.toLowerCase()}`}>{log.state}</span>
                      )}
                    </td>
                    <td>{log.teacherName}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" title="Editar" onClick={() => openModal(log.id)}>
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button className="action-btn delete" title="Eliminar" onClick={() => handleDeleteLog(log.id)}>
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Mostrando {totalEntries > 0 ? (page - 1) * limit + 1 : 0} a {Math.min(page * limit, totalEntries)} de {totalEntries} registros
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="page-btn active">{page}</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Registro de Asistencia */}
      {isModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Editar Registro' : 'Nuevo Registro de Asistencia'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveLog}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Estudiante</label>
                  <select
                    className="form-control"
                    value={modalStudentId}
                    onChange={(e) => setModalStudentId(e.target.value)}
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Curso</label>
                  <select
                    className="form-control"
                    value={modalCourse}
                    onChange={(e) => setModalCourse(e.target.value)}
                    required
                  >
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Álgebra">Álgebra</option>
                    <option value="Comunicación">Comunicación</option>
                    <option value="Inglés Técnico">Inglés Técnico</option>
                    <option value="Historia">Historia</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Hora</label>
                    <input
                      type="time"
                      className="form-control"
                      value={modalTime}
                      onChange={(e) => setModalTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-control"
                    value={modalState}
                    onChange={(e) => setModalState(e.target.value)}
                    required
                  >
                    <option value="Presente">Presente</option>
                    <option value="Tardanza">Tardanza</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Justificado">Justificado</option>
                  </select>
                </div>
                {modalState === 'Tardanza' && (
                  <div className="form-group">
                    <label className="form-label">Nota de Tardanza (Hora de ingreso, ej: 08:03)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="08:03"
                      value={modalTimeNote}
                      onChange={(e) => setModalTimeNote(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ASISTENCIA POR SALÓN (CONSOLIDADA)
// ==========================================================================
const AdminClassroomAttendanceView: React.FC<SubViewProps> = ({ showToast }) => {
  const { students, logs, cards } = useAuth();
  
  // Obtener lista única de grados/salones ordenados
  const uniqueClassrooms = Array.from(new Set(students.map(s => s.grade)))
    .filter(g => g && g !== 'Sin Grado')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const [selectedGrade, setSelectedGrade] = useState(uniqueClassrooms[0] || '');
  const [selectedDate, setSelectedDate] = useState('2026-07-09'); // Fecha de simulación por defecto

  // Filtrar estudiantes por el salón seleccionado
  const classroomStudents = students.filter(s => s.grade === selectedGrade);

  // Obtener logs del día para el salón seleccionado
  const classroomLogs = logs.filter(l => l.date === selectedDate && l.grade === selectedGrade);

  // Estadísticas del salón
  const totalStudents = classroomStudents.length;
  const presentCount = classroomLogs.filter(l => l.state === 'Presente').length;
  const tardyCount = classroomLogs.filter(l => l.state === 'Tardanza').length;
  const justifiedCount = classroomLogs.filter(l => l.state === 'Justificado').length;
  const absentCount = totalStudents - (presentCount + tardyCount + justifiedCount);
  
  const attendanceRate = totalStudents > 0 
    ? Math.round(((presentCount + tardyCount + justifiedCount) / totalStudents) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="panel-header">
        <h1 className="panel-title">Asistencia por Salón</h1>
        <p className="panel-subtitle">Consolidado y control detallado de puntualidad por aula y sección</p>
      </div>

      {/* Selectores de Salón y Fecha */}
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seleccionar Salón</label>
            <select
              className="filter-select !m-0 min-w-[200px]"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {uniqueClassrooms.length === 0 ? (
                <option value="">No hay salones disponibles</option>
              ) : (
                uniqueClassrooms.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seleccionar Fecha</label>
            <input
              type="date"
              className="filter-date !m-0"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-[var(--text-muted)] block">SALÓN ACTUAL</span>
          <span className="text-lg font-black text-[var(--primary-dark)]">{selectedGrade || 'Ninguno'}</span>
        </div>
      </div>

      {/* Grid de Estadísticas del Salón */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
          <div className="stat-info">
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-label">Alumnos Matriculados</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><i className="fa-solid fa-circle-check"></i></div>
          <div className="stat-info">
            <span className="stat-value">{presentCount + tardyCount}</span>
            <span className="stat-label">Asistieron Hoy</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><i className="fa-solid fa-clock"></i></div>
          <div className="stat-info">
            <span className="stat-value">{tardyCount}</span>
            <span className="stat-label">Tardanzas</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon"><i className="fa-solid fa-circle-xmark"></i></div>
          <div className="stat-info">
            <span className="stat-value">{absentCount}</span>
            <span className="stat-label">Ausentes</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon"><i className="fa-solid fa-chart-simple"></i></div>
          <div className="stat-info">
            <span className="stat-value">{attendanceRate}%</span>
            <span className="stat-label">Ratio Asistencia</span>
          </div>
        </div>
      </div>

      {/* Lista de Roster / Alumnos */}
      <div className="card table-card">
        <div className="card-header border-b border-gray-100 pb-2 mb-4">
          <h3 className="card-title"><i className="fa-solid fa-list-check"></i> Registro de Asistencia</h3>
          <span className="card-subtitle">Listado oficial de estudiantes del salón</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Código de Credencial</th>
                <th>Estado</th>
                <th>Hora Entrada</th>
                <th>Hora Salida</th>
                <th>Observación / Notas</th>
              </tr>
            </thead>
            <tbody>
              {classroomStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No hay estudiantes registrados en este salón.
                  </td>
                </tr>
              ) : (
                classroomStudents.map(student => {
                  const log = classroomLogs.find(l => l.studentId === student.id);
                  const card = cards.find(c => c.studentId === student.id);
                  
                  let stateLabel: 'Presente' | 'Tardanza' | 'Ausente' | 'Justificado' = 'Ausente';
                  if (log) {
                    stateLabel = log.state;
                  }

                  let badgeClass = 'ausente';
                  if (stateLabel === 'Presente') badgeClass = 'presente';
                  else if (stateLabel === 'Tardanza') badgeClass = 'tardanza';
                  else if (stateLabel === 'Justificado') badgeClass = 'justificado';

                  return (
                    <tr key={student.id}>
                      <td className="font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                          {student.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="block text-gray-800">{student.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{student.grade}</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-gray-500 font-semibold">
                        {card ? card.codigo_barra : 'Sin Tarjeta'}
                      </td>
                      <td>
                        <span className={`status-badge ${badgeClass}`}>
                          {stateLabel}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-bold text-gray-700">
                        {log ? log.time : '-'}
                      </td>
                      <td className="font-mono text-xs font-bold text-gray-700">
                        {log?.timeOut ? log.timeOut : '-'}
                      </td>
                      <td className="text-xs text-gray-500 italic">
                        {log?.timeNote ? `Ingreso tardío registrado: ${log.timeNote}` : (stateLabel === 'Justificado' ? 'Inasistencia justificada formalmente' : '-')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - JUSTIFICACIONES
// ==========================================================================
const AdminJustificationsView: React.FC<SubViewProps> = ({ showToast }) => {
  const { justifications, logs, saveJustifications, saveLogs } = useAuth();
  
  const handleResolve = async (justId: string, status: 'Aprobado' | 'Rechazado') => {
    const justObj = justifications.find(j => j.id === justId);
    if (!justObj) return;

    // Actualizar justificación
    const newJusts = justifications.map(j => j.id === justId ? { ...j, status } : j);

    try {
      await saveJustifications(newJusts);

      // Si se aprueba, actualizar la asistencia de ese día a "Justificado"
      if (status === 'Aprobado') {
        const idUsuario = parseInt(justObj.studentId.replace('est-', ''));
        const newLogs = logs.map(l => {
          if (l.studentId === justObj.studentId && l.date === justObj.date) {
            return { ...l, state: 'Justificado' as const };
          }
          return l;
        });
        await saveLogs(newLogs);
      }

      showToast(`Solicitud ${status === 'Aprobado' ? 'Aprobada' : 'Rechazada'}`, 'success');
    } catch (e) {
      showToast('Error al procesar la justificación', 'error');
    }
  };

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Justificaciones de Inasistencia</h1>
        <p className="panel-subtitle">Revisión y aprobación de justificantes médicos y permisos</p>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Fecha Justificada</th>
                <th>Motivo de Ausencia</th>
                <th>Evidencia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {justifications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No hay solicitudes registradas.
                  </td>
                </tr>
              ) : (
                justifications.map(just => (
                  <tr key={just.id}>
                    <td>
                      <div className="student-cell">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                          {just.studentName.substring(0, 2)}
                        </div>
                        <span>{just.studentName}</span>
                      </div>
                    </td>
                    <td>{just.date}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: '220px' }}>{just.reason}</td>
                    <td>
                      <a href="#" className="text-[var(--primary)] font-semibold flex items-center gap-1 hover:underline" onClick={(e) => { e.preventDefault(); alert(`Abriendo documento: ${just.documentName}`); }}>
                        <i className="fa-regular fa-file-pdf"></i>
                        {just.documentName}
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${just.status === 'Pendiente' ? 'tardanza' : just.status === 'Aprobado' ? 'presente' : 'ausente'}`}>
                        {just.status}
                      </span>
                    </td>
                    <td>
                      {just.status === 'Pendiente' ? (
                        <div className="flex gap-2">
                          <button className="btn-primary py-1 px-3 text-xs" onClick={() => handleResolve(just.id, 'Aprobado')}>
                            <i className="fa-solid fa-check"></i> Aprobar
                          </button>
                          <button className="btn-secondary py-1 px-3 text-xs" onClick={() => handleResolve(just.id, 'Rechazado')}>
                            <i className="fa-solid fa-xmark"></i> Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] font-semibold">Resuelta</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ESTUDIANTES (FICHA MÉDICA)
// ==========================================================================
const AdminStudentsView: React.FC<SubViewProps> = ({ showToast }) => {
  const { students, classrooms, saveStudent, deleteStudent } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [tempGrade, setTempGrade] = useState('');
  const [tempSection, setTempSection] = useState('');

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).filter(Boolean);

  const filteredStudents = students.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(search.toLowerCase()) || 
                          st.id.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = !filterGrade || st.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Por favor habilita las ventanas emergentes.", "error");
      return;
    }
    const rowsHtml = filteredStudents.map(st => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${st.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${st.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${st.grade}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Estudiantes - Colegio San José de Calasanz</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px solid #0f4c9c; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #0a2d5c; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 10px; }
            th { background-color: #0f4c9c; color: white; padding: 12px 10px; text-transform: uppercase; font-size: 11px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Colegio San José de Calasanz</h1>
            <p>Reporte de Estudiantes Matriculados</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID Alumno</th>
                <th>Nombre Completo</th>
                <th>Grado y Sección</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="3" style="text-align:center; padding: 20px;">No hay registros.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    let csvContent = "ID Alumno,Nombre Completo,Grado y Sección\n";
    filteredStudents.forEach(st => {
      const row = [
        `"${st.id}"`,
        `"${st.name.replace(/"/g, '""')}"`,
        `"${st.grade.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte Excel (CSV) de estudiantes descargado con éxito', 'success');
  };

  // Formulario de Alumno (Crear/Editar)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    celular: '',
    direccion: '',
    id_aula: '',
    tipo_sangre: 'O+',
    seguro_medico: 'EsSalud',
    alergias: '',
    observaciones_medicas: '',
    apoderado_nombre: '',
    apoderado_telefono: '',
    apoderado_parentesco: ''
  });

  const openMedicalModal = async (student: Student) => {
    setSelectedStudent(student);
    const idUsuario = parseInt(student.id.replace('est-', ''));
    try {
      const { data, error } = await supabase
        .from('datos_estudiante')
        .select('*')
        .eq('id_usuario', idUsuario)
        .single();
      
      if (error) throw error;

      let unpackedData = { ...data };
      if (data.observaciones_medicas && data.observaciones_medicas.startsWith('{')) {
        try {
          const parsed = JSON.parse(data.observaciones_medicas);
          unpackedData.apoderado_nombre = parsed.apoderado_nombre || '';
          unpackedData.apoderado_telefono = parsed.apoderado_telefono || '';
          unpackedData.apoderado_parentesco = parsed.apoderado_parentesco || '';
          unpackedData.observaciones_medicas = parsed.nota || '';
        } catch (e) {
          // ignore parsing error
        }
      }
      setMedicalInfo(unpackedData);
    } catch (e) {
      setMedicalInfo({
        tipo_sangre: 'No Registrado',
        seguro_medico: 'No Registrado',
        alergias: 'Ninguna',
        observaciones_medicas: 'Sin observaciones',
        apoderado_nombre: '',
        apoderado_telefono: '',
        apoderado_parentesco: ''
      });
    }
  };

  const handleCreateOpen = () => {
    const firstClass = classrooms[0];
    setTempGrade(firstClass ? firstClass.grado : '');
    setTempSection(firstClass ? firstClass.seccion : 'A');
    
    setFormData({
      id: '',
      numero_documento: '',
      nombres: '',
      apellidos: '',
      correo: '',
      celular: '',
      direccion: '',
      id_aula: firstClass ? String(firstClass.id_aula) : '',
      tipo_sangre: 'O+',
      seguro_medico: 'EsSalud',
      alergias: '',
      observaciones_medicas: '',
      apoderado_nombre: '',
      apoderado_telefono: '',
      apoderado_parentesco: ''
    });
    setIsFormOpen(true);
  };

  const handleEditOpen = async (student: Student) => {
    const idUsuario = parseInt(student.id.replace('est-', ''));
    try {
      showToast('Cargando datos...', 'info');
      const [
        { data: userObj },
        { data: medObj },
        { data: aulaObj }
      ] = await Promise.all([
        supabase.from('usuarios').select('*').eq('id_usuario', idUsuario).single(),
        supabase.from('datos_estudiante').select('*').eq('id_usuario', idUsuario).maybeSingle(),
        supabase.from('estudiante_aula').select('*').eq('id_estudiante', idUsuario).maybeSingle()
      ]);

      if (userObj) {
        let apoderado_nombre = '';
        let apoderado_telefono = '';
        let apoderado_parentesco = '';
        let observaciones_medicas_clean = medObj?.observaciones_medicas || '';

        if (medObj?.observaciones_medicas && medObj.observaciones_medicas.startsWith('{')) {
          try {
            const parsed = JSON.parse(medObj.observaciones_medicas);
            apoderado_nombre = parsed.apoderado_nombre || '';
            apoderado_telefono = parsed.apoderado_telefono || '';
            apoderado_parentesco = parsed.apoderado_parentesco || '';
            observaciones_medicas_clean = parsed.nota || '';
          } catch (e) {
            // ignore JSON parse error
          }
        }

        const activeClass = classrooms.find(c => String(c.id_aula) === String(aulaObj?.id_aula));
        setTempGrade(activeClass ? activeClass.grado : '');
        setTempSection(activeClass ? activeClass.seccion : '');

        setFormData({
          id: student.id,
          numero_documento: userObj.numero_documento,
          nombres: userObj.nombres,
          apellidos: userObj.apellidos,
          correo: userObj.correo,
          celular: userObj.celular || '',
          direccion: userObj.direccion || '',
          id_aula: aulaObj ? String(aulaObj.id_aula) : '',
          tipo_sangre: medObj?.tipo_sangre || 'O+',
          seguro_medico: medObj?.seguro_medico || 'EsSalud',
          alergias: medObj?.alergias || '',
          observaciones_medicas: observaciones_medicas_clean,
          apoderado_nombre,
          apoderado_telefono,
          apoderado_parentesco
        });
        setIsFormOpen(true);
      }
    } catch (e) {
      showToast('Error al cargar datos del alumno', 'error');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este estudiante? Se borrará todo su historial de asistencia, justificaciones y tarjeta ID.')) {
      try {
        await deleteStudent(studentId);
        showToast('Estudiante eliminado con éxito', 'success');
      } catch (e) {
        showToast('Error al eliminar estudiante', 'error');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero_documento || !formData.nombres || !formData.apellidos || !formData.correo || !tempGrade || !tempSection) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      let finalAulaId = '';
      const matched = classrooms.find(c => c.grado === tempGrade && c.seccion === tempSection);

      if (matched) {
        finalAulaId = String(matched.id_aula);
      } else {
        // La combinación de grado y sección no existe en base de datos, la creamos dinámicamente
        showToast('Configurando nueva sección en el sistema...', 'info');
        const { data: newAula, error: errA } = await supabase
          .from('grados_secciones')
          .insert({
            grado: tempGrade,
            seccion: tempSection,
            nivel: tempGrade.includes('Secundaria') ? 'Secundaria' : 'Primaria',
            anio_academico: 2026
          })
          .select()
          .single();

        if (errA) throw errA;
        finalAulaId = String(newAula.id_aula);
      }

      await saveStudent({
        ...formData,
        id_aula: finalAulaId
      });
      showToast(formData.id ? 'Alumno actualizado con éxito' : 'Alumno registrado con éxito', 'success');
      setIsFormOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar alumno', 'error');
    }
  };

  return (
    <div>
      <div className="panel-header flex justify-between items-center">
        <div>
          <h1 className="panel-title">Estudiantes</h1>
          <p className="panel-subtitle">Lista de alumnos matriculados y fichas de salud</p>
        </div>
        <button className="btn-primary" onClick={handleCreateOpen}>
          <i className="fa-solid fa-plus"></i> Agregar Estudiante
        </button>
      </div>

      <div className="card table-card">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-sm"></i>
              <input 
                type="text" 
                placeholder="Buscar por nombre o ID..." 
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-3 py-1.5 outline-none focus:border-blue-500 focus:bg-white transition-all w-48"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="">Todos los Grados</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700" onClick={handleExportExcel}>
              <i className="fa-solid fa-file-excel text-green-600"></i> Excel (CSV)
            </button>
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700" onClick={handleExportPDF}>
              <i className="fa-solid fa-file-pdf text-red-600"></i> PDF
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Alumno</th>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Grado y Sección</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(st => {
                // Obtener DNI simplificado desde estudiantes locales si existiera
                const dni = st.id.replace('est-', 'DNI-00');
                return (
                  <tr key={st.id}>
                    <td>{st.id}</td>
                    <td><span className="font-mono text-gray-500 font-bold">{dni}</span></td>
                    <td>
                      <div className="student-cell">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                          {st.name.substring(0, 2)}
                        </div>
                        <span>{st.name}</span>
                      </div>
                    </td>
                    <td>{st.grade}</td>
                    <td>
                      <div className="flex gap-2 justify-center">
                        <button className="btn-secondary py-1 px-2.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 flex items-center gap-1 border-none shadow-none" onClick={() => openMedicalModal(st)} title="Ficha Médica">
                          <i className="fa-solid fa-heart-pulse"></i> Ficha
                        </button>
                        <button className="btn-secondary py-1 px-2.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 border-none shadow-none" onClick={() => handleEditOpen(st)} title="Editar Ficha">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button className="btn-secondary py-1 px-2.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 flex items-center gap-1 border-none shadow-none" onClick={() => handleDelete(st.id)} title="Eliminar Alumno">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha Médica */}
      {selectedStudent && medicalInfo && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Ficha Médica - {selectedStudent.name}</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              {/* Emergency Contact Section */}
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-phone-volume animate-pulse"></i> Contacto de Emergencia / Apoderado
                </h4>
                {medicalInfo.apoderado_nombre ? (
                  <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-800">{medicalInfo.apoderado_nombre}</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                        {medicalInfo.apoderado_parentesco || 'Apoderado'}
                      </span>
                    </div>
                    {medicalInfo.apoderado_telefono && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Teléfono:</span>
                        <a 
                          href={`tel:${medicalInfo.apoderado_telefono}`} 
                          className="flex items-center gap-1.5 text-sm font-bold text-green-600 hover:text-green-700 bg-white border border-green-200 shadow-sm rounded-md px-3 py-1 transition-all"
                        >
                          <i className="fa-solid fa-phone"></i> {medicalInfo.apoderado_telefono}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No hay contacto de emergencia registrado para este estudiante.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block">Tipo de Sangre</label>
                  <span className="font-bold text-lg text-[var(--primary)]">{medicalInfo.tipo_sangre || 'No Registrado'}</span>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block">Seguro Médico</label>
                  <span className="font-bold text-sm">{medicalInfo.seguro_medico || 'Particular / Ninguno'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] font-semibold block">Alergias</label>
                <div className="bg-[#fef2f2] border border-[#ef4444]/15 rounded-md p-3 text-sm text-[#ef4444] font-semibold mt-1">
                  {medicalInfo.alergias || 'Ninguna conocida'}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] font-semibold block">Observaciones Médicas</label>
                <p className="text-sm border border-gray-200 rounded-md p-3 bg-gray-50 mt-1">{medicalInfo.observaciones_medicas || 'Sin observaciones registradas'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setSelectedStudent(null)}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar / Editar Estudiante */}
      {isFormOpen && (
        <div className="modal-overlay active">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Editar Estudiante' : 'Agregar Estudiante'}</h3>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">Datos Académicos y Personales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">DNI / Documento *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label">Grado *</label>
                      <select
                        className="form-control"
                        value={tempGrade}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setTempGrade(newGrade);
                          const matched = classrooms.find(c => c.grado === newGrade && c.seccion === tempSection);
                          setFormData({ ...formData, id_aula: matched ? String(matched.id_aula) : '' });
                        }}
                        required
                      >
                        <option value="">Grado...</option>
                        <option value="1º Primaria">1º Primaria</option>
                        <option value="2º Primaria">2º Primaria</option>
                        <option value="3º Primaria">3º Primaria</option>
                        <option value="4º Primaria">4º Primaria</option>
                        <option value="5º Primaria">5º Primaria</option>
                        <option value="6º Primaria">6º Primaria</option>
                        <option value="1º Secundaria">1º Secundaria</option>
                        <option value="2º Secundaria">2º Secundaria</option>
                        <option value="3º Secundaria">3º Secundaria</option>
                        <option value="4º Secundaria">4º Secundaria</option>
                        <option value="5º Secundaria">5º Secundaria</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Sección *</label>
                      <select
                        className="form-control"
                        value={tempSection}
                        onChange={(e) => {
                          const newSection = e.target.value;
                          setTempSection(newSection);
                          const matched = classrooms.find(c => c.grado === tempGrade && c.seccion === newSection);
                          setFormData({ ...formData, id_aula: matched ? String(matched.id_aula) : '' });
                        }}
                        required
                        disabled={!tempGrade}
                      >
                        <option value="">Sección...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nombres *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Celular</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 mt-2">Contacto de Emergencia / Apoderado</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nombre del Apoderado</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Ej: Juan Silva"
                      value={formData.apoderado_nombre}
                      onChange={(e) => setFormData({ ...formData, apoderado_nombre: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Celular del Apoderado</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Ej: 999888777"
                      value={formData.apoderado_telefono}
                      onChange={(e) => setFormData({ ...formData, apoderado_telefono: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Parentesco / Relación</label>
                  <select 
                    className="form-control"
                    value={formData.apoderado_parentesco}
                    onChange={(e) => setFormData({ ...formData, apoderado_parentesco: e.target.value })}
                  >
                    <option value="">Seleccione parentesco...</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Abuelo/a">Abuelo/a</option>
                    <option value="Tío/a">Tío/a</option>
                    <option value="Hermano/a Mayor">Hermano/a Mayor</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 mt-2">Ficha Médica y de Salud</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tipo de Sangre</label>
                    <select 
                      className="form-control"
                      value={formData.tipo_sangre}
                      onChange={(e) => setFormData({ ...formData, tipo_sangre: e.target.value })}
                    >
                      <option value="O+">O Rh+</option>
                      <option value="O-">O Rh-</option>
                      <option value="A+">A Rh+</option>
                      <option value="A-">A Rh-</option>
                      <option value="B+">B Rh+</option>
                      <option value="B-">B Rh-</option>
                      <option value="AB+">AB Rh+</option>
                      <option value="AB-">AB Rh-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Seguro Médico</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="EsSalud, SIS, Rímac, etc."
                      value={formData.seguro_medico}
                      onChange={(e) => setFormData({ ...formData, seguro_medico: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Alergias</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: Penicilina, polen (dejar vacío si no aplica)"
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones Médicas / Tratamientos</label>
                  <textarea 
                    className="form-control h-20"
                    placeholder="Ninguna"
                    value={formData.observaciones_medicas}
                    onChange={(e) => setFormData({ ...formData, observaciones_medicas: e.target.value })}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - DOCENTES
// ==========================================================================
const AdminTeachersView: React.FC<SubViewProps> = ({ showToast }) => {
  const { teachers, classrooms, saveTeacher, deleteTeacher } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    celular: '',
    direccion: '',
    id_rol: 5,
    materia_especialidad: '',
    id_aula_tutor: ''
  });

  const handleCreateOpen = () => {
    setFormData({
      id: '',
      numero_documento: '',
      nombres: '',
      apellidos: '',
      correo: '',
      celular: '',
      direccion: '',
      id_rol: 5,
      materia_especialidad: '',
      id_aula_tutor: classrooms[0]?.id_aula || ''
    });
    setIsFormOpen(true);
  };

  const handleEditOpen = async (teacher: Teacher) => {
    const idUsuario = parseInt(teacher.id.replace('doc-', ''));
    try {
      showToast('Cargando datos...', 'info');
      const { data: userObj, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', idUsuario)
        .single();
      
      if (error) throw error;

      if (userObj) {
        setFormData({
          id: teacher.id,
          numero_documento: userObj.numero_documento,
          nombres: userObj.nombres,
          apellidos: userObj.apellidos,
          correo: userObj.correo,
          celular: userObj.celular || '',
          direccion: userObj.direccion || '',
          id_rol: userObj.id_rol || 5,
          materia_especialidad: userObj.materia_especialidad || '',
          id_aula_tutor: userObj.id_aula_tutor || ''
        });
        setIsFormOpen(true);
      }
    } catch (e) {
      showToast('Error al cargar datos del docente', 'error');
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este docente del sistema?')) {
      try {
        await deleteTeacher(teacherId);
        showToast('Docente eliminado con éxito', 'success');
      } catch (e) {
        showToast('Error al eliminar docente', 'error');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero_documento || !formData.nombres || !formData.apellidos || !formData.correo) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      await saveTeacher(formData);
      showToast(formData.id ? 'Docente actualizado con éxito' : 'Docente registrado con éxito', 'success');
      setIsFormOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar docente', 'error');
    }
  };

  const [filterLevel, setFilterLevel] = useState<'Todos' | 'Primaria' | 'Secundaria'>('Todos');
  const [search, setSearch] = useState('');

  const filteredTeachers = teachers.filter(tc => {
    const matchesSearch = tc.name.toLowerCase().includes(search.toLowerCase()) || 
                          tc.id.toLowerCase().includes(search.toLowerCase()) || 
                          (tc.subject || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesLevel = true;
    if (filterLevel === 'Primaria') matchesLevel = tc.roleId === 5;
    else if (filterLevel === 'Secundaria') matchesLevel = tc.roleId === 6;
    
    return matchesSearch && matchesLevel;
  });

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Por favor habilita las ventanas emergentes.", "error");
      return;
    }
    const rowsHtml = filteredTeachers.map(tc => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tc.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${tc.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tc.roleName} - ${tc.subject || ''}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Docentes - Colegio San José de Calasanz</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px solid #0f4c9c; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #0a2d5c; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 10px; }
            th { background-color: #0f4c9c; color: white; padding: 12px 10px; text-transform: uppercase; font-size: 11px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Colegio San José de Calasanz</h1>
            <p>Reporte de Docentes Registrados</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID Profesor</th>
                <th>Nombre Completo</th>
                <th>Especialidad / Cursos</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="3" style="text-align:center; padding: 20px;">No hay registros.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    let csvContent = "ID Profesor,Nombre Completo,Especialidad / Cursos\n";
    filteredTeachers.forEach(tc => {
      const row = [
        `"${tc.id}"`,
        `"${tc.name.replace(/"/g, '""')}"`,
        `"${(tc.roleName + ' - ' + (tc.subject || '')).replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_docentes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte Excel (CSV) de docentes descargado con éxito', 'success');
  };

  return (
    <div>
      <div className="panel-header flex justify-between items-center">
        <div>
          <h1 className="panel-title">Docentes</h1>
          <p className="panel-subtitle">Lista de profesores y sus asignaturas asignadas</p>
        </div>
        <button className="btn-primary" onClick={handleCreateOpen}>
          <i className="fa-solid fa-plus"></i> Agregar Docente
        </button>
      </div>

      {/* Pestañas de Filtro superior (Segmented Control) */}
      <div className="flex gap-1 mb-6 bg-white p-1.5 rounded-xl border border-gray-200/80 shadow-sm w-fit">
        <button 
          type="button"
          className={`px-5 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all duration-200 ${filterLevel === 'Todos' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-transparent text-[var(--text-muted)] hover:bg-gray-100'}`}
          onClick={() => setFilterLevel('Todos')}
        >
          Todos ({teachers.length})
        </button>
        <button 
          type="button"
          className={`px-5 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all duration-200 ${filterLevel === 'Primaria' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-transparent text-[var(--text-muted)] hover:bg-gray-100'}`}
          onClick={() => setFilterLevel('Primaria')}
        >
          Docentes Primaria ({teachers.filter(t => t.roleId === 5).length})
        </button>
        <button 
          type="button"
          className={`px-5 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all duration-200 ${filterLevel === 'Secundaria' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-transparent text-[var(--text-muted)] hover:bg-gray-100'}`}
          onClick={() => setFilterLevel('Secundaria')}
        >
          Docentes Secundaria ({teachers.filter(t => t.roleId === 6).length})
        </button>
      </div>

      <div className="card table-card">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-sm"></i>
              <input 
                type="text" 
                placeholder="Buscar por nombre, ID o materia..." 
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700" onClick={handleExportExcel}>
              <i className="fa-solid fa-file-excel text-green-600"></i> Excel (CSV)
            </button>
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700" onClick={handleExportPDF}>
              <i className="fa-solid fa-file-pdf text-red-600"></i> PDF
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Profesor</th>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Especialidad / Cursos</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(tc => {
                const dni = tc.id.replace('doc-', 'DNI-00');
                return (
                  <tr key={tc.id}>
                    <td>{tc.id}</td>
                    <td><span className="font-mono text-gray-500 font-bold">{dni}</span></td>
                    <td>
                      <div className="student-cell">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                          {tc.name.substring(0, 2)}
                        </div>
                        <span>{tc.name}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="font-bold text-gray-800 text-sm block">{tc.roleName}</span>
                        <span className="text-xs text-gray-400">{tc.subject}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-center">
                        <button className="btn-secondary py-1 px-2.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 border-none shadow-none" onClick={() => handleEditOpen(tc)} title="Editar Docente">
                          <i className="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button className="btn-secondary py-1 px-2.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 flex items-center gap-1 border-none shadow-none" onClick={() => handleDelete(tc.id)} title="Eliminar Docente">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar Docente */}
      {isFormOpen && (
        <div className="modal-overlay active">
          <div className="modal-box max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Editar Docente' : 'Agregar Docente'}</h3>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">DNI / Documento *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nombres *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Celular</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clasificación / Nivel *</label>
                  <select
                    className="form-control"
                    value={formData.id_rol}
                    onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                    required
                  >
                    <option value={5}>Docente Primaria</option>
                    <option value={6}>Docente Secundaria</option>
                    <option value={2}>Docente General / Otro</option>
                  </select>
                </div>

                {formData.id_rol === 5 && (
                  <div className="form-group">
                    <label className="form-label">Aula a Cargo (Tutoría) *</label>
                    <select
                      className="form-control"
                      value={formData.id_aula_tutor}
                      onChange={(e) => setFormData({ ...formData, id_aula_tutor: parseInt(e.target.value) })}
                      required
                    >
                      <option value="">Seleccione un aula</option>
                      {classrooms.map(c => (
                        <option key={c.id_aula} value={c.id_aula}>{c.grado} {c.seccion}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.id_rol === 6 && (
                  <div className="form-group">
                    <label className="form-label">Especialidad / Asignatura *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Ej: Matemáticas, Comunicación, Inglés"
                      value={formData.materia_especialidad}
                      onChange={(e) => setFormData({ ...formData, materia_especialidad: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Docente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - CREDENCIALES (GENERADOR DE CARDS)
// ==========================================================================
const AdminCardsView: React.FC<SubViewProps> = ({ showToast }) => {
  const { students, teachers, staff, cards, saveCards } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeCard, setActiveCard] = useState<IDCard | null>(null);

  // Modo de impresión: 'individual' | 'classroom'
  const [printMode, setPrintMode] = useState<'individual' | 'classroom'>('individual');
  // Categoría en modo individual: 'students' | 'teachers' | 'staff'
  const [selectedCategory, setSelectedCategory] = useState<'students' | 'teachers' | 'staff'>('students');
  // Grupo seleccionado en modo grupal (aula o roles)
  const [selectedClassroom, setSelectedClassroom] = useState('');

  // Configuraciones personalizadas para la credencial
  const [cardCode, setCardCode] = useState('');
  const [codeType, setCodeType] = useState<'Barcode' | 'QR'>('Barcode');
  const [colorPalette, setColorPalette] = useState<'blue' | 'green' | 'purple' | 'red' | 'charcoal'>('blue');
  const [cardOrientation, setCardOrientation] = useState<'Vertical' | 'Horizontal'>('Vertical');

  const [isMounted, setIsMounted] = useState(false);

  // Obtener lista única de aulas
  const classroomsList = Array.from(new Set(students.map(s => s.grade))).sort();

  useEffect(() => {
    setIsMounted(true);
    if (classroomsList.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classroomsList[0]);
    }
  }, [students]);

  // Cargar credencial existente de la persona seleccionada o generar una nueva por defecto
  useEffect(() => {
    if (selectedStudentId) {
      const existingCard = cards.find(c => c.studentId === selectedStudentId);
      if (existingCard) {
        setActiveCard(existingCard);
        setCardCode(existingCard.codigo_barra);
        setCodeType(existingCard.type);
      } else {
        setActiveCard(null);
        setCardCode('CAL-2026-' + String(Math.floor(1000 + Math.random() * 9000)));
        setCodeType('Barcode');
      }
    }
  }, [selectedStudentId, cards]);

  // Cambiar la persona seleccionada por defecto al cambiar de categoría
  useEffect(() => {
    if (selectedCategory === 'students' && students.length > 0) {
      setSelectedStudentId(students[0].id);
    } else if (selectedCategory === 'teachers' && teachers.length > 0) {
      setSelectedStudentId(teachers[0].id);
    } else if (selectedCategory === 'staff' && staff.length > 0) {
      setSelectedStudentId(staff[0].id);
    }
  }, [selectedCategory, students, teachers, staff]);

  const handleGenerate = async () => {
    if (!selectedStudentId) return;

    const existingCard = cards.find(c => c.studentId === selectedStudentId);
    const cardData: IDCard = {
      id: existingCard ? existingCard.id : 'card-' + Date.now(),
      studentId: selectedStudentId,
      codigo_barra: cardCode,
      type: codeType,
      date: '2026-03-01',
      estado: existingCard ? existingCard.estado : true
    };

    let newCards = [...cards];
    if (existingCard) {
      newCards = newCards.map(c => c.id === existingCard.id ? cardData : c);
    } else {
      newCards.push(cardData);
    }

    try {
      await saveCards(newCards);
      setActiveCard(cardData);
      showToast(existingCard ? 'Credencial actualizada' : 'Credencial creada', 'success');
    } catch (e) {
      showToast('Error al guardar credencial', 'error');
    }
  };

  const handleGenerateClassroomCards = async () => {
    let updatedCards = [...cards];
    let generatedCount = 0;

    classroomPeople.forEach(person => {
      const hasCard = cards.some(c => c.studentId === person.id);
      if (!hasCard) {
        const cardData: IDCard = {
          id: 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          studentId: person.id,
          codigo_barra: 'CAL-2026-' + String(Math.floor(1000 + Math.random() * 9000)),
          type: codeType,
          date: '2026-03-01',
          estado: true
        };
        updatedCards.push(cardData);
        generatedCount++;
      }
    });

    if (generatedCount > 0) {
      try {
        await saveCards(updatedCards);
        showToast(`Se generaron ${generatedCount} credenciales para el grupo`, 'success');
      } catch (e) {
        showToast('Error al generar credenciales para el grupo', 'error');
      }
    } else {
      showToast('Todos los integrantes del grupo ya tienen credenciales', 'info');
    }
  };

  const handleToggleStatus = async () => {
    if (!activeCard) return;
    const newCards = cards.map(c => c.id === activeCard.id ? { ...c, estado: !c.estado } : c);
    try {
      await saveCards(newCards);
      setActiveCard({ ...activeCard, estado: !activeCard.estado });
      showToast(`Credencial ${!activeCard.estado ? 'Activada' : 'Bloqueada'}`, 'success');
    } catch (e) {
      showToast('Error al actualizar tarjeta', 'error');
    }
  };

  const renderQRCode = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const size = 21;
    const cells: boolean[] = [];
    const isFinder = (x: number, y: number) => {
      if (x < 7 && y < 7) return true;
      if (x >= size - 7 && y < 7) return true;
      if (x < 7 && y >= size - 7) return true;
      return false;
    };
    const isFinderFilled = (x: number, y: number) => {
      if (x < 7 && y < 7) {
        if (x === 0 || x === 6 || y === 0 || y === 6) return true;
        if (x >= 2 && x <= 4 && y >= 2 && y <= 4) return true;
        return false;
      }
      if (x >= size - 7 && y < 7) {
        const rx = x - (size - 7);
        if (rx === 0 || rx === 6 || y === 0 || y === 6) return true;
        if (rx >= 2 && rx <= 4 && y >= 2 && y <= 4) return true;
        return false;
      }
      if (x < 7 && y >= size - 7) {
        const ry = y - (size - 7);
        if (x === 0 || x === 6 || ry === 0 || ry === 6) return true;
        if (x >= 2 && x <= 4 && ry >= 2 && ry <= 4) return true;
        return false;
      }
      return false;
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFinder(x, y)) {
          cells.push(isFinderFilled(x, y));
        } else {
          const val = Math.abs(Math.sin(hash + x * 12.9898 + y * 78.233)) * 43758.5453;
          cells.push((Math.floor(val) % 2) === 0);
        }
      }
    }
    return (
      <svg className="w-18 h-18 transition-all duration-300 hover:scale-105" viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" />
        {cells.map((filled, idx) => {
          if (!filled) return null;
          const x = idx % size;
          const y = Math.floor(idx / size);
          return <rect key={idx} x={x} y={y} width="1" height="1" fill="black" />;
        })}
      </svg>
    );
  };

  const renderBarcode = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lines = [];
    lines.push({ x: 5, w: 1 });
    lines.push({ x: 7, w: 1 });
    let currentX = 10;
    for (let i = 0; i < 45; i++) {
      const val = Math.abs(Math.sin(hash + i * 23.45)) * 10;
      const width = (Math.floor(val) % 3) + 1;
      const gap = (Math.floor(val * 1.5) % 3) + 1;
      lines.push({ x: currentX, w: width });
      currentX += width + gap;
      if (currentX >= 90) break;
    }
    lines.push({ x: 92, w: 1 });
    lines.push({ x: 94, w: 1 });
    return (
      <svg className="w-full h-8 max-w-[200px]" stroke="currentColor" viewBox="0 0 100 20">
        <rect width="100" height="20" fill="white" />
        {lines.map((line, idx) => (
          <line key={idx} x1={line.x} y1="2" x2={line.x} y2="18" stroke="black" strokeWidth={line.w} />
        ))}
      </svg>
    );
  };

  const getGradient = (palette: string) => {
    switch (palette) {
      case 'green': return 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)';
      case 'purple': return 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)';
      case 'red': return 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)';
      case 'charcoal': return 'linear-gradient(135deg, #111827 0%, #374151 100%)';
      case 'blue':
      default:
        return 'linear-gradient(135deg, #0a2d5c 0%, #1e5095 100%)';
    }
  };

  const getPersonDetails = (id: string) => {
    if (id.startsWith('est-')) {
      const p = students.find(s => s.id === id);
      return p ? { name: p.name, subtitle: 'ESTUDIANTE', detailLabel: 'Grado:', detailValue: p.grade } : null;
    }
    if (id.startsWith('doc-')) {
      const p = teachers.find(t => t.id === id);
      return p ? { name: p.name, subtitle: 'DOCENTE', detailLabel: 'Especialidad:', detailValue: p.subject || 'Educación' } : null;
    }
    if (id.startsWith('staff-')) {
      const p = staff.find(st => st.id === id);
      return p ? { name: p.name, subtitle: p.roleName.toUpperCase(), detailLabel: 'Cargo:', detailValue: p.roleName } : null;
    }
    return null;
  };

  const renderCardTemplate = (id: string, code: string, type: 'Barcode' | 'QR', orientation: 'Vertical' | 'Horizontal') => {
    const details = getPersonDetails(id);
    if (!details) return null;

    return orientation === 'Vertical' ? (
      <div className="id-card-badge" style={{ background: getGradient(colorPalette) }}>
        <div className="id-card-inner-header">
          <div className="id-card-logo">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div className="id-card-school-info">
            <h4>COLEGIO SAN JOSÉ</h4>
            <p>DE CALASANZ</p>
          </div>
        </div>
        
        <div className="id-card-body">
          <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-md bg-white flex items-center justify-center font-bold text-2xl text-[var(--primary)] mb-2">
            {details.name.substring(0, 2)}
          </div>
          <h3 className="text-white text-base font-bold">{details.name}</h3>
          <span className="id-card-title-label">{details.subtitle}</span>
          
          <div className="id-card-details">
            <div>
              <span>{details.detailLabel}</span>
              <span className="text-white font-semibold">{details.detailValue}</span>
            </div>
            <div>
              <span>Código:</span>
              <span className="text-white font-semibold">{code}</span>
            </div>
          </div>
        </div>

        <div className="id-card-footer mt-auto bg-white rounded-xl p-3 flex flex-col items-center justify-center text-black w-full shadow-inner transition-all duration-300">
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Credencial de Acceso</span>
          <div className="flex items-center justify-center w-full py-0.5">
            {type === 'Barcode' ? renderBarcode(code) : renderQRCode(code)}
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest mt-1 text-gray-500">{code}</span>
        </div>
      </div>
    ) : (
      <div className="id-card-badge horizontal" style={{ background: getGradient(colorPalette) }}>
        <div className="id-card-horizontal-left">
          <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-md bg-white flex items-center justify-center font-bold text-2xl text-[var(--primary)] mb-2">
            {details.name.substring(0, 2)}
          </div>
          <h3 className="text-white text-base font-bold mb-1">{details.name}</h3>
          <span className="id-card-title-label text-[8px] px-3 py-0.5 mb-3">{details.subtitle}</span>
          
          <div className="id-card-details text-[11px] p-2 rounded-lg w-full">
            <div className="flex justify-between gap-4">
              <span className="opacity-70 text-[10px]">{details.detailLabel}</span>
              <span className="text-white font-bold text-[10px]">{details.detailValue}</span>
            </div>
            <div className="flex justify-between gap-4 mt-1">
              <span className="opacity-70 text-[10px]">Código:</span>
              <span className="text-white font-bold text-[10px]">{code}</span>
            </div>
          </div>
        </div>

        <div className="id-card-horizontal-divider"></div>

        <div className="id-card-horizontal-right">
          <div className="id-card-inner-header border-none pb-0 mb-0 flex flex-col items-center text-center">
            <div className="id-card-logo mb-1">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="id-card-school-info text-center">
              <h4 className="text-[10px] leading-tight">COLEGIO SAN JOSÉ</h4>
              <p className="text-[7px]">DE CALASANZ</p>
            </div>
          </div>

          <div className="mt-auto bg-white rounded-xl p-2.5 flex flex-col items-center justify-center text-black w-full shadow-inner">
            <span className="text-[7px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">Credencial de Acceso</span>
            <div className="flex items-center justify-center w-full py-0.5 scale-90">
              {type === 'Barcode' ? renderBarcode(code) : renderQRCode(code)}
            </div>
            <span className="text-[8px] font-mono font-bold tracking-widest mt-0.5 text-gray-500">{code}</span>
          </div>
        </div>
      </div>
    );
  };

  const student = selectedStudentId; // Contiene el ID de la persona seleccionada (est-, doc- o staff-)
  
  // Lista de personas a imprimir en lote según selección
  const classroomPeople = 
    selectedClassroom === 'ALL_TEACHERS' 
      ? teachers.map(t => ({ id: t.id }))
      : selectedClassroom === 'ALL_STAFF'
      ? staff.map(st => ({ id: st.id }))
      : students.filter(s => s.grade === selectedClassroom).map(s => ({ id: s.id }));

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Generación de Tarjetas ID</h1>
        <p className="panel-subtitle">Administración y emisión de credenciales de asistencia</p>
      </div>

      {/* Selector de Modo de Impresión */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-lg border border-[var(--border-color)] max-w-md">
        <button 
          className={`flex-grow py-2 px-4 rounded-md text-sm font-semibold transition-all ${printMode === 'individual' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setPrintMode('individual')}
        >
          <i className="fa-solid fa-user mr-2"></i> Individual
        </button>
        <button 
          className={`flex-grow py-2 px-4 rounded-md text-sm font-semibold transition-all ${printMode === 'classroom' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setPrintMode('classroom')}
        >
          <i className="fa-solid fa-users mr-2"></i> Por Aula / Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card flex flex-col gap-4">
          {printMode === 'individual' ? (
            <>
              {/* Selector de Categoría (Solo Individual) */}
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${selectedCategory === 'students' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setSelectedCategory('students')}
                  >
                    Estudiantes
                  </button>
                  <button 
                    type="button" 
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${selectedCategory === 'teachers' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setSelectedCategory('teachers')}
                  >
                    Docentes
                  </button>
                  <button 
                    type="button" 
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${selectedCategory === 'staff' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setSelectedCategory('staff')}
                  >
                    Personal / Staff
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {selectedCategory === 'students' ? 'Selecciona el Estudiante' : selectedCategory === 'teachers' ? 'Selecciona el Docente' : 'Selecciona el Personal'}
                </label>
                <select 
                  className="form-control"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {selectedCategory === 'students' && students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                  ))}
                  {selectedCategory === 'teachers' && teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Docente)</option>
                  ))}
                  {selectedCategory === 'staff' && staff.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.roleName})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Código de la Tarjeta (Editable)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  placeholder="Ej: CAL-2026-0001"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Selecciona el Grupo / Aula</label>
                <select 
                  className="form-control"
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                >
                  <optgroup label="Aulas Estudiantes">
                    {classroomsList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Personal del Colegio">
                    <option value="ALL_TEACHERS">Todos los Docentes</option>
                    <option value="ALL_STAFF">Todo el Personal / Auxiliares</option>
                  </optgroup>
                </select>
              </div>

              <button className="btn-secondary justify-center py-2" onClick={handleGenerateClassroomCards}>
                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Generar Códigos Faltantes
              </button>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Tipo de Código de Acceso</label>
            <select 
              className="form-control"
              value={codeType}
              onChange={(e) => setCodeType(e.target.value as 'Barcode' | 'QR')}
            >
              <option value="Barcode">Código de Barras</option>
              <option value="QR">Código QR</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Paleta de Colores de la Credencial</label>
            <div className="flex gap-3 mt-1">
              <button 
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorPalette === 'blue' ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                style={{ background: 'linear-gradient(135deg, #0a2d5c 0%, #1e5095 100%)' }}
                onClick={() => setColorPalette('blue')}
                title="Azul Calasanz"
              />
              <button 
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorPalette === 'green' ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)' }}
                onClick={() => setColorPalette('green')}
                title="Verde Bosque"
              />
              <button 
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorPalette === 'purple' ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)' }}
                onClick={() => setColorPalette('purple')}
                title="Púrpura Imperial"
              />
              <button 
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorPalette === 'red' ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)' }}
                onClick={() => setColorPalette('red')}
                title="Rojo Atardecer"
              />
              <button 
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorPalette === 'charcoal' ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}
                onClick={() => setColorPalette('charcoal')}
                title="Gris Carbón"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-gray-700">Orientación de la Credencial</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-gray-700">
                <input 
                  type="radio" 
                  name="orientation" 
                  value="Vertical" 
                  checked={cardOrientation === 'Vertical'} 
                  onChange={() => setCardOrientation('Vertical')}
                  className="cursor-pointer"
                />
                Vertical (Modelo 1)
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-gray-700">
                <input 
                  type="radio" 
                  name="orientation" 
                  value="Horizontal" 
                  checked={cardOrientation === 'Horizontal'} 
                  onChange={() => setCardOrientation('Horizontal')}
                  className="cursor-pointer"
                />
                Horizontal (Modelo 2)
              </label>
            </div>
          </div>

          {printMode === 'individual' && (
            <button className="btn-primary w-full justify-center mt-2" onClick={handleGenerate}>
              <i className="fa-solid fa-address-card"></i> Guardar y Generar Credencial
            </button>
          )}
        </div>

        <div className="card flex flex-col items-center justify-center p-6">
          {printMode === 'individual' ? (
            student ? (
              <div className="flex flex-col items-center gap-6">
                <div id="printable-id-card" className="id-card-badge-container">
                  {renderCardTemplate(student, cardCode, codeType, cardOrientation)}
                </div>

                <div className="flex gap-4">
                  <button 
                    className={`btn-primary ${activeCard && !activeCard.estado ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} 
                    onClick={handleToggleStatus}
                    disabled={!activeCard}
                  >
                    <i className={`fa-solid ${activeCard && !activeCard.estado ? 'fa-lock-open' : 'fa-lock'}`}></i>
                    {activeCard ? (activeCard.estado ? 'Bloquear Tarjeta' : 'Desbloquear') : 'Sin Guardar'}
                  </button>
                  <button className="btn-secondary" onClick={() => window.print()}>
                    <i className="fa-solid fa-print"></i> Imprimir
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-[var(--text-muted)] flex flex-col items-center gap-3">
                <i className="fa-solid fa-address-card text-5xl opacity-40"></i>
                <p>Genera una credencial para ver el diseño.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-6 w-full">
              <h3 className="text-lg font-bold text-gray-700">Vista Previa ({classroomPeople.length} credenciales)</h3>
              
              <div className="flex max-h-[380px] overflow-y-auto w-full gap-4 flex-wrap justify-center p-4 border rounded-lg bg-gray-50">
                {classroomPeople.map(person => {
                  const personCard = cards.find(c => c.studentId === person.id);
                  const displayCode = personCard ? personCard.codigo_barra : 'CAL-2026-PEND';
                  const displayType = codeType;
                  return (
                    <div key={person.id} className="scale-[0.6] -m-20 origin-center">
                      {renderCardTemplate(person.id, displayCode, displayType, cardOrientation)}
                    </div>
                  );
                })}
              </div>

              <button className="btn-primary w-full justify-center" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Imprimir Todo el Grupo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portal de Impresión */}
      {isMounted && createPortal(
        <div id="print-area-root">
          {printMode === 'individual' ? (
            student ? (
              <div className="single-print-wrapper">
                {renderCardTemplate(student, cardCode, codeType, cardOrientation)}
              </div>
            ) : null
          ) : (
            <div className="batch-print-grid">
              {classroomPeople.map(person => {
                const personCard = cards.find(c => c.studentId === person.id);
                const displayCode = personCard ? personCard.codigo_barra : 'CAL-2026-MOCK';
                const displayType = codeType;
                return (
                  <div key={person.id}>
                    {renderCardTemplate(person.id, displayCode, displayType, cardOrientation)}
                  </div>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: DOCENTE - PANEL DE INICIO (ESTADÍSTICAS RÁPIDAS)
// ==========================================================================
const TeacherDashboardView: React.FC = () => {
  const { user, courses, students } = useAuth();
  
  // Encontrar cursos asignados
  const teacherCourses = courses.filter(c => c.teacherId === user?.id);
  const totalMyStudents = teacherCourses.reduce((sum, c) => sum + c.studentIds.length, 0);

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Bienvenido, {user?.nombres}</h1>
        <p className="panel-subtitle">Módulo docente del Colegio San José de Calasanz</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><i className="fa-solid fa-chalkboard"></i></div>
          <div className="stat-info">
            <span className="stat-value">{teacherCourses.length}</span>
            <span className="stat-label">Cursos Asignados</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
          <div className="stat-info">
            <span className="stat-value">{totalMyStudents}</span>
            <span className="stat-label">Alumnos a Cargo</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-book-open"></i> Mis Cursos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teacherCourses.map(course => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
              <h4 className="font-bold text-base text-[var(--primary-dark)]">{course.name}</h4>
              <p className="text-sm text-[var(--text-muted)] font-semibold">Grado: {course.grade}</p>
              <div className="flex justify-between items-center text-xs mt-2 font-semibold">
                <span>Alumnos: {course.studentIds.length}</span>
                <span className="text-[var(--primary)]">Clase 2026</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: DOCENTE - REGISTRO DE ASISTENCIA
// ==========================================================================
const TeacherRegisterView: React.FC<SubViewProps> = ({ showToast }) => {
  const { user, courses, students, logs, saveLogs } = useAuth();
  const teacherCourses = courses.filter(c => c.teacherId === user?.id);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceStates, setAttendanceStates] = useState<Record<string, 'Presente' | 'Tardanza' | 'Ausente' | 'Justificado'>>({});

  useEffect(() => {
    if (teacherCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(teacherCourses[0].id);
    }
  }, [teacherCourses]);

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const activeStudents = students.filter(s => activeCourse?.studentIds.includes(s.id));

  const handleStateChange = (studentId: string, state: 'Presente' | 'Tardanza' | 'Ausente' | 'Justificado') => {
    setAttendanceStates(prev => ({ ...prev, [studentId]: state }));
  };

  const handleSave = async () => {
    if (!activeCourse) return;
    const todayStr = '2026-07-09'; // Fecha fija de simulación
    const timeStr = '08:00';

    const newLogs = [...logs];
    activeStudents.forEach(st => {
      const state = attendanceStates[st.id] || 'Presente';
      
      const logObj: AttendanceLog = {
        id: 'log-' + Date.now() + '-' + st.id,
        date: todayStr,
        time: timeStr,
        studentId: st.id,
        studentName: st.name,
        grade: st.grade,
        course: activeCourse.name,
        state,
        teacherId: user?.id || 'doc-admin',
        teacherName: user ? `${user.nombres} ${user.apellidos}` : 'Docente'
      };

      // Si ya hay asistencia de ese alumno hoy, la sobreescribimos
      const idx = newLogs.findIndex(l => l.studentId === st.id && l.date === todayStr);
      if (idx >= 0) {
        newLogs[idx] = { ...newLogs[idx], state, time: timeStr };
      } else {
        newLogs.push(logObj);
      }
    });

    try {
      await saveLogs(newLogs);
      showToast('Asistencia guardada con éxito', 'success');
    } catch (e) {
      showToast('Error al guardar asistencia', 'error');
    }
  };

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Toma de Asistencia</h1>
        <p className="panel-subtitle">Registro de asistencia diaria para tus clases asignadas</p>
      </div>

      <div className="card attendance-picker-card">
        <div className="course-selector-bar">
          <div className="course-picker">
            <label className="text-xs font-bold block mb-1">Curso / Salón</label>
            <select
              className="filter-select w-full"
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setAttendanceStates({}); }}
            >
              {teacherCourses.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.grade}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary self-end ml-auto" onClick={handleSave}>
            <i className="fa-solid fa-save"></i> Guardar Asistencia
          </button>
        </div>

        <div className="student-attendance-list">
          {activeStudents.length === 0 ? (
            <p className="text-center py-8 text-[var(--text-muted)]">No hay alumnos asignados a este curso.</p>
          ) : (
            activeStudents.map(st => {
              const activeState = attendanceStates[st.id] || 'Presente';
              return (
                <div key={st.id} className="student-attendance-row">
                  <div className="student-info">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center font-bold text-sm text-[var(--primary)]">
                      {st.name.substring(0, 2)}
                    </div>
                    <div className="student-details">
                      <h4>{st.name}</h4>
                      <p>{st.id}</p>
                    </div>
                  </div>
                  <div className="attendance-options">
                    <button 
                      className={`option-btn presente ${activeState === 'Presente' ? 'active' : ''}`}
                      onClick={() => handleStateChange(st.id, 'Presente')}
                    >Presente</button>
                    <button 
                      className={`option-btn tardanza ${activeState === 'Tardanza' ? 'active' : ''}`}
                      onClick={() => handleStateChange(st.id, 'Tardanza')}
                    >Tardanza</button>
                    <button 
                      className={`option-btn ausente ${activeState === 'Ausente' ? 'active' : ''}`}
                      onClick={() => handleStateChange(st.id, 'Ausente')}
                    >Ausente</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ESTUDIANTE - CALENDARIO E INASISTENCIAS
// ==========================================================================
const StudentDashboardView: React.FC<SubViewProps> = ({ showToast }) => {
  const { user, logs, justifications, saveJustifications } = useAuth();
  
  // Formulario de Justificación
  const [justDate, setJustDate] = useState('2026-07-07');
  const [justReason, setJustReason] = useState('');
  const [justFile, setJustFile] = useState('receta_medica.pdf');
  const [submittingJust, setSubmittingJust] = useState(false);

  // Filtrar mis logs
  const myLogs = logs.filter(l => l.studentId === user?.id);

  // Mapear días de Julio 2026
  // Julio empieza el Miércoles (1) y tiene 31 días.
  // Mapeamos los días: Domingo (0) a Sábado (6)
  const daysInMonth = 31;
  const startDayOffset = 3; // Miércoles (0=Dom, 1=Lun, 2=Mar, 3=Mie)

  const calendarCells = [];
  // Celdas vacías iniciales
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ day: 0, empty: true });
  }

  // Celdas de días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `2026-07-${d < 10 ? '0' + d : d}`;
    const log = myLogs.find(l => l.date === dayStr);
    
    calendarCells.push({
      day: d,
      empty: false,
      logState: log ? log.state : null,
      time: log ? log.time : null
    });
  }

  const handleRequestJustification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingJust(true);

    const newJust: Justification = {
      id: 'just-' + Date.now(),
      studentId: user.id,
      studentName: `${user.nombres} ${user.apellidos}`,
      date: justDate,
      reason: justReason,
      documentName: justFile,
      status: 'Pendiente'
    };

    try {
      await saveJustifications([...justifications, newJust]);
      showToast('Solicitud enviada correctamente', 'success');
      setJustReason('');
    } catch (err) {
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setSubmittingJust(false);
    }
  };

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Mi Asistencia</h1>
        <p className="panel-subtitle">Calendario mensual y reporte de inasistencias</p>
      </div>

      <div className="student-view-layout">
        {/* Calendario Mensual */}
        <div className="card calendar-card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-calendar-days"></i> Calendario de Asistencia</h3>
            <span className="month-selector">Julio 2026</span>
          </div>

          <div className="month-grid">
            <div className="day-header">Dom</div>
            <div className="day-header">Lun</div>
            <div className="day-header">Mar</div>
            <div className="day-header">Mié</div>
            <div className="day-header">Jue</div>
            <div className="day-header">Vie</div>
            <div className="day-header">Sáb</div>

            {calendarCells.map((cell, idx) => (
              cell.empty ? (
                <div key={`empty-${idx}`} className="day-cell empty"></div>
              ) : (
                <div 
                  key={`day-${cell.day}`} 
                  className={`day-cell ${cell.logState ? cell.logState.toLowerCase() : ''}`}
                >
                  <span className="text-xs">{cell.day}</span>
                  {cell.logState && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold block leading-none">{cell.logState}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-semibold block leading-none">{cell.time}</span>
                      <div className="day-status-indicator"></div>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Justificar Faltas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-file-signature"></i> Justificar Falta</h3>
          </div>
          <form onSubmit={handleRequestJustification}>
            <div className="form-group">
              <label className="form-label">Fecha de Inasistencia</label>
              <input
                type="date"
                className="form-control"
                value={justDate}
                onChange={(e) => setJustDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo / Explicación</label>
              <textarea
                className="form-control"
                placeholder="Explica detalladamente la razón de tu inasistencia..."
                value={justReason}
                onChange={(e) => setJustReason(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Evidencia Física (Archivo pdf/jpg)</label>
              <input
                type="text"
                className="form-control"
                value={justFile}
                onChange={(e) => setJustFile(e.target.value)}
                placeholder="Nombre_archivo.pdf"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={submittingJust}>
              {submittingJust ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - ASISTENCIA DE PERSONAL (DOCENTES, LIMPIEZA, ETC)
// ==========================================================================
const AdminStaffLogsView: React.FC<SubViewProps> = ({ showToast }) => {
  const { teachers, staff, logs, saveLogs } = useAuth();
  
  const [filterDate, setFilterDate] = useState('2026-07-09'); // Fecha de simulación por defecto
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'Todos' | 'Docentes' | 'Limpieza' | 'Auxiliares' | 'Administrativos'>('Todos');
  
  // Estados para Edición en Línea
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<'Presente' | 'Tardanza' | 'Ausente' | 'Justificado'>('Presente');
  const [editTime, setEditTime] = useState('08:00');
  const [editTimeOut, setEditTimeOut] = useState('14:00');
  const [editNote, setEditNote] = useState('');

  // Estados para Modal de Registro Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [regState, setRegState] = useState<'Presente' | 'Tardanza' | 'Ausente' | 'Justificado'>('Presente');
  const [regTime, setRegTime] = useState('08:00');
  const [regTimeOut, setRegTimeOut] = useState('14:00');
  const [regNote, setRegNote] = useState('');

  // Combinar Docentes y Personal en una sola lista para el roster
  const staffRoster = React.useMemo(() => {
    const list: { id: string; name: string; roleName: string; roleId: number; photo: string; type: 'docente' | 'staff'; detail: string }[] = [];
    
    // Añadir docentes
    teachers.forEach(t => {
      list.push({
        id: t.id,
        name: t.name,
        roleName: t.roleName,
        roleId: t.roleId,
        photo: t.photo,
        type: 'docente',
        detail: t.subject
      });
    });

    // Añadir personal auxiliar, limpieza y administrativo
    staff.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        roleName: s.roleName,
        roleId: s.roleId,
        photo: s.photo,
        type: 'staff',
        detail: s.roleName === 'Administrativo' ? 'Oficina y Dirección' : s.roleName === 'Auxiliar' ? 'Auxiliar de Aula' : 'Mantenimiento y Limpieza'
      });
    });

    return list;
  }, [teachers, staff]);

  // Logs correspondientes al día seleccionado
  const dayLogs = React.useMemo(() => {
    return logs.filter(l => l.date === filterDate && !l.studentId.startsWith('est-'));
  }, [logs, filterDate]);

  // KPIs dinámicos calculados basados en el filterDate seleccionado
  const kpis = React.useMemo(() => {
    // 1. Docentes
    const teachersList = staffRoster.filter(p => p.type === 'docente');
    const presentTeachers = dayLogs.filter(l => l.studentId.startsWith('doc-') && (l.state === 'Presente' || l.state === 'Tardanza')).length;
    
    // 2. Auxiliares
    const auxList = staffRoster.filter(p => p.roleId === 7);
    const presentAux = dayLogs.filter(l => {
      const p = staffRoster.find(st => st.id === l.studentId);
      return p && p.roleId === 7 && (l.state === 'Presente' || l.state === 'Tardanza');
    }).length;

    // 3. Limpieza
    const limList = staffRoster.filter(p => p.roleId === 8);
    const presentLim = dayLogs.filter(l => {
      const p = staffRoster.find(st => st.id === l.studentId);
      return p && p.roleId === 8 && (l.state === 'Presente' || l.state === 'Tardanza');
    }).length;

    // 4. Administrativos
    const admList = staffRoster.filter(p => p.roleId === 1);
    const presentAdm = dayLogs.filter(l => {
      const p = staffRoster.find(st => st.id === l.studentId);
      return p && p.roleId === 1 && (l.state === 'Presente' || l.state === 'Tardanza');
    }).length;

    return {
      teachers: { total: teachersList.length, present: presentTeachers },
      aux: { total: auxList.length, present: presentAux },
      lim: { total: limList.length, present: presentLim },
      adm: { total: admList.length, present: presentAdm }
    };
  }, [staffRoster, dayLogs]);

  // Filtrado de la lista según los inputs del usuario
  const filteredRoster = React.useMemo(() => {
    return staffRoster.filter(person => {
      // Filtro de búsqueda
      const matchesSearch = person.name.toLowerCase().includes(search.toLowerCase()) || 
                            person.id.toLowerCase().includes(search.toLowerCase());
      
      // Filtro de rol
      let matchesRole = true;
      if (filterRole === 'Docentes') {
        matchesRole = person.type === 'docente';
      } else if (filterRole === 'Limpieza') {
        matchesRole = person.roleId === 8;
      } else if (filterRole === 'Auxiliares') {
        matchesRole = person.roleId === 7;
      } else if (filterRole === 'Administrativos') {
        matchesRole = person.roleId === 1;
      }

      return matchesSearch && matchesRole;
    });
  }, [staffRoster, search, filterRole]);

  // Manejador para abrir la edición en línea
  const handleEditClick = (personId: string, currentLog: AttendanceLog | undefined) => {
    setEditingId(personId);
    if (currentLog) {
      setEditState(currentLog.state);
      setEditTime(currentLog.time);
      setEditTimeOut(currentLog.timeOut || '14:00');
      setEditNote(currentLog.timeNote || '');
    } else {
      setEditState('Ausente');
      setEditTime('08:00');
      setEditTimeOut('14:00');
      setEditNote('');
    }
  };

  // Guardar la edición del registro
  const handleSaveClick = async (personId: string, personName: string, personRoleName: string) => {
    try {
      showToast('Guardando registro...', 'info');
      const existingLog = dayLogs.find(l => l.studentId === personId);
      
      let updatedLogs = [...logs];
      
      if (existingLog) {
        // Modificar registro existente
        updatedLogs = logs.map(l => {
          if (l.id === existingLog.id) {
            return {
              ...l,
              state: editState,
              time: editTime,
              timeOut: editState === 'Ausente' ? undefined : editTimeOut,
              timeNote: editNote || undefined
            };
          }
          return l;
        });
      } else {
        // Crear registro nuevo
        const newLog: AttendanceLog = {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          date: filterDate,
          time: editTime,
          timeOut: editState === 'Ausente' ? undefined : editTimeOut,
          studentId: personId,
          studentName: personName,
          grade: personRoleName,
          course: 'Asistencia Personal',
          state: editState,
          timeNote: editNote || undefined,
          teacherId: 'doc-admin',
          teacherName: 'Control de Personal'
        };
        updatedLogs.push(newLog);
      }

      await saveLogs(updatedLogs);
      showToast('Registro de asistencia guardado con éxito', 'success');
      setEditingId(null);
    } catch (e) {
      showToast('Error al guardar asistencia del personal', 'error');
    }
  };

  // Crear registro de asistencia manual desde el modal
  const handleRegisterManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      showToast('Por favor selecciona un miembro del personal', 'error');
      return;
    }

    const selectedPerson = staffRoster.find(p => p.id === selectedStaffId);
    if (!selectedPerson) return;

    try {
      showToast('Guardando registro manual...', 'info');
      
      // Comprobar si ya existe un registro
      const existingLog = logs.find(l => l.studentId === selectedStaffId && l.date === filterDate);
      let updatedLogs = [...logs];

      if (existingLog) {
        updatedLogs = logs.map(l => {
          if (l.id === existingLog.id) {
            return {
              ...l,
              state: regState,
              time: regTime,
              timeOut: regState === 'Ausente' ? undefined : regTimeOut,
              timeNote: regNote || undefined
            };
          }
          return l;
        });
      } else {
        const newLog: AttendanceLog = {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          date: filterDate,
          time: regTime,
          timeOut: regState === 'Ausente' ? undefined : regTimeOut,
          studentId: selectedStaffId,
          studentName: selectedPerson.name,
          grade: selectedPerson.roleName,
          course: 'Asistencia Personal',
          state: regState,
          timeNote: regNote || undefined,
          teacherId: 'doc-admin',
          teacherName: 'Control de Personal'
        };
        updatedLogs.push(newLog);
      }

      await saveLogs(updatedLogs);
      showToast('Asistencia manual registrada con éxito', 'success');
      setIsModalOpen(false);
      setSelectedStaffId('');
      setRegNote('');
    } catch (e) {
      showToast('Error al registrar asistencia manual', 'error');
    }
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes.");
      return;
    }

    const rowsHtml = filteredRoster.map(person => {
      const log = dayLogs.find(l => l.studentId === person.id);
      const stateLabel = log ? log.state : 'Ausente';
      const timeIn = log ? log.time : '-';
      const timeOut = log && log.timeOut ? log.timeOut : '-';
      const obs = log && log.timeNote ? log.timeNote : '';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${person.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${person.roleName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${person.detail}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${stateLabel === 'Presente' ? '#10b981' : stateLabel === 'Tardanza' ? '#f59e0b' : stateLabel === 'Justificado' ? '#3b82f6' : '#ef4444'}">${stateLabel}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${timeIn}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${timeOut}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-style: italic; font-size: 11px;">${obs}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Asistencia del Personal - Colegio San José de Calasanz</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px solid #0f4c9c; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #0a2d5c; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; color: #4a5568; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 10px; }
            th { background-color: #0f4c9c; color: white; padding: 12px 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Colegio San José de Calasanz</h1>
            <p>Reporte de Control de Asistencia del Personal</p>
          </div>
          <div class="meta">
            <div>
              <strong>Fecha del Reporte:</strong> ${filterDate} <br/>
              <strong>Exportado el:</strong> ${new Date().toLocaleDateString('es-PE')}
            </div>
            <div>
              <strong>Filtro Rol:</strong> ${filterRole} | <strong>Total Registros:</strong> ${filteredRoster.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Especialidad / Área</th>
                <th>Estado</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">No hay personal registrado para esta búsqueda.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            S.C.A. Colegio San José de Calasanz - Control de Personal 2026.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    let csv = 'Nombre,Rol,Especialidad/Area,Estado,Hora Entrada,Hora Salida,Observacion\n';

    filteredRoster.forEach(person => {
      const log = dayLogs.find(l => l.studentId === person.id);
      const stateLabel = log ? log.state : 'Ausente';
      const timeIn = log ? log.time : '-';
      const timeOut = log && log.timeOut ? log.timeOut : '-';
      const obs = log && log.timeNote ? log.timeNote.replace(/,/g, ' ') : '';
      
      csv += `"${person.name}","${person.roleName}","${person.detail}","${stateLabel}","${timeIn}","${timeOut}","${obs}"\n`;
    });

    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asistencia_personal_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="panel-header flex justify-between items-center">
        <div>
          <h1 className="panel-title">Asistencia de Personal</h1>
          <p className="panel-subtitle">Registro y control diario de asistencia para docentes y personal administrativo, auxiliar y de limpieza</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> Registrar Entrada Manual
          </button>
        </div>
      </div>

      {/* KPI GRID: PERSONAL */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
          <div className="stat-info">
            <span className="stat-value">{kpis.teachers.present} <span className="text-sm font-semibold text-blue-400">/ {kpis.teachers.total}</span></span>
            <span className="stat-label">Docentes Presentes</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><i className="fa-solid fa-broom"></i></div>
          <div className="stat-info">
            <span className="stat-value">{kpis.lim.present} <span className="text-sm font-semibold text-emerald-400">/ {kpis.lim.total}</span></span>
            <span className="stat-label">Personal de Limpieza</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><i className="fa-solid fa-user-group"></i></div>
          <div className="stat-info">
            <span className="stat-value">{kpis.aux.present} <span className="text-sm font-semibold text-amber-400">/ {kpis.aux.total}</span></span>
            <span className="stat-label">Auxiliares Activos</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon"><i className="fa-solid fa-user-tie"></i></div>
          <div className="stat-info">
            <span className="stat-value">{kpis.adm.present} <span className="text-sm font-semibold text-red-400">/ {kpis.adm.total}</span></span>
            <span className="stat-label">Administrativos</span>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="form-group mb-0">
            <label className="form-label text-xs">Fecha a Visualizar</label>
            <input 
              type="date" 
              className="form-control" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Buscar Personal</label>
            <div className="search-input-container" style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                className="form-control pl-9" 
                placeholder="Nombre o ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Filtrar por Rol</label>
            <select 
              className="form-control"
              value={filterRole}
              onChange={(e: any) => setFilterRole(e.target.value)}
            >
              <option value="Todos">Todos ({staffRoster.length})</option>
              <option value="Docentes">Docentes ({kpis.teachers.total})</option>
              <option value="Limpieza">Limpieza ({kpis.lim.total})</option>
              <option value="Auxiliares">Auxiliares ({kpis.aux.total})</option>
              <option value="Administrativos">Administrativos ({kpis.adm.total})</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end self-end h-[42px]">
            <button className="btn-outline px-3" onClick={handleExportPDF} title="Exportar PDF">
              <i className="fa-solid fa-file-pdf text-red-600"></i> PDF
            </button>
            <button className="btn-outline px-3" onClick={handleExportExcel} title="Exportar Excel">
              <i className="fa-solid fa-file-excel text-green-600"></i> Excel
            </button>
          </div>
        </div>
      </div>

      {/* ROSTER TABLE CARD */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Personal</th>
                <th>Rol / Área</th>
                <th>Estado Asistencia</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Observación / Justificación</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map(person => {
                const log = dayLogs.find(l => l.studentId === person.id);
                const isEditing = editingId === person.id;
                
                // Si no hay log, el estado es Ausente por defecto
                const state = log ? log.state : 'Ausente';
                const timeIn = log ? log.time : '-';
                const timeOut = log && log.timeOut ? log.timeOut : '-';
                const note = log && log.timeNote ? log.timeNote : '';

                return (
                  <tr key={person.id}>
                    <td>
                      <div className="student-cell flex items-center gap-3">
                        <img 
                          src={person.photo} 
                          alt={person.name} 
                          className="w-9 h-9 rounded-full object-cover border border-gray-200" 
                        />
                        <div>
                          <div className="font-bold text-[var(--text-main)]">{person.name}</div>
                          <div className="text-xs text-[var(--text-muted)] font-mono">{person.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          person.roleName.includes('Docente') ? 'bg-purple-100 text-purple-800' :
                          person.roleName === 'Limpieza' ? 'bg-teal-100 text-teal-800' :
                          person.roleName === 'Auxiliar' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {person.roleName}
                        </span>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">{person.detail}</div>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-control text-xs py-1 px-2 h-auto"
                          value={editState}
                          onChange={(e: any) => setEditState(e.target.value)}
                        >
                          <option value="Presente">Presente</option>
                          <option value="Tardanza">Tardanza</option>
                          <option value="Ausente">Ausente</option>
                          <option value="Justificado">Justificado</option>
                        </select>
                      ) : (
                        <span className={`badge ${
                          state === 'Presente' ? 'success' :
                          state === 'Tardanza' ? 'warning' :
                          state === 'Justificado' ? 'info' :
                          'danger'
                        }`}>
                          {state}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="time" 
                          className="form-control text-xs py-1 px-2 h-auto w-24"
                          value={editTime}
                          disabled={editState === 'Ausente'}
                          onChange={(e) => setEditTime(e.target.value)}
                        />
                      ) : (
                        <span className="font-mono font-medium text-gray-700">{timeIn}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="time" 
                          className="form-control text-xs py-1 px-2 h-auto w-24"
                          value={editTimeOut}
                          disabled={editState === 'Ausente'}
                          onChange={(e) => setEditTimeOut(e.target.value)}
                        />
                      ) : (
                        <span className="font-mono font-medium text-gray-700">{timeOut}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="form-control text-xs py-1 px-2 h-auto"
                          value={editNote}
                          placeholder="Nota..."
                          onChange={(e) => setEditNote(e.target.value)}
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">{note || '-'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded p-1.5 border-none cursor-pointer flex items-center justify-center"
                            onClick={() => handleSaveClick(person.id, person.name, person.roleName)}
                            title="Guardar"
                          >
                            <i className="fa-solid fa-check text-xs"></i>
                          </button>
                          <button 
                            className="bg-gray-400 hover:bg-gray-500 text-white rounded p-1.5 border-none cursor-pointer flex items-center justify-center"
                            onClick={() => setEditingId(null)}
                            title="Cancelar"
                          >
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded p-1.5 border-none cursor-pointer flex items-center justify-center mx-auto"
                          onClick={() => handleEditClick(person.id, log)}
                          title="Editar Asistencia"
                        >
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colspan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No se encontró personal que coincida con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRO MANUAL DE ASISTENCIA */}
      {isModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-box active max-w-md">
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-clipboard-user text-blue-600"></i> Registrar Asistencia Manual</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleRegisterManual} className="flex flex-col gap-4" style={{ padding: '20px 24px 24px 24px' }}>
              <div className="form-group">
                <label className="form-label">Miembro del Personal</label>
                <select 
                  className="form-control"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una persona...</option>
                  {staffRoster.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.roleName})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado Asistencia</label>
                <select 
                  className="form-control"
                  value={regState}
                  onChange={(e: any) => setRegState(e.target.value)}
                  required
                >
                  <option value="Presente">Presente</option>
                  <option value="Tardanza">Tardanza</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Justificado">Justificado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Hora Entrada</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={regTime} 
                    disabled={regState === 'Ausente'}
                    onChange={(e) => setRegTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Salida</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={regTimeOut} 
                    disabled={regState === 'Ausente'}
                    onChange={(e) => setRegTimeOut(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nota u Observación</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={regNote} 
                  placeholder="Ej. Ingreso tardío por tráfico, justificado..."
                  onChange={(e) => setRegNote(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full justify-center mt-2">
                Guardar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN - CALENDARIO ESCOLAR Y EVENTOS
// ==========================================================================
const AdminCalendarView: React.FC<SubViewProps> = ({ showToast }) => {
  const { events, saveEvents } = useAuth();
  
  // Usar Julio de 2026 como valor inicial de acuerdo a la simulación del proyecto
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 6 es Julio (0-indexado)
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Campos para nuevo/editado evento
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'Feriado' | 'Examen' | 'Reunion' | 'Festividad' | 'Otro'>('Otro');
  const [eventTime, setEventTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Obtener días del mes
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener el día de la semana en que inicia el mes (Lunes = 0 a Domingo = 6)
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    // Ajustar para que el Lunes sea 0 y Domingo sea 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Navegar al mes anterior
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  // Navegar al mes siguiente
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  // Generar la lista de celdas para el mes
  const calendarCells = React.useMemo(() => {
    const cells = [];
    
    // Rellenar días vacíos antes del inicio del mes
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: null });
    }

    // Rellenar los días reales del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      cells.push({ day, dateStr });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDay]);

  // Filtrar eventos del día
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  // Crear o editar un evento
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !selectedDate) {
      showToast('Por favor escribe un título para el evento', 'error');
      return;
    }

    try {
      if (editingEventId) {
        showToast('Actualizando evento...', 'info');
        const updatedEvents = events.map(evt => {
          if (evt.id === editingEventId) {
            return {
              ...evt,
              title: eventTitle,
              type: eventType,
              date: selectedDate,
              time: eventTime || undefined,
              description: eventDesc || undefined
            };
          }
          return evt;
        });
        await saveEvents(updatedEvents);
        showToast('Evento actualizado con éxito', 'success');
      } else {
        showToast('Creando evento...', 'info');
        const newEvent: SchoolEvent = {
          id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          title: eventTitle,
          type: eventType,
          date: selectedDate,
          time: eventTime || undefined,
          description: eventDesc || undefined
        };
        await saveEvents([...events, newEvent]);
        showToast('Evento escolar programado con éxito', 'success');
      }
      
      // Resetear campos
      setEventTitle('');
      setEventType('Otro');
      setEventTime('');
      setEventDesc('');
      setEditingEventId(null);
      setIsModalOpen(false);
    } catch (err) {
      showToast('Error al guardar el evento', 'error');
    }
  };

  // Abrir modal en modo edición
  const handleEditEventClick = (evt: SchoolEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventType(evt.type);
    setEventTime(evt.time || '');
    setEventDesc(evt.description || '');
    setIsModalOpen(true);
  };

  // Eliminar un evento
  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este evento del calendario?')) {
      try {
        showToast('Eliminando evento...', 'info');
        const updatedEvents = events.filter(e => e.id !== eventId);
        await saveEvents(updatedEvents);
        showToast('Evento eliminado con éxito', 'success');
      } catch (err) {
        showToast('Error al eliminar el evento', 'error');
      }
    }
  };

  // Eventos para el día seleccionado
  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="panel-header">
        <h1 className="panel-title">Calendario Escolar y Eventos</h1>
        <p className="panel-subtitle">Planificación de feriados, reuniones, exámenes bimestrales y festividades institucionales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PARTE IZQUIERDA: EL CALENDARIO MENSUAL */}
        <div className="lg:col-span-2 card p-5">
          {/* Cabecera del Calendario */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="m-0 text-lg font-black text-[#0f4c9c] flex items-center gap-2">
              <i className="fa-solid fa-calendar"></i> {months[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-2">
              <button className="btn-outline p-2 h-9 w-9 flex items-center justify-center" onClick={handlePrevMonth}>
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button className="btn-outline p-2 h-9 w-9 flex items-center justify-center" onClick={handleNextMonth}>
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center gap-2 mb-2">
            {daysOfWeek.map(day => (
              <span key={day} className="text-xs font-bold text-[var(--text-muted)] py-1 uppercase tracking-wider">{day}</span>
            ))}
          </div>

          {/* Grilla de Días */}
          <div className="grid grid-cols-7 gap-2" style={{ gridAutoRows: '100px' }}>
            {calendarCells.map((cell, idx) => {
              const hasEvents = cell.dateStr ? getEventsForDate(cell.dateStr) : [];
              const isSelected = cell.dateStr && selectedDate === cell.dateStr;
              
              // Determinar si hay un feriado/sin clases este día
              const isHoliday = hasEvents.some(e => e.type === 'Feriado');
              
              return (
                <div 
                  key={idx}
                  onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                  className={`border border-solid p-1.5 rounded-lg flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    !cell.day ? 'bg-gray-50/50 border-gray-100 cursor-default pointer-events-none' : 
                    isSelected ? 'border-[var(--primary)] bg-blue-50/20 shadow-sm' :
                    isHoliday ? 'border-red-200 bg-red-50/30 hover:bg-red-50/60' :
                    'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${
                      !cell.day ? 'text-transparent' :
                      isHoliday ? 'text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full' :
                      'text-gray-700'
                    }`}>
                      {cell.day}
                    </span>
                    {hasEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                    )}
                  </div>

                  {/* Listado pequeño de eventos en la celda */}
                  <div className="flex flex-col gap-0.5 overflow-hidden max-h-[70px]">
                    {hasEvents.slice(0, 2).map(e => (
                      <span 
                        key={e.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                          e.type === 'Feriado' ? 'bg-red-100 text-red-800' :
                          e.type === 'Examen' ? 'bg-purple-100 text-purple-800' :
                          e.type === 'Reunion' ? 'bg-green-100 text-green-800' :
                          e.type === 'Festividad' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {e.title}
                      </span>
                    ))}
                    {hasEvents.length > 2 && (
                      <span className="text-[8px] text-[var(--text-muted)] italic pl-1">+{hasEvents.length - 2} más</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PARTE DERECHA: SIDEBAR DE DETALLES Y CREACIÓN */}
        <div className="flex flex-col gap-4">
          
          {/* CARD DE DETALLES DEL DÍA SELECCIONADO */}
          <div className="card p-5">
            <h3 className="m-0 text-sm font-black text-gray-800 border-b border-gray-100 pb-3 mb-4">
              <i className="fa-solid fa-list-check text-[var(--primary)]"></i> Actividades del Día
            </h3>

            {selectedDate ? (
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Fecha Seleccionada</div>
                  <div className="font-bold text-gray-800 mt-1">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>

                <div className="flex flex-col gap-3">
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-6 text-sm text-[var(--text-muted)] italic">
                      No hay eventos programados para este día.
                    </div>
                  ) : (
                    selectedDayEvents.map(evt => (
                      <div key={evt.id} className="p-3 rounded-lg border border-solid flex flex-col gap-2 relative bg-white border-gray-200">
                        <div className="flex justify-between items-start pr-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.type === 'Feriado' ? 'bg-red-100 text-red-800' :
                            evt.type === 'Examen' ? 'bg-purple-100 text-purple-800' :
                            evt.type === 'Reunion' ? 'bg-green-100 text-green-800' :
                            evt.type === 'Festividad' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {evt.type}
                          </span>
                          <div className="flex gap-1 absolute right-2 top-2">
                            <button 
                              className="bg-transparent border-none text-blue-500 hover:text-blue-700 cursor-pointer p-1"
                              onClick={() => handleEditEventClick(evt)}
                              title="Editar Evento"
                            >
                              <i className="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button 
                              className="bg-transparent border-none text-red-500 hover:text-red-700 cursor-pointer p-1"
                              onClick={() => handleDeleteEvent(evt.id)}
                              title="Eliminar Evento"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>
                        <h4 className="m-0 text-sm font-bold text-gray-800">{evt.title}</h4>
                        {evt.time && (
                          <div className="text-xs text-gray-600 font-mono">
                            <i className="fa-regular fa-clock"></i> Hora: {evt.time}
                          </div>
                        )}
                        {evt.description && (
                          <p className="m-0 text-xs text-[var(--text-muted)] leading-relaxed">{evt.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button 
                  className="btn-primary justify-center mt-2 w-full"
                  onClick={() => {
                    setEditingEventId(null);
                    setEventTitle('');
                    setEventType('Otro');
                    setEventTime('');
                    setEventDesc('');
                    setIsModalOpen(true);
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Programar Actividad
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-[var(--text-muted)] italic">
                Selecciona un día en el calendario para ver sus actividades o programar un nuevo evento.
              </div>
            )}
          </div>

          {/* CARD DE LEYENDA */}
          <div className="card p-4">
            <h4 className="m-0 text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">Leyenda de Categorías</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>
                <span className="font-medium text-gray-700">Feriado / Sin clases (Día no hábil)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></span>
                <span className="font-medium text-gray-700">Examen / Evaluaciones</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>
                <span className="font-medium text-gray-700">Reunión de Padres / Docentes</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></span>
                <span className="font-medium text-gray-700">Festividad / Ceremonia Cívica</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>
                <span className="font-medium text-gray-700">Otros Eventos</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: CREAR EVENTO */}
      {isModalOpen && selectedDate && (
        <div className="modal-overlay active">
          <div className="modal-box active max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-calendar-plus text-blue-600"></i> {editingEventId ? 'Editar Actividad' : 'Programar Nueva Actividad'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4" style={{ padding: '20px 24px 24px 24px' }}>
              <div className="form-group">
                <label className="form-label">Fecha Programada</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Título del Evento</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ej. Día del Logro, Primer Examen Parcial..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tipo de Actividad</label>
                  <select 
                    className="form-control"
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    required
                  >
                    <option value="Feriado">Feriado / Sin clases</option>
                    <option value="Examen">Examen</option>
                    <option value="Reunion">Reunión</option>
                    <option value="Festividad">Festividad / Cívico</option>
                    <option value="Otro">Otro / General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hora (Opcional)</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Detalles sobre la actividad o indicaciones especiales..."
                />
              </div>

              <button type="submit" className="btn-primary w-full justify-center mt-2">
                {editingEventId ? 'Guardar Cambios' : 'Programar Evento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUB-VISTA: ADMIN/TEACHER - HORARIO ESCOLAR SEMANAL
// ==========================================================================
interface TimetableProps {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isAdminView: boolean;
}

const TimetableScheduleView: React.FC<TimetableProps> = ({ showToast, isAdminView }) => {
  const { user, teachers, classrooms, schedules, saveSchedules } = useAuth();

  // Buscar información de tutoría en caso de que sea un docente
  const currentTeacher = React.useMemo(() => {
    if (!user) return null;
    return teachers.find(t => t.id === user.id || t.name === `${user.nombres} ${user.apellidos}`);
  }, [teachers, user]);

  const idAulaTutor = currentTeacher?.idAulaTutor;

  // Estado del aula seleccionada (Admin elige, Tutor queda fijo)
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);

  // Inicializar el salón seleccionado
  useEffect(() => {
    if (isAdminView) {
      if (classrooms.length > 0 && selectedClassroomId === null) {
        setSelectedClassroomId(classrooms[0].id_aula);
      }
    } else {
      if (idAulaTutor) {
        setSelectedClassroomId(idAulaTutor);
      }
    }
  }, [isAdminView, classrooms, idAulaTutor, selectedClassroomId]);

  // Modal de agregar/editar horario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  
  const [schedDay, setSchedDay] = useState<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'>('Lunes');
  const [schedStart, setSchedStart] = useState('08:00');
  const [schedEnd, setSchedEnd] = useState('09:30');
  const [schedSubject, setSchedSubject] = useState('');

  const daysOfWeek: ('Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado')[] = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const timeSlots = [
    { start: '06:45', end: '07:00', label: '6:45 - 7:00', isSpecial: true, specialLabel: 'REFLEXIÓN' },
    { start: '07:00', end: '07:50', label: '7:00 - 7:50' },
    { start: '07:50', end: '08:40', label: '7:50 - 8:40' },
    { start: '08:40', end: '09:30', label: '8:40 - 9:30' },
    { start: '09:30', end: '10:20', label: '9:30 - 10:20' },
    { start: '10:20', end: '10:50', label: '10:20 - 10:50', isSpecial: true, specialLabel: 'DESCANSO' },
    { start: '10:50', end: '11:40', label: '10:50 - 11:40' },
    { start: '11:40', end: '12:30', label: '11:40 - 12:30' },
    { start: '12:30', end: '13:10', label: '12:30 - 13:10', isSpecial: true, specialLabel: 'ALMUERZO' },
    { start: '13:10', end: '14:00', label: '1:10 - 2:00' },
    { start: '14:00', end: '14:50', label: '2:00 - 2:50' }
  ];

  const getSubjectColorClass = (subjectName: string) => {
    const norm = subjectName.toLowerCase().trim();
    if (norm.includes('matemática') || norm.includes('algebra') || norm.includes('geometria')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (norm.includes('religión') || norm.includes('etica') || norm.includes('ética')) return 'bg-green-100 text-green-800 border-green-200';
    if (norm.includes('ciencia') || norm.includes('quimica') || norm.includes('química') || norm.includes('fisica') || norm.includes('física')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (norm.includes('inglés') || norm.includes('ingles') || norm.includes('english')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (norm.includes('sociales') || norm.includes('historia') || norm.includes('geografia')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (norm.includes('lengua') || norm.includes('castellana') || norm.includes('comunicación')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (norm.includes('filosofía') || norm.includes('filosofia')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (norm.includes('educación física') || norm.includes('deporte') || norm.includes('ed. física') || norm.includes('educacion')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Comprobar si el usuario actual tiene permisos de edición (Administrador o Tutor del aula seleccionada)
  const canEdit = React.useMemo(() => {
    if (isAdminView) return true;
    return idAulaTutor !== undefined && idAulaTutor === selectedClassroomId;
  }, [isAdminView, idAulaTutor, selectedClassroomId]);

  // Filtrar los horarios correspondientes al aula seleccionada
  const classSchedules = React.useMemo(() => {
    if (selectedClassroomId === null) return [];
    return schedules.filter(s => s.classroomId === selectedClassroomId);
  }, [schedules, selectedClassroomId]);

  // Nombre del aula seleccionada
  const selectedClassroomName = React.useMemo(() => {
    const aula = classrooms.find(c => c.id_aula === selectedClassroomId);
    return aula ? `${aula.grado} ${aula.seccion}` : 'Sin Aula';
  }, [classrooms, selectedClassroomId]);

  // Manejar el envío del formulario (Crear / Editar)
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedSubject || selectedClassroomId === null) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (schedStart >= schedEnd) {
      showToast('La hora de inicio debe ser anterior a la hora de fin', 'error');
      return;
    }

    try {
      let updatedSchedules = [...schedules];

      if (editingScheduleId) {
        showToast('Actualizando horario...', 'info');
        updatedSchedules = schedules.map(s => {
          if (s.id === editingScheduleId) {
            return {
              ...s,
              dayOfWeek: schedDay,
              startTime: schedStart,
              endTime: schedEnd,
              subject: schedSubject
            };
          }
          return s;
        });
        showToast('Horario actualizado con éxito', 'success');
      } else {
        showToast('Agregando horario...', 'info');
        const newSched: ClassSchedule = {
          id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          classroomId: selectedClassroomId,
          dayOfWeek: schedDay,
          startTime: schedStart,
          endTime: schedEnd,
          subject: schedSubject
        };
        updatedSchedules.push(newSched);
        showToast('Horario programado con éxito', 'success');
      }

      await saveSchedules(updatedSchedules);
      
      // Resetear campos
      setSchedSubject('');
      setSchedDay('Lunes');
      setSchedStart('08:00');
      setSchedEnd('09:30');
      setEditingScheduleId(null);
      setIsModalOpen(false);
    } catch (err) {
      showToast('Error al guardar el horario', 'error');
    }
  };

  // Abrir modal en modo edición
  const handleEditScheduleClick = (s: ClassSchedule) => {
    setEditingScheduleId(s.id);
    setSchedDay(s.dayOfWeek);
    setSchedStart(s.startTime);
    setSchedEnd(s.endTime);
    setSchedSubject(s.subject);
    setIsModalOpen(true);
  };

  // Eliminar un horario
  const handleDeleteSchedule = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este bloque horario del calendario?')) {
      try {
        showToast('Eliminando horario...', 'info');
        const updatedSchedules = schedules.filter(s => s.id !== id);
        await saveSchedules(updatedSchedules);
        showToast('Bloque horario eliminado con éxito', 'success');
      } catch (err) {
        showToast('Error al eliminar el bloque horario', 'error');
      }
    }
  };

  // Si el rol es Docente pero no es Tutor de ningún aula
  if (!isAdminView && !idAulaTutor) {
    return (
      <div className="flex flex-col gap-6">
        <div className="panel-header">
          <h1 className="panel-title">Horario Escolar</h1>
          <p className="panel-subtitle">Visualización y organización de materias semanales</p>
        </div>
        <div className="card text-center py-12 px-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <i className="fa-solid fa-lock text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-800 m-0">Acceso de Edición Restringido</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md m-0 leading-relaxed">
            Solo los docentes que son **tutores de aula** o el **personal administrativo** pueden establecer o modificar los horarios de clase. 
            Actualmente no tienes un salón asignado a tu cargo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="panel-header flex justify-between items-center">
        <div>
          <h1 className="panel-title">Horario Escolar Semanal</h1>
          <p className="panel-subtitle">Planificación de cursos y asignaturas escolares por día y hora</p>
        </div>
        {canEdit && (
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingScheduleId(null);
              setSchedSubject('');
              setSchedDay('Lunes');
              setSchedStart('08:00');
              setSchedEnd('09:30');
              setIsModalOpen(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Agregar Curso al Horario
          </button>
        )}
      </div>

      {/* SELECTOR DE AULA (Solo visible para Admin) */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="form-group mb-0 flex-1 md:flex-initial md:w-80">
            <label className="form-label text-xs font-bold text-gray-700">Grado y Sección a Visualizar</label>
            {isAdminView ? (
              <select 
                className="form-control mt-1"
                value={selectedClassroomId || ''}
                onChange={(e) => setSelectedClassroomId(Number(e.target.value))}
              >
                {classrooms.map(c => (
                  <option key={c.id_aula} value={c.id_aula}>{c.grado} {c.seccion} ({c.nivel})</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                className="form-control mt-1" 
                value={selectedClassroomName} 
                disabled 
              />
            )}
          </div>
          <div className="text-xs text-[var(--text-muted)] self-end mb-2">
            <i className="fa-solid fa-circle-info text-blue-500"></i> {isAdminView ? 'Como Administrador tienes control total sobre los horarios.' : 'Como Tutor puedes editar el horario de tu aula asignada.'}
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE HORARIO SEMANAL EN TABLA (DISEÑO AGENDA COLEGIO) */}
      <div className="card p-0 overflow-hidden" style={{ border: '1px solid #c0c0c0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '10%' }}>HORAS</th>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>LUNES</th>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>MARTES</th>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>MIÉRCOLES</th>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>JUEVES</th>
                <th style={{ padding: '12px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>VIERNES</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#1e293b', width: '15%' }}>SÁBADO</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, idx) => {
                if (slot.isSpecial) {
                  // REFLEXIÓN, DESCANSO, ALMUERZO
                  const isDescanso = slot.specialLabel === 'DESCANSO';
                  return (
                    <tr key={idx} style={{ height: '40px', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                        {slot.label}
                      </td>
                      <td colSpan={5} style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', fontWeight: '900', backgroundColor: '#fef08a', color: '#854d0e', letterSpacing: '4px', fontSize: '12px', textTransform: 'uppercase' }}>
                        {slot.specialLabel}
                      </td>
                      <td style={{ padding: '6px 8px', backgroundColor: isDescanso ? '#fef08a' : '#f8fafc', fontWeight: isDescanso ? 'bold' : 'normal', color: isDescanso ? '#854d0e' : '#94a3b8', fontSize: '11px' }}>
                        {isDescanso ? 'DESCANSO (10:30-10:50)' : '-'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={idx} style={{ height: '55px', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                      {slot.label}
                    </td>
                    {daysOfWeek.map(day => {
                      const item = classSchedules.find(s => s.dayOfWeek === day && s.startTime === slot.start);
                      const isSabado = day === 'Sábado';

                      return (
                        <td 
                          key={day} 
                          style={{ padding: '4px', borderRight: isSabado ? 'none' : '1px solid #e2e8f0', verticalAlign: 'middle', position: 'relative', cursor: canEdit ? 'pointer' : 'default' }}
                          className="hover:bg-slate-50/50"
                          onClick={() => {
                            if (!canEdit) return;
                            if (item) {
                              handleEditScheduleClick(item);
                            } else {
                              setEditingScheduleId(null);
                              setSchedSubject('');
                              setSchedDay(day);
                              setSchedStart(slot.start);
                              setSchedEnd(slot.end);
                              setIsModalOpen(true);
                            }
                          }}
                        >
                          {item ? (
                            <div 
                              className={`p-2 rounded-lg border border-solid relative group transition-all duration-150 ${getSubjectColorClass(item.subject)}`}
                              style={{ minHeight: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                            >
                              <span className="font-bold text-xs text-center" style={{ display: 'block', lineHeight: '1.2' }}>{item.subject}</span>
                              {canEdit && (
                                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-white/90 rounded p-0.5 shadow-sm border border-gray-200">
                                  <button 
                                    className="bg-transparent border-none text-blue-600 hover:text-blue-800 cursor-pointer p-0.5 flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditScheduleClick(item);
                                    }}
                                    title="Editar"
                                  >
                                    <i className="fa-solid fa-pen text-[8px]"></i>
                                  </button>
                                  <button 
                                    className="bg-transparent border-none text-red-600 hover:text-red-800 cursor-pointer p-0.5 flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSchedule(item.id);
                                    }}
                                    title="Eliminar"
                                  >
                                    <i className="fa-solid fa-trash-can text-[8px]"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            canEdit && (
                              <div className="flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-150" style={{ height: '35px' }}>
                                <i className="fa-solid fa-plus-circle text-slate-300 text-lg"></i>
                              </div>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AGREGAR / EDITAR HORARIO */}
      {isModalOpen && selectedClassroomId !== null && (
        <div className="modal-overlay active">
          <div className="modal-box active max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-table-cells text-blue-600"></i> {editingScheduleId ? 'Editar Bloque Horario' : 'Agregar Curso al Horario'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmitSchedule} className="flex flex-col gap-4" style={{ padding: '20px 24px 24px 24px' }}>
              <div className="form-group">
                <label className="form-label">Aula Seleccionada</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={selectedClassroomName}
                  disabled 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Curso / Asignatura</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={schedSubject}
                  onChange={(e) => setSchedSubject(e.target.value)}
                  placeholder="Ej. Álgebra, Razonamiento Verbal, Ciencia..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Día de la Semana</label>
                <select 
                  className="form-control"
                  value={schedDay}
                  onChange={(e: any) => setSchedDay(e.target.value)}
                  required
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Hora Inicio</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Fin</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center mt-2">
                {editingScheduleId ? 'Guardar Cambios' : 'Agregar Horario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



