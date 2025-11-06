
import React, { useEffect, useMemo, useState } from 'react';
import {
  listarRegiones,
  listarPeriodos,
  listarAvances,
  obtenerTemasDisponibles
} from '../services/servicioComunidades';

const regiones = listarRegiones();
const periodos = listarPeriodos();
const temasDisponibles = obtenerTemasDisponibles();

const REGION_DEFECTO = regiones.find(region => region.id !== 'todos')?.id || 'todos';
const PERIODO_DEFECTO = periodos.find(periodo => periodo.id !== 'todos')?.id || 'todos';

const resumenTexto = (valor, singular, plural) => `${valor} ${valor === 1 ? singular : plural}`;

const obtenerNombreRegion = regionId => regiones.find(region => region.id === regionId)?.nombre || 'Región';
const obtenerEtiquetaPeriodo = periodoId => periodos.find(periodo => periodo.id === periodoId)?.etiqueta || 'Periodo';

const calcularResumen = data => {
  const totalIniciativas = data.length;
  const totalComunidades = data.reduce(
    (acumulado, item) => acumulado + (item.indicadores?.hogaresBeneficiados || 0),
    0
  );
  const emisionesEvitadas = data.reduce(
    (acumulado, item) => acumulado + (item.indicadores?.reduccionEmisionesTon || 0),
    0
  );
  const avancePromedio =
    totalIniciativas === 0
      ? 0
      : Math.round(
          data.reduce((acumulado, item) => acumulado + (item.indicadores?.porcentajeAvance || 0), 0) /
            totalIniciativas
        );

  return {
    success: true,
    data: {
      totalIniciativas,
      totalComunidades,
      emisionesEvitadas,
      avancePromedio
    }
  };
};
const VistaPortalCiudadano = () => {
  const [region, setRegion] = useState('todos');
  const [periodo, setPeriodo] = useState('todos');
  const [tabActiva, setTabActiva] = useState('publico');

  const [iniciativasExtras, setIniciativasExtras] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage?.getItem('comunidades:iniciativasExtras');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  });

  const [formIniciativa, setFormIniciativa] = useState({
    region: REGION_DEFECTO,
    periodo: PERIODO_DEFECTO,
    titulo: '',
    resumen: '',
    hogaresBeneficiados: '',
    reduccionEmisionesTon: '',
    porcentajeAvance: '',
    temas: '',
    imagenAlt: ''
  });
  const [mensajeForm, setMensajeForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage?.getItem('currentUser');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }, []);

  const puedeVerInterno = useMemo(() => {
    const rol = currentUser?.rol;
    return ['control-interno', 'auditor', 'jefe-operaciones'].includes(rol);
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.setItem('comunidades:iniciativasExtras', JSON.stringify(iniciativasExtras));
    } catch (error) {
      // ignorar problemas de almacenamiento
    }
  }, [iniciativasExtras]);

  const avancesPublicos = useMemo(() => listarAvances(region, periodo), [region, periodo]);

  const extrasFiltradas = useMemo(
    () =>
      iniciativasExtras.filter(item => {
        const regionOk = region === 'todos' || item.region === region;
        const periodoOk = periodo === 'todos' || item.periodo === periodo;
        return regionOk && periodoOk;
      }),
    [iniciativasExtras, region, periodo]
  );

  const avancesInternos = useMemo(
    () => ({
      success: true,
      filtros: { region, periodo },
      data: [...avancesPublicos.data, ...extrasFiltradas]
    }),
    [avancesPublicos, extrasFiltradas, region, periodo]
  );

  const resumenPublico = useMemo(() => calcularResumen(avancesPublicos.data), [avancesPublicos]);
  const resumenInterno = useMemo(() => calcularResumen(avancesInternos.data), [avancesInternos]);

  const mensajeResultadosPublico =
    avancesPublicos.data.length === 0
      ? 'No se encontraron iniciativas para los filtros seleccionados.'
      : `${avancesPublicos.data.length} iniciativa(s) disponible(s) para las comunidades`;

  const mensajeResultadosInterno =
    avancesInternos.data.length === 0
      ? 'Sin iniciativas que coincidan con los filtros.'
      : `${avancesInternos.data.length} iniciativa(s) disponibles para revisión interna`;

  const onChangeFormField = event => {
    const { name, value } = event.target;
    setFormIniciativa(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetMensajes = () => setMensajeForm(null);
  const estaEditando = Boolean(editandoId);
  const manejarSubmitIniciativa = event => {
    event.preventDefault();
    resetMensajes();

    const regionSeleccionada = formIniciativa.region;
    const periodoSeleccionado = formIniciativa.periodo;
    const titulo = formIniciativa.titulo.trim();
    const resumen = formIniciativa.resumen.trim();
    const imagenAlt = formIniciativa.imagenAlt.trim();
    const hogares = Number(formIniciativa.hogaresBeneficiados);
    const reduccion = Number(formIniciativa.reduccionEmisionesTon);
    const avance = Number(formIniciativa.porcentajeAvance);
    const temas = formIniciativa.temas
      .split(',')
      .map(tema => tema.trim())
      .filter(Boolean);

    if (!regionSeleccionada || regionSeleccionada === 'todos') {
      setMensajeForm({ tipo: 'error', texto: 'Selecciona una región específica.' });
      return;
    }

    if (!periodoSeleccionado || periodoSeleccionado === 'todos') {
      setMensajeForm({ tipo: 'error', texto: 'Selecciona un periodo específico.' });
      return;
    }

    if (!titulo || !resumen || !imagenAlt) {
      setMensajeForm({ tipo: 'error', texto: 'Completa los campos obligatorios.' });
      return;
    }

    if (!Number.isFinite(hogares) || hogares < 0) {
      setMensajeForm({ tipo: 'error', texto: 'Ingresa un número válido de hogares beneficiados.' });
      return;
    }

    if (!Number.isFinite(reduccion) || reduccion < 0) {
      setMensajeForm({ tipo: 'error', texto: 'Ingresa una reducción de emisiones válida (puede ser 0).' });
      return;
    }

    if (!Number.isFinite(avance) || avance < 0 || avance > 100) {
      setMensajeForm({ tipo: 'error', texto: 'El avance debe estar entre 0 y 100%.' });
      return;
    }

    if (temas.length === 0) {
      setMensajeForm({ tipo: 'error', texto: 'Agrega al menos un tema (separados por coma).' });
      return;
    }

    const baseIniciativa = {
      region: regionSeleccionada,
      periodo: periodoSeleccionado,
      titulo,
      resumen,
      indicadores: {
        hogaresBeneficiados: hogares,
        reduccionEmisionesTon: reduccion,
        porcentajeAvance: avance
      },
      temas,
      imagenAlt,
      origen: 'manual'
    };

    if (estaEditando) {
      setIniciativasExtras(prev =>
        prev.map(item => (item.id === editandoId ? { ...item, ...baseIniciativa } : item))
      );
      setMensajeForm({
        tipo: 'exito',
        texto: 'Iniciativa actualizada correctamente. Se mantendrá en tu navegador para revisión interna.'
      });
      setEditandoId(null);
    } else {
      const nuevaIniciativa = {
        id: `manual-${Date.now()}`,
        ...baseIniciativa
      };
      setIniciativasExtras(prev => [nuevaIniciativa, ...prev]);
      setMensajeForm({
        tipo: 'exito',
        texto: 'Iniciativa agregada correctamente. Quedará disponible para revisión interna (se guarda localmente).'
      });
    }

    setFormIniciativa(prev => ({
      ...prev,
      titulo: '',
      resumen: '',
      hogaresBeneficiados: '',
      reduccionEmisionesTon: '',
      porcentajeAvance: '',
      temas: '',
      imagenAlt: ''
    }));
  };

  const eliminarIniciativaManual = id => {
    setIniciativasExtras(prev => prev.filter(item => item.id !== id));
  };

  const iniciarEdicionIniciativa = item => {
    setMensajeForm({
      tipo: 'info',
      texto: 'Editando iniciativa guardada localmente. Realiza los cambios y guarda para actualizarla.'
    });
    setEditandoId(item.id);
    setFormIniciativa({
      region: item.region,
      periodo: item.periodo,
      titulo: item.titulo,
      resumen: item.resumen,
      hogaresBeneficiados: String(item.indicadores?.hogaresBeneficiados ?? ''),
      reduccionEmisionesTon: String(item.indicadores?.reduccionEmisionesTon ?? ''),
      porcentajeAvance: String(item.indicadores?.porcentajeAvance ?? ''),
      temas: (item.temas || []).join(', '),
      imagenAlt: item.imagenAlt || ''
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    resetMensajes();
    setFormIniciativa({
      region: REGION_DEFECTO,
      periodo: PERIODO_DEFECTO,
      titulo: '',
      resumen: '',
      hogaresBeneficiados: '',
      reduccionEmisionesTon: '',
      porcentajeAvance: '',
      temas: '',
      imagenAlt: ''
    });
  };

  const renderBadgeTema = tema => (
    <span
      key={tema}
      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 bg-white"
      role="listitem"
    >
      {tema}
    </span>
  );
  return (
    <main className="bg-slate-900 text-white min-h-screen">
      <div className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80')] opacity-25"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <header className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <p className="uppercase tracking-[0.3em] text-xs text-amber-300 font-semibold" role="text">
              Portal Ciudadano - Comunidades Codelco
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
          {puedeVerInterno && (
            <div role="tablist" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              <button
                type="button"
                role="tab"
                aria-selected={tabActiva === 'publico'}
                onClick={() => setTabActiva('publico')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                  tabActiva === 'publico'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Vista pública
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tabActiva === 'interno'}
                onClick={() => setTabActiva('interno')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                  tabActiva === 'interno'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Panel interno
              </button>
            </div>
          )}

          {tabActiva === 'publico' && (
            <>
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
                      {resumenPublico.data.totalIniciativas}
                    </dd>
                    <p className="mt-1 text-xs text-white/80">
                      {resumenTexto(resumenPublico.data.totalIniciativas, 'programa disponible', 'programas disponibles')}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 text-slate-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                    <dt className="text-sm text-slate-600">Hogares beneficiados</dt>
                    <dd className="mt-2 text-2xl font-semibold">
                      {new Intl.NumberFormat('es-CL').format(resumenPublico.data.totalComunidades)}
                    </dd>
                    <p className="mt-1 text-xs text-slate-500">
                      Familias que participan en las iniciativas.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 text-slate-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                    <dt className="text-sm text-slate-600">Emisiones evitadas</dt>
                    <dd className="mt-2 text-2xl font-semibold">
                      {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(resumenPublico.data.emisionesEvitadas)} tCOe
                    </dd>
                    <p className="mt-1 text-xs text-slate-500">
                      Reducción estimada por programas comunitarios.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-100 text-emerald-900 p-5 shadow focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                    <dt className="text-sm text-emerald-700">Avance promedio</dt>
                    <dd className="mt-2 text-2xl font-semibold">
                      {resumenPublico.data.avancePromedio}%
                    </dd>
                    <p className="mt-1 text-xs text-emerald-700">
                      Considera los compromisos vigentes durante el periodo.
                    </p>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="titulo-temas">
                <h2 id="titulo-temas" className="text-lg font-semibold text-slate-900">
                  Temas destacados
                </h2>
                <div className="mt-3 flex flex-wrap gap-2" role="list">
                  {temasDisponibles.map(renderBadgeTema)}
                </div>
              </section>
              <section aria-labelledby="titulo-iniciativas" className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 id="titulo-iniciativas" className="text-xl font-bold text-slate-900">
                    Iniciativas abiertas al diálogo
                  </h2>
                  <span className="text-sm text-slate-500" role="status" aria-live="polite">
                    {mensajeResultadosPublico}
                  </span>
                </div>

                {avancesPublicos.data.length === 0 ? (
                  <div
                    className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600"
                    role="alert"
                  >
                    Prueba con otra combinación de filtros o escríbenos a comunidades@codelco.cl para solicitar más detalles.
                  </div>
                ) : (
                  <ul className="grid gap-6 md:grid-cols-2" aria-label="Listado de iniciativas" role="list">
                    {avancesPublicos.data.map(item => (
                      <li key={item.id}>
                        <article className="h-full rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-amber-400" tabIndex={0}>
                          <div className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold uppercase tracking-widest">
                              <span>{obtenerNombreRegion(item.region)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{obtenerEtiquetaPeriodo(item.periodo)}</span>
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
                                <span className="text-xs text-slate-500">tCOe</span>
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
            </>
          )}
          {tabActiva === 'interno' && puedeVerInterno && (
            <section className="space-y-6" aria-label="Panel interno de iniciativas">
              <header className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">Panel interno de iniciativas</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Gestiona nuevas iniciativas a nivel local antes de publicarlas en el portal ciudadano.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Las iniciativas agregadas se almacenan en tu navegador y solo estarán visibles para roles internos.
                </p>
              </header>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Agregar nueva iniciativa</h3>
                <p className="text-sm text-slate-500">
                  Usa este formulario para registrar iniciativas en evaluación interna. Puedes reutilizar los datos para cargarlas en el sistema oficial más adelante.
                </p>
                {mensajeForm && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      mensajeForm.tipo === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                    role={mensajeForm.tipo === 'error' ? 'alert' : 'status'}
                  >
                    {mensajeForm.texto}
                  </div>
                )}
                <form className="grid gap-4 md:grid-cols-2" onSubmit={manejarSubmitIniciativa}>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-region" className="text-sm font-semibold text-slate-700">Región</label>
                    <select
                      id="form-region"
                      name="region"
                      value={formIniciativa.region}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                    >
                      {regiones
                        .filter(opcion => opcion.id !== 'todos')
                        .map(opcion => (
                          <option key={opcion.id} value={opcion.id}>
                            {opcion.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-periodo" className="text-sm font-semibold text-slate-700">Periodo</label>
                    <select
                      id="form-periodo"
                      name="periodo"
                      value={formIniciativa.periodo}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                    >
                      {periodos
                        .filter(opcion => opcion.id !== 'todos')
                        .map(opcion => (
                          <option key={opcion.id} value={opcion.id}>
                            {opcion.etiqueta}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="form-titulo" className="text-sm font-semibold text-slate-700">Título de la iniciativa</label>
                    <input
                      id="form-titulo"
                      name="titulo"
                      type="text"
                      value={formIniciativa.titulo}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Ej. Programa de eficiencia hídrica en campamentos"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="form-resumen" className="text-sm font-semibold text-slate-700">Resumen para publicación</label>
                    <textarea
                      id="form-resumen"
                      name="resumen"
                      value={formIniciativa.resumen}
                      onChange={onChangeFormField}
                      rows="3"
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Describe brevemente el objetivo y el impacto esperado."
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-hogares" className="text-sm font-semibold text-slate-700">Hogares beneficiados</label>
                    <input
                      id="form-hogares"
                      name="hogaresBeneficiados"
                      type="number"
                      min="0"
                      value={formIniciativa.hogaresBeneficiados}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Ej. 150"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-reduccion" className="text-sm font-semibold text-slate-700">Reducción de emisiones (tCOe)</label>
                    <input
                      id="form-reduccion"
                      name="reduccionEmisionesTon"
                      type="number"
                      min="0"
                      value={formIniciativa.reduccionEmisionesTon}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Ej. 25"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-avance" className="text-sm font-semibold text-slate-700">Avance porcentual</label>
                    <input
                      id="form-avance"
                      name="porcentajeAvance"
                      type="number"
                      min="0"
                      max="100"
                      value={formIniciativa.porcentajeAvance}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Ej. 45"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="form-temas" className="text-sm font-semibold text-slate-700">Temas (separados por coma)</label>
                    <input
                      id="form-temas"
                      name="temas"
                      type="text"
                      value={formIniciativa.temas}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Ej. energía, agua, educación"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="form-imagen" className="text-sm font-semibold text-slate-700">Texto alternativo de imagen</label>
                    <input
                      id="form-imagen"
                      name="imagenAlt"
                      type="text"
                      value={formIniciativa.imagenAlt}
                      onChange={onChangeFormField}
                      className="form-input border border-slate-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      placeholder="Describe la imagen asociada a la iniciativa."
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-lg bg-codelco-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-codelco-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-codelco-primary"
                    >
                      {estaEditando ? 'Actualizar iniciativa interna' : 'Guardar iniciativa interna'}
                    </button>
                    {estaEditando ? (
                      <button
                        type="button"
                        onClick={cancelarEdicion}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                      >
                        Cancelar edici�n
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          resetMensajes();
                          setFormIniciativa({
                            region: REGION_DEFECTO,
                            periodo: PERIODO_DEFECTO,
                            titulo: '',
                            resumen: '',
                            hogaresBeneficiados: '',
                            reduccionEmisionesTon: '',
                            porcentajeAvance: '',
                            temas: '',
                            imagenAlt: ''
                          });
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                      >
                        Limpiar formulario
                      </button>
                    )}
                  </div>
                </form>
              </section>
              <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total iniciativas (con internas)</h3>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{resumenInterno.data.totalIniciativas}</p>
                  <p className="text-xs text-slate-500">Incluye datos públicos y registros internos en preparación.</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Comunidades impactadas</h3>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {new Intl.NumberFormat('es-CL').format(resumenInterno.data.totalComunidades)}
                  </p>
                  <p className="text-xs text-slate-500">Hogares beneficiados acumulados para la selección.</p>
                </article>
              </section>

              <section className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Listado de iniciativas internas y públicas</h3>
                    <p className="text-sm text-slate-500">{mensajeResultadosInterno}</p>
                  </div>
                  <span className="text-xs text-slate-400" role="status">
                    {iniciativasExtras.length} iniciativa(s) agregadas localmente
                  </span>
                </header>
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Iniciativa</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Región</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Periodo</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wide">Avance (%)</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {avancesInternos.data.map(item => {
                        const esManual = item.origen === 'manual';
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-slate-900 font-medium">
                              {item.titulo}
                              {esManual && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                  Interna
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{obtenerNombreRegion(item.region)}</td>
                            <td className="px-4 py-3 text-slate-600">{obtenerEtiquetaPeriodo(item.periodo)}</td>
                            <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                              {item.indicadores?.porcentajeAvance ?? 0}%
                            </td>
                            <td className="px-4 py-3 text-right">
                              {esManual ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicionIniciativa(item)}
                                    className="text-xs font-semibold text-codelco-primary hover:text-codelco-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-codelco-primary/40"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarIniciativaManual(item.id)}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Publicada</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {avancesInternos.data.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-500 text-sm">
                            No hay iniciativas que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default VistaPortalCiudadano;
