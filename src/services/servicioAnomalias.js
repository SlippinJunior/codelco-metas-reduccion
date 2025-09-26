import lecturasSeed from '../../data/lecturas-ejemplo.json';
import servicioAuditoria from './servicioAuditoria';
import { arrayToCsv, downloadCsv } from '../utils/csv';
import { generarId } from '../utils/helpers';

const STORAGE_KEY_LECTURAS = 'codelco_anomalias_demo';
const STORAGE_KEY_REGLAS = 'codelco_anomalias_reglas';
const STORAGE_KEY_CONFIG = 'codelco_anomalias_config';

const DEFAULT_RULES = {
  consumo_diesel: {
    etiqueta: 'Consumo de Diésel',
    rango: { min: 28, max: 40 },
    salto: { deltaMax: 4 },
    zscore: { ventana: 10, umbral: 2.5 }
  },
  energia_kwh: {
    etiqueta: 'Energía Eléctrica',
    rango: { min: 1180, max: 1400 },
    salto: { deltaMax: 90 },
    zscore: { ventana: 12, umbral: 2.8 }
  },
  temperatura_c: {
    etiqueta: 'Temperatura Horno',
    rango: { min: 1150, max: 1210 },
    salto: { deltaMax: 25 },
    zscore: { ventana: 15, umbral: 3 }
  },
  caudal_m3_h: {
    etiqueta: 'Caudal Agua',
    rango: { min: 390, max: 460 },
    salto: { deltaMax: 25 },
    zscore: { ventana: 12, umbral: 2.5 }
  }
};

const DEFAULT_CONFIG = {
  tamanioPagina: 15,
  orden: { columna: 'timestamp', direccion: 'desc' }
};

const SUSCRIPTORES = new Set();

function tieneLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (error) {
    return false;
  }
}

function clonProfundo(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function inicializarLecturas() {
  if (!tieneLocalStorage()) {
    return lecturasSeed.map(normalizarLectura);
  }

  const existente = window.localStorage.getItem(STORAGE_KEY_LECTURAS);
  if (!existente) {
    const normalizadas = lecturasSeed.map(normalizarLectura);
    window.localStorage.setItem(STORAGE_KEY_LECTURAS, JSON.stringify(normalizadas));
    return normalizadas;
  }

  try {
    const parseadas = JSON.parse(existente);
    if (Array.isArray(parseadas)) {
      const saneadas = parseadas.map(normalizarLectura);
      window.localStorage.setItem(STORAGE_KEY_LECTURAS, JSON.stringify(saneadas));
      return saneadas;
    }
    throw new Error('Formato inválido en almacenamiento de lecturas');
  } catch (error) {
    const normalizadas = lecturasSeed.map(normalizarLectura);
    window.localStorage.setItem(STORAGE_KEY_LECTURAS, JSON.stringify(normalizadas));
    return normalizadas;
  }
}

function leerLecturasRaw() {
  if (!tieneLocalStorage()) {
    return lecturasSeed.map(normalizarLectura);
  }
  const data = window.localStorage.getItem(STORAGE_KEY_LECTURAS);
  if (!data) {
    return inicializarLecturas();
  }
  try {
    const parseadas = JSON.parse(data);
    if (Array.isArray(parseadas)) {
      return parseadas.map(normalizarLectura);
    }
    return inicializarLecturas();
  } catch (error) {
    return inicializarLecturas();
  }
}

function guardarLecturas(lecturas) {
  if (!tieneLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEY_LECTURAS, JSON.stringify(lecturas));
}

function obtenerReglas() {
  if (!tieneLocalStorage()) {
    return clonProfundo(DEFAULT_RULES);
  }
  const guardadas = window.localStorage.getItem(STORAGE_KEY_REGLAS);
  if (!guardadas) {
    window.localStorage.setItem(STORAGE_KEY_REGLAS, JSON.stringify(DEFAULT_RULES));
    return clonProfundo(DEFAULT_RULES);
  }
  try {
    const parseadas = JSON.parse(guardadas);
    return { ...clonProfundo(DEFAULT_RULES), ...parseadas };
  } catch (error) {
    window.localStorage.setItem(STORAGE_KEY_REGLAS, JSON.stringify(DEFAULT_RULES));
    return clonProfundo(DEFAULT_RULES);
  }
}

function guardarReglas(reglas) {
  if (!tieneLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEY_REGLAS, JSON.stringify(reglas));
}

function obtenerConfig() {
  if (!tieneLocalStorage()) {
    return clonProfundo(DEFAULT_CONFIG);
  }
  const guardado = window.localStorage.getItem(STORAGE_KEY_CONFIG);
  if (!guardado) {
    window.localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    return clonProfundo(DEFAULT_CONFIG);
  }
  try {
    const parseado = JSON.parse(guardado);
    return { ...clonProfundo(DEFAULT_CONFIG), ...parseado };
  } catch (error) {
    window.localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    return clonProfundo(DEFAULT_CONFIG);
  }
}

function guardarConfig(config) {
  if (!tieneLocalStorage()) return;
  const merged = { ...obtenerConfig(), ...config };
  window.localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
}

function notificarCambios(payload = {}) {
  SUSCRIPTORES.forEach(cb => {
    try {
      cb(payload);
    } catch (error) {
      console.warn('Suscriptor de anomalías lanzó error', error);
    }
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('anomalias:actualizado', { detail: payload }));
  }
}

function normalizarLectura(lectura) {
  const base = {
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
    origen: 'historico'
  };

  return {
    ...base,
    ...lectura,
    valida: {
      ...base.valida,
      ...(lectura?.valida || {})
    },
    motivos: Array.isArray(lectura?.motivos) ? lectura.motivos : [],
    historialValidaciones: Array.isArray(lectura?.historialValidaciones)
      ? lectura.historialValidaciones
      : []
  };
}

function calcularMedia(valores) {
  if (!valores.length) return 0;
  return valores.reduce((suma, val) => suma + val, 0) / valores.length;
}

function calcularDesviacionEstandar(valores) {
  if (valores.length < 2) return 0;
  const media = calcularMedia(valores);
  const suma = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0);
  return Math.sqrt(suma / (valores.length - 1));
}

function detectarAnomalias(lecturas, reglas = null) {
  const reglasEvaluar = reglas || obtenerReglas();
  const mapaOriginal = new Map(lecturas.map(l => [l.id, l]));
  const ordenCronologico = [...lecturas].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const historicoPorSensor = new Map();
  const resultados = new Map();

  ordenCronologico.forEach(lectura => {
    const copia = normalizarLectura(mapaOriginal.get(lectura.id));
    const reglasTipo = reglasEvaluar[copia.tipo] || {};
    const motivos = [];
    let score = 0;

    const historico = historicoPorSensor.get(copia.sensorId) || [];
    const ultimo = historico[historico.length - 1];

    if (reglasTipo?.rango) {
      const { min, max } = reglasTipo.rango;
      if (typeof min === 'number' && copia.valor < min) {
        motivos.push({ regla: 'rango', detalle: `Valor ${copia.valor} < mínimo ${min}` });
        score = Math.max(score, (min - copia.valor) / Math.max(1, Math.abs(min)) + 1);
      }
      if (typeof max === 'number' && copia.valor > max) {
        motivos.push({ regla: 'rango', detalle: `Valor ${copia.valor} > máximo ${max}` });
        score = Math.max(score, (copia.valor - max) / Math.max(1, Math.abs(max)) + 1);
      }
    }

    if (ultimo && reglasTipo?.salto?.deltaMax != null) {
      const delta = Math.abs(copia.valor - ultimo.valor);
      if (delta > reglasTipo.salto.deltaMax) {
        motivos.push({
          regla: 'salto',
          detalle: `Variación ${delta.toFixed(2)} supera umbral ${reglasTipo.salto.deltaMax}`
        });
        score = Math.max(score, delta / reglasTipo.salto.deltaMax + 0.8);
      }
    }

    if (reglasTipo?.zscore) {
      const ventana = Math.max(3, reglasTipo.zscore.ventana || 10);
      const valoresVentana = historico.slice(-ventana + 1).map(item => item.valor);
      if (valoresVentana.length >= 2) {
        const media = calcularMedia(valoresVentana);
        const desviacion = calcularDesviacionEstandar(valoresVentana);
        if (desviacion > 0) {
          const z = Math.abs((copia.valor - media) / desviacion);
          if (z > (reglasTipo.zscore.umbral || 3)) {
            motivos.push({
              regla: 'outlier',
              detalle: `Z-score ${z.toFixed(2)} supera ${reglasTipo.zscore.umbral || 3}`
            });
            score = Math.max(score, z);
          }
        }
      }
    }

    copia.anomalia = motivos.length > 0;
    copia.motivos = motivos;
    copia.scoreAnomalia = Number(score.toFixed(3));

    historico.push({ valor: copia.valor, timestamp: copia.timestamp, id: copia.id });
    historicoPorSensor.set(copia.sensorId, historico);
    resultados.set(copia.id, copia);
  });

  return lecturas.map(original => resultados.get(original.id) || original);
}

function filtrarLecturas(lecturas, filtros = {}) {
  const {
    sensorId,
    division,
    tipo,
    estado,
    fechaInicio,
    fechaFin,
    soloAnomalias = false
  } = filtros;

  return lecturas.filter(lectura => {
    if (soloAnomalias && !lectura.anomalia) return false;
    if (sensorId && lectura.sensorId !== sensorId) return false;
    if (division && lectura.division !== division) return false;
    if (tipo && lectura.tipo !== tipo) return false;
    if (estado && lectura.valida?.estado !== estado) return false;
    if (fechaInicio && new Date(lectura.timestamp) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(lectura.timestamp) > new Date(fechaFin)) return false;
    return true;
  });
}

function ordenarLecturas(lecturas, columna, direccion = 'desc') {
  const factor = direccion === 'asc' ? 1 : -1;
  return [...lecturas].sort((a, b) => {
    const valorA = a[columna];
    const valorB = b[columna];
    if (valorA == null && valorB == null) return 0;
    if (valorA == null) return 1 * factor;
    if (valorB == null) return -1 * factor;
    if (columna === 'timestamp') {
      return (new Date(valorA) - new Date(valorB)) * factor;
    }
    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return (valorA - valorB) * factor;
    }
    return String(valorA).localeCompare(String(valorB)) * factor;
  });
}

function paginarLecturas(lecturas, pagina = 1, tamanio = 15) {
  const total = lecturas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanio));
  const paginaSegura = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaSegura - 1) * tamanio;
  const fin = inicio + tamanio;
  return {
    pagina: paginaSegura,
    total,
    totalPaginas,
    items: lecturas.slice(inicio, fin)
  };
}

function recalcularPersistido() {
  const lecturas = leerLecturasRaw();
  const reglas = obtenerReglas();
  const recalculadas = detectarAnomalias(lecturas, reglas);
  guardarLecturas(recalculadas);
  return recalculadas;
}

async function registrarEventoAuditoria({ lectura, accion, usuario, comentario, estado }) {
  try {
    await servicioAuditoria.agregarEvento?.({
      usuario: usuario || 'demo-usuario',
      rol: 'tecnico',
      accion,
      entidad: 'lecturas-anomalias',
      entidad_id: lectura.id,
      motivo: comentario || `Validación ${estado}`,
      fecha_hora: new Date().toISOString(),
      detalle_anterior: null,
      detalle_nuevo: {
        id: lectura.id,
        estado,
        sensorId: lectura.sensorId,
        motivos: lectura.motivos,
        valor: lectura.valor
      },
      ip_origen: '127.0.0.1'
    });
  } catch (error) {
    // Ignorar fallas de auditoría en demo
  }
}

function listarLecturas(filtros = {}, opciones = {}) {
  const config = obtenerConfig();
  const lecturas = recalcularPersistido();
  const filtradas = filtrarLecturas(lecturas, filtros);
  const ordenColumna = opciones?.orden?.columna || config.orden.columna;
  const ordenDireccion = opciones?.orden?.direccion || config.orden.direccion;
  const ordenadas = ordenarLecturas(filtradas, ordenColumna, ordenDireccion);
  const tamanioPagina = opciones?.tamanioPagina || config.tamanioPagina;
  const paginaActual = opciones?.pagina || 1;
  const paginadas = paginarLecturas(ordenadas, paginaActual, tamanioPagina);

  return {
    success: true,
    data: paginadas.items,
    pagina: paginadas.pagina,
    total: paginadas.total,
    totalPaginas: paginadas.totalPaginas,
    orden: { columna: ordenColumna, direccion: ordenDireccion }
  };
}

function listarLecturasPendientes(parametros = {}) {
  const filtros = { ...parametros, estado: 'pendiente' };
  const resultado = listarLecturas(filtros, parametros);
  return resultado;
}

function obtenerLectura(id) {
  const lecturas = recalcularPersistido();
  const lectura = lecturas.find(item => item.id === id);
  if (!lectura) {
    return { success: false, message: 'Lectura no encontrada' };
  }
  return { success: true, data: lectura };
}

function prepararValidacion(lectura, estado, usuario, comentario) {
  const ahora = new Date().toISOString();
  const registro = {
    id: generarId('validacion'),
    estado,
    usuario: usuario || 'demo-usuario',
    comentario: comentario || '',
    fecha: ahora
  };
  const actualizada = {
    ...lectura,
    valida: {
      estado,
      usuario: registro.usuario,
      comentario: registro.comentario,
      fecha: ahora
    },
    participaEnCalculos: estado !== 'rechazada',
    historialValidaciones: [...(lectura.historialValidaciones || []), registro]
  };
  return { actualizada, registro };
}

async function aprobarLectura(id, usuario = 'demo-usuario', comentario = '') {
  const lecturas = recalcularPersistido();
  const indice = lecturas.findIndex(l => l.id === id);
  if (indice === -1) {
    return { success: false, message: 'Lectura no encontrada' };
  }
  const { actualizada } = prepararValidacion(lecturas[indice], 'aprobada', usuario, comentario);
  lecturas[indice] = actualizada;
  guardarLecturas(lecturas);
  notificarCambios({ tipo: 'validacion', ids: [id], estado: 'aprobada' });

  await registrarEventoAuditoria({
    lectura: actualizada,
    accion: 'validar',
    usuario,
    comentario,
    estado: 'aprobada'
  });

  return { success: true, data: actualizada };
}

async function rechazarLectura(id, usuario = 'demo-usuario', comentario = '') {
  if (!comentario || !comentario.trim()) {
    return { success: false, message: 'Debe ingresar un comentario para rechazar.' };
  }

  const lecturas = recalcularPersistido();
  const indice = lecturas.findIndex(l => l.id === id);
  if (indice === -1) {
    return { success: false, message: 'Lectura no encontrada' };
  }
  const { actualizada } = prepararValidacion(lecturas[indice], 'rechazada', usuario, comentario);
  lecturas[indice] = actualizada;
  guardarLecturas(lecturas);
  notificarCambios({ tipo: 'validacion', ids: [id], estado: 'rechazada' });

  await registrarEventoAuditoria({
    lectura: actualizada,
    accion: 'rechazar',
    usuario,
    comentario,
    estado: 'rechazada'
  });

  return { success: true, data: actualizada };
}

async function validarLecturasEnLote(ids = [], estado, usuario = 'demo-usuario', comentario = '') {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'Debe seleccionar al menos una lectura.' };
  }

  if (estado === 'rechazada' && (!comentario || !comentario.trim())) {
    return { success: false, message: 'El comentario es obligatorio al rechazar en lote.' };
  }

  const lecturas = recalcularPersistido();
  const actualizadas = [];

  ids.forEach(id => {
    const indice = lecturas.findIndex(l => l.id === id);
    if (indice !== -1) {
      const { actualizada } = prepararValidacion(lecturas[indice], estado, usuario, comentario);
      lecturas[indice] = actualizada;
      actualizadas.push(actualizada);
    }
  });

  guardarLecturas(lecturas);
  notificarCambios({ tipo: 'validacion-lote', ids, estado });

  await Promise.all(actualizadas.map(lectura => registrarEventoAuditoria({
    lectura,
    accion: estado === 'aprobada' ? 'validar' : 'rechazar',
    usuario,
    comentario,
    estado
  })));

  return {
    success: true,
    data: actualizadas,
    totalActualizadas: actualizadas.length
  };
}

function registrarLectura(lectura, { recalcular = true } = {}) {
  const lecturas = leerLecturasRaw();
  const normalizada = normalizarLectura({
    ...lectura,
    id: lectura.id || generarId('lectura'),
    origen: lectura.origen || 'simulada'
  });
  const existentesSinDuplicados = lecturas.filter(item => item.id !== normalizada.id);
  const actualizadas = [...existentesSinDuplicados, normalizada];
  const finales = recalcular ? detectarAnomalias(actualizadas) : actualizadas;
  guardarLecturas(finales);
  notificarCambios({ tipo: 'nueva', id: normalizada.id });
  return { success: true, data: finales.find(item => item.id === normalizada.id) };
}

function exportarLecturasCSV(params = {}) {
  const lecturas = recalcularPersistido();
  const filtradas = filtrarLecturas(lecturas, params);
  const encabezados = [
    { key: 'id', label: 'id' },
    { key: 'timestamp', label: 'timestamp' },
    { key: 'sensorId', label: 'sensor_id' },
    { key: 'division', label: 'division' },
    { key: 'tipo', label: 'tipo' },
    { key: 'valor', label: 'valor' },
    { key: 'unidad', label: 'unidad' },
    { key: 'anomalia', label: 'anomalia' },
    { key: 'scoreAnomalia', label: 'score' },
    { key: 'estado', label: 'estado_validacion' },
    { key: 'participa', label: 'participa_en_calculos' },
    { key: 'motivos', label: 'motivos' }
  ];

  const filas = filtradas.map(lectura => ({
    id: lectura.id,
    timestamp: lectura.timestamp,
    sensorId: lectura.sensorId,
    division: lectura.division,
    tipo: lectura.tipo,
    valor: lectura.valor,
    unidad: lectura.unidad,
    anomalia: lectura.anomalia ? 'SI' : 'NO',
    scoreAnomalia: lectura.scoreAnomalia,
    estado: lectura.valida?.estado || 'pendiente',
    participa: lectura.participaEnCalculos ? 'SI' : 'NO',
    motivos: lectura.motivos.map(m => `${m.regla}: ${m.detalle}`).join(' | ')
  }));

  const contenido = arrayToCsv(encabezados, filas);
  downloadCsv(`lecturas_anomalias_${Date.now()}.csv`, contenido);
  return { success: true, total: filas.length };
}

function actualizarReglasParciales(parciales) {
  const reglasActuales = obtenerReglas();
  const actualizadas = { ...reglasActuales };
  Object.entries(parciales || {}).forEach(([tipo, config]) => {
    actualizadas[tipo] = {
      ...actualizadas[tipo],
      ...config,
      rango: { ...actualizadas[tipo]?.rango, ...config?.rango },
      salto: { ...actualizadas[tipo]?.salto, ...config?.salto },
      zscore: { ...actualizadas[tipo]?.zscore, ...config?.zscore }
    };
  });
  guardarReglas(actualizadas);
  const recalculadas = recalcularPersistido();
  notificarCambios({ tipo: 'reglas-actualizadas' });
  return { success: true, data: actualizadas, lecturas: recalculadas };
}

function resetReglas() {
  guardarReglas(DEFAULT_RULES);
  const recalculadas = recalcularPersistido();
  notificarCambios({ tipo: 'reglas-reset' });
  return { success: true, data: clonProfundo(DEFAULT_RULES), lecturas: recalculadas };
}

function suscribirseActualizaciones(callback) {
  if (typeof callback === 'function') {
    SUSCRIPTORES.add(callback);
  }
  return {
    unsubscribe: () => SUSCRIPTORES.delete(callback)
  };
}

function obtenerResumen() {
  const lecturas = recalcularPersistido();
  const total = lecturas.length;
  const pendientes = lecturas.filter(l => l.valida?.estado === 'pendiente').length;
  const aprobadas = lecturas.filter(l => l.valida?.estado === 'aprobada').length;
  const rechazadas = lecturas.filter(l => l.valida?.estado === 'rechazada').length;
  const anomalias = lecturas.filter(l => l.anomalia).length;

  return {
    total,
    pendientes,
    aprobadas,
    rechazadas,
    anomalias
  };
}

function obtenerHistorialCercano(lecturaId, n = 10) {
  const lecturas = recalcularPersistido();
  const lectura = lecturas.find(l => l.id === lecturaId);
  if (!lectura) return [];
  const mismas = lecturas
    .filter(l => l.sensorId === lectura.sensorId && l.tipo === lectura.tipo)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const indice = mismas.findIndex(l => l.id === lecturaId);
  if (indice === -1) return mismas.slice(0, n);
  return mismas.slice(indice, indice + n);
}

/**
 * Obtiene únicamente las lecturas validadas para ser consideradas en cálculos
 * corporativos. Cualquier módulo que agregue o calcule inventarios debe usar
 * este helper para excluir los rechazos (CA-R04-2).
 */
function obtenerLecturasValidas() {
  return recalcularPersistido().filter(lectura => lectura.participaEnCalculos);
}

export default {
  DEFAULT_RULES,
  listarLecturas,
  listarLecturasPendientes,
  detectarAnomalias,
  obtenerReglas,
  actualizarReglasParciales,
  resetReglas,
  obtenerResumen,
  obtenerLectura,
  obtenerHistorialCercano,
  registrarLectura,
  aprobarLectura,
  rechazarLectura,
  validarLecturasEnLote,
  exportarLecturasCSV,
  suscribirseActualizaciones,
  registrarEventoAuditoria,
  obtenerConfig,
  guardarConfig,
  obtenerLecturasValidas
};

export {
  DEFAULT_RULES,
  listarLecturas,
  listarLecturasPendientes,
  detectarAnomalias,
  obtenerReglas,
  actualizarReglasParciales,
  resetReglas,
  obtenerResumen,
  obtenerLectura,
  obtenerHistorialCercano,
  registrarLectura,
  aprobarLectura,
  rechazarLectura,
  validarLecturasEnLote,
  exportarLecturasCSV,
  suscribirseActualizaciones,
  obtenerConfig,
  guardarConfig,
  obtenerLecturasValidas
};
