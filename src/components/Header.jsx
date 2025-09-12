import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const nav = useNavigate();
  const cu = localStorage.getItem('currentUser');
  const user = cu ? JSON.parse(cu) : null;

  const logout = () => {
    localStorage.removeItem('currentUser');
    nav('/login');
  };

  return (
    <header className="bg-codelco-primary text-white p-3 flex items-center justify-between shadow">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="font-semibold text-white">Codelco - Metas</Link>
        {user && (['control-interno','auditor'].includes(user.rol)) && (
          <Link to="/auditoria" className="text-sm text-white/90 hover:text-white">Auditoría</Link>
        )}
        <Link to="/progreso" className="text-sm text-white/90 hover:text-white">Progreso</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center space-x-3">
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
