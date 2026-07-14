'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isActive }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleItemClick = (e: React.MouseEvent, view: string) => {
    e.preventDefault();
    onViewChange(view);
  };

  const getProfilePhoto = () => {
    if (user.role_name === 'admin') {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombres + '+' + user.apellidos)}&background=${user.role_name === 'teacher' ? '6b46c1' : '3b82f6'}&color=fff`;
  };

  const getRoleLabel = () => {
    if (user.role_name === 'admin') return 'Administrador';
    if (user.role_name === 'teacher') return 'Docente';
    return 'Estudiante';
  };

  return (
    <aside className={`sidebar ${isActive ? 'active' : ''}`} id="app-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <i className="fa-solid fa-graduation-cap"></i>
        </div>
        <div className="logo-text">
          S.C.A.
          <span>Colegio Calasanz</span>
        </div>
      </div>
      
      <ul className="sidebar-menu" id="sidebar-menu-items">
        {/* ROL: ADMINISTRATIVO */}
        {user.role_name === 'admin' && (
          <>
            <li className={`menu-item ${currentView === 'admin-dashboard' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-dashboard')}>
                <i className="fa-solid fa-chart-line"></i>
                <span>Inicio (Dashboard)</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-scan-station' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-scan-station')}>
                <i className="fa-solid fa-qrcode"></i>
                <span>Estación de Escaneo</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-logs' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-logs')}>
                <i className="fa-solid fa-calendar-days"></i>
                <span>Asistencia Diaria</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-classroom-attendance' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-classroom-attendance')}>
                <i className="fa-solid fa-chalkboard"></i>
                <span>Asistencia por Salón</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-staff-logs' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-staff-logs')}>
                <i className="fa-solid fa-user-tie"></i>
                <span>Asistencia de Personal</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-justifications' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-justifications')}>
                <i className="fa-solid fa-file-signature"></i>
                <span>Justificaciones</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-announcements' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-announcements')}>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Comunicados</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-calendar' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-calendar')}>
                <i className="fa-solid fa-calendar-day"></i>
                <span>Calendario Escolar</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-schedule' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-schedule')}>
                <i className="fa-solid fa-table-cells"></i>
                <span>Horario Escolar</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-students' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-students')}>
                <i className="fa-solid fa-users"></i>
                <span>Estudiantes</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-teachers' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-teachers')}>
                <i className="fa-solid fa-chalkboard-user"></i>
                <span>Docentes</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'admin-cards' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'admin-cards')}>
                <i className="fa-solid fa-address-card"></i>
                <span>Tarjetas ID</span>
              </a>
            </li>
          </>
        )}
        
        {/* ROL: DOCENTE */}
        {user.role_name === 'teacher' && (
          <>
            <li className={`menu-item ${currentView === 'teacher-dashboard' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'teacher-dashboard')}>
                <i className="fa-solid fa-clipboard-user"></i>
                <span>Panel Docente</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'teacher-register' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'teacher-register')}>
                <i className="fa-solid fa-user-check"></i>
                <span>Tomar Asistencia</span>
              </a>
            </li>
            <li className={`menu-item ${currentView === 'teacher-schedule' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => handleItemClick(e, 'teacher-schedule')}>
                <i className="fa-solid fa-table-cells"></i>
                <span>Horario Escolar</span>
              </a>
            </li>
          </>
        )}
        
        {/* ROL: ESTUDIANTE */}
        {user.role_name === 'student' && (
          <li className={`menu-item ${currentView === 'student-dashboard' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => handleItemClick(e, 'student-dashboard')}>
              <i className="fa-solid fa-user-clock"></i>
              <span>Mi Asistencia</span>
            </a>
          </li>
        )}

        {/* CERRAR SESIÓN */}
        <li className="menu-item logout-menu-item" id="sidebar-logout-btn">
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Cerrar Sesión</span>
          </a>
        </li>
      </ul>
      
      <div className="sidebar-footer">
        <div className="user-quick-profile">
          <img id="user-profile-img" src={getProfilePhoto()} alt="Avatar Usuario" />
          <div className="profile-info">
            <h4 id="user-profile-name">{`${user.nombres} ${user.apellidos}`}</h4>
            <p id="user-profile-role">{getRoleLabel()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
