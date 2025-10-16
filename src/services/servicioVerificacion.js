import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import casosDemo from '../../data/casos-verificacion-ejemplo.json';
import {
  obtenerBloquePorRegistro,
  listarBloques,
  calcularSHA256Base64
} from './servicioCadena';

let delaySimuladoMs = 0;

const DEFAULT_SELLO = 'Registro demostrativo - no vinculante';

function getPerformanceNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function valoresEquivalentes(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, index) => valoresEquivalentes(val, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!valoresEquivalentes(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return a === b;
}

function formatearObjeto(obj) {
  if (!obj) {
    return '{}';
  }
  if (typeof obj === 'string') {
    try {
      return JSON.stringify(JSON.parse(obj), null, 2);
    } catch (error) {
      return obj;
    }
  }
  return JSON.stringify(obj, null, 2);
}

export function configurarDelaySimulado(ms = 0) {
  if (!Number.isFinite(ms) || ms < 0) {
    delaySimuladoMs = 0;
    return;
  }
  delaySimuladoMs = ms;
}

export function obtenerCasosDemostrativos() {
  return casosDemo;
}

export function encontrarCasoDemo(registroId) {
  return casosDemo.find(caso => caso.registro_id === registroId) || null;
}

export async function obtenerRegistrosDisponibles() {
  const bloques = await listarBloques();
  return bloques.map(bloque => ({
    registro_id: bloque.registro_id,
    tipo_entidad: bloque.tipo_entidad,
    descripcion: encontrarCasoDemo(bloque.registro_id)?.descripcion || bloque.motivo,
    fecha_hora: bloque.fecha_hora,
    usuario: bloque.usuario
  }));
}

function diferir(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function prepararContenidoParaHuella(bloque, contenido) {
  const contenidoSerializado = formatearObjeto(contenido);
  const sello = bloque?.sello || DEFAULT_SELLO;
  return `${contenidoSerializado}\n---\n${sello}\nReferencia:${bloque.registro_id}`;
}

function normalizarObjeto(contenido) {
  if (contenido == null) {
    return {};
  }
  if (isPlainObject(contenido) || Array.isArray(contenido)) {
    return JSON.parse(JSON.stringify(contenido));
  }
  if (typeof contenido === 'string') {
    try {
      return JSON.parse(contenido);
    } catch (error) {
      return { raw: contenido };
    }
  }
  return { valor: contenido };
}

export function detectarDivergencias(objA = {}, objB = {}) {
  const diferencias = [];

  const visitar = (ruta, valorA, valorB, profundidad) => {
    if (valoresEquivalentes(valorA, valorB)) {
      return;
    }

    const rutaActual = ruta;

    if (profundidad < 1 && isPlainObject(valorA) && isPlainObject(valorB)) {
      const claves = new Set([
        ...Object.keys(valorA || {}),
        ...Object.keys(valorB || {})
      ]);
      for (const clave of claves) {
        const siguienteRuta = rutaActual ? `${rutaActual}.${clave}` : clave;
        visitar(siguienteRuta, valorA?.[clave], valorB?.[clave], profundidad + 1);
      }
      return;
    }

    diferencias.push({
      campo: rutaActual || '(raíz)',
      valor_almacenado: valorA,
      valor_actual: valorB
    });
  };

  const clavesRaiz = new Set([
    ...Object.keys(objA || {}),
    ...Object.keys(objB || {})
  ]);
  for (const clave of clavesRaiz) {
    visitar(clave, objA?.[clave], objB?.[clave], 0);
  }

  return diferencias;
}

export async function verificarRegistroPorId(registroId, opciones = {}) {
  if (!registroId) {
    throw new Error('Debe proporcionar un identificador de registro.');
  }

  const bloque = await obtenerBloquePorRegistro(registroId);
  if (!bloque) {
    throw new Error('Registro no encontrado en la cadena demostrativa.');
  }

  const caso = encontrarCasoDemo(registroId);
  const contenidoEsperado = normalizarObjeto(bloque.contenido);

  let contenidoActual = opciones?.contenidoActual ?? caso?.manipulacion_demo?.contenido_manipulado ?? null;
  if (!contenidoActual) {
    contenidoActual = contenidoEsperado;
  } else {
    contenidoActual = normalizarObjeto(contenidoActual);
  }

  const contenidoFirmadoActual = prepararContenidoParaHuella(bloque, contenidoActual);

  const inicio = getPerformanceNow();
  const huellaRecalculada = await calcularSHA256Base64(contenidoFirmadoActual);

  const delaySolicitado = Number.isFinite(opciones?.delayMs) && opciones.delayMs > 0
    ? opciones.delayMs
    : delaySimuladoMs;
  if (delaySolicitado > 0) {
    await diferir(delaySolicitado);
  }

  const fin = getPerformanceNow();
  const tiempoMs = Number((fin - inicio).toFixed(2));

  const valido = huellaRecalculada === bloque.huella;
  const divergencias = valido ? [] : detectarDivergencias(contenidoEsperado, contenidoActual);

  return {
    registroId,
    valido,
    huella_almacenada: bloque.huella,
    huella_recalculada: huellaRecalculada,
    tiempo_ms: tiempoMs,
    divergencias,
    detalle_contenido: {
      esperado: contenidoEsperado,
      actual: contenidoActual
    },
    metadata: {
      descripcion: caso?.descripcion || bloque.motivo,
      usuario: bloque.usuario,
      fecha_hora: bloque.fecha_hora,
      tipo_entidad: bloque.tipo_entidad,
      manipulacion_descripcion: valido ? null : caso?.manipulacion_demo?.descripcion || opciones?.motivo || 'Alteraciones detectadas en la comparación.'
    }
  };
}

export async function simularManipulacion(registroId) {
  const caso = encontrarCasoDemo(registroId);
  if (!caso?.manipulacion_demo) {
    return null;
  }
  return {
    descripcion: caso.manipulacion_demo.descripcion,
    contenido: normalizarObjeto(caso.manipulacion_demo.contenido_manipulado)
  };
}

export function generarInformeVerificacion(resultado, formato = 'json') {
  if (!resultado) {
    throw new Error('No hay resultado de verificación disponible.');
  }

  const fecha = new Date();
  const timestamp = fecha.toISOString().replace(/[:.]/g, '-');
  const baseNombre = `informe_verificacion_${resultado.registroId}_${timestamp}`;

  const resumen = {
    registroId: resultado.registroId,
    fecha_verificacion: fecha.toISOString(),
    resultado: resultado.valido ? 'valido' : 'invalido',
    tiempo_ms: resultado.tiempo_ms,
    huella_almacenada: resultado.huella_almacenada,
    huella_recalculada: resultado.huella_recalculada,
    divergencias: resultado.divergencias,
    metadata: resultado.metadata
  };

  if (formato === 'json') {
    const blob = new Blob([JSON.stringify(resumen, null, 2)], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${baseNombre}.json`);
    return `${baseNombre}.json`;
  }

  if (formato === 'pdf') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
    doc.setFont('Helvetica', '');
    doc.setFontSize(16);
    doc.text('Informe demostrativo de verificación', 40, 60);
    doc.setFontSize(10);
    doc.text(`Registro: ${resultado.registroId}`, 40, 80);
    doc.text(`Fecha de verificación: ${new Date(resumen.fecha_verificacion).toLocaleString('es-CL')}`, 40, 95);
    doc.text(`Resultado: ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'}`, 40, 110);
    doc.text(`Tiempo empleado: ${resultado.tiempo_ms} ms`, 40, 125);
    doc.text(`Huella almacenada: ${resultado.huella_almacenada}`, 40, 145, { maxWidth: 520 });
    doc.text(`Huella recalculada: ${resultado.huella_recalculada}`, 40, 165, { maxWidth: 520 });

    if (resultado.divergencias?.length) {
      doc.text('Divergencias detectadas:', 40, 190);
      resultado.divergencias.slice(0, 6).forEach((diff, idx) => {
        const baseY = 205 + idx * 30;
        doc.text(`• ${diff.campo}`, 50, baseY);
        doc.text(`Almacenado: ${JSON.stringify(diff.valor_almacenado)}`, 60, baseY + 14, { maxWidth: 480 });
        doc.text(`Actual: ${JSON.stringify(diff.valor_actual)}`, 60, baseY + 26, { maxWidth: 480 });
      });
    }

    const blob = doc.output('blob');
    saveAs(blob, `${baseNombre}.pdf`);
    return `${baseNombre}.pdf`;
  }

  throw new Error('Formato no soportado. Utiliza "json" o "pdf".');
}

export default {
  configurarDelaySimulado,
  obtenerCasosDemostrativos,
  encontrarCasoDemo,
  obtenerRegistrosDisponibles,
  detectarDivergencias,
  verificarRegistroPorId,
  simularManipulacion,
  generarInformeVerificacion
};
