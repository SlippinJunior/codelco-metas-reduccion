import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { listarMetas, DIVISIONES, PROCESOS } from '../services/servicioMetas';
import { generarDatosReales, construirPeriodo } from '../services/servicioDatosSimulados';
import SelectorPeriodo from '../components/SelectorPeriodo';
import GraficoProgresoMensual from '../components/GraficoProgresoMensual';
import FiltroDivisionProceso from '../components/FiltroDivisionProceso';

/**
 * VistaProgreso
 * Orquesta la carga de metas, genera datos simulados y mide tiempo de renderizado inicial.
 */
export default function VistaProgreso() {
  const [metas, setMetas] = useState([]);
  const [division, setDivision] = useState(null);
  const [proceso, setProceso] = useState(null);
  const [periodo, setPeriodo] = useState(construirPeriodo('anio', new Date().getFullYear()));
  const [datos, setDatos] = useState(null);
  const [renderTimeMs, setRenderTimeMs] = useState(null);
  const [loadTimeMs, setLoadTimeMs] = useState(null);
  const [showPerfWarning, setShowPerfWarning] = useState(false);
  const [inicioCarga, setInicioCarga] = useState(null);
  const [isLoadingMetas, setIsLoadingMetas] = useState(false);
  const [isLoadingDatos, setIsLoadingDatos] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoadingMetas(true);

    listarMetas()
      .then(res => {
        if (!mounted) return;
        if (res.success) {
          setMetas(res.data || []);
        }
        setIsLoadingMetas(false);
      })
      .catch(error => {
        console.error('[VistaProgreso] No se pudieron cargar las metas', error);
        if (mounted) {
          setIsLoadingMetas(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  const metasFiltradas = useMemo(() => {
    return metas.filter(m => {
      if (division && m.division.toLowerCase().replace(/\s+/g, '-') !== division) return false;
      if (proceso && m.proceso !== proceso) return false;
      return true;
    });
  }, [metas, division, proceso]);

  useEffect(() => {
    let mounted = true;
    setIsLoadingDatos(true);
    setDatos(null);
    setRenderTimeMs(null);
    setLoadTimeMs(null);
    setShowPerfWarning(false);

    const start = performance.now();
    setInicioCarga(start);

    try {
      const resultado = generarDatosReales(metasFiltradas, periodo);
      const mid = performance.now();
      const loadMs = Math.round(mid - start);

      if (!mounted) return;

      setDatos(resultado);
      setLoadTimeMs(loadMs);
      setRenderTimeMs(loadMs);
      setShowPerfWarning(loadMs > 2000);
    } catch (error) {
      console.error('[VistaProgreso] Error generando datos simulados', error);
      if (mounted) {
        setDatos(null);
        setShowPerfWarning(false);
      }
    } finally {
      if (mounted) {
        setIsLoadingDatos(false);
      }
    }

    return () => { mounted = false; };
  }, [metasFiltradas, periodo]);

  function onGraficoRenderizado(completoAtMs) {
    setRenderTimeMs(completoAtMs);
    if (completoAtMs > 2000) {
      console.warn('[VistaProgreso] tiempo total renderizado (ms):', completoAtMs);
      setShowPerfWarning(true);
    } else {
      setShowPerfWarning(false);
    }
  }

  const resumen = useMemo(() => {
    if (!datos) return null;
    const agregado = datos.agregadoPorMes || [];
    if (!agregado.length) {
      return {
        meses: 0,
        mesesCumplidos: 0,
        porcentajeCumplimiento: 0,
        promedioMeta: 0,
        promedioReal: 0,
        brechaPromedio: 0
      };
    }

    const mesesCumplidos = agregado.filter(m => m.valorReal <= m.valorMeta).length;
    const promedioMeta = agregado.reduce((acc, item) => acc + item.valorMeta, 0) / agregado.length;
    const promedioReal = agregado.reduce((acc, item) => acc + item.valorReal, 0) / agregado.length;
    const brechaPromedio = promedioReal - promedioMeta;
    const porcentajeCumplimiento = Math.round((mesesCumplidos / Math.max(1, agregado.length)) * 100);

    return {
      meses: agregado.length,
      mesesCumplidos,
      porcentajeCumplimiento,
      promedioMeta,
      promedioReal,
      brechaPromedio
    };
  }, [datos]);

  const divisionSeleccionada = division ? DIVISIONES.find(d => d.id === division) : null;
  const procesoSeleccionado = proceso ? PROCESOS.find(p => p.id === proceso) : null;

  const periodoLabel = useMemo(() => {
    if (!periodo) return '';
    if (periodo.tipo === 'anio') return `Año ${periodo.año}`;
    if (periodo.tipo === 'semestre') return `${periodo.indice === 1 ? '1er' : '2do'} semestre ${periodo.año}`;
    if (periodo.tipo === 'trimestre') return `Trimestre ${periodo.indice} · ${periodo.año}`;
    return '';
  }, [periodo]);

  const hayMetas = metas.length > 0;
  const hayMetasFiltradas = metasFiltradas.length > 0;

  const formatDecimal = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return Number(value).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-codelco-light via-white to-white py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="card bg-gradient-to-r from-codelco-primary/10 via-white to-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-semibold text-codelco-primary">Progreso: Real vs Meta</h1>
                <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                  Supervisa la evolución mensual de los indicadores clave y detecta rápidamente desviaciones frente a las metas de reducción. Ajusta filtros para segmentar por división, proceso o periodo y obtén una comparativa clara del desempeño.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-codelco-primary/40 bg-white/80 px-3 py-1 text-codelco-primary">
                  <span className="h-2 w-2 rounded-full bg-codelco-primary" aria-hidden="true" />
                  División: {divisionSeleccionada?.nombre || 'Todas'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-codelco-secondary/40 bg-white/80 px-3 py-1 text-codelco-secondary">
                  <span className="h-2 w-2 rounded-full bg-codelco-secondary" aria-hidden="true" />
                  Proceso: {procesoSeleccionado?.nombre || 'Todos'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-codelco-accent/40 bg-white/80 px-3 py-1 text-codelco-accent">
                  <span className="h-2 w-2 rounded-full bg-codelco-accent" aria-hidden="true" />
                  {periodoLabel}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 min-w-[220px]">
              <article className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Metas disponibles</h3>
                <p className="mt-2 text-2xl font-semibold text-codelco-dark">{isLoadingMetas ? '...' : metas.length}</p>
                <p className="text-xs text-gray-500">Registradas en el prototipo</p>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Metas en vista</h3>
                <p className="mt-2 text-2xl font-semibold text-codelco-dark">{isLoadingDatos ? '...' : metasFiltradas.length}</p>
                <p className="text-xs text-gray-500">Aplicando filtros actuales</p>
              </article>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-codelco-secondary">Configura la comparación</h2>
                <p className="mt-1 text-xs text-gray-500 max-w-xl">
                  Selecciona la división y el proceso para enfocar el análisis. Los resultados se recalculan al instante con datos simulados consistentes.
                </p>
              </div>
              <FiltroDivisionProceso
                division={division}
                proceso={proceso}
                onChangeDivision={setDivision}
                onChangeProceso={setProceso}
              />
            </div>
            <div className="w-full lg:w-80">
              <SelectorPeriodo
                periodo={periodo}
                onChange={setPeriodo}
              />
            </div>
          </div>
        </section>

        {showPerfWarning && (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm">
            El cálculo y renderizado superó los 2 segundos. Se registró en la consola para diagnóstico; considera segmentar los filtros o optimizar la fuente de datos.
          </div>
        )}

        <section className="card space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-codelco-primary">Evolución mensual promedio</h2>
              <p className="text-sm text-gray-600">Comparación directa entre el promedio real y la meta definida para cada mes del periodo seleccionado.</p>
            </div>
            <div className="text-xs text-gray-500">
              <div>Tiempo de generación: <span className="font-medium text-codelco-dark">{loadTimeMs !== null ? `${loadTimeMs} ms` : '—'}</span></div>
              <div>Tiempo total de render: <span className="font-medium text-codelco-dark">{renderTimeMs !== null ? `${renderTimeMs} ms` : '—'}</span></div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-inner">
            {isLoadingDatos && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                <span className="text-sm font-medium text-codelco-secondary">Generando datos...</span>
              </div>
            )}

            {hayMetasFiltradas && datos ? (
              <Suspense fallback={<div className="py-12 text-center text-codelco-secondary">Preparando gráfico…</div>}>
                <GraficoProgresoMensual
                  datos={datos}
                  inicioCarga={inicioCarga}
                  onRendered={onGraficoRenderizado}
                />
              </Suspense>
            ) : !isLoadingDatos ? (
              <div className="py-12 text-center text-sm text-gray-500">
                {hayMetas
                  ? 'No encontramos metas que coincidan con los filtros seleccionados. Ajusta los parámetros para visualizar la serie.'
                  : 'Aún no hay metas registradas para generar la comparación de progreso.'}
              </div>
            ) : null}
          </div>

          {resumen && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="card border-l-4 border-codelco-primary bg-codelco-primary/5">
                <h3 className="text-sm font-semibold text-gray-600">Meses analizados</h3>
                <p className="mt-2 text-2xl font-semibold text-codelco-dark">{resumen.meses}</p>
                <p className="text-xs text-gray-500">{metasFiltradas.length ? 'Promedio basado en las metas visibles.' : 'Sin metas en el filtro actual.'}</p>
              </article>

              <article className="card border-l-4 border-codelco-secondary bg-codelco-secondary/5">
                <h3 className="text-sm font-semibold text-gray-600">Cumplimiento del periodo</h3>
                <p className="mt-2 text-2xl font-semibold text-codelco-dark">{resumen.porcentajeCumplimiento}%</p>
                <p className="text-xs text-gray-500">{`Se cumplieron ${resumen.mesesCumplidos} de ${resumen.meses} meses en promedio.`}</p>
              </article>

              <article className={`card border-l-4 ${resumen.brechaPromedio > 0 ? 'border-rose-500 bg-rose-50' : 'border-emerald-500 bg-emerald-50/80'}`}>
                <h3 className="text-sm font-semibold text-gray-600">Brecha promedio</h3>
                <p className={`mt-2 text-2xl font-semibold ${resumen.brechaPromedio > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {`${formatDecimal(resumen.brechaPromedio)} tCO₂e`}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.brechaPromedio > 0 ? 'El valor real está por encima de la meta.' : resumen.brechaPromedio < 0 ? 'El valor real está por debajo de la meta.' : 'El valor real coincide con la meta.'}
                </p>
              </article>

              <article className="card border-l-4 border-codelco-accent bg-codelco-accent/10">
                <h3 className="text-sm font-semibold text-gray-600">Promedios del periodo</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Meta</span>
                    <span className="font-semibold text-codelco-dark">{`${formatDecimal(resumen.promedioMeta)} tCO₂e`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Real</span>
                    <span className="font-semibold text-codelco-dark">{`${formatDecimal(resumen.promedioReal)} tCO₂e`}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Promedio mensual ponderado de las metas visibles.</p>
              </article>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
