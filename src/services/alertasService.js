import { crypto } from 'crypto';
import { media, maximo, percentil } from '../utils/estadistica';
import lecturasEjemplo from '../../data/lecturas-ejemplo.json';

const CONFIG_KEY = 'codelco_alertas_config_versions';
const HIST_KEY = 'codelco_alertas_historial';
const CURRENT_CONFIG_KEY = 'codelco_alertas_config_current';

function sha256Hex(str) {
  // simple browser-friendly fallback using Subtle if available; in tests/node use a polyfill
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // not usable synchronously here; as a fallback return timestamp-hash placeholder
    return `v-${Date.now()}`;
  }
  // Node environment
  try {
    const { createHash } = require('crypto');
    return createHash('sha256').update(str).digest('hex');
  } catch (e) {
    return `v-${Date.now()}`;
  }
}

// default config shape
const DEFAULT_CONFIG = {
  nombre: 'Política inicial',
  ventanaDias: 7,
  metodo: 'maximo', // media|maximo|percentil
  percentilP: 95,
  severidadPorDefecto: 'media',
  reglas: {
    consumo_diesel: { etiqueta: 'Consumo Diésel', unidad: 'L', umbral: 35, direccion: '>' , severidad: 'media', ambito: 'División El Teniente' },
    energia_kwh: { etiqueta: 'Energía', unidad: 'kWh', umbral: 1300, direccion: '>' , severidad: 'media', ambito: 'División El Teniente' }
  }
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getConfig() {
  return loadJSON(CURRENT_CONFIG_KEY, DEFAULT_CONFIG);
}

export function setConfig(cfg) {
  saveJSON(CURRENT_CONFIG_KEY, cfg);
  return { success: true };
}

export function listVersions() {
  return loadJSON(CONFIG_KEY, []);
}

export function saveVersion(cfg, usuario = 'anon') {
  const versions = listVersions();
  const payload = { config: cfg, fecha: new Date().toISOString(), usuario };
  const hash = sha256Hex(JSON.stringify(cfg) + payload.fecha + usuario);
  const entry = { ...payload, hash };
  versions.unshift(entry);
  saveJSON(CONFIG_KEY, versions);
  // also set current
  setConfig(cfg);
  return entry;
}

export function restoreVersion(hash) {
  const versions = listVersions();
  const v = versions.find(x => x.hash === hash);
  if (!v) return { success: false, message: 'Version not found' };
  setConfig(v.config);
  return { success: true };
}

export function listarHistorial(filtros = {}) {
  return loadJSON(HIST_KEY, []);
}

export function registrarAlertas(alertas) {
  const hist = listarHistorial();
  const nuevos = alertas.map(a => ({ ...a, id: `alert-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, estado: 'abierta' }));
  const merged = [...nuevos, ...hist];
  saveJSON(HIST_KEY, merged);
  return { success: true, added: nuevos.length };
}

export function cerrarAlerta(id, comentario, usuario='anon') {
  const hist = listarHistorial();
  const idx = hist.findIndex(h => h.id === id);
  if (idx === -1) return { success: false, message: 'not found' };
  hist[idx].estado = 'cerrada';
  hist[idx].cierre = { usuario, comentario, fecha: new Date().toISOString() };
  saveJSON(HIST_KEY, hist);
  return { success: true };
}

function seleccionarMetodo(metodo, values, p) {
  if (metodo === 'media') return media(values);
  if (metodo === 'maximo') return maximo(values);
  if (metodo === 'percentil') return percentil(values, p || 95);
  return media(values);
}

// simulate: sliding window over lecturas grouped by indicador+ambito
export function simular(config = null, lecturas = null, periodo = null) {
  const cfg = config || getConfig();
  const datos = lecturas || lecturasEjemplo;
  const ventanaMs = (periodo || cfg.ventanaDias || 7) * 24 * 3600 * 1000;

  // group readings by tipo + division (ambito)
  const grupos = {};
  for (const l of datos) {
    const key = `${l.tipo}||${l.division || l.ambito || 'global'}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(l);
  }

  const resultados = [];

  for (const [key, items] of Object.entries(grupos)) {
    const [tipo, ambito] = key.split('||');
    const regla = cfg.reglas?.[tipo];
    if (!regla) continue;
    // sort by time
    const sorted = items.slice().sort((a,b)=> new Date(a.timestamp) - new Date(b.timestamp));
    // sliding window: for each reading take window [t - ventana, t]
    for (let i=0;i<sorted.length;i++){
      const t = new Date(sorted[i].timestamp).getTime();
      const windowItems = sorted.filter(x=> new Date(x.timestamp).getTime() >= t - ventanaMs && new Date(x.timestamp).getTime() <= t);
      const valores = windowItems.map(w => w.valor).filter(v=> typeof v === 'number');
      if (!valores.length) continue;
      const agregado = seleccionarMetodo(cfg.metodo || 'media', valores, cfg.percentilP);
      const umbral = regla.umbral;
      const direccion = regla.direccion || '>';
      let exceeds = false;
      if (direccion === '>') exceeds = agregado > umbral;
      else if (direccion === '<') exceeds = agregado < umbral;
      if (exceeds) {
        const exceso = agregado - umbral;
        const pct = (exceso / (umbral || 1)) * 100;
        resultados.push({
          timestamp: new Date(sorted[i].timestamp).toISOString(),
          indicador: tipo,
          ambito,
          valor: agregado,
          umbral,
          exceso,
          pct: Number(pct.toFixed(2)),
          severidad: regla.severidad || cfg.severidadPorDefecto,
          regla: regla.etiqueta || tipo
        });
      }
    }
  }

  return resultados;
}

export default {
  simular,
  registrarAlertas,
  listarHistorial,
  cerrarAlerta,
  getConfig,
  setConfig,
  listVersions,
  saveVersion,
  restoreVersion
};
