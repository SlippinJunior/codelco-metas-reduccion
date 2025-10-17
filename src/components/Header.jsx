import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const nav = useNavigate();
  const cu = localStorage.getItem('currentUser');
  const user = cu ? JSON.parse(cu) : null;

  // theme handling
  const applyTheme = (t) => {
    try { document.documentElement.classList.toggle('dark', t === 'dark'); } catch (e) {}
  };
  const setTheme = (t) => { localStorage.theme = t; applyTheme(t); };
  // ensure initial theme
  useEffect(() => { applyTheme(localStorage.theme || 'light'); }, []);

  const logout = () => {
    localStorage.removeItem('currentUser');
    nav('/login');
  };

  return (
    <header className="bg-codelco-primary text-white p-3 flex items-center justify-between shadow">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="font-semibold text-white">Codelco - Metas</Link>
        {user && (['control-interno','auditor'].includes(user.rol)) && (
          <>
            <Link to="/auditoria" className="text-sm text-white/90 hover:text-white">Auditoría</Link>
            <Link to="/cadena-registros" className="text-sm text-white/90 hover:text-white">
              Cadena de registros
            </Link>
            <Link to="/verificacion" className="text-sm text-white/90 hover:text-white">
              Verificación
            </Link>
          </>
        )}
        {user && (['operario','fundicion_turno'].includes(user.rol)) && (
          <Link to="/operario/activos" className="text-sm text-white/90 hover:text-white">Activos (Tiempo Real)</Link>
        )}
        {/* Pestaña exclusiva para Jefe de Operaciones */}
        {user && user.rol === 'jefe-operaciones' && (
          <Link to="/alertas" className="text-sm text-white/90 hover:text-white">Alertas</Link>
        )}
        <Link to="/progreso" className="text-sm text-white/90 hover:text-white">Progreso</Link>
        <Link to="/exportar-reportes" className="text-sm text-white/90 hover:text-white">Exportar reportes</Link>
        <Link to="/sensores" className="text-sm text-white/90 hover:text-white">Sensores</Link>
        <Link to="/anomalias" className="text-sm text-white/90 hover:text-white">Anomalías</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center space-x-3">
            <button
              className="rounded-lg border px-3 py-1 text-sm mr-2 bg-white/10 text-white"
              onClick={() => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')}
              title="Alternar modo oscuro"
            >
              🌙/☀️
            </button>
            <div className="text-sm text-white">{user.usuario} <span className="text-xs text-white/80">{user.rol}</span></div>
            <button onClick={logout} className="bg-white/10 text-white px-3 py-1 rounded-md hover:bg-white/20">Salir</button>
          </div>
        ) : (
          <Link to="/login" className="bg-white/10 text-white px-3 py-1 rounded-md hover:bg-white/20">Iniciar</Link>
        )}
      </div>
    </header>
  );
}

export default Header;
