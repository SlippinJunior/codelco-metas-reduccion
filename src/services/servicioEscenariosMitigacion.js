import { generarId } from '../utils/helpers';
import { arrayToCsv, downloadCsv } from '../utils/csv';

const STORAGE_KEY = 'codelco_mitigacion_escenarios_v1';

export const DEFAULT_ESCENARIOS = [
  {
    id: 'esc-electrificacion-flota',
    nombre: 'Electrificacion de flota LHD',
    tecnologia: 'Reemplazo de LHD diesel por equipos electricos y cargadores rapidos',
    division: 'El Teniente',
    horizonte: 10,
    capex: 95,
    costoOperacionAnual: 12,
    ahorroOpexAnual: 18.5,
    baselineEmisiones: 68000,
    reduccionPorcentaje: 0.35,
    supuestos: {
      factorEmisionDieselKgCo2ePorLitro: 2.68,
      precioDieselUsdPorLitro: 0.95,
      coberturaRenovable: '55%',
      comentario: 'Incluye red de carga dedicada y capacitacion de operadores'
    }
  },
  {
    id: 'esc-h2-caex',
    nombre: 'Blend de hidrogeno verde en CAEX',
    tecnologia: 'Sustitucion del 60% del diesel por hidrogeno verde en la flota CAEX',
    division: 'Chuquicamata',
    horizonte: 12,
    capex: 175,
    costoOperacionAnual: 22,
    ahorroOpexAnual: 26,
    baselineEmisiones: 92000,
    reduccionPorcentaje: 0.42,
    supuestos: {
      precioHidrogenoUsdPorKg: 3.8,
      factorEmisionHidrogenoKgCo2ePorKg: 0.4,
      mezclaEnergetica: '40% generacion onsite, 60% compra externa',
      comentario: 'Incluye planta de electrolisis modular y almacenamiento criogenico'
    }
  },
  {
    id: 'esc-optimizacion-molienda',
    nombre: 'Optimizacion energetica en molienda',
    tecnologia: 'Sistema de control avanzado y variadores de frecuencia en molienda SAG',
    division: 'Andina',
    horizonte: 7,
    capex: 48,
    costoOperacionAnual: 6.5,
    ahorroOpexAnual: 11.4,
    baselineEmisiones: 54000,
    reduccionPorcentaje: 0.28,
    supuestos: {
      factorEmisionEnergiaKgCo2ePorMwh: 0.32,
      precioEnergiaUsdPorMwh: 55,
      disponibilidadEsperada: '94%',
      comentario: 'Integra gemelo digital y programa de Mantenimiento Predictivo'
    }
  }
];

function cloneEscenario(base) {
  return {
    ...base,
    supuestos: { ...(base.supuestos || {}) }
  };
}

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function ensureSeeded(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return DEFAULT_ESCENARIOS.map(cloneEscenario);
  }
  if (list.length < 3) {
    const existingIds = new Set(list.map(item => item.id));
    const merged = [...list];
    DEFAULT_ESCENARIOS.forEach(item => {
      if (!existingIds.has(item.id)) {
        merged.push(cloneEscenario(item));
      }
    });
    return merged;
  }
  return list;
}

function loadEscenarios() {
  if (!hasLocalStorage()) {
    return DEFAULT_ESCENARIOS.map(cloneEscenario);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = DEFAULT_ESCENARIOS.map(cloneEscenario);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    const sane = ensureSeeded(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sane));
    return sane;
  } catch {
    return DEFAULT_ESCENARIOS.map(cloneEscenario);
  }
}

function saveEscenarios(list) {
  if (!hasLocalStorage()) return false;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

function parseNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizarEscenario(raw) {
  if (!raw) return null;
  return {
    id: raw.id || generarId('escenario'),
    nombre: raw.nombre || 'Escenario sin nombre',
    tecnologia: raw.tecnologia || '',
    division: raw.division || '',
    horizonte: parseNumber(raw.horizonte, 5),
    capex: parseNumber(raw.capex, 0),
    costoOperacionAnual: parseNumber(raw.costoOperacionAnual, 0),
    ahorroOpexAnual: parseNumber(raw.ahorroOpexAnual, 0),
    baselineEmisiones: parseNumber(raw.baselineEmisiones, 0),
    reduccionPorcentaje: Math.min(1, Math.max(0, parseNumber(raw.reduccionPorcentaje, 0))),
    supuestos: {
      ...(raw.supuestos || {})
    }
  };
}

export function calcularIndicadores(escenario) {
  const data = normalizarEscenario(escenario);
  if (!data) return null;

  const capex = data.capex;
  const opexAnual = data.costoOperacionAnual;
  const ahorroAnual = data.ahorroOpexAnual;
  const horizonte = data.horizonte;
  const baseline = data.baselineEmisiones;
  const reduccionPct = data.reduccionPorcentaje;

  const reduccionTon = baseline * reduccionPct;
  const emisionesPosteriores = Math.max(0, baseline - reduccionTon);
  const costoTotal = capex + (opexAnual * horizonte);
  const beneficios = ahorroAnual * horizonte;
  const costoNeto = costoTotal - beneficios;
  const roi = capex > 0 ? (beneficios - capex) / capex : null;
  const payback = ahorroAnual > 0 ? capex / ahorroAnual : null;
  const reduccionTotalTon = reduccionTon * (horizonte > 0 ? horizonte : 1);
  const costoAbatimiento = reduccionTotalTon > 0 ? (costoNeto * 1_000_000) / reduccionTotalTon : null;

  return {
    horizonte,
    baseline,
    reduccionPct,
    reduccionTon,
    emisionesPosteriores,
    costoTotal,
    beneficios,
    costoNeto,
    roi,
    payback,
    costoAbatimiento
  };
}

export function listarEscenarios() {
  const escenarios = loadEscenarios().map(normalizarEscenario);
  return {
    success: true,
    data: escenarios.map(item => ({
      ...item,
      indicadores: calcularIndicadores(item)
    }))
  };
}

export function obtenerEscenario(id) {
  const escenarios = loadEscenarios();
  const encontrado = escenarios.find(item => item.id === id);
  if (!encontrado) return null;
  return normalizarEscenario(encontrado);
}

export function agregarEscenario(parcial = {}) {
  const escenarios = loadEscenarios().map(normalizarEscenario);
  const nuevo = normalizarEscenario({
    id: generarId('escenario'),
    nombre: 'Nuevo escenario',
    tecnologia: '',
    division: '',
    horizonte: 8,
    capex: 25,
    costoOperacionAnual: 4,
    ahorroOpexAnual: 6,
    baselineEmisiones: 25000,
    reduccionPorcentaje: 0.18,
    supuestos: {
      comentario: 'Editar supuestos clave del escenario'
    },
    ...parcial
  });
  escenarios.push(nuevo);
  saveEscenarios(escenarios);
  return { success: true, data: nuevo };
}

export function actualizarEscenario(id, cambios = {}) {
  const escenarios = loadEscenarios().map(normalizarEscenario);
  const index = escenarios.findIndex(item => item.id === id);
  if (index === -1) {
    return { success: false, message: 'Escenario no encontrado' };
  }
  const baseSupuestos = { ...(escenarios[index].supuestos || {}) };
  if (cambios.supuestos) {
    Object.entries(cambios.supuestos).forEach(([clave, valor]) => {
      if (valor === null || valor === undefined || valor === '__delete__') {
        delete baseSupuestos[clave];
      } else {
        baseSupuestos[clave] = valor;
      }
    });
  }
  const actualizado = normalizarEscenario({
    ...escenarios[index],
    ...cambios,
    supuestos: baseSupuestos
  });
  escenarios[index] = actualizado;
  saveEscenarios(escenarios);
  return { success: true, data: actualizado };
}

export function eliminarEscenario(id) {
  const escenarios = loadEscenarios().map(normalizarEscenario);
  const filtrados = escenarios.filter(item => item.id !== id);
  if (filtrados.length === escenarios.length) {
    return { success: false, message: 'Escenario no encontrado' };
  }
  saveEscenarios(filtrados);
  return { success: true, data: filtrados };
}

export function duplicarEscenario(id) {
  const escenario = obtenerEscenario(id);
  if (!escenario) {
    return { success: false, message: 'Escenario no encontrado' };
  }
  const copia = normalizarEscenario({
    ...escenario,
    id: generarId('escenario'),
    nombre: `${escenario.nombre} (copia)`
  });
  const escenarios = loadEscenarios().map(normalizarEscenario);
  escenarios.push(copia);
  saveEscenarios(escenarios);
  return { success: true, data: copia };
}

export function resetEscenarios() {
  const base = DEFAULT_ESCENARIOS.map(cloneEscenario);
  saveEscenarios(base);
  return {
    success: true,
    data: base.map(normalizarEscenario)
  };
}

function buildSupuestoKeys(escenarios) {
  const keys = new Set();
  escenarios.forEach(item => {
    Object.keys(item.supuestos || {}).forEach(key => keys.add(key));
  });
  return Array.from(keys);
}

export function descargarAnexo(escenariosInput = null, opciones = {}) {
  const base = escenariosInput
    ? escenariosInput.map(normalizarEscenario)
    : loadEscenarios().map(normalizarEscenario);

  const escenarios = base.map(item => ({
    ...item,
    indicadores: calcularIndicadores(item)
  }));

  const supKeys = buildSupuestoKeys(escenarios);
  const headers = [
    { key: 'nombre', label: 'Escenario' },
    { key: 'tecnologia', label: 'Tecnologia' },
    { key: 'division', label: 'Division' },
    { key: 'horizonte', label: 'Horizonte (anos)' },
    { key: 'capex', label: 'CAPEX (MMUSD)' },
    { key: 'costoOperacionAnual', label: 'Costo OPEX anual (MMUSD)' },
    { key: 'ahorroOpexAnual', label: 'Ahorro OPEX anual (MMUSD)' },
    { key: 'baselineEmisiones', label: 'Emisiones base (tCO2e/a)' },
    { key: 'reduccionPorcentaje', label: 'Reduccion %' },
    { key: 'reduccionTon', label: 'Reduccion tCO2e/a' },
    { key: 'emisionesPosteriores', label: 'Emisiones post proyecto (tCO2e/a)' },
    { key: 'costoTotal', label: 'Costo total (MMUSD)' },
    { key: 'beneficios', label: 'Beneficios acumulados (MMUSD)' },
    { key: 'costoNeto', label: 'Costo neto (MMUSD)' },
    { key: 'roi', label: 'ROI %' },
    { key: 'payback', label: 'Payback (anios)' },
    { key: 'costoAbatimiento', label: 'Costo abatimiento (USD/tCO2e)' }
  ];

  supKeys.forEach(key => {
    headers.push({
      key: `supuesto_${key}`,
      label: `Supuesto - ${key}`
    });
  });

  const rows = escenarios.map(item => {
    const indicadores = item.indicadores;
    const supuestos = item.supuestos || {};
    const valoresSupuestos = {};
    supKeys.forEach(key => {
      valoresSupuestos[`supuesto_${key}`] = supuestos[key] ?? '';
    });

    return {
      nombre: item.nombre,
      tecnologia: item.tecnologia,
      division: item.division,
      horizonte: item.horizonte,
      capex: item.capex,
      costoOperacionAnual: item.costoOperacionAnual,
      ahorroOpexAnual: item.ahorroOpexAnual,
      baselineEmisiones: indicadores.baseline,
      reduccionPorcentaje: Number((indicadores.reduccionPct * 100).toFixed(2)),
      reduccionTon: Number(indicadores.reduccionTon.toFixed(0)),
      emisionesPosteriores: Number(indicadores.emisionesPosteriores.toFixed(0)),
      costoTotal: Number(indicadores.costoTotal.toFixed(2)),
      beneficios: Number(indicadores.beneficios.toFixed(2)),
      costoNeto: Number(indicadores.costoNeto.toFixed(2)),
      roi: indicadores.roi != null ? Number((indicadores.roi * 100).toFixed(2)) : '',
      payback: indicadores.payback != null ? Number(indicadores.payback.toFixed(2)) : '',
      costoAbatimiento: indicadores.costoAbatimiento != null ? Number(indicadores.costoAbatimiento.toFixed(2)) : '',
      ...valoresSupuestos
    };
  });

  const csv = arrayToCsv(headers, rows);
  const nombreArchivo = opciones.nombreArchivo || `anexo_escenarios_${Date.now()}.csv`;
  downloadCsv(nombreArchivo, csv);
  return { success: true, nombre: nombreArchivo, totalEscenarios: escenarios.length };
}

export default {
  DEFAULT_ESCENARIOS,
  listarEscenarios,
  obtenerEscenario,
  agregarEscenario,
  actualizarEscenario,
  eliminarEscenario,
  duplicarEscenario,
  resetEscenarios,
  calcularIndicadores,
  descargarAnexo
};
