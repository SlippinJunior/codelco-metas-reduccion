/**
 * servicioAlertas.js
 * Servicio para configurar umbrales y severidad de alertas.
 * Guarda configuraciones versionadas en localStorage y permite simular
 * alertas hipotéticas usando lecturas históricas (reutiliza la data de lecturas).
 */

import lecturasSeed from '../../data/lecturas-ejemplo.json';
import { generarId } from '../utils/helpers';

const STORAGE_KEY = 'codelco_alertas_config_v1';
const STORAGE_KEY_HISTORIAL = 'codelco_alertas_historial_v1';

export const DEFAULT_ALERTAS = {
  ventanaDias: 7,
  severidadPorDefecto: 'media',
  reglas: {
    consumo_diesel: { etiqueta: 'Consumo Diésel (L)', umbral: 36, severidad: 'media' },
    energia_kwh: { etiqueta: 'Energía (kWh)', umbral: 1350, severidad: 'media' },
    temperatura_c: { etiqueta: 'Temperatura Horno (°C)', umbral: 1200, severidad: 'alta' },
    caudal_m3_h: { etiqueta: 'Caudal Agua (m³/h)', umbral: 460, severidad: 'baja' }
  }
};

function tieneLocalStorage() {
  try { return typeof window !== 'undefined' && !!window.localStorage; } catch (e) { return false; }
}

function inicializar() {
  if (!tieneLocalStorage()) return DEFAULT_ALERTAS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ALERTAS));
    return { ...DEFAULT_ALERTAS };
  }
  try { return { ...DEFAULT_ALERTAS, ...JSON.parse(raw) }; } catch (e) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ALERTAS)); return { ...DEFAULT_ALERTAS }; }
}

function guardar(config) {
  if (!tieneLocalStorage()) return { success: false, message: 'No localStorage' };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return { success: true };
}

function obtenerConfig() {
  return inicializar();
}

function obtenerHistorial() {
  if (!tieneLocalStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY_HISTORIAL);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function pushHistorial(entry) {
  if (!tieneLocalStorage()) return;
  const h = obtenerHistorial();
  h.unshift(entry);
  window.localStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(h.slice(0, 50)));
}

async function guardarConfigVersionada(config, { usuario = 'anon' } = {}) {
  try {
    const version = `v${Date.now()}`;
    const entry = { version, fecha: new Date().toISOString(), usuario, config };
    const r = guardar(config);
    if (!r.success) return { success: false, message: 'No se pudo guardar' };
    pushHistorial(entry);
    return { success: true, historial: obtenerHistorial(), entry };
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

function actualizarReglasParciales(parciales = {}) {
  const cfg = obtenerConfig();
  const reglasActuales = { ...(cfg.reglas || {}) };
  Object.entries(parciales).forEach(([tipo, cambios]) => {
    reglasActuales[tipo] = { ...(reglasActuales[tipo] || {}), ...cambios };
  });
  const nuevoCfg = { ...cfg, reglas: reglasActuales };
  const r = guardar(nuevoCfg);
  if (!r.success) return { success: false, message: 'No se pudo guardar reglas' };
  return { success: true, data: nuevoCfg };
}

/**
 * Simula alertas basadas en lecturas históricas.
 * Genera una lista de alertas hipotéticas aplicando reglas sencillas:
 * - Si un valor supera umbral configurado -> alerta
 * - Severidad se toma de la regla o del default
 */
function simularAlertas(lecturasOverride = null) {
  const cfg = obtenerConfig();
  // normalizar lecturas seed en caso de no tener localStorage
  const lecturas = lecturasOverride || (Array.isArray(lecturasSeed) ? lecturasSeed : []);
  const ventanaMs = (cfg.ventanaDias || 7) * 24 * 60 * 60 * 1000;
  const ahora = Date.now();
  const recortadas = lecturas.filter(l => new Date(l.timestamp).getTime() >= (ahora - ventanaMs));

  const alerts = [];
  recortadas.forEach(l => {
    const regla = cfg.reglas?.[l.tipo];
    if (regla && typeof regla.umbral === 'number') {
      if (l.valor > regla.umbral) {
        alerts.push({
          id: generarId('alerta'),
          titulo: `${regla.etiqueta || l.tipo} supera umbral`,
          detalle: `Sensor ${l.sensorId} valor=${l.valor} > umbral ${regla.umbral}`,
          severidad: regla.severidad || cfg.severidadPorDefecto || 'media',
          timestamp: l.timestamp
        });
      }
    } else {
      // fallback: detectar picos relativos simples
      // si lectura tiene flag 'anomalia' proveniente de anomalias, convertir en alerta
      if (l.anomalia) {
        alerts.push({
          id: generarId('alerta'),
          titulo: `Posible desviaci\u00f3n en ${l.tipo}`,
          detalle: `Sensor ${l.sensorId} registr\u00f3 anomalia (score ${l.scoreAnomalia})`,
          severidad: cfg.severidadPorDefecto || 'media',
          timestamp: l.timestamp
        });
      }
    }
  });

  // ordenar por severidad y tiempo: alta -> reciente
  const prioridad = { alta: 3, media: 2, baja: 1 };
  alerts.sort((a,b) => (prioridad[b.severidad] - prioridad[a.severidad]) || (new Date(b.timestamp) - new Date(a.timestamp)));
  return alerts;
}

export default {
  DEFAULT_ALERTAS,
  obtenerConfig,
  guardarConfigVersionada,
  simularAlertas,
  obtenerHistorial
};
