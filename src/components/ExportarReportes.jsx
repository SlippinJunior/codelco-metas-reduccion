import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarMetas, DIVISIONES, PROCESOS } from '../services/servicioMetas';
import servicioAuditoria from '../services/servicioAuditoria';
import { generarPDF, generarCSV } from '../services/servicioExportes';
import { generarDatosReales, construirPeriodo } from '../services/servicioDatosSimulados';

const ALCANCES = [
  { value: 'todas', label: 'Todas las metas disponibles' },
  { value: 'activas', label: 'Solo metas activas' },
  { value: 'progreso-alto', label: 'Metas con progreso ≥ 20%' },
  { value: 'rezagadas', label: 'Metas rezagadas (progreso < 10%)' }
];

function obtenerAñosDisponibles(metas) {
  const años = metas.map(meta => new Date(meta.fechaObjetivo).getFullYear());
  return Array.from(new Set(años)).sort((a, b) => a - b);
}

function agruparPorDivision(metas) {
  return metas.reduce((acc, meta) => {
    if (!acc[meta.division]) {
      acc[meta.division] = [];
    }
    acc[meta.division].push(meta);
    return acc;
  }, {});
}

function construirResumenDivision(division, metas, periodoEtiqueta) {
  if (!metas.length) {
    return `No se encontraron metas activas para ${division} en ${periodoEtiqueta}.`;
  }
  const progresoPromedio = (metas.reduce((acc, meta) => acc + (meta.progreso?.porcentaje || 0), 0) / metas.length).toFixed(1);
  const procesos = Array.from(new Set(metas.map(meta => meta.proceso))).join(', ');
  const metaDestacada = metas.reduce((destacada, meta) => {
    if (!destacada || (meta.progreso?.porcentaje || 0) > (destacada.progreso?.porcentaje || 0)) {
      return meta;
    }
    return destacada;
  }, null);
  return `La división ${division} reporta ${metas.length} meta(s) con un progreso promedio de ${progresoPromedio}%. ` +
    `Los procesos clave evaluados incluyen ${procesos || 'procesos generales de producción'}. ` +
    (metaDestacada ? `La meta "${metaDestacada.nombre}" destaca con ${metaDestacada.progreso?.porcentaje || 0}% de avance.` : '');
}

function construirResumenGeneral(metas, metasPorDivision) {
  if (!metas.length) return { promedioProgreso: 0, topDivisiones: [], topProcesos: [] };
  const promedio = (metas.reduce((acc, meta) => acc + (meta.progreso?.porcentaje || 0), 0) / metas.length).toFixed(1);
  const divisionesOrdenadas = Object.entries(metasPorDivision)
    .map(([division, lista]) => ({ division, progreso: (lista.reduce((a, meta) => a + (meta.progreso?.porcentaje || 0), 0) / lista.length) || 0 }))
    .sort((a, b) => b.progreso - a.progreso)
    .slice(0, 2)
    .map(item => `${item.division} (${item.progreso.toFixed(1)}%)`);
  const procesos = Array.from(new Set(metas.map(meta => meta.proceso))).slice(0, 3);
  return {
    promedioProgreso: Number(promedio),
    topDivisiones: divisionesOrdenadas,
    topProcesos: procesos
  };
}

function construirPeriodoEtiqueta(periodo) {
  if (!periodo) return 'año completo';
  if (periodo.tipo === 'anio') return `año ${periodo.año}`;
  if (periodo.tipo === 'semestre') return `${periodo.indice === 2 ? 'segundo' : 'primer'} semestre ${periodo.año}`;
  if (periodo.tipo === 'trimestre') return `trimestre ${periodo.indice} ${periodo.año}`;
  return 'periodo seleccionado';
}

function obtenerEventosCreacion(historial) {
  return historial.reduce((acc, evento) => {
    if (evento.accion === 'crear' && evento.entidad === 'metas') {
      acc[evento.entidad_id] = {
        usuario: evento.usuario,
        fecha: evento.fecha_hora
      };
    }
    return acc;
  }, {});
}

const PreviewModal = ({ abierto, onClose, resumen, periodoEtiqueta, divisiones, firmante }) => {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <div className="bg-codelco-primary text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Previsualización rápida</h3>
            <p className="text-sm text-blue-100">Portada e índice del reporte</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white" aria-label="Cerrar previsualización">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-codelco-dark font-semibold text-lg">Portada</h4>
            <div className="mt-3 grid gap-2 text-sm text-codelco-secondary">
              <p><span className="font-semibold text-codelco-dark">Reporte:</span> Comparativo de metas corporativas</p>
              <p><span className="font-semibold text-codelco-dark">Periodo:</span> {periodoEtiqueta}</p>
              <p><span className="font-semibold text-codelco-dark">Divisiones:</span> {divisiones.length ? divisiones.join(', ') : 'Todas las divisiones'}</p>
              <p><span className="font-semibold text-codelco-dark">Firmante:</span> {firmante || 'No indicado'}</p>
            </div>
          </section>
          <section>
            <h4 className="text-codelco-dark font-semibold text-lg">Índice estimado</h4>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-codelco-secondary">
              <li>Resumen ejecutivo</li>
              {divisiones.map(nombre => (
                <li key={nombre}>Metas — {nombre}</li>
              ))}
              <li>Comparaciones gráficas por división</li>
              {resumen.incluirHistorial && <li>Historial de cambios</li>}
              <li>Bloque de firma digital simulada</li>
            </ol>
          </section>
        </div>
        <div className="bg-gray-50 px-6 py-4 text-right">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const ExportarReportes = () => {
  const [cargando, setCargando] = useState(true);
  const [metas, setMetas] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [divisionesSeleccionadas, setDivisionesSeleccionadas] = useState([]);
  const [procesosSeleccionados, setProcesosSeleccionados] = useState([]);
  const [alcance, setAlcance] = useState('todas');
  const [periodoTipo, setPeriodoTipo] = useState('anio');
  const [periodoAño, setPeriodoAño] = useState(new Date().getFullYear());
  const [periodoIndice, setPeriodoIndice] = useState(1);
  const [incluirHistorial, setIncluirHistorial] = useState(true);
  const [firmante, setFirmante] = useState('');
  const [generando, setGenerando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [firmaReciente, setFirmaReciente] = useState(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        const [resultadoMetas, eventosAuditoria] = await Promise.all([
          listarMetas(),
          servicioAuditoria.listarEventos({ entidad: 'metas', pageSize: 500 })
        ]);
        if (resultadoMetas.success) {
          setMetas(resultadoMetas.data);
        }
        if (eventosAuditoria.success) {
          setAuditoria(eventosAuditoria.data);
        }
      } catch (error) {
        console.error('Error al cargar datos para exportación', error);
        setMensaje({ tipo: 'error', texto: 'No se pudieron obtener los datos iniciales. Intente nuevamente.' });
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  const añosDisponibles = useMemo(() => obtenerAñosDisponibles(metas), [metas]);

  const periodoSeleccionado = useMemo(() => construirPeriodo(periodoTipo, periodoAño, periodoIndice), [periodoTipo, periodoAño, periodoIndice]);
  const periodoEtiqueta = construirPeriodoEtiqueta(periodoSeleccionado);

  const metasFiltradas = useMemo(() => {
    return metas.filter(meta => {
      const coincideDivision = divisionesSeleccionadas.length === 0 || divisionesSeleccionadas.includes(meta.division);
      const coincideProceso = procesosSeleccionados.length === 0 || procesosSeleccionados.includes(meta.proceso);
      let coincideAlcance = true;
      if (alcance === 'activas') {
        coincideAlcance = meta.estado === 'activa';
      } else if (alcance === 'progreso-alto') {
        coincideAlcance = (meta.progreso?.porcentaje || 0) >= 20;
      } else if (alcance === 'rezagadas') {
        coincideAlcance = (meta.progreso?.porcentaje || 0) < 10;
      }
      return coincideDivision && coincideProceso && coincideAlcance;
    });
  }, [metas, divisionesSeleccionadas, procesosSeleccionados, alcance]);

  const metasPorDivision = useMemo(() => {
    const agrupadas = agruparPorDivision(metasFiltradas);
    if (divisionesSeleccionadas.length === 0) {
      return agrupadas;
    }
    const ordenadas = {};
    divisionesSeleccionadas.forEach(division => {
      ordenadas[division] = agrupadas[division] || [];
    });
    return ordenadas;
  }, [metasFiltradas, divisionesSeleccionadas]);

  const divisionesParaReporte = useMemo(() => {
    const claves = Object.keys(metasPorDivision);
    if (!claves.length) {
      return divisionesSeleccionadas.length ? divisionesSeleccionadas : DIVISIONES.map(d => d.nombre);
    }
    return claves;
  }, [metasPorDivision, divisionesSeleccionadas]);

  const resumenPorDivision = useMemo(() => {
    return divisionesParaReporte.reduce((acc, division) => {
      const metasDivision = metasPorDivision[division] || [];
      acc[division] = construirResumenDivision(division, metasDivision, periodoEtiqueta);
      return acc;
    }, {});
  }, [divisionesParaReporte, metasPorDivision, periodoEtiqueta]);

  const resumenGeneral = useMemo(() => construirResumenGeneral(metasFiltradas, metasPorDivision), [metasFiltradas, metasPorDivision]);

  const historialFiltrado = useMemo(() => {
    if (!incluirHistorial) return [];
    const idsMetas = new Set(metasFiltradas.map(meta => meta.id));
    return auditoria.filter(evento => idsMetas.has(evento.entidad_id));
  }, [auditoria, metasFiltradas, incluirHistorial]);

  const creadoresPorMeta = useMemo(() => obtenerEventosCreacion(historialFiltrado), [historialFiltrado]);

  const seriesPorDivision = useMemo(() => {
    const serie = {};
    divisionesParaReporte.forEach(division => {
      const metasDivision = metasPorDivision[division] || [];
      if (!metasDivision.length) return;
      const datos = generarDatosReales(metasDivision, periodoSeleccionado);
      serie[division] = datos.agregadoPorMes.map(punto => ({
        etiqueta: punto.etiqueta,
        valorMeta: punto.valorMeta,
        valorReal: punto.valorReal
      }));
    });
    return serie;
  }, [divisionesParaReporte, metasPorDivision, periodoSeleccionado]);

  const manejarDivision = (division) => {
    setDivisionesSeleccionadas(prev => prev.includes(division)
      ? prev.filter(item => item !== division)
      : [...prev, division]);
  };

  const manejarProceso = (proceso) => {
    setProcesosSeleccionados(prev => prev.includes(proceso)
      ? prev.filter(item => item !== proceso)
      : [...prev, proceso]);
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 6000);
  };

  const prepararReporte = () => ({
    metas: metasFiltradas,
    metasPorDivision,
    divisionesSeleccionadas: divisionesParaReporte,
    resumen: resumenGeneral,
    resumenPorDivision,
    historial: historialFiltrado,
    creadoresPorMeta,
    periodoSeleccionado,
    seriesPorDivision
  });

  const onGenerarPDF = async () => {
    if (!metasFiltradas.length) {
      mostrarMensaje('error', 'Debe seleccionar al menos una meta para generar el PDF.');
      return;
    }
    try {
      setGenerando('pdf');
      const reporte = prepararReporte();
      const resultado = await generarPDF(reporte, {
        incluirHistorial,
        firmante: firmante || 'Firmante Demo',
        nombreArchivo: 'reporte_comparativo.pdf'
      });
      setFirmaReciente({ tipo: 'PDF', ...resultado.firma });
      mostrarMensaje('success', 'Reporte PDF generado y descargado correctamente.');
    } catch (error) {
      console.error('Error al generar PDF', error);
      mostrarMensaje('error', 'No se pudo generar el PDF. Revise la consola para más detalles.');
    } finally {
      setGenerando(null);
    }
  };

  const onGenerarCSV = async () => {
    if (!metasFiltradas.length) {
      mostrarMensaje('error', 'Debe seleccionar al menos una meta para generar el CSV.');
      return;
    }
    try {
      setGenerando('csv');
      const reporte = prepararReporte();
      const resultado = await generarCSV(reporte, {
        incluirHistorial,
        firmante: firmante || 'Firmante Demo',
        nombreArchivo: 'reporte_comparativo.csv'
      });
      setFirmaReciente({ tipo: 'CSV', ...resultado.firma });
      mostrarMensaje('success', 'Archivos CSV y firma descargados correctamente.');
    } catch (error) {
      console.error('Error al generar CSV', error);
      mostrarMensaje('error', 'No se pudo generar el CSV. Revise la consola para más detalles.');
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="bg-codelco-light min-h-screen py-10">
      <PreviewModal
        abierto={previewVisible}
        onClose={() => setPreviewVisible(false)}
        resumen={{ incluirHistorial }}
        periodoEtiqueta={periodoEtiqueta}
        divisiones={divisionesParaReporte}
        firmante={firmante}
      />

      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-codelco-dark">Exportar reportes comparativos</h1>
            <p className="text-codelco-secondary max-w-2xl mt-1">
              Configure los parámetros del reporte, previsualice la portada y genere archivos PDF o CSV con firma digital simulada.
            </p>
          </div>
          <Link to="/dashboard" className="btn-secondary">Volver al panel</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="card">
              <h2 className="text-xl font-semibold text-codelco-dark">Selección de filtros</h2>
              {cargando ? (
                <div className="flex items-center gap-3 text-codelco-secondary mt-4">
                  <span className="inline-flex h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                  Cargando datos de metas...
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Divisiones</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {DIVISIONES.map(division => (
                        <label key={division.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-codelco-primary transition">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={divisionesSeleccionadas.includes(division.nombre)}
                            onChange={() => manejarDivision(division.nombre)}
                          />
                          <span className="text-sm text-codelco-secondary">{division.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Procesos</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {PROCESOS.map(proceso => (
                        <label key={proceso.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-codelco-primary transition">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={procesosSeleccionados.includes(proceso.id)}
                            onChange={() => manejarProceso(proceso.id)}
                          />
                          <span className="text-sm text-codelco-secondary">{proceso.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="periodo-tipo" className="block text-sm font-medium text-codelco-dark mb-1">Tipo de periodo</label>
                      <select
                        id="periodo-tipo"
                        value={periodoTipo}
                        onChange={(e) => setPeriodoTipo(e.target.value)}
                        className="form-input"
                      >
                        <option value="anio">Año</option>
                        <option value="semestre">Semestre</option>
                        <option value="trimestre">Trimestre</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="periodo-año" className="block text-sm font-medium text-codelco-dark mb-1">Año</label>
                      <select
                        id="periodo-año"
                        value={periodoAño}
                        onChange={(e) => setPeriodoAño(Number(e.target.value))}
                        className="form-input"
                      >
                        {[...añosDisponibles, new Date().getFullYear()].sort((a, b) => a - b).map(año => (
                          <option key={año} value={año}>{año}</option>
                        ))}
                      </select>
                    </div>
                    {(periodoTipo === 'semestre' || periodoTipo === 'trimestre') && (
                      <div>
                        <label htmlFor="periodo-indice" className="block text-sm font-medium text-codelco-dark mb-1">
                          {periodoTipo === 'semestre' ? 'Semestre' : 'Trimestre'}
                        </label>
                        <select
                          id="periodo-indice"
                          value={periodoIndice}
                          onChange={(e) => setPeriodoIndice(Number(e.target.value))}
                          className="form-input"
                        >
                          {(periodoTipo === 'semestre' ? [1, 2] : [1, 2, 3, 4]).map(valor => (
                            <option key={valor} value={valor}>{valor}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="alcance" className="block text-sm font-medium text-codelco-dark mb-1">Alcance de metas</label>
                    <select
                      id="alcance"
                      value={alcance}
                      onChange={(e) => setAlcance(e.target.value)}
                      className="form-input"
                    >
                      {ALCANCES.map(opcion => (
                        <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="incluir-historial"
                      type="checkbox"
                      className="form-checkbox"
                      checked={incluirHistorial}
                      onChange={(e) => setIncluirHistorial(e.target.checked)}
                    />
                    <label htmlFor="incluir-historial" className="text-sm text-codelco-secondary">
                      Incluir historial de cambios desde la auditoría
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="card">
              <h2 className="text-xl font-semibold text-codelco-dark">Datos de firma</h2>
              <p className="text-sm text-codelco-secondary mb-3">
                El nombre ingresado se utilizará en la firma digital simulada y en el archivo de firma adjunto.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firmante" className="block text-sm font-medium text-codelco-dark mb-1">Firmante (nombre)</label>
                  <input
                    id="firmante"
                    type="text"
                    value={firmante}
                    onChange={(e) => setFirmante(e.target.value)}
                    placeholder="Ejemplo: Gerente Sustentabilidad - Demo"
                    className="form-input"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" className="btn-secondary" onClick={() => setPreviewVisible(true)}>
                    Ver previsualización
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card bg-white shadow-lg">
              <h3 className="text-lg font-semibold text-codelco-dark">Resumen rápido</h3>
              <div className="mt-4 space-y-2 text-sm text-codelco-secondary">
                <p><span className="font-semibold text-codelco-dark">Metas seleccionadas:</span> {metasFiltradas.length}</p>
                <p><span className="font-semibold text-codelco-dark">Divisiones:</span> {divisionesParaReporte.length}</p>
                <p><span className="font-semibold text-codelco-dark">Periodo:</span> {periodoEtiqueta}</p>
                <p><span className="font-semibold text-codelco-dark">Historial:</span> {incluirHistorial ? 'Incluido' : 'Excluido'}</p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={onGenerarPDF}
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={generando === 'pdf' || cargando}
                >
                  {generando === 'pdf' && (
                    <span className="inline-flex h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                  )}
                  Generar PDF
                </button>
                <button
                  type="button"
                  onClick={onGenerarCSV}
                  className="btn-accent flex items-center justify-center gap-2"
                  disabled={generando === 'csv' || cargando}
                >
                  {generando === 'csv' && (
                    <span className="inline-flex h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                  )}
                  Generar CSV
                </button>
              </div>
              <p className="mt-3 text-xs text-codelco-secondary">
                Los archivos se descargarán automáticamente. La firma simulada se mostrará también en la interfaz para su verificación rápida.
              </p>
            </section>

            {firmaReciente && (
              <section className="card border border-codelco-primary/30 bg-blue-50">
                <h3 className="text-lg font-semibold text-codelco-dark flex items-center gap-2">
                  Última firma generada
                </h3>
                <div className="mt-3 space-y-2 text-xs text-codelco-secondary">
                  <p><span className="font-semibold text-codelco-dark">Tipo:</span> {firmaReciente.tipo}</p>
                  <p><span className="font-semibold text-codelco-dark">Firmante:</span> {firmaReciente.firmante}</p>
                  <p><span className="font-semibold text-codelco-dark">Fecha:</span> {new Date(firmaReciente.fechaISO).toLocaleString('es-CL')}</p>
                  <div>
                    <p className="font-semibold text-codelco-dark mb-1">Hash SHA-256:</p>
                    <code className="block bg-white border border-blue-200 rounded p-2 text-[11px] break-all text-codelco-secondary">
                      {firmaReciente.hashBase64}
                    </code>
                  </div>
                  <p className="text-[11px] text-codelco-secondary/80">{firmaReciente.nota}</p>
                </div>
              </section>
            )}

            {mensaje && (
              <div className={`card text-sm ${mensaje.tipo === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {mensaje.texto}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ExportarReportes;
