'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const { user, resetDatabase, justifications } = useAuth();

  const handleReset = async () => {
    try {
      await resetDatabase();
      alert("Base de datos de Supabase restaurada con éxito.");
    } catch (e) {
      console.error(e);
      alert("Error al restaurar la base de datos.");
    }
  };

  const pendingJustsCount = justifications.filter(j => j.status === 'Pendiente').length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle-btn" id="menu-toggle" onClick={onMenuToggle}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <div className="system-title" id="system-top-title">
          Colegio San José de Calasanz
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-actions">
          {user?.role_name === 'admin' && (
            <>
              {/* Botón de Reset de Simulador para Desarrollo */}
              <button 
                className="icon-badge-btn" 
                title="Reiniciar Datos del Simulador"
                onClick={handleReset}
              >
                <i className="fa-solid fa-rotate"></i>
              </button>

              {/* Botón de Notificaciones (Justificaciones Pendientes) */}
              <button className="icon-badge-btn" title="Justificaciones Pendientes">
                <i className="fa-solid fa-bell"></i>
                {pendingJustsCount > 0 && <span className="badge" id="notif-badge"></span>}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
