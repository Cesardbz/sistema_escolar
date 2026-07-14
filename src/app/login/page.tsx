'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Si ya está logueado, ir al dashboard directamente
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem('kiosk_mode_auto_lock');
    setErrorMsg('');
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        router.replace('/dashboard');
      } else {
        setErrorMsg('Correo o contraseña incorrectos.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Error de conexión con la base de datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMsg('');
    setSubmitting(true);

    try {
      const loggedUser = await login(quickEmail, quickPass);
      if (loggedUser) {
        router.replace('/dashboard');
      } else {
        setErrorMsg('Correo o contraseña incorrectos.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Error de conexión con la base de datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h2>Sistema de Asistencia</h2>
          <p>Colegio San José de Calasanz</p>
        </div>

        {errorMsg && (
          <div className="login-error-box active" id="login-error-box">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span id="login-error-msg">{errorMsg}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="ejemplo@colegio.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
              </>
            )}
          </button>
        </form>

        <div className="quick-login-section">
          <div className="quick-login-title">Accesos de Prueba</div>
          <div className="quick-login-grid">
            <button
              className="quick-login-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem('kiosk_mode_auto_lock');
                handleQuickLogin('admin@colegio.edu.pe', 'admin');
              }}
              disabled={submitting}
            >
              <i className="fa-solid fa-user-shield"></i>
              <span>Admin</span>
            </button>
            <button
              className="quick-login-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem('kiosk_mode_auto_lock');
                handleQuickLogin('ana.gomez@colegio.edu.pe', 'password123');
              }}
              disabled={submitting}
            >
              <i className="fa-solid fa-chalkboard-user"></i>
              <span>Docente</span>
            </button>
            <button
              className="quick-login-btn"
              type="button"
              onClick={() => {
                localStorage.setItem('kiosk_mode_auto_lock', 'true');
                handleQuickLogin('admin@colegio.edu.pe', 'admin');
              }}
              disabled={submitting}
            >
              <i className="fa-solid fa-qrcode"></i>
              <span>Escáner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
