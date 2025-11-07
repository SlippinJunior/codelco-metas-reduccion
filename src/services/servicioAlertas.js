/**
 * servicioAlertas.js
 * Gestión de umbrales, severidades y simulación de alertas basadas en lecturas históricas.
 */

import lecturasSeed from '../../data/lecturas-ejemplo.json';
import { generarId } from '../utils/helpers';

const STORAGE_KEY = 'codelco_alertas_config_v1';
const STORAGE_KEY_HISTORIAL = 'codelco_alertas_historial_v1';
const STORAGE_KEY_ALERTLOG = 'codelco_alertas_registradas_v1';

const PRIORIDAD_SEVERIDAD = {
  critica: 4,
  alta: 3,
  media: 2,
  baja: 1
};

export const DEFAULT_ALERTAS = {
  nombre: 'Política corporativa - emisiones',
  metodo: 'media',
  percentilP: 95,
  ventanaDias: 7,
  severidadPorDefecto: 'media',
  reglas: {
    consumo_diesel: {
      etiqueta: 'Consumo Diésel (L)',
      unidad: 'L',
      umbral: 36,
      severidad: 'media',
      direccion: '>',
      ambito: 'División El Teniente'
    },
    energia_kwh: {
      etiqueta: 'Energía (kWh)',
      unidad: 'kWh',
      umbral: 1350,
      severidad: 'media',
      direccion: '>'
    },
    temperatura_c: {
      etiqueta: 'Temperatura Horno (°C)',
      unidad: '°C',
      umbral: 1200,
      severidad: 'alta',
      direccion: '>'
    },
    caudal_m3_h: {
      etiqueta: 'Caudal Agua (m³/h)',
      unidad: 'm³/h',
      umbral: 460,
      severidad: 'baja',
      direccion: '>'
    }
  }
};

function tieneLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (error) {
    return false;
  }
}

function normalizarConfig(baseConfig) {
  const cfg = { ...DEFAULT_ALERTAS, ...(baseConfig || {}) };
  cfg.nombre = cfg.nombre || DEFAULT_ALERTAS.nombre;
  cfg.metodo = cfg.metodo || DEFAULT_ALERTAS.metodo;
  cfg.percentilP = typeof cfg.percentilP === 'number' ? cfg.percentilP : DEFAULT_ALERTAS.percentilP;
  cfg.ventanaDias = Number(cfg.ventanaDias) > 0 ? Number(cfg.ventanaDias) : DEFAULT_ALERTAS.ventanaDias;
  cfg.severidadPorDefecto = cfg.severidadPorDefecto || DEFAULT_ALERTAS.severidadPorDefecto;

  const reglasNormalizadas = { ...(DEFAULT_ALERTAS.reglas || {}), ...(cfg.reglas || {}) };
  cfg.reglas = Object.entries(reglasNormalizadas).reduce((acc, [clave, regla]) => {
    acc[clave] = {
      etiqueta: regla.etiqueta || clave,
      unidad: regla.unidad || DEFAULT_ALERTAS.reglas?.[clave]?.unidad || '',
      umbral: typeof regla.umbral === 'number' ? regla.umbral : DEFAULT_ALERTAS.reglas?.[clave]?.umbral ?? null,
      severidad: regla.severidad || cfg.severidadPorDefecto,
      direccion: regla.direccion === '<' ? '<' : '>',
      ambito: regla.ambito || DEFAULT_ALERTAS.reglas?.[clave]?.ambito || 'global'
    };
    return acc;
  }, {});

  return cfg;
}

function leerJSON(key, fallback = null) {
  if (!tieneLocalStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function escribirJSON(key, value) {
  if (!tieneLocalStorage()) return false;
  window.localStorage.setItem(key, JSON.stringify(value));
  return true;
}

function obtenerConfig() {
  const almacenada = leerJSON(STORAGE_KEY, null);
  const cfg = normalizarConfig(almacenada);
  if (almacenada === null && tieneLocalStorage()) {
    escribirJSON(STORAGE_KEY, cfg);
  }
  return cfg;
}

function getConfig() {
  return obtenerConfig();
}

function guardar(config) {
  if (!tieneLocalStorage()) return { success: false, message: 'No localStorage' };
  const cfgNormalizada = normalizarConfig(config);
  escribirJSON(STORAGE_KEY, cfgNormalizada);
  return { success: true, data: cfgNormalizada };
}

function obtenerHistorial() {
  return leerJSON(STORAGE_KEY_HISTORIAL, []) || [];
}

function listarHistorial() {
  return obtenerHistorial();
}

function pushHistorial(entry) {
  if (!tieneLocalStorage()) return;
  const historial = obtenerHistorial();
  historial.unshift(entry);
  escribirJSON(STORAGE_KEY_HISTORIAL, historial.slice(0, 50));
}

async function guardarConfigVersionada(config, { usuario = 'anon' } = {}) {
  try {
    const { success, data } = guardar(config);
    if (!success) return { success: false, message: 'No se pudo guardar configuración' };
    const version = `v${Date.now()}`;
    const registro = {
      version,
      fecha: new Date().toISOString(),
      usuario,
      config: data
    };
    pushHistorial(registro);
    return { success: true, historial: obtenerHistorial(), entry: registro };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

function actualizarReglasParciales(parciales = {}) {
  const cfg = obtenerConfig();
  const reglasActuales = { ...(cfg.reglas || {}) };
  Object.entries(parciales).forEach(([tipo, cambios]) => {
    reglasActuales[tipo] = {
      ...(reglasActuales[tipo] || {}),
      ...cambios
    };
  });
  const nuevoCfg = { ...cfg, reglas: reglasActuales };
  const resultado = guardar(nuevoCfg);
  if (!resultado.success) return { success: false, message: 'No se pudo guardar reglas' };
  return { success: true, data: resultado.data };
}

function leerAlertLog() {
  return leerJSON(STORAGE_KEY_ALERTLOG, []) || [];
}

function persistAlertLog(alertas) {
  if (!tieneLocalStorage()) return;
  escribirJSON(STORAGE_KEY_ALERTLOG, alertas.slice(0, 200));
}

function registrarAlertas(alertas = [], { usuario = 'anon' } = {}) {
  if (!Array.isArray(alertas) || alertas.length === 0) {
    return { success: false, message: 'No hay alertas para registrar' };
  }
  if (!tieneLocalStorage()) {
    return { success: false, message: 'No localStorage' };
  }
  const almacenadas = leerAlertLog();
  const enriquecidas = alertas.map(alerta => ({
    ...alerta,
    id: alerta.id || generarId('alerta-registrada'),
    registradoEl: new Date().toISOString(),
    registradoPor: usuario
  }));
  persistAlertLog([...enriquecidas, ...almacenadas]);
  return { success: true, added: alertas.length, alertas: enriquecidas };
}

function getSimulationWindow(lecturas, ventanaDias = 7) {
  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    return { desde: null, hasta: null, desdeMs: null, hastaMs: null };
  }
  const timestamps = lecturas
    .map(l => new Date(l.timestamp || l.fecha || Date.now()).getTime())
    .filter(Boolean)
    .sort((a, b) => a - b);
  const hastaMs = timestamps[timestamps.length - 1];
  const ventanaMs = Math.max(1, ventanaDias) * 24 * 60 * 60 * 1000;
  const desdeMs = hastaMs - ventanaMs;
  return {
    desde: new Date(desdeMs).toISOString(),
    hasta: new Date(hastaMs).toISOString(),
    desdeMs,
    hastaMs
  };
}

function agregarValorVentana(valores = [], metodo = 'media', percentil = 95) {
  if (!Array.isArray(valores) || valores.length === 0) return null;
  if (metodo === 'maximo') {
    return Math.max(...valores);
  }
  if (metodo === 'percentil') {
    const ordenados = [...valores].sort((a, b) => a - b);
    const idx = Math.min(
      ordenados.length - 1,
      Math.max(0, Math.round((percentil / 100) * (ordenados.length - 1)))
    );
    return ordenados[idx];
  }
  const sumatoria = valores.reduce((acc, v) => acc + v, 0);
  return sumatoria / valores.length;
}

function simular(configOverride = null, lecturasOverride = null, ventanaDiasOverride = null) {
  const cfg = normalizarConfig(configOverride || obtenerConfig());
  const ventanaDias = Number(ventanaDiasOverride ?? cfg.ventanaDias ?? DEFAULT_ALERTAS.ventanaDias);
  const lecturasBase = Array.isArray(lecturasOverride) && lecturasOverride.length > 0 ? lecturasOverride : lecturasSeed;
  const ventana = getSimulationWindow(lecturasBase, ventanaDias);
  if (!ventana.desde || !ventana.hasta) return [];

  const lecturasVentana = lecturasBase.filter(l => {
    const ts = new Date(l.timestamp || l.fecha || ventana.hasta).getTime();
    return ts >= ventana.desdeMs && ts <= ventana.hastaMs;
  });

  const resultados = [];

  Object.entries(cfg.reglas || {}).forEach(([indicador, regla]) => {
    const lecturasIndicador = lecturasVentana.filter(l => l.tipo === indicador);
    if (lecturasIndicador.length === 0) return;

    const valores = lecturasIndicador.map(l => Number(l.valor)).filter(v => !Number.isNaN(v));
    const valorVentana = agregarValorVentana(valores, cfg.metodo, cfg.percentilP);
    const umbral = typeof regla.umbral === 'number' ? regla.umbral : null;
    if (umbral === null) return;

    const direccion = regla.direccion === '<' ? '<' : '>';

    lecturasIndicador.forEach(lectura => {
      const valor = Number(lectura.valor);
      if (Number.isNaN(valor)) return;
      const compara = direccion === '<' ? valor < umbral : valor > umbral;
      if (!compara) return;

      const excesoAbs = direccion === '<'
        ? Number((umbral - valor).toFixed(3))
        : Number((valor - umbral).toFixed(3));
      const excesoPct = umbral === 0 ? null : Number(((excesoAbs / umbral) * (direccion === '<' ? -1 : 1)).toFixed(4));

      resultados.push({
        id: generarId('sim-alerta'),
        timestamp: lectura.timestamp || new Date().toISOString(),
        indicador,
        indicadorNombre: regla.etiqueta || indicador,
        ambito: {
          division: lectura.division || regla.ambito || 'División no especificada',
          proceso: lectura.proceso || lectura.subproceso || 'Proceso no especificado',
          tags: lectura.tags || []
        },
        valor,
        unidad: regla.unidad || lectura.unidad || '',
        umbral,
        exceso: excesoAbs,
        pct: excesoPct === null ? null : Math.abs(excesoPct),
        severidad: regla.severidad || cfg.severidadPorDefecto || 'media',
        regla: indicador,
        direccion,
        ventana: {
          metodo: cfg.metodo,
          dias: ventanaDias,
          desde: ventana.desde,
          hasta: ventana.hasta,
          valorVentana: valorVentana === null ? null : Number(valorVentana.toFixed(3)),
          muestras: valores.length
        },
        resumen: `Sensor ${lectura.sensorId} superó el umbral configurado`,
        lecturaId: lectura.id
      });
    });
  });

  resultados.sort((a, b) => {
    const priA = PRIORIDAD_SEVERIDAD[a.severidad] || 0;
    const priB = PRIORIDAD_SEVERIDAD[b.severidad] || 0;
    if (priA !== priB) return priB - priA;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return resultados;
}

function simularAlertas(lecturasOverride = null) {
  return simular(null, lecturasOverride);
}

export default {
  DEFAULT_ALERTAS,
  obtenerConfig,
  getConfig,
  guardarConfigVersionada,
  actualizarReglasParciales,
  registrarAlertas,
  simular,
  simularAlertas,
  obtenerHistorial,
  listarHistorial
};
