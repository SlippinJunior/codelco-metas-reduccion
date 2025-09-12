/**
 * servicioDatosSimulados.js
 * Genera lecturas mensuales simuladas (reales) a partir de las metas existentes.
 * Diseñado para ser reemplazado por `fetchDatosReales(apiConfig)` en producción.
 */

import { addMonths, startOfMonth, format } from 'date-fns';

/**
 * Periodo: { tipo: 'anio'|'semestre'|'trimestre', año: number, indice?: number }
 * - para semestre: indice 1 o 2 (primer o segundo semestre)
 * - para trimestre: indice 1..4
 */

// Generador de ruido reproducible básico
function ruido(seed) {
  let t = seed % 2147483647;
  return function() {
    t = (t * 16807) % 2147483647;
    return (t - 1) / 2147483646;
  };
}

function mesesParaPeriodo(periodo) {
  const { tipo, año, indice } = periodo;
  if (tipo === 'anio') {
    const meses = Array.from({ length: 12 }, (_, i) => ({ año, mes: i + 1 }));
    return meses;
  }

  if (tipo === 'semestre') {
    const start = indice === 2 ? 7 : 1;
    return Array.from({ length: 6 }, (_, i) => ({ año, mes: start + i }));
  }

  if (tipo === 'trimestre') {
    const start = (indice - 1) * 3 + 1;
    return Array.from({ length: 3 }, (_, i) => ({ año, mes: start + i }));
  }

  return [];
}

/**
 * generarDatosReales
 * @param {Array} metas - lista de metas (objeto tal como servicioMetas entrega)
 * @param {Object} periodo - { tipo: 'anio'|'semestre'|'trimestre', año: number, indice?: number }
 * @returns {Object} { seriesPorMeta: { [metaId]: [{ etiqueta, valor }] }, agregadoPorMes: [{ etiqueta, valorMeta, valorReal }] }
 */
export function generarDatosReales(metas, periodo) {
  // Crear lista de meses
  const meses = mesesParaPeriodo(periodo);

  // Semilla basada en año para reproducibilidad
  const rng = ruido(periodo.año || 2024);

  // Series por meta
  const seriesPorMeta = {};

  // Para agregado por mes (suma o promedio según indicador) usaremos promedio
  const agregadoPorMes = meses.map(m => ({
    etiqueta: `${m.año}-${String(m.mes).padStart(2, '0')}`,
    valorMeta: 0,
    valorReal: 0
  }));

  metas.forEach((meta, metaIndex) => {
    // baseline y objetivo
    const baseline = Number(meta.lineaBase?.valor || 0);

    // Calcular evolución de la meta: lineal desde baseline hacia objetivo implícito
    // Si meta.progreso.porcentaje define reducción objetivo relativa, estimamos valor objetivo
    // Para prototipo asumimos que la meta anual objetivo es baseline * (1 - 0.25) si no se especifica
    const reduccionEsperada = (meta.reduccionEsperadaPct ?? (meta.reduccionPct ?? 0)) || (meta.progreso?.porcentaje || 0) / 100;
    const objetivo = baseline * (1 - reduccionEsperada);

    // Si objetivo igual a baseline (sin reducción), dejamos la meta constante
    const delta = objetivo === baseline ? 0 : (objetivo - baseline) / Math.max(1, meses.length - 1);

    // seed específico por meta
    const metaRng = ruido((periodo.año || 2024) + metaIndex + baseline);

    seriesPorMeta[meta.id] = meses.map((m, idx) => {
      // Valor meta progresivo
      const valorMeta = baseline + delta * idx;

      // Valor real: baseline + ruido pequeño (gauss-like aprox)
      const noise = (metaRng() - 0.5) * 0.06 * baseline; // +/-3% ruido por defecto
      const tendencia = ((idx / Math.max(1, meses.length - 1)) * (objetivo - baseline)) * 0.2; // pequeñas variaciones de tendencia
      const valorReal = Math.max(0, valorMeta + noise + tendencia + (rng() - 0.5) * 0.02 * baseline);

      return {
        etiqueta: `${m.año}-${String(m.mes).padStart(2, '0')}`,
        valorMeta: Number(valorMeta.toFixed(3)),
        valorReal: Number(valorReal.toFixed(3))
      };
    });

    // Acumular en agregadoPorMes (sumaremos y luego dividiremos por número de metas activos)
    seriesPorMeta[meta.id].forEach((punto, i) => {
      agregadoPorMes[i].valorMeta += punto.valorMeta;
      agregadoPorMes[i].valorReal += punto.valorReal;
    });
  });

  // Promediar agregado
  const cuenta = Math.max(1, metas.length);
  agregadoPorMes.forEach(a => {
    a.valorMeta = Number((a.valorMeta / cuenta).toFixed(3));
    a.valorReal = Number((a.valorReal / cuenta).toFixed(3));
  });

  return { seriesPorMeta, agregadoPorMes, meses: meses.map(m => `${m.año}-${String(m.mes).padStart(2, '0')}`) };
}

/**
 * Utilidad: convierte periodo seleccionado a objeto periodo usado por este servicio
 */
export function construirPeriodo(tipo, año, indice = 1) {
  return { tipo, año: Number(año), indice: Number(indice) };
}

// Exports adicionales para pruebas
export default {
  generarDatosReales,
  construirPeriodo
};
