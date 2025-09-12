import React, { useEffect, useMemo, useState, Suspense } from 'react';
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
  const [showPerfWarning, setShowPerfWarning] = useState(false);
  const [inicioCarga, setInicioCarga] = useState(null);

  // Cargar metas al montar
  useEffect(() => {
    let mounted = true;
    listarMetas().then(res => {
      if (!mounted) return;
      if (res.success) setMetas(res.data || []);
    });
    return () => { mounted = false; };
  }, []);

  // Generar datos simulados cuando cambian filtros
  useEffect(() => {
    let mounted = true;
    (async () => {
      const start = performance.now();
      setInicioCarga(start);

      // Filtrar metas por division/proceso
      const metasFiltradas = metas.filter(m => {
        if (division && m.division.toLowerCase().replace(/\s+/g, '-') !== division) return false;
        if (proceso && m.proceso !== proceso) return false;
        return true;
      });

      // Simular carga y generación de datos
      const resultado = generarDatosReales(metasFiltradas, periodo);

  // Medimos tiempo hasta que datos están listos (render se medirá en el gráfico vía callback)
  const mid = performance.now();
  const loadMs = Math.round(mid - start);

      if (!mounted) return;
      setDatos(resultado);

      // Si carga ya excede 2s, avisar
      if (loadMs > 2000) {
        console.warn('[VistaProgreso] tiempo de generación de datos (ms):', loadMs);
        setShowPerfWarning(true);
      } else {
        setShowPerfWarning(false);
      }

      // Guardamos un valor preliminar; el gráfico actualizará con el tiempo final cuando termine de montar
      setRenderTimeMs(loadMs);
    })();

    return () => { mounted = false; };
  }, [metas, division, proceso, periodo]);

  // Handler cuando el gráfico ha terminado de renderizar
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
    const mesesCumplidos = agregado.filter(m => m.valorReal <= m.valorMeta).length;
    const porcentajeCumplimiento = Math.round((mesesCumplidos / Math.max(1, agregado.length)) * 100);
    return {
      meses: agregado.length,
      mesesCumplidos,
      porcentajeCumplimiento
    };
  }, [datos]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-codelco-dark mb-4">Progreso: Real vs Meta</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="col-span-1 md:col-span-2">
          <FiltroDivisionProceso
            division={division}
            proceso={proceso}
            onChangeDivision={setDivision}
            onChangeProceso={setProceso}
          />
        </div>

        <div className="col-span-1">
          <SelectorPeriodo
            periodo={periodo}
            onChange={(p) => setPeriodo(p)}
          />
        </div>
      </div>

      {showPerfWarning && (
        <div role="alert" className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800">
          Renderizado &gt; 2s. Se registró en consola para diagnóstico. Considerar optimizar datos o paginar.
        </div>
      )}

      <div className="bg-white border rounded p-4">
        {datos ? (
          <Suspense fallback={<div>Cargando gráfico...</div>}>
            <GraficoProgresoMensual
              datos={datos}
              inicioCarga={inicioCarga}
              onRendered={(ms) => onGraficoRenderizado(ms)}
            />
          </Suspense>
        ) : (
          <div className="text-codelco-secondary">Cargando datos...</div>
        )}

        {resumen && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-codelco-secondary">
              Meses mostrados: <strong className="text-codelco-dark">{resumen.meses}</strong>
            </div>
            <div className="text-sm text-codelco-secondary">
              Meses cumplidos: <strong className="text-codelco-dark">{resumen.mesesCumplidos}</strong>
            </div>
            <div className="text-sm text-codelco-secondary">
              Cumplimiento: <strong className="text-codelco-dark">{resumen.porcentajeCumplimiento}%</strong>
            </div>
            <div className="text-sm text-codelco-secondary">
              Tiempo inicial (ms): <strong className="text-codelco-dark">{renderTimeMs ?? '-'}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
