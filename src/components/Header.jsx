import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const nav = useNavigate();
  const cu = localStorage.getItem('currentUser');
  const user = cu ? JSON.parse(cu) : null;

  const navItems = useMemo(() => ([
    { to: '/dashboard', label: 'Dashboard', roles: ['any'] },
    { to: '/progreso', label: 'Progreso', roles: ['analista-sustentabilidad', 'lider-sustentabilidad', 'control-interno', 'equipo-datos', 'admin'] },
    { to: '/auditoria', label: 'Auditoría', roles: ['auditor', 'control-interno', 'admin'] },
    { to: '/cadena-registros', label: 'Cadena de registros', roles: ['auditor', 'control-interno', 'admin'] },
    { to: '/verificacion', label: 'Verificación', roles: ['auditor', 'control-interno', 'admin'] },
    { to: '/operario/activos', label: 'Activos (Tiempo Real)', roles: ['operario', 'fundicion_turno', 'admin'] },
    { to: '/alertas', label: 'Alertas', roles: ['jefe-operaciones', 'admin'] },
    { to: '/exportar-reportes', label: 'Exportar reportes', roles: ['analista-sustentabilidad', 'lider-sustentabilidad', 'control-interno', 'equipo-datos', 'admin'] },
    { to: '/ia-prediccion', label: 'IA Desvíos', roles: ['analista-sustentabilidad', 'lider-sustentabilidad', 'control-interno', 'equipo-datos', 'admin'] },
    { to: '/escenarios-mitigacion', label: 'Escenarios', roles: ['analista-sustentabilidad', 'lider-sustentabilidad', 'control-interno', 'admin'] },
    { to: '/sensores', label: 'Sensores', roles: ['operario', 'equipo-datos', 'control-interno', 'admin'] },
    { to: '/anomalias', label: 'Anomalías', roles: ['equipo-datos', 'control-interno', 'admin'] },
    { to: '/comunidades', label: 'Portal Ciudadano', roles: ['any', 'public'] },
    { to: '/comunidades/glosario', label: 'Glosario Ciudadano', roles: ['any', 'public'] }
  ]), []);

  const visibleNavItems = useMemo(() => {
    if (!user) {
      return navItems.filter(item => item.roles.includes('public'));
    }
    return navItems.filter(item => item.roles.includes('any') || item.roles.includes(user.rol));
  }, [navItems, user]);

  // no local theme handling here anymore; theme is not managed globally
  useEffect(() => { }, []);

  const logout = () => {
    localStorage.removeItem('currentUser');
    nav('/login');
  };

  return (
    <header className="bg-codelco-primary text-white p-3 flex items-center justify-between shadow">
      <div className="flex items-center space-x-4">
        <Link to={user ? '/dashboard' : '/comunidades'} className="font-semibold text-white">Codelco - Metas</Link>
        {visibleNavItems.map(item => (
          <Link key={item.to} to={item.to} className="text-sm text-white/90 hover:text-white transition-colors">
            {item.label}
          </Link>
        ))}
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
