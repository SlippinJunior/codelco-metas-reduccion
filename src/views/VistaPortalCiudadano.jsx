import React, { useMemo, useState } from 'react';
import {
  listarRegiones,
  listarPeriodos,
  listarAvances,
  obtenerResumenGeneral,
  obtenerTemasDisponibles
} from '../services/servicioComunidades';

const regiones = listarRegiones();
const periodos = listarPeriodos();
const temasDisponibles = obtenerTemasDisponibles();

const resumenTexto = (valor, singular, plural) => `${valor} ${valor === 1 ? singular : plural}`;

const VistaPortalCiudadano = () => {
  const [region, setRegion] = useState('todos');
  const [periodo, setPeriodo] = useState('todos');

  const avances = useMemo(() => listarAvances(region, periodo), [region, periodo]);
  const resumen = useMemo(() => obtenerResumenGeneral(region, periodo), [region, periodo]);

  const mensajeResultados =
    avances.data.length === 0
      ? 'No se encontraron iniciativas para los filtros seleccionados.'
      : `${avances.data.length} iniciativa(s) disponible(s) para las comunidades`;

  return (
    <main className="bg-slate-900 text-white min-h-screen">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80')] opacity-25" aria-hidden="true" />
        <div className="relative z-10">
          <header className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <p className="uppercase tracking-[0.3em] text-xs text-amber-300 font-semibold" role="text">
              Portal Ciudadano · Comunidades Codelco
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
              Información transparente y accesible para nuestros vecinos
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-slate-100">
              Conoce los avances socioambientales relevantes para las comunidades cercanas a nuestras operaciones.
              Este portal utiliza lenguaje claro, alto contraste y navegación compatible con teclado.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#filtros"
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explorar iniciativas
              </a>
              <a
                href="/comunidades/glosario"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Ir al glosario
              </a>
            </div>
          </header>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-t-3xl shadow-2xl -mt-8">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-10">
          <section id="filtros" aria-labelledby="titulo-filtros" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 id="titulo-filtros" className="text-xl font-bold text-slate-900">
                  Filtrar resultados
                </h2>
                <p className="text-sm text-slate-600">
                  Selecciona región y periodo. Puedes navegar con teclado y recibirás el resultado al instante.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500" role="text">
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" />
                Portal AA · Contraste verificado
              </div>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" aria-describedby="nota-filtros">
              <div className="flex flex-col gap-2">
                <label htmlFor="select-region" className="text-sm font-semibold text-slate-800">
                  Región
                </label>
                <select
                  id="select-region"
                  value={region}
                  onChange={event => setRegion(event.target.value)}
                  className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                >
                  {regiones.map(opcion => (
                    <option key={opcion.id} value={opcion.id}>
                      {opcion.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="select-periodo" className="text-sm font-semibold text-slate-800">
                  Periodo
                </label>
                <select
                  id="select-periodo"
                  value={periodo}
                  onChange={event => setPeriodo(event.target.value)}
                  className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                >
                  {periodos.map(opcion => (
                    <option key={opcion.id} value={opcion.id}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <p id="nota-filtros" className="mt-4 text-xs text-slate-500">
              Nota: se muestran datos no sensibles. Para más antecedentes técnicos visite la mesa de vinculación correspondiente.
            </p>
            <div className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
              {mensajeResultados}
            </div>
          </section>

          <section aria-labelledby="titulo-resumen">
            <h2 id="titulo-resumen" className="text-xl font-bold text-slate-900">
              Resumen para la comunidad
            </h2>
            <p className="text-sm text-slate-600">
              Estos valores ayudan a dimensionar el alcance social y ambiental sin exponer datos críticos.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
              <div className="rounded-2xl bg-slate-900 text-white p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                <dt className="text-sm text-white/70">Iniciativas activas</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {resumen.data.totalIniciativas}
                </dd>
                <p className="mt-1 text-xs text-white/80">
                  {resumenTexto(resumen.data.totalIniciativas, 'programa disponible', 'programas disponibles')}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 text-slate-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                <dt className="text-sm text-slate-600">Hogares beneficiados</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {new Intl.NumberFormat('es-CL').format(resumen.data.totalComunidades)}
                </dd>
                <p className="mt-1 text-xs text-slate-500">
                  Familias que participan en las iniciativas.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 text-slate-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                <dt className="text-sm text-slate-600">Emisiones evitadas</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(resumen.data.emisionesEvitadas)} tCO₂e
                </dd>
                <p className="mt-1 text-xs text-slate-500">
                  Reducción estimada por programas comunitarios.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 text-emerald-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                <dt className="text-sm text-emerald-700">Avance promedio</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {resumen.data.avancePromedio}%
                </dd>
                <p className="mt-1 text-xs text-emerald-700">
                  Avance ponderado declarado públicamente.
                </p>
              </div>
            </dl>
          </section>

          <section aria-labelledby="titulo-temas">
            <h2 id="titulo-temas" className="text-lg font-semibold text-slate-900">
              Temas destacados
            </h2>
            <div className="mt-3 flex flex-wrap gap-2" role="list">
              {temasDisponibles.map(tema => (
                <span
                  key={tema}
                  className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 bg-white"
                  role="listitem"
                >
                  {tema}
                </span>
              ))}
            </div>
          </section>

          <section aria-labelledby="titulo-iniciativas" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 id="titulo-iniciativas" className="text-xl font-bold text-slate-900">
                Iniciativas abiertas al diálogo
              </h2>
              <span className="text-sm text-slate-500" role="status" aria-live="polite">
                {mensajeResultados}
              </span>
            </div>

            {avances.data.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600"
                role="alert"
              >
                Prueba con otra combinación de filtros o escribe a comunidades@codelco.cl para solicitar más detalles.
              </div>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2" aria-label="Listado de iniciativas" role="list">
                {avances.data.map(item => (
                  <li key={item.id}>
                    <article className="h-full rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold uppercase tracking-widest">
                          <span>{regiones.find(r => r.id === item.region)?.nombre || 'Región'}</span>
                          <span aria-hidden="true">•</span>
                          <span>{periodos.find(p => p.id === item.periodo)?.etiqueta || 'Periodo'}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.titulo}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {item.resumen}
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-center rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Hogares</span>
                            <span className="text-base font-semibold text-slate-900">
                              {new Intl.NumberFormat('es-CL').format(item.indicadores.hogaresBeneficiados)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">tCO₂e</span>
                            <span className="text-base font-semibold text-slate-900">
                              {item.indicadores.reduccionEmisionesTon}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Avance</span>
                            <span className="text-base font-semibold text-emerald-700">
                              {item.indicadores.porcentajeAvance}%
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.temas.map(tema => (
                            <span key={tema} className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                              {tema}
                            </span>
                          ))}
                        </div>
                        <figure>
                          <span className="block rounded-2xl bg-slate-200 h-32 w-full relative overflow-hidden">
                            <span className="sr-only">{item.imagenAlt}</span>
                          </span>
                          <figcaption className="mt-2 text-xs text-slate-500">
                            {item.imagenAlt}
                          </figcaption>
                        </figure>
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                          <span>
                            Estos antecedentes se validan trimestralmente con la mesa de vinculación local.
                          </span>
                          <a
                            href="mailto:comunidades@codelco.cl?subject=Consulta%20Portal%20Ciudadano"
                            className="text-sm font-medium text-amber-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                          >
                            Solicitar más información
                          </a>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default VistaPortalCiudadano;
