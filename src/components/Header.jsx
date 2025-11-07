import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const nav = useNavigate();
  const cu = localStorage.getItem('currentUser');
  const user = cu ? JSON.parse(cu) : null;

  // no local theme handling here anymore; theme is not managed globally
  useEffect(() => {}, []);

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
            <Link to="/auditoria" className="text-sm text-white/90 hover:text-white">Auditoria</Link>
            <Link to="/cadena-registros" className="text-sm text-white/90 hover:text-white">
              Cadena de registros
            </Link>
            <Link to="/verificacion" className="text-sm text-white/90 hover:text-white">
              Verificacion
            </Link>
          </>
        )}
        {user && (['operario','fundicion_turno'].includes(user.rol)) && (
          <Link to="/operario/activos" className="text-sm text-white/90 hover:text-white">Activos (Tiempo Real)</Link>
        )}
        {/* Pestana exclusiva para Jefe de Operaciones */}
        {user && user.rol === 'jefe-operaciones' && (
          <Link to="/alertas" className="text-sm text-white/90 hover:text-white">Alertas</Link>
        )}
        <Link to="/progreso" className="text-sm text-white/90 hover:text-white">Progreso</Link>
        <Link to="/comunidades" className="text-sm text-white/90 hover:text-white">Portal Ciudadano</Link>
        <Link to="/ia-prediccion" className="text-sm text-white/90 hover:text-white">IA Desvios</Link>
        <Link to="/escenarios-mitigacion" className="text-sm text-white/90 hover:text-white">Escenarios</Link>
        <Link to="/exportar-reportes" className="text-sm text-white/90 hover:text-white">Exportar reportes</Link>
        <Link to="/sensores" className="text-sm text-white/90 hover:text-white">Sensores</Link>
        <Link to="/anomalias" className="text-sm text-white/90 hover:text-white">Anomalias</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center space-x-3">
            {/* Theme toggle is shown only in Activos (Tiempo Real) view via ThemeToggle component */}
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
