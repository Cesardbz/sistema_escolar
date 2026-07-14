// Lógica de la Aplicación - Sistema de Control de Asistencia (app.js)

// --- ESTADO GLOBAL ---
let appState = {
  currentRole: 'admin',
  currentView: 'admin-dashboard',
  selectedTeacherId: 'doc-01', // Ana Gómez para la simulación
  selectedStudentId: 'est-01', // Mateo Silva para la simulación
  activeStudentMonth: new Date(2026, 6, 1), // Julio 2026 para la visualización inicial
  
  // Instancias de Chart.js
  charts: {
    dailySummary: null,
    weekly: null,
    gradeDist: null
  },
  
  // Paginación de Tabla
  logsTablePage: 1,
  logsTableLimit: 8
};

// Fecha de simulación "Hoy" (para cálculos consistentes en la base de datos simulada)
const SIMULATED_TODAY = '2026-07-09';

// Nombres de meses en español
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// --- EVENT LISTENERS DE INICIO ---
document.addEventListener('DOMContentLoaded', async () => {
  // Esperar a que los datos de Supabase se carguen en memoria
  if (window.AttendanceDB && window.AttendanceDB.init) {
    try {
      await window.AttendanceDB.init();
    } catch (e) {
      console.error("Error inicializando AttendanceDB con Supabase:", e);
    }
  }
  initApp();
});

function initApp() {
  setupSidebarNavigation();
  setupRoleSelector();
  setupFilters();
  setupModals();
  setupForms();
  setupLoginFlow();
  
  // Verificar si hay una sesión activa de usuario
  const cachedUser = sessionStorage.getItem('sessionUser');
  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser);
      applySessionUser(user);
    } catch (e) {
      console.error("Error al cargar sesión de usuario:", e);
      showLoginForm();
    }
  } else {
    showLoginForm();
  }
  
  // Soporte menú responsivo para móviles
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
    
    // Cerrar sidebar al hacer click fuera en móviles
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
  }
}

// --- SISTEMA DE RUTAS / SIDEBAR ---
function setupSidebarNavigation() {
  const menuItems = document.querySelectorAll('#sidebar-menu-items .menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      navigateToView(targetView);
      
      // Cerrar sidebar en celular tras navegación
      document.getElementById('app-sidebar').classList.remove('active');
    });
  });
}

function navigateToView(viewName) {
  appState.currentView = viewName;
  
  // Actualizar clases activas en sidebar
  const menuItems = document.querySelectorAll('#sidebar-menu-items .menu-item');
  menuItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Alternar paneles de vista
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(panel => {
    panel.classList.remove('active');
  });

  // Para la vista especial "admin-logs" que es la tabla completa reutilizada
  if (viewName === 'admin-logs') {
    const container = document.getElementById('logs-expanded-card-container');
    const tableCard = document.getElementById('main-attendance-table-card');
    if (container && tableCard) {
      container.appendChild(tableCard);
    }
    document.getElementById('view-admin-logs').classList.add('active');
  } else {
    // Si salimos de logs, devolver la tabla a su columna original en el dashboard general
    const containerCol = document.getElementById('main-attendance-table-column');
    const tableCard = document.getElementById('main-attendance-table-card');
    if (containerCol && tableCard && !containerCol.contains(tableCard)) {
      containerCol.appendChild(tableCard);
    }
    
    const targetPanel = document.getElementById(`view-${viewName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  }

  // Refrescar contenidos
  refreshCurrentView();
}

// --- SELECTOR DE ROLES (SIMULADOR) ---
function setupRoleSelector() {
  const selector = document.getElementById('role-selector-sim');
  selector.addEventListener('change', (e) => {
    const role = e.target.value;
    appState.currentRole = role;
    
    // Ocultar/Mostrar opciones del sidebar
    const menuItems = document.querySelectorAll('#sidebar-menu-items .menu-item');
    menuItems.forEach(item => {
      const itemRole = item.getAttribute('data-role');
      if (itemRole === role) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });

    // Actualizar perfil de usuario rápido
    const profileImg = document.getElementById('user-profile-img');
    const profileName = document.getElementById('user-profile-name');
    const profileRole = document.getElementById('user-profile-role');

    if (role === 'admin') {
      profileImg.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
      profileName.textContent = 'José Calasanz';
      profileRole.textContent = 'Administrador';
      navigateToView('admin-dashboard');
    } else if (role === 'teacher') {
      const teacher = AttendanceDB.getTeachers().find(t => t.id === appState.selectedTeacherId);
      profileImg.src = teacher ? teacher.photo : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150';
      profileName.textContent = teacher ? teacher.name : 'Ana Gómez';
      profileRole.textContent = 'Docente';
      navigateToView('teacher-dashboard');
    } else if (role === 'student') {
      const student = AttendanceDB.getStudents().find(s => s.id === appState.selectedStudentId);
      profileImg.src = student ? student.photo : 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150';
      profileName.textContent = student ? student.name : 'Mateo Silva';
      profileRole.textContent = `Estudiante - ${student ? student.grade : '3º Primaria'}`;
      navigateToView('student-dashboard');
    }
  });
}

// --- CONTROL DE CARGA / ACTUALIZACIÓN DE CONTENIDO ---
function refreshCurrentView() {
  // Ajustar el badge de notificaciones (Justificaciones pendientes)
  const pendingJustifications = AttendanceDB.getJustifications().filter(j => j.status === 'Pendiente').length;
  const notifBadge = document.getElementById('notif-badge');
  if (pendingJustifications > 0) {
    notifBadge.style.display = 'block';
  } else {
    notifBadge.style.display = 'none';
  }

  // Cargar datos según la vista activa
  if (appState.currentView === 'admin-dashboard' || appState.currentView === 'admin-logs') {
    renderAdminDashboardStats();
    renderLogsTable();
    renderAdminAlerts();
    initAdminCharts();
    populateAdminModalsDropdowns();
  } else if (appState.currentView === 'admin-justifications') {
    renderJustificationsTable();
  } else if (appState.currentView === 'admin-students') {
    renderStudentsTable();
  } else if (appState.currentView === 'admin-teachers') {
    renderTeachersTable();
  } else if (appState.currentView === 'admin-cards') {
    renderCardsView();
  } else if (appState.currentView === 'teacher-dashboard') {
    renderTeacherDashboard();
  } else if (appState.currentView === 'teacher-register') {
    renderTeacherRegisterForm();
  } else if (appState.currentView === 'student-dashboard') {
    renderStudentDashboard();
  }
}

// ==========================================================================
// RENDERIZADO DE COMPONENTES: VISTA ADMINISTRADOR
// ==========================================================================

function renderAdminDashboardStats() {
  const logs = AttendanceDB.getLogs();
  
  // Total históricos
  const totalCount = logs.length;
  const presentCount = logs.filter(l => l.state === 'Presente').length;
  const lateCount = logs.filter(l => l.state === 'Tardanza').length;
  const justifiedCount = logs.filter(l => l.state === 'Justificado').length;
  const absentCount = logs.filter(l => l.state === 'Ausente').length;
  
  // Calcular porcentaje de asistencia (Presente + Tardanza + Justificado cuentan como presentes o justificados en el porcentaje general)
  const attendanceRate = totalCount > 0 ? (((presentCount + lateCount + justifiedCount) / totalCount) * 100).toFixed(1) : '100';
  document.getElementById('admin-stat-percent').textContent = `${attendanceRate}%`;
  
  // Estadísticas del día simulado
  const todayLogs = logs.filter(l => l.date === SIMULATED_TODAY);
  const todayPresents = todayLogs.filter(l => l.state === 'Presente').length;
  const todayLates = todayLogs.filter(l => l.state === 'Tardanza').length;
  const todayAbsents = todayLogs.filter(l => l.state === 'Ausente').length;

  document.getElementById('admin-stat-present').textContent = todayPresents;
  document.getElementById('admin-stat-late').textContent = todayLates;
  document.getElementById('admin-stat-absent').textContent = todayAbsents;
  
  document.getElementById('daily-summary-date').textContent = formatDateES(SIMULATED_TODAY);
}

function renderAdminAlerts() {
  const logs = AttendanceDB.getLogs();
  
  // 1. Alertas de Ausentismo (Estudiantes con más inasistencias sin justificar)
  const absencesCount = {};
  logs.forEach(log => {
    if (log.state === 'Ausente') {
      absencesCount[log.studentId] = (absencesCount[log.studentId] || 0) + 1;
    }
  });

  const students = AttendanceDB.getStudents();
  const alertList = document.getElementById('absentee-alerts-list');
  alertList.innerHTML = '';

  // Ordenar estudiantes por más faltas
  const sortedAbsentees = Object.entries(absencesCount)
    .map(([studentId, count]) => {
      const student = students.find(s => s.id === studentId);
      return { student, count };
    })
    .filter(item => item.student !== undefined)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3); // Top 3

  if (sortedAbsentees.length === 0) {
    alertList.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">No hay alertas de ausentismo.</p>';
  } else {
    sortedAbsentees.forEach(item => {
      alertList.innerHTML += `
        <div class="alert-item">
          <div class="alert-user">
            <img src="${item.student.photo}" alt="${item.student.name}">
            <div>
              <div class="alert-name">${item.student.name}</div>
              <div class="alert-desc">${item.student.grade}</div>
            </div>
          </div>
          <span class="alert-badge danger">${item.count} faltas</span>
        </div>
      `;
    });
  }

  // 2. Tardanzas Recientes
  const latesList = document.getElementById('recent-lates-list');
  latesList.innerHTML = '';

  const recentLates = logs
    .filter(log => log.state === 'Tardanza')
    .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))
    .slice(0, 3);

  if (recentLates.length === 0) {
    latesList.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">No hay tardanzas recientes.</p>';
  } else {
    recentLates.forEach(log => {
      const student = students.find(s => s.id === log.studentId);
      latesList.innerHTML += `
        <div class="alert-item">
          <div class="alert-user">
            <img src="${student ? student.photo : 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150'}" alt="${log.studentName}">
            <div>
              <div class="alert-name">${log.studentName}</div>
              <div class="alert-desc">${log.grade} | ${formatDateShort(log.date)}</div>
            </div>
          </div>
          <span class="alert-badge warning">${log.timeNote || log.time}</span>
        </div>
      `;
    });
  }
}

// --- GRÁFICOS (Chart.js) ---
function initAdminCharts() {
  const logs = AttendanceDB.getLogs();
  
  // --- 1. RESUMEN DIARIO ---
  const todayLogs = logs.filter(l => l.date === SIMULATED_TODAY);
  const presents = todayLogs.filter(l => l.state === 'Presente').length;
  const absents = todayLogs.filter(l => l.state === 'Ausente').length;
  const lates = todayLogs.filter(l => l.state === 'Tardanza').length;
  
  const ctxDaily = document.getElementById('chart-resumen-diario').getContext('2d');
  if (appState.charts.dailySummary) appState.charts.dailySummary.destroy();
  
  appState.charts.dailySummary = new Chart(ctxDaily, {
    type: 'bar',
    data: {
      labels: ['Asistencias', 'Ausentes', 'Tardanzas'],
      datasets: [{
        label: 'Estudiantes',
        data: [presents, absents, lates],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });

  // --- 2. ASISTENCIA SEMANAL (Simulado Lunes-Viernes) ---
  const ctxWeekly = document.getElementById('chart-weekly').getContext('2d');
  if (appState.charts.weekly) appState.charts.weekly.destroy();
  
  appState.charts.weekly = new Chart(ctxWeekly, {
    type: 'bar',
    data: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
      datasets: [{
        label: 'Asistencia (%)',
        data: [96.2, 96.5, 95.8, 96.5, 97.2],
        backgroundColor: '#f59e0b',
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { min: 80, max: 100 }
      }
    }
  });

  // --- 3. DISTRIBUCIÓN POR GRADO ---
  const grades = ['3º Primaria', '5º Secundaria', '1º Secundaria', '4º Secundaria', '2º Secundaria'];
  const gradeRates = grades.map(grade => {
    const gradeLogs = logs.filter(l => l.grade === grade);
    if (gradeLogs.length === 0) return 100;
    const present = gradeLogs.filter(l => ['Presente', 'Tardanza', 'Justificado'].includes(l.state)).length;
    return Math.round((present / gradeLogs.length) * 100);
  });

  const ctxGrade = document.getElementById('chart-grade-dist').getContext('2d');
  if (appState.charts.gradeDist) appState.charts.gradeDist.destroy();
  
  appState.charts.gradeDist = new Chart(ctxGrade, {
    type: 'doughnut',
    data: {
      labels: grades,
      datasets: [{
        data: gradeRates,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
      },
      cutout: '65%'
    }
  });
}

// --- TABLA DE REGISTROS DE ASISTENCIA (CON FILTROS Y BUSQUEDA) ---
function setupFilters() {
  const inputs = ['log-search', 'filter-date', 'filter-grade', 'filter-state'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        appState.logsTablePage = 1; // reset a pág 1
        renderLogsTable();
      });
    }
  });
}

function renderLogsTable() {
  const searchVal = document.getElementById('log-search').value.toLowerCase();
  const dateVal = document.getElementById('filter-date').value;
  const gradeVal = document.getElementById('filter-grade').value;
  const stateVal = document.getElementById('filter-state').value;
  
  let logs = AttendanceDB.getLogs();
  const students = AttendanceDB.getStudents();
  
  // Ordenar por fecha y hora descendente por defecto
  logs.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

  // Aplicar filtros
  const filteredLogs = logs.filter(log => {
    // Búsqueda textual por estudiante o docente
    const matchesSearch = log.studentName.toLowerCase().includes(searchVal) || 
                          log.teacherName.toLowerCase().includes(searchVal) || 
                          log.course.toLowerCase().includes(searchVal);
    
    const matchesDate = !dateVal || log.date === dateVal;
    const matchesGrade = !gradeVal || log.grade === gradeVal;
    const matchesState = !stateVal || log.state === stateVal;
    
    return matchesSearch && matchesDate && matchesGrade && matchesState;
  });

  // Paginación
  const totalEntries = filteredLogs.length;
  const totalPages = Math.ceil(totalEntries / appState.logsTableLimit) || 1;
  
  if (appState.logsTablePage > totalPages) {
    appState.logsTablePage = totalPages;
  }
  
  const startIndex = (appState.logsTablePage - 1) * appState.logsTableLimit;
  const endIndex = Math.min(startIndex + appState.logsTableLimit, totalEntries);
  
  const pageLogs = filteredLogs.slice(startIndex, endIndex);
  
  // Renderizar filas
  const tbody = document.getElementById('logs-table-body');
  tbody.innerHTML = '';
  
  if (pageLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No se encontraron registros.</td></tr>`;
  } else {
    pageLogs.forEach(log => {
      const student = students.find(s => s.id === log.studentId);
      const studentPhoto = student ? student.photo : 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150';
      
      const stateBadge = log.state === 'Tardanza' && log.timeNote 
        ? `<span class="status-badge tardanza">Tardanza (${log.timeNote})</span>`
        : `<span class="status-badge ${log.state.toLowerCase()}">${log.state}</span>`;
      
      tbody.innerHTML += `
        <tr>
          <td>${formatDateShort(log.date)}</td>
          <td>${log.time}</td>
          <td>
            <div class="student-cell">
              <img src="${studentPhoto}" alt="${log.studentName}">
              <span>${log.studentName}</span>
            </div>
          </td>
          <td>${log.grade} - ${log.course}</td>
          <td>${stateBadge}</td>
          <td>${log.teacherName}</td>
          <td>
            <div class="actions-cell">
              <button class="action-btn" title="Editar" onclick="openEditLogModal('${log.id}')"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="action-btn delete" title="Eliminar" onclick="deleteLog('${log.id}')"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </td>
        </tr>
      `;
    });
  }
  
  // Info de Entradas
  document.getElementById('table-entries-info').textContent = 
    totalEntries > 0 ? `Mostrando ${startIndex + 1} a ${endIndex} de ${totalEntries} registros` : 'Mostrando 0 de 0 registros';
    
  // Renderizar Botones Paginación
  renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
  const pagination = document.getElementById('table-pagination');
  pagination.innerHTML = '';
  
  // Botón Anterior
  const prevBtn = document.createElement('button');
  prevBtn.className = `page-btn ${appState.logsTablePage === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
  prevBtn.disabled = appState.logsTablePage === 1;
  prevBtn.addEventListener('click', () => {
    appState.logsTablePage--;
    renderLogsTable();
  });
  pagination.appendChild(prevBtn);
  
  // Botones de Páginas
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${appState.logsTablePage === i ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      appState.logsTablePage = i;
      renderLogsTable();
    });
    pagination.appendChild(pageBtn);
  }
  
  // Botón Siguiente
  const nextBtn = document.createElement('button');
  nextBtn.className = `page-btn ${appState.logsTablePage === totalPages ? 'disabled' : ''}`;
  nextBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
  nextBtn.disabled = appState.logsTablePage === totalPages;
  nextBtn.addEventListener('click', () => {
    appState.logsTablePage++;
    renderLogsTable();
  });
  pagination.appendChild(nextBtn);
}

// ==========================================================================
// VISTA: GESTIÓN DE JUSTIFICACIONES (ADMINISTRADOR)
// ==========================================================================

function renderJustificationsTable() {
  const justifications = AttendanceDB.getJustifications();
  const tbody = document.getElementById('justifications-table-body');
  tbody.innerHTML = '';

  if (justifications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay solicitudes de justificación registradas.</td></tr>`;
    return;
  }

  // Ordenar por pendientes primero
  justifications.sort((a, b) => {
    if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
    if (a.status !== 'Pendiente' && b.status === 'Pendiente') return 1;
    return new Date(b.date) - new Date(a.date);
  });

  justifications.forEach(just => {
    let statusClass = 'justificado'; // default blue
    if (just.status === 'Aprobado') statusClass = 'presente';
    if (just.status === 'Rechazado') statusClass = 'ausente';
    
    let actionsHtml = '';
    if (just.status === 'Pendiente') {
      actionsHtml = `
        <div style="display:flex; gap: 8px;">
          <button class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem; background-color: var(--success);" onclick="resolveJustification('${just.id}', 'Aprobado')">
            <i class="fa-solid fa-check"></i> Aprobar
          </button>
          <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.75rem; background-color: var(--danger); color: white;" onclick="resolveJustification('${just.id}', 'Rechazado')">
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
        </div>
      `;
    } else {
      actionsHtml = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Procesado</span>`;
    }

    tbody.innerHTML += `
      <tr>
        <td><strong>${just.studentName}</strong></td>
        <td>${formatDateES(just.date)}</td>
        <td><span title="${just.reason}">${truncateText(just.reason, 40)}</span></td>
        <td>
          <a href="#" style="color:var(--primary); font-weight:600;" onclick="alert('Descargando archivo: ${just.documentName}')">
            <i class="fa-regular fa-file-pdf"></i> ${just.documentName}
          </a>
        </td>
        <td><span class="status-badge ${statusClass}">${just.status}</span></td>
        <td>${actionsHtml}</td>
      </tr>
    `;
  });
}

function resolveJustification(justId, newStatus) {
  let justifications = AttendanceDB.getJustifications();
  const just = justifications.find(j => j.id === justId);
  
  if (just) {
    just.status = newStatus;
    AttendanceDB.saveJustifications(justifications);

    // Si es APROBADO, debemos buscar el log de asistencia correspondiente a este estudiante en esa fecha
    // y cambiar su estado de 'Ausente' a 'Justificado' automáticamente
    if (newStatus === 'Aprobado') {
      let logs = AttendanceDB.getLogs();
      const studentLog = logs.find(l => l.studentId === just.studentId && l.date === just.date);
      if (studentLog) {
        studentLog.state = 'Justificado';
        AttendanceDB.saveLogs(logs);
        showToast(`Asistencia de ${just.studentName} cambiada a "Justificado"`);
      }
    }
    
    showToast(`Solicitud marcada como ${newStatus}`);
    renderJustificationsTable();
  }
}

// ==========================================================================
// VISTAS DE APRENDICES Y DOCENTES (TABLAS SIMPLES DE GESTIÓN)
// ==========================================================================

function renderStudentsTable() {
  const students = AttendanceDB.getStudents();
  const logs = AttendanceDB.getLogs();
  const tbody = document.getElementById('students-table-body');
  tbody.innerHTML = '';

  students.forEach(st => {
    const studentLogs = logs.filter(l => l.studentId === st.id);
    let attendanceRate = 100;
    if (studentLogs.length > 0) {
      const positiveStateCount = studentLogs.filter(l => ['Presente', 'Tardanza', 'Justificado'].includes(l.state)).length;
      attendanceRate = Math.round((positiveStateCount / studentLogs.length) * 100);
    }

    tbody.innerHTML += `
      <tr>
        <td><img src="${st.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
        <td><strong>${st.name}</strong></td>
        <td>${st.grade}</td>
        <td>
          <div style="display:flex; align-items:center; gap: 8px;">
            <div style="width: 100px; background-color: var(--border-color); height: 8px; border-radius: 4px; overflow:hidden;">
              <div style="width: ${attendanceRate}%; background-color: ${attendanceRate > 90 ? 'var(--success)' : 'var(--warning)'}; height: 100%;"></div>
            </div>
            <strong>${attendanceRate}%</strong>
          </div>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 8px; font-size:0.75rem;" onclick="showStudentHistoryDirect('${st.id}')">Ver Historial</button>
        </td>
      </tr>
    `;
  });
}

function showStudentHistoryDirect(studentId) {
  appState.selectedStudentId = studentId;
  
  // Cambiar selector del simulador visual
  document.getElementById('role-selector-sim').value = 'student';
  appState.currentRole = 'student';
  
  // Simular evento change en selector de roles
  const event = new Event('change');
  document.getElementById('role-selector-sim').dispatchEvent(event);
}

function renderTeachersTable() {
  const teachers = AttendanceDB.getTeachers();
  const tbody = document.getElementById('teachers-table-body');
  tbody.innerHTML = '';

  teachers.forEach(tc => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${tc.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
        <td><strong>${tc.name}</strong></td>
        <td>${tc.subject}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 8px; font-size:0.75rem;" onclick="showTeacherDashboardDirect('${tc.id}')">Ver Panel</button>
        </td>
      </tr>
    `;
  });
}

function showTeacherDashboardDirect(teacherId) {
  appState.selectedTeacherId = teacherId;
  
  // Cambiar selector del simulador visual
  document.getElementById('role-selector-sim').value = 'teacher';
  appState.currentRole = 'teacher';
  
  // Simular evento change en selector de roles
  const event = new Event('change');
  document.getElementById('role-selector-sim').dispatchEvent(event);
}

// ==========================================================================
// VISTA: PANEL DOCENTE
// ==========================================================================

function renderTeacherDashboard() {
  const teacher = AttendanceDB.getTeachers().find(t => t.id === appState.selectedTeacherId);
  document.getElementById('teacher-welcome-title').textContent = `Bienvenido, ${teacher ? teacher.name : 'Docente'}`;
  
  // Listar asignaturas del docente
  const courses = AttendanceDB.getCourses().filter(c => c.teacherId === appState.selectedTeacherId);
  const coursesList = document.getElementById('teacher-courses-list');
  coursesList.innerHTML = '';

  if (courses.length === 0) {
    coursesList.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted);">No tiene materias asignadas.</p>';
  } else {
    courses.forEach(c => {
      coursesList.innerHTML += `
        <div class="alert-item">
          <div>
            <div class="alert-name">${c.name}</div>
            <div class="alert-desc">${c.grade} | ${c.studentIds.length} Estudiantes</div>
          </div>
          <button class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="navigateToTeacherRegister('${c.id}')">
            <i class="fa-solid fa-list-check"></i> Tomar Lista
          </button>
        </div>
      `;
    });
  }
}

function navigateToTeacherRegister(courseId) {
  navigateToView('teacher-register');
  const courseSelect = document.getElementById('teacher-course-select');
  if (courseSelect) {
    courseSelect.value = courseId;
    // Forzar renderizado de la lista
    const event = new Event('change');
    courseSelect.dispatchEvent(event);
  }
}

// Tomar asistencia por curso
let currentTempAttendance = {}; // Guardado temporal en pantalla: { studentId: 'Presente' }

function renderTeacherRegisterForm() {
  const select = document.getElementById('teacher-course-select');
  select.innerHTML = '';
  
  const courses = AttendanceDB.getCourses().filter(c => c.teacherId === appState.selectedTeacherId);
  courses.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.grade} - ${c.name}</option>`;
  });
  
  // Establecer fecha por defecto a "Hoy"
  const dateInput = document.getElementById('teacher-session-date');
  dateInput.value = SIMULATED_TODAY;
  
  // Escuchar cambios
  select.onchange = () => loadStudentsForAttendanceSheet();
  dateInput.onchange = () => loadStudentsForAttendanceSheet();
  
  loadStudentsForAttendanceSheet();
}

function loadStudentsForAttendanceSheet() {
  const courseId = document.getElementById('teacher-course-select').value;
  const sheet = document.getElementById('student-attendance-sheet');
  
  if (!courseId) {
    sheet.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 32px 0;">Seleccione un curso.</p>';
    return;
  }
  
  const course = AttendanceDB.getCourses().find(c => c.id === courseId);
  const students = AttendanceDB.getStudents().filter(s => course.studentIds.includes(s.id));
  
  document.getElementById('teacher-student-count').textContent = `Alumnos: ${students.length}`;
  sheet.innerHTML = '';
  currentTempAttendance = {}; // Reset

  students.forEach(st => {
    currentTempAttendance[st.id] = 'Presente'; // Por defecto presentes
    
    const row = document.createElement('div');
    row.className = 'student-attendance-row';
    row.innerHTML = `
      <div class="student-info">
        <img src="${st.photo}" alt="${st.name}">
        <div class="student-details">
          <h4>${st.name}</h4>
          <p>${st.grade}</p>
        </div>
      </div>
      <div class="attendance-options" data-student-id="${st.id}">
        <button type="button" class="option-btn presente active" onclick="setTempAttendance('${st.id}', 'Presente', this)">Presente</button>
        <button type="button" class="option-btn tardanza" onclick="setTempAttendance('${st.id}', 'Tardanza', this)">Tardanza</button>
        <button type="button" class="option-btn ausente" onclick="setTempAttendance('${st.id}', 'Ausente', this)">Falta</button>
      </div>
    `;
    sheet.appendChild(row);
  });
}

function setTempAttendance(studentId, state, buttonEl) {
  currentTempAttendance[studentId] = state;
  
  // Desactivar botones hermanos
  const container = buttonEl.parentElement;
  container.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
  
  // Activar botón seleccionado
  buttonEl.classList.add('active');
}

function markTeacherAttendance(type) {
  const statusDiv = document.getElementById('teacher-punch-status');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  statusDiv.textContent = `Fichaje de ${type} registrado con éxito a las ${timeStr}`;
  showToast(`Fichaje de ${type} guardado`);
}

// Guardar pase de lista del profesor
document.getElementById('save-attendance-sheet-btn').onclick = () => {
  const courseId = document.getElementById('teacher-course-select').value;
  const sessionDate = document.getElementById('teacher-session-date').value;
  
  if (!courseId || !sessionDate) {
    alert('Campos incompletos');
    return;
  }
  
  const course = AttendanceDB.getCourses().find(c => c.id === courseId);
  const teacher = AttendanceDB.getTeachers().find(t => t.id === appState.selectedTeacherId);
  let logs = AttendanceDB.getLogs();
  
  // Registrar asistencia para cada alumno
  Object.entries(currentTempAttendance).forEach(([studentId, state]) => {
    const student = AttendanceDB.getStudents().find(s => s.id === studentId);
    
    // Si ya existe registro de ese alumno ese dia para esa clase, lo pisamos
    const existingIndex = logs.findIndex(l => l.studentId === studentId && l.date === sessionDate && l.course === course.name);
    
    const newLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      date: sessionDate,
      time: '08:00', // hora default
      studentId: studentId,
      studentName: student.name,
      grade: student.grade,
      course: course.name,
      state: state,
      teacherId: teacher.id,
      teacherName: teacher.name
    };
    
    if (state === 'Tardanza') {
      newLog.timeNote = '08:15'; // simular hora tardanza
    }
    
    if (existingIndex >= 0) {
      logs[existingIndex] = newLog;
    } else {
      logs.push(newLog);
    }
  });
  
  AttendanceDB.saveLogs(logs);
  showToast('Asistencia guardada correctamente.');
  navigateToView('teacher-dashboard');
};


// ==========================================================================
// VISTA: PANEL DEL ESTUDIANTE (CALENDARIO DE ASISTENCIA)
// ==========================================================================

function renderStudentDashboard() {
  const student = AttendanceDB.getStudents().find(s => s.id === appState.selectedStudentId);
  document.getElementById('student-welcome-title').textContent = `Mi Control de Asistencia - ${student ? student.name : 'Estudiante'}`;
  
  // Calcular métricas personales
  const logs = AttendanceDB.getLogs().filter(l => l.studentId === appState.selectedStudentId);
  
  const totalCount = logs.length;
  const absents = logs.filter(l => l.state === 'Ausente').length;
  const lates = logs.filter(l => l.state === 'Tardanza').length;
  const presents = logs.filter(l => ['Presente', 'Justificado'].includes(l.state)).length;

  // Porcentaje asistencia
  const studentPct = totalCount > 0 ? Math.round(((presents + lates) / totalCount) * 100) : 100;
  
  document.getElementById('student-stat-pct').textContent = `${studentPct}%`;
  document.getElementById('student-stat-lates').textContent = lates;
  document.getElementById('student-stat-absences').textContent = absents;

  // Pintar el calendario
  renderStudentCalendar();
}

function renderStudentCalendar() {
  const containerName = document.getElementById('student-calendar-month-name');
  const month = appState.activeStudentMonth.getMonth();
  const year = appState.activeStudentMonth.getFullYear();
  
  containerName.textContent = `${MONTH_NAMES[month]} ${year}`;
  
  // Limpiar celdas anteriores (conservar cabeceras)
  const grid = document.querySelector('.month-grid');
  const headers = grid.querySelectorAll('.day-header');
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));
  
  // Obtener primer dia y cantidad de dias
  const firstDay = new Date(year, month, 1).getDay(); // 0 es Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Ajustar primer dia (Lunes como primer dia)
  let startOffset = firstDay === 0 ? 6 : firstDay - 1;
  
  // Espacios vacios iniciales
  for (let i = 0; i < startOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    grid.appendChild(emptyCell);
  }
  
  const logs = AttendanceDB.getLogs().filter(l => l.studentId === appState.selectedStudentId);
  
  // Crear celdas de dias
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Buscar si hay asistencia este dia
    const dayLogs = logs.filter(l => l.date === cellDateStr);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.textContent = day;
    
    if (dayLogs.length > 0) {
      // Tomamos el estado más restrictivo si hay múltiples clases
      let state = 'Presente';
      if (dayLogs.some(l => l.state === 'Ausente')) state = 'Ausente';
      else if (dayLogs.some(l => l.state === 'Tardanza')) state = 'Tardanza';
      else if (dayLogs.some(l => l.state === 'Justificado')) state = 'Justificado';
      
      dayCell.classList.add(state.toLowerCase());
      
      const indicator = document.createElement('span');
      indicator.className = 'day-status-indicator';
      dayCell.appendChild(indicator);
      
      // Mostrar tooltip simple al pasar el mouse
      dayCell.title = `${state} - ${dayLogs[0].course}`;
    }
    
    grid.appendChild(dayCell);
  }
}

function changeStudentMonth(direction) {
  appState.activeStudentMonth.setMonth(appState.activeStudentMonth.getMonth() + direction);
  renderStudentCalendar();
}


// ==========================================================================
// FORMULARIOS Y ACCIONES CRUD (ADMINISTRADOR)
// ==========================================================================

function populateAdminModalsDropdowns() {
  const students = AttendanceDB.getStudents();
  const studentSelect = document.getElementById('modal-student-select');
  studentSelect.innerHTML = '';
  students.forEach(st => {
    studentSelect.innerHTML += `<option value="${st.id}">${st.name} (${st.grade})</option>`;
  });

  const courses = AttendanceDB.getCourses();
  const courseSelect = document.getElementById('modal-course-select');
  courseSelect.innerHTML = '';
  // Eliminar duplicados de nombres de cursos para la selección del log
  const uniqueCourseNames = [...new Set(courses.map(c => c.name))];
  uniqueCourseNames.forEach(cName => {
    courseSelect.innerHTML += `<option value="${cName}">${cName}</option>`;
  });
}

function setupModals() {
  const modal = document.getElementById('add-log-modal');
  const openBtn = document.getElementById('open-add-log-btn');
  const closeBtn = document.getElementById('close-log-modal');
  const cancelBtn = document.getElementById('cancel-log-modal');
  const stateSelect = document.getElementById('modal-state-select');
  const tardanzaGroup = document.getElementById('modal-tardanza-note-group');
  
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      document.getElementById('log-modal-title').textContent = 'Nuevo Registro de Asistencia';
      document.getElementById('attendance-log-form').reset();
      document.getElementById('edit-log-id').value = '';
      tardanzaGroup.style.display = 'none';
      
      // Valores default para fecha y hora actuales
      const now = new Date();
      document.getElementById('modal-date').value = SIMULATED_TODAY;
      document.getElementById('modal-time').value = '08:00';
      
      modal.classList.add('active');
    });
  }
  
  const closeModal = () => modal.classList.remove('active');
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  // Mostrar campo de tardanza si el estado es Tardanza
  if (stateSelect && tardanzaGroup) {
    stateSelect.addEventListener('change', (e) => {
      if (e.target.value === 'Tardanza') {
        tardanzaGroup.style.display = 'block';
        document.getElementById('modal-time-note').value = '08:15';
      } else {
        tardanzaGroup.style.display = 'none';
      }
    });
  }
}

// Editar Registro
function openEditLogModal(logId) {
  const logs = AttendanceDB.getLogs();
  const log = logs.find(l => l.id === logId);
  if (!log) return;
  
  document.getElementById('log-modal-title').textContent = 'Editar Registro de Asistencia';
  document.getElementById('edit-log-id').value = log.id;
  
  populateAdminModalsDropdowns();
  
  document.getElementById('modal-student-select').value = log.studentId;
  document.getElementById('modal-course-select').value = log.course;
  document.getElementById('modal-date').value = log.date;
  document.getElementById('modal-time').value = log.time;
  document.getElementById('modal-state-select').value = log.state;
  
  const tardanzaGroup = document.getElementById('modal-tardanza-note-group');
  if (log.state === 'Tardanza') {
    tardanzaGroup.style.display = 'block';
    document.getElementById('modal-time-note').value = log.timeNote || '';
  } else {
    tardanzaGroup.style.display = 'none';
  }
  
  document.getElementById('add-log-modal').classList.add('active');
}

// Guardar / Registrar Asistencia (Admin)
function setupForms() {
  // 1. Submit de Formulario de Asistencia (Admin)
  const form = document.getElementById('attendance-log-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('edit-log-id').value;
    const studentId = document.getElementById('modal-student-select').value;
    const courseName = document.getElementById('modal-course-select').value;
    const dateVal = document.getElementById('modal-date').value;
    const timeVal = document.getElementById('modal-time').value;
    const stateVal = document.getElementById('modal-state-select').value;
    const timeNoteVal = document.getElementById('modal-time-note').value;
    
    let logs = AttendanceDB.getLogs();
    const students = AttendanceDB.getStudents();
    const student = students.find(s => s.id === studentId);
    
    // Obtener docente asignado a ese curso para rellenar
    const courses = AttendanceDB.getCourses();
    const courseObj = courses.find(c => c.name === courseName && c.grade === student.grade) || courses.find(c => c.name === courseName);
    
    let teacherName = 'Personal Admin';
    let teacherId = 'doc-admin';
    if (courseObj) {
      const teacherObj = AttendanceDB.getTeachers().find(t => t.id === courseObj.teacherId);
      if (teacherObj) {
        teacherName = teacherObj.name;
        teacherId = teacherObj.id;
      }
    }
    
    const logData = {
      id: editId || 'log-' + Date.now(),
      date: dateVal,
      time: timeVal,
      studentId: studentId,
      studentName: student.name,
      grade: student.grade,
      course: courseName,
      state: stateVal,
      teacherId: teacherId,
      teacherName: teacherName
    };
    
    if (stateVal === 'Tardanza' && timeNoteVal) {
      logData.timeNote = timeNoteVal;
    }
    
    if (editId) {
      // Modificar existente
      const idx = logs.findIndex(l => l.id === editId);
      if (idx >= 0) logs[idx] = logData;
      showToast('Registro actualizado');
    } else {
      // Agregar nuevo
      logs.push(logData);
      showToast('Nuevo registro creado');
    }
    
    AttendanceDB.saveLogs(logs);
    document.getElementById('add-log-modal').classList.remove('active');
    refreshCurrentView();
  };

  // 2. Submit Justificación (Estudiante)
  const justForm = document.getElementById('justification-request-form');
  if (justForm) {
    justForm.onsubmit = (e) => {
      e.preventDefault();
      
      const dateVal = document.getElementById('just-date').value;
      const reasonVal = document.getElementById('just-reason').value;
      const fileInput = document.getElementById('just-file');
      
      const student = AttendanceDB.getStudents().find(s => s.id === appState.selectedStudentId);
      let justifications = AttendanceDB.getJustifications();
      
      const newJust = {
        id: 'just-' + Date.now(),
        studentId: appState.selectedStudentId,
        studentName: student ? student.name : 'Estudiante',
        date: dateVal,
        reason: reasonVal,
        documentName: fileInput.files[0] ? fileInput.files[0].name : 'certificado_solicitud.pdf',
        status: 'Pendiente'
      };
      
      justifications.push(newJust);
      AttendanceDB.saveJustifications(justifications);
      
      showToast('Solicitud enviada con éxito');
      justForm.reset();
      
      // Si ya hay una inasistencia registrada de ese dia, podemos avisar
      renderStudentDashboard();
    };
  }
}

// Eliminar Registro
function deleteLog(logId) {
  if (confirm('¿Está seguro de que desea eliminar este registro de asistencia?')) {
    let logs = AttendanceDB.getLogs();
    logs = logs.filter(l => l.id !== logId);
    AttendanceDB.saveLogs(logs);
    showToast('Registro eliminado');
    refreshCurrentView();
  }
}


// ==========================================================================
// UTILERÍAS Y COMPONENTES VISUALES
// ==========================================================================

function showToast(message) {
  // Eliminar toasts viejos
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background-color: var(--primary-dark);
    color: white;
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    font-size: 0.9rem;
    font-weight: 500;
    pointer-events: none;
    transform: translateY(10px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--success); margin-right:8px;"></i> ${message}`;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);
  
  // Fade out y remover
  setTimeout(() => {
    toast.style.transform = 'translateY(10px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Formatear Fecha AAAA-MM-DD -> DD/MM/AAAA
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

// Formatear Fecha AAAA-MM-DD -> DD de Mes del AAAA
function formatDateES(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = dateObj.getDate();
  const month = MONTH_NAMES[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day} ${month.substr(0, 3)} ${year}`;
}

function truncateText(text, length) {
  if (text.length <= length) return text;
  return text.substr(0, length) + '...';
}

// ==========================================================================
// VISTA: GENERADOR Y GESTOR DE CREDENCIALES (ADMINISTRADOR)
// ==========================================================================

let cardGeneratorInitialized = false;

function renderCardsView() {
  const students = AttendanceDB.getStudents();
  const cards = AttendanceDB.getCards();
  
  // 1. Llenar el selector de estudiantes
  const studentSelect = document.getElementById('card-student-select');
  if (studentSelect) {
    studentSelect.innerHTML = '';
    students.forEach(st => {
      studentSelect.innerHTML += `<option value="${st.id}">${st.name} (${st.grade})</option>`;
    });
  }

  // 2. Renderizar la tabla de tarjetas emitidas
  const tbody = document.getElementById('cards-table-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (cards.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay credenciales emitidas.</td></tr>`;
    } else {
      cards.forEach(card => {
        const student = students.find(s => s.id === card.studentId);
        if (!student) return;
        
        const statusBadge = card.estado 
          ? `<span class="status-badge presente">Activa</span>` 
          : `<span class="status-badge ausente">Bloqueada</span>`;
          
        tbody.innerHTML += `
          <tr>
            <td>
              <div class="student-cell">
                <img src="${student.photo}" alt="${student.name}">
                <span><strong>${student.name}</strong><br><small style="color:var(--text-muted);">${student.grade}</small></span>
              </div>
            </td>
            <td><code>${card.codigo_barra}</code></td>
            <td><span class="status-badge justificado">${card.type}</span></td>
            <td>${statusBadge}</td>
            <td>
              <div class="actions-cell">
                <button class="action-btn" title="Ver Vista Previa" onclick="previewCard('${card.studentId}', '${card.codigo_barra}', '${card.type}')"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn" title="${card.estado ? 'Bloquear' : 'Activar'}" onclick="toggleCardStatus('${card.id}')">${card.estado ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>'}</button>
                <button class="action-btn delete" title="Eliminar" onclick="deleteCard('${card.id}')"><i class="fa-regular fa-trash-can"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
    }
  }

  // 3. Inicializar manejadores del formulario una sola vez
  if (!cardGeneratorInitialized) {
    const form = document.getElementById('card-generator-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        saveGeneratedCard();
      };
    }

    const autogenBtn = document.getElementById('btn-autogen-card');
    if (autogenBtn) {
      autogenBtn.onclick = () => autoGenerateCardCode();
    }

    const printBtn = document.getElementById('btn-print-card');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    // Al cambiar de estudiante en el selector, autocompletar si ya tiene tarjeta o auto-generar
    if (studentSelect) {
      studentSelect.addEventListener('change', (e) => {
        onCardStudentChange(e.target.value);
      });
    }

    cardGeneratorInitialized = true;
  }

  // 4. Cargar tarjeta por defecto (primer estudiante de la lista)
  if (students.length > 0) {
    const defaultStudentId = studentSelect ? studentSelect.value : students[0].id;
    onCardStudentChange(defaultStudentId);
  }
}

function onCardStudentChange(studentId) {
  const cards = AttendanceDB.getCards();
  const existingCard = cards.find(c => c.studentId === studentId);
  const codeInput = document.getElementById('card-code-input');
  const typeSelect = document.getElementById('card-code-type');
  
  if (existingCard) {
    if (codeInput) codeInput.value = existingCard.codigo_barra;
    if (typeSelect) typeSelect.value = existingCard.type;
    previewCard(studentId, existingCard.codigo_barra, existingCard.type);
  } else {
    // Si no tiene tarjeta, autogenerar un código sugerido y previsualizar
    const tempCode = generateNextCardCode();
    if (codeInput) codeInput.value = tempCode;
    if (typeSelect) typeSelect.value = 'QR';
    previewCard(studentId, tempCode, 'QR');
  }
}

function autoGenerateCardCode() {
  const codeInput = document.getElementById('card-code-input');
  if (codeInput) {
    codeInput.value = generateNextCardCode();
    // Forzar actualización de vista previa
    const studentId = document.getElementById('card-student-select').value;
    const type = document.getElementById('card-code-type').value;
    previewCard(studentId, codeInput.value, type);
  }
}

function generateNextCardCode() {
  const cards = AttendanceDB.getCards();
  if (cards.length === 0) return 'CAL-2026-0001';
  
  // Extraer números secuenciales
  const numbers = cards.map(c => {
    const parts = c.codigo_barra.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2]);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  });
  
  const maxNum = Math.max(...numbers, 0);
  return `CAL-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

function previewCard(studentId, code, type) {
  const student = AttendanceDB.getStudents().find(s => s.id === studentId);
  if (!student) return;

  // Actualizar textos de la credencial
  document.getElementById('id-card-avatar').src = student.photo;
  document.getElementById('id-card-name').textContent = student.name;
  document.getElementById('id-card-grade').textContent = student.grade;
  document.getElementById('id-card-code-text').textContent = code;

  // Limpiar gráficos anteriores
  const qrContainer = document.getElementById('id-card-qr-graphic');
  const barcodeSvg = document.getElementById('id-card-barcode-graphic');
  
  qrContainer.innerHTML = '';
  barcodeSvg.innerHTML = '';
  barcodeSvg.removeAttribute('style'); // reset layout parameters

  if (type === 'QR') {
    qrContainer.style.display = 'block';
    barcodeSvg.style.display = 'none';
    
    // Generar Código QR mediante la librería QRCode.js
    new QRCode(qrContainer, {
      text: code,
      width: 80,
      height: 80,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrContainer.style.display = 'none';
    barcodeSvg.style.display = 'block';
    
    // Generar Código de Barras mediante la librería JsBarcode
    try {
      JsBarcode(barcodeSvg, code, {
        format: "CODE128",
        width: 1.5,
        height: 45,
        displayValue: true,
        fontSize: 10,
        margin: 0,
        lineColor: '#0f172a'
      });
    } catch (err) {
      console.error("Error al generar código de barras:", err);
      barcodeSvg.innerHTML = '<text y="20" x="10" fill="red">Código no válido</text>';
    }
  }
}

function saveGeneratedCard() {
  const studentId = document.getElementById('card-student-select').value;
  const type = document.getElementById('card-code-type').value;
  const code = document.getElementById('card-code-input').value.trim();
  
  if (!code) {
    alert('Ingrese un código de tarjeta válido');
    return;
  }

  let cards = AttendanceDB.getCards();
  const existingIdx = cards.findIndex(c => c.studentId === studentId);
  
  const cardData = {
    id: existingIdx >= 0 ? cards[existingIdx].id : 'card-' + Date.now(),
    studentId: studentId,
    codigo_barra: code,
    type: type,
    date: SIMULATED_TODAY,
    estado: existingIdx >= 0 ? cards[existingIdx].estado : true
  };

  // Validar si el código ya existe en otro estudiante
  const duplicate = cards.find(c => c.codigo_barra === code && c.studentId !== studentId);
  if (duplicate) {
    alert(`El código ${code} ya está asignado a otro estudiante.`);
    return;
  }

  if (existingIdx >= 0) {
    cards[existingIdx] = cardData;
    showToast('Credencial actualizada con éxito');
  } else {
    cards.push(cardData);
    showToast('Credencial emitida con éxito');
  }

  AttendanceDB.saveCards(cards);
  renderCardsView();
}

function toggleCardStatus(cardId) {
  let cards = AttendanceDB.getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.estado = !card.estado;
    AttendanceDB.saveCards(cards);
    showToast(`Credencial ${card.estado ? 'Activada' : 'Bloqueada'}`);
    renderCardsView();
  }
}

function deleteCard(cardId) {
  if (confirm('¿Está seguro de que desea eliminar esta credencial?')) {
    let cards = AttendanceDB.getCards();
    cards = cards.filter(c => c.id !== cardId);
    AttendanceDB.saveCards(cards);
    showToast('Credencial eliminada');
    renderCardsView();
  }
}

// Exponer funciones al contexto global para uso en HTML inline/dinámico
window.markTeacherAttendance = markTeacherAttendance;
window.resolveJustification = resolveJustification;
window.showStudentHistoryDirect = showStudentHistoryDirect;
window.showTeacherDashboardDirect = showTeacherDashboardDirect;
window.navigateToTeacherRegister = navigateToTeacherRegister;
window.changeStudentMonth = changeStudentMonth;
window.openEditLogModal = openEditLogModal;
window.deleteLog = deleteLog;
window.previewCard = previewCard;
window.toggleCardStatus = toggleCardStatus;
window.deleteCard = deleteCard;

// ==========================================================================
// FLUJO DE INICIO DE SESIÓN Y SESIÓN ACTIVA (LOGIN FLOW)
// ==========================================================================

function showLoginForm() {
  document.getElementById('login-container').classList.remove('hidden');
  document.getElementById('app-container').classList.add('hidden');
}

function setupLoginFlow() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      await performLogin(email, password);
    };
  }

  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('sessionUser');
      location.reload();
    });
  }
}

async function performLogin(email, password) {
  const errorBox = document.getElementById('login-error-box');
  if (errorBox) errorBox.classList.remove('active');

  const loginBtn = document.querySelector('.login-btn');
  const originalHtml = loginBtn.innerHTML;
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verificando...</span>';

  try {
    const user = await AttendanceDB.authenticate(email, password);
    if (user) {
      sessionStorage.setItem('sessionUser', JSON.stringify(user));
      applySessionUser(user);
    } else {
      if (errorBox) {
        errorBox.classList.remove('active');
        void errorBox.offsetWidth; // trigger reflow
        errorBox.classList.add('active');
      }
    }
  } catch (e) {
    console.error("Error al iniciar sesión:", e);
    if (errorBox) {
      document.getElementById('login-error-msg').textContent = 'Error de conexión con la base de datos.';
      errorBox.classList.add('active');
    }
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = originalHtml;
  }
}

function applySessionUser(user) {
  document.getElementById('login-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');

  appState.currentRole = user.role_name;
  
  if (user.role_name === 'teacher') {
    appState.selectedTeacherId = user.id;
  } else if (user.role_name === 'student') {
    appState.selectedStudentId = user.id;
  }

  const rolePicker = document.querySelector('.role-picker-container');
  if (rolePicker) {
    rolePicker.style.display = 'none';
  }

  const profileImg = document.getElementById('user-profile-img');
  const profileName = document.getElementById('user-profile-name');
  const profileRole = document.getElementById('user-profile-role');

  if (profileName) profileName.textContent = `${user.nombres} ${user.apellidos}`;
  
  if (user.role_name === 'admin') {
    if (profileImg) profileImg.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
    if (profileRole) profileRole.textContent = 'Administrador';
    
    updateSidebarForRole('admin');
    navigateToView('admin-dashboard');
  } else if (user.role_name === 'teacher') {
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombres + '+' + user.apellidos)}&background=6b46c1&color=fff`;
    if (profileRole) profileRole.textContent = 'Docente';
    
    updateSidebarForRole('teacher');
    navigateToView('teacher-dashboard');
  } else if (user.role_name === 'student') {
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombres + '+' + user.apellidos)}&background=3b82f6&color=fff`;
    
    const studentObj = AttendanceDB.getStudents().find(s => s.id === user.id);
    const gradeText = studentObj ? studentObj.grade : 'Estudiante';
    if (profileRole) profileRole.textContent = `Estudiante - ${gradeText}`;
    
    updateSidebarForRole('student');
    navigateToView('student-dashboard');
  }

  if (window.showToast) {
    showToast(`¡Bienvenido, ${user.nombres}!`);
  }
}

function updateSidebarForRole(role) {
  const menuItems = document.querySelectorAll('#sidebar-menu-items .menu-item');
  menuItems.forEach(item => {
    const itemRole = item.getAttribute('data-role');
    if (!itemRole) return;
    
    if (itemRole === role) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

window.quickLogin = async (email, password) => {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  await performLogin(email, password);
};
