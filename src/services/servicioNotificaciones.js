/**
 * servicioNotificaciones.js
 * Notificaciones multicanal (web/app y correo) con:
 * - Plantilla de correo configurable (asunto y cuerpo)
 * - Registro de lectura y cierre por usuario (centro web)
 * - Reintentos automáticos con backoff exponencial en envíos de correo (simulados)
 *
 * Almacena estado en localStorage para el prototipo.
 */

import { generarId, validarEmail } from '../utils/helpers';

const SETTINGS_KEY = 'codelco_notif_settings_v1';
const WEB_CENTER_KEY = 'codelco_notif_centro_v1';
const OUTBOX_KEY = 'codelco_notif_outbox_v1';
const EMAIL_LOG_KEY = 'codelco_notif_email_log_v1';

export const DEFAULT_SETTINGS = {
  canales: { web: true, email: true },
  email: {
    from: 'no-reply@demo-codelco.local',
    asuntoTemplate: '[ALERTA {{severidad}}] {{titulo}}',
    cuerpoTemplate:
      'Estimado(a) {{usuario}}\n\nSe ha detectado una alerta: {{titulo}}.\n\nDetalle: {{detalle}}\nSeveridad: {{severidad}}\nFecha: {{timestamp}}\n\nIr a Panel: {{link}}\n\n— Sistema de Metas (demo)\n',
    failureRate: 0.25, // Probabilidad de fallo para simular reintentos
    maxAttempts: 3,
    backoffBaseMs: 2000
  }
};

function hasLS() {
  try { return typeof window !== 'undefined' && !!window.localStorage; } catch { return false; }
}

function loadJSON(key, fallback) {
  if (!hasLS()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  if (!hasLS()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Settings
export function getSettings() {
  const cfg = loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
  // merge con default para evitar claves faltantes
  return { ...DEFAULT_SETTINGS, ...cfg, email: { ...DEFAULT_SETTINGS.email, ...(cfg?.email || {}) } };
}

export function saveSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...(patch || {}), email: { ...current.email, ...(patch?.email || {}) } };
  saveJSON(SETTINGS_KEY, next);
  return { success: true, data: next };
}

// Centro Web (in-app notifications)
export function listarCentro(usuario = null) {
  const all = loadJSON(WEB_CENTER_KEY, []);
  if (!usuario) return all;
  return all.filter(n => n.para === usuario);
}

function upsertCentro(entries) {
  const all = loadJSON(WEB_CENTER_KEY, []);
  const map = new Map(all.map(n => [n.id, n]));
  entries.forEach(e => { map.set(e.id, e); });
  const merged = Array.from(map.values()).sort((a,b)=> new Date(b.creadoEn) - new Date(a.creadoEn));
  saveJSON(WEB_CENTER_KEY, merged);
  return merged;
}

export function marcarLeido(notifId, usuario) {
  const all = loadJSON(WEB_CENTER_KEY, []);
  const idx = all.findIndex(n => n.id === notifId && (!usuario || n.para === usuario));
  if (idx === -1) return { success: false, message: 'No encontrada' };
  if (!all[idx].leidoEn) all[idx].leidoEn = new Date().toISOString();
  saveJSON(WEB_CENTER_KEY, all);
  return { success: true };
}

export function cerrarNotificacion(notifId, usuario, comentario = '') {
  const all = loadJSON(WEB_CENTER_KEY, []);
  const idx = all.findIndex(n => n.id === notifId && (!usuario || n.para === usuario));
  if (idx === -1) return { success: false, message: 'No encontrada' };
  all[idx].cerrado = { usuario, comentario, fecha: new Date().toISOString() };
  saveJSON(WEB_CENTER_KEY, all);
  return { success: true };
}

// Outbox + Email log
export function listarOutbox() {
  return loadJSON(OUTBOX_KEY, []);
}

function saveOutbox(items) {
  saveJSON(OUTBOX_KEY, items);
}

export function listarEmailLog() {
  return loadJSON(EMAIL_LOG_KEY, []);
}

function pushEmailLog(entry) {
  const log = listarEmailLog();
  log.unshift(entry);
  saveJSON(EMAIL_LOG_KEY, log.slice(0, 200));
}

// Template renderer muy simple
function renderTemplate(tpl, ctx) {
  return String(tpl || '').replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const k = String(key || '').trim();
    return ctx?.[k] != null ? String(ctx[k]) : '';
  });
}

// Simulación de envío de correo (puede fallar)
function simulateEmailSend({ to, subject, body }, settings) {
  const { failureRate } = settings.email;
  // resultado aleatorio en demo
  const fail = Math.random() < (typeof failureRate === 'number' ? failureRate : 0.2);
  if (fail) {
    const err = new Error('SMTP simulado: fallo temporal');
    return { success: false, error: err.message };
  }
  return { success: true, id: generarId('email') };
}

// Encola una alerta para envío multicanal
export function enviarAlertaMulticanal(alerta, destinatarios = []) {
  const settings = getSettings();
  const nowIso = new Date().toISOString();
  const centerEntries = [];
  const outboxEntries = listarOutbox();

  const link = `${window.location.origin}/dashboard`;

  destinatarios.forEach(d => {
    const usuario = d?.usuario || d?.email || 'ops';
    const email = d?.email;

    if (settings.canales.web) {
      centerEntries.push({
        id: generarId('notif'),
        alertaId: alerta.id || generarId('alerta'),
        para: usuario,
        titulo: alerta.titulo,
        detalle: alerta.detalle,
        severidad: alerta.severidad,
        creadoEn: nowIso,
        leidoEn: null,
        cerrado: null
      });
    }

    if (settings.canales.email && email && validarEmail(email)) {
      const ctx = {
        usuario,
        titulo: alerta.titulo,
        detalle: alerta.detalle,
        severidad: alerta.severidad,
        timestamp: alerta.timestamp || nowIso,
        link
      };
      const subject = renderTemplate(settings.email.asuntoTemplate, ctx);
      const body = renderTemplate(settings.email.cuerpoTemplate, ctx);
      outboxEntries.unshift({
        id: generarId('out'),
        alertaId: alerta.id || null,
        to: email,
        subject,
        body,
        attempts: 0,
        maxAttempts: settings.email.maxAttempts || 3,
        nextAttemptAt: new Date(Date.now()).toISOString(),
        lastError: null,
        status: 'pending'
      });
    }
  });

  if (centerEntries.length) upsertCentro(centerEntries);
  saveOutbox(outboxEntries);
  return { success: true, creadosWeb: centerEntries.length, encoladosEmail: outboxEntries.length };
}

// Procesa outbox con backoff exponencial
export function processOutbox(nowTs = Date.now()) {
  const settings = getSettings();
  const base = settings.email.backoffBaseMs || 2000;
  const items = listarOutbox();
  let changed = false;
  const updated = items.map(item => {
    if (item.status === 'sent') return item;
    if (new Date(item.nextAttemptAt).getTime() > nowTs) return item;

    // intentar
    const res = simulateEmailSend({ to: item.to, subject: item.subject, body: item.body }, settings);
    if (res.success) {
      changed = true;
      const sent = { ...item, status: 'sent', attempts: item.attempts + 1, lastError: null, sentAt: new Date(nowTs).toISOString() };
      pushEmailLog({ id: res.id, to: item.to, subject: item.subject, fecha: sent.sentAt });
      return sent;
    } else {
      const attempts = item.attempts + 1;
      const shouldRetry = attempts < (item.maxAttempts || 3);
      const nextDelay = base * Math.pow(2, attempts - 1);
      const next = {
        ...item,
        attempts,
        lastError: res.error || 'Error desconocido',
        status: shouldRetry ? 'pending' : 'failed',
        nextAttemptAt: new Date(nowTs + nextDelay).toISOString()
      };
      changed = true;
      return next;
    }
  });
  if (changed) saveOutbox(updated);
  return { success: true, updated: changed, items: updated };
}

let workerHandle = null;
export function startWorker(intervalMs = 2000) {
  if (workerHandle) return;
  workerHandle = setInterval(() => {
    try { processOutbox(Date.now()); } catch { /* noop */ }
  }, intervalMs);
}

export function stopWorker() {
  if (workerHandle) clearInterval(workerHandle);
  workerHandle = null;
}

export function forceRetry(outId) {
  const items = listarOutbox();
  const idx = items.findIndex(i => i.id === outId);
  if (idx === -1) return { success: false };
  items[idx].nextAttemptAt = new Date(Date.now()).toISOString();
  items[idx].status = 'pending';
  saveOutbox(items);
  return { success: true };
}

export default {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  listarCentro,
  marcarLeido,
  cerrarNotificacion,
  enviarAlertaMulticanal,
  listarOutbox,
  listarEmailLog,
  processOutbox,
  startWorker,
  stopWorker,
  forceRetry
};

