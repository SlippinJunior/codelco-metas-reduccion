import sensoresEjemplo from '../../data/sensores-ejemplo.json';
import servicioAuditoria from './servicioAuditoria';
import servicioAnomalias from './servicioAnomalias';
import { generarId } from '../utils/helpers';
import { arrayToCsv, downloadCsv } from '../utils/csv';

export const ESTADOS_SENSOR = Object.freeze([
  'operativo',
  'mantenimiento',
  'alerta',
  'baja'
]);

const ESTADO_POR_DEFECTO = ESTADOS_SENSOR[0];
const STORAGE_KEY = 'codelco_sensores_demo';
const simulacionesActivas = new Map();
const MAX_REGISTROS = 100;
const MAX_BITACORA = 200;

function normalizarSensor(sensor) {
  if (!sensor || typeof sensor !== 'object') {
    return sensor;
  }

  const bitacora = Array.isArray(sensor.bitacoraEstados)
    ? sensor.bitacoraEstados
        .filter(evento => evento && typeof evento === 'object')
        .map(evento => ({
          ...evento,
          sensorId: evento.sensorId || sensor.id,
          fecha: evento.fecha || evento.fecha_hora || evento.timestamp || new Date().toISOString(),
          descripcion: evento.descripcion ?? evento.detalle ?? '',
          estado: evento.estado || sensor.estado || 'operativo',
          origen: evento.origen || 'historial',
          usuario: evento.usuario || evento.operador || 'sistema-demo'
        }))
    : [];

  const estadoNormalizado = ESTADOS_SENSOR.includes(sensor.estado)
    ? sensor.estado
    : ESTADO_POR_DEFECTO;

  return {
    ...sensor,
    estado: estadoNormalizado,
    bitacoraEstados: bitacora.slice(0, MAX_BITACORA)
  };
}

function normalizarSensores(sensores = []) {
  if (!Array.isArray(sensores)) {
    return [];
  }
  return sensores.map(sensor => normalizarSensor({ ...sensor }));
}

function tieneLocalStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage;
  } catch (error) {
    return false;
  }
}

function inicializarStorage() {
  if (!tieneLocalStorage()) return [];
  const existente = window.localStorage.getItem(STORAGE_KEY);
  if (!existente) {
    const inicial = normalizarSensores(sensoresEjemplo);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
    return inicial;
  }
  try {
    const parsed = JSON.parse(existente);
    if (Array.isArray(parsed)) {
      const normalizados = normalizarSensores(parsed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizados));
      return normalizados;
    }
    const fallback = normalizarSensores(sensoresEjemplo);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  } catch (error) {
    const fallback = normalizarSensores(sensoresEjemplo);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function leerSensores() {
  if (!tieneLocalStorage()) return normalizarSensores(sensoresEjemplo);
  const almacenados = window.localStorage.getItem(STORAGE_KEY);
  if (!almacenados) {
    return inicializarStorage();
  }
  try {
    const parsed = JSON.parse(almacenados);
    if (Array.isArray(parsed)) {
      return normalizarSensores(parsed);
    }
    return inicializarStorage();
  } catch (error) {
    return inicializarStorage();
  }
}

function guardarSensores(sensores) {
  if (!tieneLocalStorage()) return;
  const preparados = normalizarSensores(sensores);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preparados));
}

function notificarActualizacion(sensorId) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('sensores:actualizado', { detail: { sensorId } }));
  }
}

export function validarSensor(data) {
  const errores = {};
  if (!data.nombre || !data.nombre.trim()) {
    errores.nombre = 'El nombre del sensor es obligatorio.';
  }
  if (!data.tipo) {
    errores.tipo = 'Debe seleccionar un tipo de sensor.';
  }
  if (!data.division || !data.division.trim()) {
    errores.division = 'Debe indicar la división o ubicación.';
  }
  if (!data.protocolo) {
    errores.protocolo = 'Debe seleccionar un protocolo.';
  }
  if (!data.frecuenciaSegundos || Number(data.frecuenciaSegundos) <= 0) {
    errores.frecuenciaSegundos = 'La frecuencia de muestreo debe ser mayor a 0 segundos.';
  }

  if (data.protocolo === 'MQTT') {
    if (!data.credenciales?.topic || !data.credenciales.topic.trim()) {
      errores.topic = 'Debe indicar el topic MQTT.';
    }
  }

  if (data.protocolo === 'HTTP') {
    const endpoint = data.credenciales?.endpoint;
    try {
      if (!endpoint) throw new Error('Endpoint requerido');
      const url = new URL(endpoint);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Protocolo HTTP/HTTPS requerido');
      }
    } catch (error) {
      errores.endpoint = 'Debe indicar un endpoint HTTP/HTTPS válido.';
    }
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
}

export function listarSensores() {
  const sensores = leerSensores();
  sensores.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return {
    success: true,
    data: sensores
  };
}

export function obtenerSensor(id) {
  const sensores = leerSensores();
  const sensor = sensores.find(s => s.id === id);
  if (!sensor) {
    return { success: false, message: 'Sensor no encontrado' };
  }
  return { success: true, data: sensor };
}

export async function crearSensor(data) {
  const validacion = validarSensor(data);
  if (!validacion.esValido) {
    return { success: false, errors: validacion.errores };
  }

  const sensores = leerSensores();
  const nuevoSensor = {
    id: generarId('sensor'),
    nombre: data.nombre.trim(),
    tipo: data.tipo,
    division: data.division.trim(),
    protocolo: data.protocolo,
    credenciales: {
      topic: data.protocolo === 'MQTT' ? data.credenciales?.topic?.trim() : undefined,
      endpoint: data.protocolo === 'HTTP' ? data.credenciales?.endpoint?.trim() : undefined,
      secreto: data.credenciales?.secreto?.trim() || null
    },
    frecuenciaSegundos: Number(data.frecuenciaSegundos),
    descripcion: data.descripcion?.trim() || '',
  estado: ESTADO_POR_DEFECTO,
    ultimaTransmision: null,
    historialTransmisiones: [],
    acuses: [],
    bitacoraEstados: [],
    ultimaActualizacionEstado: null,
    simulacionActiva: false
  };

  sensores.push(nuevoSensor);
  guardarSensores(sensores);
  notificarActualizacion(nuevoSensor.id);

  try {
    await servicioAuditoria.agregarEvento?.({
      usuario: 'demo-usuario',
      rol: 'operador',
      accion: 'crear',
      entidad: 'sensores',
      entidad_id: nuevoSensor.id,
      motivo: 'Alta de sensor desde prototipo',
      fecha_hora: new Date().toISOString(),
      detalle_nuevo: nuevoSensor,
      detalle_anterior: null,
      ip_origen: '127.0.0.1'
    });
  } catch (error) {
    // Ignorar fallas de auditoría en demo
  }

  return { success: true, data: nuevoSensor };
}

export async function actualizarSensor(id, cambios = {}) {
  const sensores = leerSensores();
  const indice = sensores.findIndex(s => s.id === id);
  if (indice === -1) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const anterior = { ...sensores[indice] };
  sensores[indice] = { ...sensores[indice], ...cambios };
  guardarSensores(sensores);
  notificarActualizacion(id);

  try {
    await servicioAuditoria.agregarEvento?.({
      usuario: 'demo-usuario',
      rol: 'operador',
      accion: 'modificar',
      entidad: 'sensores',
      entidad_id: id,
      motivo: 'Actualización de sensor en prototipo',
      fecha_hora: new Date().toISOString(),
      detalle_nuevo: sensores[indice],
      detalle_anterior: anterior,
      ip_origen: '127.0.0.1'
    });
  } catch (error) {
    // noop
  }

  return { success: true, data: sensores[indice] };
}

export async function eliminarSensor(id) {
  const sensores = leerSensores();
  const indice = sensores.findIndex(s => s.id === id);
  if (indice === -1) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const eliminado = sensores.splice(indice, 1)[0];
  guardarSensores(sensores);
  detenerSimulacionAutomatica(id);
  notificarActualizacion(id);

  try {
    await servicioAuditoria.agregarEvento?.({
      usuario: 'demo-usuario',
      rol: 'operador',
      accion: 'eliminar',
      entidad: 'sensores',
      entidad_id: id,
      motivo: 'Eliminación de sensor en prototipo',
      fecha_hora: new Date().toISOString(),
      detalle_nuevo: null,
      detalle_anterior: eliminado,
      ip_origen: '127.0.0.1'
    });
  } catch (error) {
    // noop
  }

  return { success: true };
}

function generarPayloadTipo(sensor) {
  switch (sensor.tipo) {
    case 'combustible':
      return {
        consumo_litros: Number((20 + Math.random() * 20).toFixed(1)),
        rpm_motor: Math.floor(1500 + Math.random() * 600),
        temperatura_motor: Number((70 + Math.random() * 15).toFixed(1))
      };
    case 'electricidad':
      return {
        energia_kwh: Number((1100 + Math.random() * 400).toFixed(1)),
        factor_potencia: Number((0.9 + Math.random() * 0.1).toFixed(2))
      };
    case 'temperatura':
      return {
        temperatura_c: Number((1150 + Math.random() * 50).toFixed(1)),
        alarma: Math.random() > 0.95
      };
    case 'flujo':
      return {
        caudal_m3_h: Number((400 + Math.random() * 80).toFixed(1)),
        presion_bar: Number((3 + Math.random() * 0.6).toFixed(2))
      };
    default:
      return {
        valor: Number((Math.random() * 100).toFixed(2))
      };
  }
}

function construirLecturaAnomalia(sensor, paquete) {
  const mapa = {
    combustible: { key: 'consumo_litros', unidad: 'L', tipo: 'consumo_diesel' },
    electricidad: { key: 'energia_kwh', unidad: 'kWh', tipo: 'energia_kwh' },
    temperatura: { key: 'temperatura_c', unidad: '°C', tipo: 'temperatura_c' },
    flujo: { key: 'caudal_m3_h', unidad: 'm3/h', tipo: 'caudal_m3_h' }
  };

  const config = mapa[sensor.tipo] || { key: 'valor', unidad: sensor.unidad || 'u', tipo: sensor.tipo };
  const valor = paquete.payload?.[config.key];
  if (typeof valor !== 'number') {
    return null;
  }

  return {
    sensorId: sensor.id,
    division: sensor.division,
    timestamp: paquete.timestamp,
    valor: Number(valor),
    unidad: config.unidad,
    tipo: config.tipo,
    participaEnCalculos: true,
    anomalia: false,
    motivos: [],
    scoreAnomalia: 0,
    valida: {
      estado: 'pendiente',
      usuario: null,
      comentario: null,
      fecha: null
    },
    historialValidaciones: [],
    origen: 'simulada'
  };
}

export function enviarAcuse(sensorId, paquete) {
  const sensores = leerSensores();
  const indice = sensores.findIndex(s => s.id === sensorId);
  if (indice === -1) {
    return { success: false, message: 'Sensor no encontrado para acuse' };
  }

  const acuse = {
    id: generarId('ack'),
    paqueteId: paquete.id,
    sensorId,
    fecha_hora_acuse: new Date().toISOString(),
    estado: 'recibido',
    mensaje: paquete.protocolo === 'MQTT'
      ? 'Paquete confirmado por broker MQTT simulado.'
      : 'Respuesta 200 desde endpoint HTTP simulado.'
  };

  const sensor = sensores[indice];
  sensor.acuses = [acuse, ...(sensor.acuses || [])].slice(0, MAX_REGISTROS);
  guardarSensores(sensores);
  notificarActualizacion(sensorId);

  return { success: true, data: acuse };
}

export function simularRecepcion(sensorId) {
  const sensores = leerSensores();
  const indice = sensores.findIndex(s => s.id === sensorId);
  if (indice === -1) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const sensor = sensores[indice];
  const paquete = {
    id: generarId('pkg'),
    timestamp: new Date().toISOString(),
    payload: generarPayloadTipo(sensor),
    protocolo: sensor.protocolo
  };

  sensor.historialTransmisiones = [paquete, ...(sensor.historialTransmisiones || [])].slice(0, MAX_REGISTROS);
  sensor.ultimaTransmision = paquete.timestamp;
  sensores[indice] = sensor;
  guardarSensores(sensores);

  const acuseResultado = enviarAcuse(sensorId, paquete);
  try {
    const lecturaAnomalia = construirLecturaAnomalia(sensor, paquete);
    if (lecturaAnomalia) {
      servicioAnomalias.registrarLectura(lecturaAnomalia, { recalcular: true });
    }
  } catch (error) {
    console.warn('No se pudo registrar lectura para módulo de anomalías', error);
  }
  notificarActualizacion(sensorId);

  return { success: true, data: { paquete, acuse: acuseResultado.success ? acuseResultado.data : null } };
}

export function iniciarSimulacionAutomatica(sensorId) {
  const sensores = leerSensores();
  const sensor = sensores.find(s => s.id === sensorId);
  if (!sensor) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const frecuencia = Math.max(1, Number(sensor.frecuenciaSegundos) || 30);

  if (simulacionesActivas.has(sensorId)) {
    clearInterval(simulacionesActivas.get(sensorId));
  }

  const intervalo = setInterval(() => {
    simularRecepcion(sensorId);
  }, frecuencia * 1000);

  simulacionesActivas.set(sensorId, intervalo);

  sensor.simulacionActiva = true;
  guardarSensores(sensores);
  notificarActualizacion(sensorId);

  return { success: true, data: { sensorId, frecuencia, intervalo } };
}

export function detenerSimulacionAutomatica(sensorId) {
  if (simulacionesActivas.has(sensorId)) {
    clearInterval(simulacionesActivas.get(sensorId));
    simulacionesActivas.delete(sensorId);
  }

  const sensores = leerSensores();
  const indice = sensores.findIndex(s => s.id === sensorId);
  if (indice !== -1 && sensores[indice].simulacionActiva) {
    sensores[indice].simulacionActiva = false;
    guardarSensores(sensores);
    notificarActualizacion(sensorId);
  }

  return { success: true };
}

export function detenerTodasLasSimulaciones() {
  simulacionesActivas.forEach(intervalo => clearInterval(intervalo));
  simulacionesActivas.clear();

  const sensores = leerSensores().map(sensor => ({ ...sensor, simulacionActiva: false }));
  guardarSensores(sensores);
}

export function registrarEstadoSensor(sensorId, nuevoEstado, descripcion = '', opciones = {}) {
  if (!nuevoEstado) {
    return { success: false, message: 'Debe indicar el nuevo estado del sensor' };
  }

  if (!ESTADOS_SENSOR.includes(nuevoEstado)) {
    return { success: false, message: 'Estado no reconocido' };
  }

  const sensores = leerSensores();
  const indice = sensores.findIndex(sensor => sensor.id === sensorId);
  if (indice === -1) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const sensor = { ...sensores[indice] };
  const evento = {
    id: generarId('estado'),
    sensorId,
    estado: nuevoEstado,
    descripcion: descripcion?.trim() || '',
    fecha: new Date().toISOString(),
    usuario: opciones.usuario || 'demo-usuario',
    origen: opciones.origen || 'manual',
    criticidad: opciones.criticidad || 'media'
  };

  sensor.estado = nuevoEstado;
  const bitacora = Array.isArray(sensor.bitacoraEstados) ? sensor.bitacoraEstados.slice() : [];
  sensor.bitacoraEstados = [evento, ...bitacora].slice(0, MAX_BITACORA);
  sensor.ultimaActualizacionEstado = evento.fecha;

  sensores[indice] = sensor;
  guardarSensores(sensores);
  notificarActualizacion(sensorId);

  try {
    servicioAuditoria.agregarEvento?.({
      usuario: evento.usuario,
      rol: opciones.rol || 'operador',
      accion: 'actualizar-estado',
      entidad: 'sensores',
      entidad_id: sensorId,
      motivo: 'Cambio de estado de sensor desde prototipo',
      fecha_hora: evento.fecha,
      detalle_nuevo: { estado: nuevoEstado, descripcion: evento.descripcion },
      detalle_anterior: opciones.estadoAnterior || null,
      ip_origen: '127.0.0.1'
    });
  } catch (error) {
    // Ignorar errores de auditoría en demo
  }

  return { success: true, data: sensor };
}

function normalizarFechaFiltro(valor) {
  if (!valor) return null;
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  if (typeof valor === 'string') {
    if (valor.length >= 10) {
      return valor.slice(0, 10);
    }
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return fecha.toISOString().slice(0, 10);
    }
  }
  return null;
}

export function listarBitacoraSensor(sensorId, filtros = {}) {
  const sensores = leerSensores();
  const sensor = sensores.find(s => s.id === sensorId);
  if (!sensor) {
    return { success: false, message: 'Sensor no encontrado' };
  }

  const bitacora = Array.isArray(sensor.bitacoraEstados) ? sensor.bitacoraEstados : [];
  const fechaDesde = normalizarFechaFiltro(filtros.desde);
  const fechaHasta = normalizarFechaFiltro(filtros.hasta);

  if (!fechaDesde && !fechaHasta) {
    return { success: true, data: bitacora, sensor };
  }

  const filtrados = bitacora.filter(evento => {
    if (!evento) return false;
    const fechaEvento = normalizarFechaFiltro(evento.fecha || evento.fecha_hora || evento.timestamp);
    if (!fechaEvento) return false;
    if (fechaDesde && fechaEvento < fechaDesde) return false;
    if (fechaHasta && fechaEvento > fechaHasta) return false;
    return true;
  });

  return { success: true, data: filtrados, sensor };
}

export function exportarBitacoraSensor(sensorId, filtros = {}) {
  const resultado = listarBitacoraSensor(sensorId, filtros);
  if (!resultado.success) {
    return resultado;
  }

  const { data: eventos, sensor } = resultado;
  if (!eventos.length) {
    return { success: false, message: 'No hay eventos en el rango solicitado.' };
  }

  const headers = [
    { key: 'fecha', label: 'fecha' },
    { key: 'estado', label: 'estado' },
    { key: 'usuario', label: 'usuario' },
    { key: 'descripcion', label: 'descripcion' },
    { key: 'origen', label: 'origen' }
  ];

  const rows = eventos.map(evento => ({
    fecha: normalizarFechaFiltro(evento.fecha || evento.fecha_hora || evento.timestamp) || evento.fecha || '',
    estado: evento.estado || ESTADO_POR_DEFECTO,
    usuario: evento.usuario || 'demo-usuario',
    descripcion: evento.descripcion || evento.comentario || '',
    origen: evento.origen || 'manual'
  }));

  const csv = arrayToCsv(headers, rows);
  const nombreArchivo = `bitacora_${sensor?.id || sensorId}_${Date.now()}.csv`;
  downloadCsv(nombreArchivo, csv);

  return {
    success: true,
    data: {
      nombreArchivo,
      total: rows.length
    }
  };
}

export function suscribirseActualizaciones(callback) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return { unsubscribe: () => {} };
  }

  const handler = (event) => callback?.(event.detail || {});
  window.addEventListener('sensores:actualizado', handler);

  return {
    unsubscribe: () => window.removeEventListener('sensores:actualizado', handler)
  };
}

export default {
  validarSensor,
  listarSensores,
  obtenerSensor,
  crearSensor,
  actualizarSensor,
  eliminarSensor,
  simularRecepcion,
  iniciarSimulacionAutomatica,
  detenerSimulacionAutomatica,
  detenerTodasLasSimulaciones,
  enviarAcuse,
  registrarEstadoSensor,
  listarBitacoraSensor,
  exportarBitacoraSensor,
  suscribirseActualizaciones
};
