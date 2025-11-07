import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Usuarios predefinidos basados en las historias de usuario del README
const USUARIOS_DEMO = [
  {
    usuario: 'maria.torres',
    nombre: 'María Torres',
    rol: 'analista-sustentabilidad',
    descripcion: 'Analista de Sustentabilidad - HU-R01 (Gestión de metas)'
  },
  {
    usuario: 'carlos.rojas',
    nombre: 'Carlos Rojas',
    rol: 'lider-sustentabilidad',
    descripcion: 'Líder de Sustentabilidad - HU-R02 (Análisis de progreso)'
  },
  {
    usuario: 'ana.silva',
    nombre: 'Ana Silva',
    rol: 'auditor',
    descripcion: 'Auditor - HU-R07 (Auditar eventos críticos)'
  },
  {
    usuario: 'pedro.gomez',
    nombre: 'Pedro Gómez',
    rol: 'operario',
    descripcion: 'Operario de Planta - HU-R10 (Monitoreo tiempo real)'
  },
  {
    usuario: 'lucia.mendez',
    nombre: 'Lucía Méndez',
    rol: 'control-interno',
    descripcion: 'Control Interno - HU-R14 (Gestión transparencia comunidades)'
  },
  {
    usuario: 'jorge.campos',
    nombre: 'Jorge Campos',
    rol: 'equipo-datos',
    descripcion: 'Equipo de Datos - HU-R05/R06 (Detección y validación anomalías)'
  },
  {
    usuario: 'admin',
    nombre: 'Administrador',
    rol: 'admin',
    descripcion: 'Administrador - Acceso total al sistema'
  }
];

const HERO_HIGHLIGHTS = [
  {
    title: 'Metas con impacto',
    description: 'Planificación corporativa y métricas centralizadas para visibilizar el avance climático.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: 'Operación inteligente',
    description: 'Alertas en tiempo real, sensores conectados y detección temprana de desviaciones.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l3-1.5L15 20l-.75-3M9.75 6h4.5M4.5 6h15M4.5 6A2.25 2.25 0 017.5 3.75h9A2.25 2.25 0 0118.75 6m0 0v10.5A2.25 2.25 0 0116.5 18.75h-9A2.25 2.25 0 015.25 16.5V6" />
      </svg>
    )
  },
  {
    title: 'Transparencia total',
    description: 'Auditoría trazable, cadena de registros y portal ciudadano para fortalecer la confianza.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

function Login() {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(USUARIOS_DEMO[0].usuario);
  const [mounted, setMounted] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(timer);
  }, []);

  const usuarioActual = useMemo(
    () => USUARIOS_DEMO.find(u => u.usuario === usuarioSeleccionado) || USUARIOS_DEMO[0],
    [usuarioSeleccionado]
  );

  const submit = (e) => {
    e.preventDefault();
    localStorage.setItem('currentUser', JSON.stringify({
      usuario: usuarioActual.usuario,
      nombre: usuarioActual.nombre,
      rol: usuarioActual.rol
    }));
    nav('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-codelco-primary/10 via-white to-codelco-light overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-codelco-primary/20 blur-3xl animate-pulse" aria-hidden />
        <div className="absolute bottom-[-120px] left-[-40px] h-80 w-80 rounded-full bg-codelco-accent/15 blur-3xl" aria-hidden />
        <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" aria-hidden />
      </div>

      <div
        className={`relative z-10 w-full max-w-5xl transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="grid gap-8 lg:grid-cols-[0.85fr,1fr] items-stretch">
          <aside className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-codelco-primary to-codelco-primary/80 text-white p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.2em]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden />
                <span>Experiencia demo</span>
              </div>
              <h1 className="text-3xl font-semibold leading-tight">
                Inicia sesión como los roles clave y recorre todo el ecosistema de sostenibilidad.
              </h1>
              <p className="text-white/80 text-base leading-relaxed">
                Cada usuario refleja una historia real del prototipo. Selecciona un perfil para descubrir cómo cambian las vistas, permisos y reportes disponibles.
              </p>
            </div>
            <ul className="space-y-5 mt-6">
              {HERO_HIGHLIGHTS.map(highlight => (
                <li key={highlight.title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-white shadow-inner">
                    {highlight.icon}
                  </span>
                  <div>
                    <p className="font-medium text-white text-lg">{highlight.title}</p>
                    <p className="text-white/75 text-sm leading-relaxed">{highlight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <form
            onSubmit={submit}
            className="card relative overflow-hidden w-full rounded-3xl border border-white/40 bg-white shadow-xl backdrop-blur-lg lg:p-9 p-7"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/95 to-codelco-light/85" aria-hidden />
            <div className="relative space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-codelco-secondary/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-codelco-accent" aria-hidden />
                  Demo guiada
                </span>
                <h2 className="text-3xl font-semibold text-codelco-dark">Iniciar Sesión</h2>
                <p className="text-sm text-codelco-secondary">
                  Accede como un perfil preconfigurado y explora los flujos completos según su rol.
                </p>
              </div>

              <label className="form-label text-codelco-secondary">Seleccionar Usuario</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-codelco-secondary/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A3 3 0 017.757 17h8.486a3 3 0 012.636 0.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <select
                  value={usuarioSeleccionado}
                  onChange={e => setUsuarioSeleccionado(e.target.value)}
                  className="input pl-12 pr-4 py-3 text-base shadow-inner focus:ring-2 focus:ring-codelco-primary/60 focus:border-codelco-primary transition-all duration-300"
                >
                  {USUARIOS_DEMO.map(u => (
                    <option key={u.usuario} value={u.usuario}>
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-codelco-primary/15 bg-codelco-primary/5 p-5 shadow-sm transition-all duration-300 hover:border-codelco-primary/30">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-codelco-secondary/70">
                  <span>Rol activo</span>
                  <span className="inline-flex items-center gap-2 text-codelco-primary">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                    {usuarioActual.rol.replace(/-/g, ' ')}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-codelco-dark/80">
                  {usuarioActual.descripcion}
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <p className="text-xs uppercase tracking-[0.35em] text-codelco-secondary/70">Sesión disponible</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-codelco-secondary">
                    <span className="mt-1 h-2 w-2 rounded-full bg-codelco-accent" aria-hidden />
                    Experiencia personalizada según permisos y flujos críticos.
                  </li>
                  <li className="flex items-start gap-3 text-codelco-secondary">
                    <span className="mt-1 h-2 w-2 rounded-full bg-codelco-accent" aria-hidden />
                    Persistent login simulado mediante almacenamiento local.
                  </li>
                  <li className="flex items-start gap-3 text-codelco-secondary">
                    <span className="mt-1 h-2 w-2 rounded-full bg-codelco-accent" aria-hidden />
                    Cambia de rol en cualquier momento para validar escenarios.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className="btn-primary group relative flex-1 overflow-hidden text-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl"
                  type="submit"
                >
                  <span className="relative z-10">Entrar al dashboard</span>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-codelco-accent/30 via-codelco-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </button>
                <Link
                  to="/comunidades"
                  className="text-sm font-medium text-codelco-primary hover:text-codelco-primary/80 transition-colors"
                >
                  Ver portal ciudadano
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
