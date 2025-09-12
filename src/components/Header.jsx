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
    <header className="bg-white border-b p-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="font-semibold text-codelco-dark">Codelco - Metas</Link>
        {user && (['control-interno','auditor'].includes(user.rol)) && (
          <Link to="/auditoria" className="text-sm text-gray-600">Auditoría</Link>
        )}
        <Link to="/progreso" className="text-sm text-gray-600">Progreso</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-700">{user.usuario} <span className="text-xs text-gray-400">{user.rol}</span></div>
            <button onClick={logout} className="btn-small">Salir</button>
          </div>
        ) : (
          <Link to="/login" className="btn-small">Iniciar</Link>
        )}
      </div>
    </header>
  );
}

export default Header;
