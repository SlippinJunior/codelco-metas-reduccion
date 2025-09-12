/**
 * servicioAuditoria.js
 * Servicio simple de auditoría para prototipo.
 * Almacena eventos en localStorage y permite filtrar, paginar y exportar a CSV.
 * En producción, reemplazar por llamadas a API de auditoría centralizada.
 */

import auditoriaEjemplo from '../../data/auditoria-ejemplo.json';

const STORAGE_KEY = 'codelco_auditoria_events';

function inicializar() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auditoriaEjemplo));
  }
}

export async function listarEventos({ usuario, rol, entidad, accion, inicio, fin, page = 1, pageSize = 20, q = '' } = {}) {
  inicializar();
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  let items = all.slice();

  if (usuario) items = items.filter(e => e.usuario === usuario);
  if (rol) items = items.filter(e => e.rol === rol);
  if (entidad) items = items.filter(e => e.entidad === entidad);
  if (accion) items = items.filter(e => e.accion === accion);
  if (inicio) items = items.filter(e => new Date(e.fecha_hora) >= new Date(inicio));
  if (fin) items = items.filter(e => new Date(e.fecha_hora) <= new Date(fin));
  if (q) {
    const qLower = q.toLowerCase();
    items = items.filter(e => (e.motivo || '').toLowerCase().includes(qLower) || (e.entidad_id || '').toLowerCase().includes(qLower) || JSON.stringify(e.detalle_anterior || '').toLowerCase().includes(qLower) || JSON.stringify(e.detalle_nuevo || '').toLowerCase().includes(qLower));
  }

  // Ordenar por fecha desc
  items.sort((a,b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return { success: true, data: paged, total };
}

export async function agregarEvento(evento) {
  inicializar();
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const nuevo = { id: `evt-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, ...evento };
  all.push(nuevo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return { success: true, data: nuevo };
}

export async function exportarEventosCSV({ usuario, rol, entidad, accion, inicio, fin, q } = {}) {
  // Usa listarEventos para mantener filtros
  const resultado = await listarEventos({ usuario, rol, entidad, accion, inicio, fin, q, page: 1, pageSize: 10000 });
  if (!resultado.success) return resultado;
  const rows = resultado.data;

  const headers = ['id','fecha_hora','usuario','rol','accion','entidad','entidad_id','motivo','detalle_anterior','detalle_nuevo','ip_origen'];

  const csvRows = [headers.join(',')];

  rows.forEach(r => {
    const safe = v => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return `"${s.replace(/"/g,'""')}"`;
    };
    csvRows.push([
      safe(r.id),
      safe(r.fecha_hora),
      safe(r.usuario),
      safe(r.rol),
      safe(r.accion),
      safe(r.entidad),
      safe(r.entidad_id),
      safe(r.motivo),
      safe(r.detalle_anterior),
      safe(r.detalle_nuevo),
      safe(r.ip_origen)
    ].join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `auditoria-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Registrar evento de exportación
  try { await agregarEvento({ usuario: 'sistema', rol: 'sistema', accion: 'exportar', entidad: 'auditoria', fecha_hora: new Date().toISOString(), motivo: 'Exportación CSV desde interfaz' }); } catch (e) { /* ignore */ }

  return { success: true, message: `Exportado ${rows.length} eventos` };
}

export default { listarEventos, agregarEvento, exportarEventosCSV };
