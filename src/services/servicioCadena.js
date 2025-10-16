import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import cadenaDemo from '../../data/cadena-ejemplo.json';

const STORAGE_KEY = 'cadena_registros_demo';
const SELLO_DEMO = 'Registro demostrativo - no vinculante';

function obtenerStorage() {
  if (typeof window === 'undefined') return [];
  const almacenado = window.localStorage.getItem(STORAGE_KEY);
  if (!almacenado) return [];
  try {
    return JSON.parse(almacenado);
  } catch (error) {
    console.warn('No fue posible parsear cadena simulada desde storage:', error);
    return [];
  }
}

function guardarStorage(cadena) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cadena));
}

export async function inicializarCadenaDemo() {
  if (typeof window === 'undefined') return;
  const existente = obtenerStorage();
  if (existente.length > 0) return;
  guardarStorage(cadenaDemo);
}

export function limpiarCadenaDemo() {
  if (typeof window === 'undefined') return;
  guardarStorage([]);
}

export async function calcularSHA256Base64(textoPlano) {
  const encoder = new TextEncoder();
  const data = encoder.encode(textoPlano);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBinary = String.fromCharCode(...hashArray);
  return window.btoa(hashBinary);
}

function serializarContenido(contenido) {
  if (typeof contenido === 'string') {
    try {
      const parsed = JSON.parse(contenido);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return contenido;
    }
  }
  return JSON.stringify(contenido, null, 2);
}

export async function crearBloque({ registro_id, tipo_entidad, contenido, usuario, motivo }) {
  const cadenaActual = obtenerStorage();
  const index = cadenaActual.length;
  const huellaPadre = index > 0 ? cadenaActual[cadenaActual.length - 1].huella : null;

  const contenidoSerializado = serializarContenido(contenido);
  const contenidoFirmado = `${contenidoSerializado}\n---\n${SELLO_DEMO}\nReferencia:${registro_id}`;
  const huella = await calcularSHA256Base64(contenidoFirmado);

  const fecha_hora = new Date().toISOString();
  const bloque = {
    index,
    registro_id,
    tipo_entidad,
    contenido: contenidoSerializado,
    huella,
    huella_padre: huellaPadre,
    usuario,
    fecha_hora,
    motivo,
    sello: SELLO_DEMO,
    referencia: `BLOCK-${String(index).padStart(4, '0')}`
  };

  const cadenaNueva = [...cadenaActual, bloque];
  guardarStorage(cadenaNueva);
  return bloque;
}

export async function listarBloques() {
  const cadena = obtenerStorage();
  return [...cadena];
}

export async function obtenerBloquePorRegistro(registroId) {
  const cadena = obtenerStorage();
  return cadena.find(bloque => bloque.registro_id === registroId) || null;
}

export async function recalcularHuellaBloque(bloque, contenidoAlternativo) {
  const contenido = contenidoAlternativo ?? bloque.contenido;
  const contenidoFirmado = `${contenido}\n---\n${SELLO_DEMO}\nReferencia:${bloque.registro_id}`;
  return calcularSHA256Base64(contenidoFirmado);
}

export async function verificarBloque(index) {
  const cadena = obtenerStorage();
  const bloque = cadena.find(b => b.index === index);
  if (!bloque) {
    return { estado: 'no-encontrado' };
  }
  const huellaCalculada = await recalcularHuellaBloque(bloque, bloque.contenido);
  const coincide = huellaCalculada === bloque.huella;
  return {
    estado: coincide ? 'valido' : 'manipulado',
    calculada: huellaCalculada,
    almacenada: bloque.huella,
    diferencia: coincide ? null : 'El contenido parece haber sido alterado en almacenamiento demo.'
  };
}

export async function exportarCadenaCSV() {
  const cadena = obtenerStorage();
  if (!cadena.length) return;
  const encabezado = 'index,registro_id,tipo_entidad,huella,huella_padre,usuario,fecha_hora\n';
  const lineas = cadena.map(b => [
    b.index,
    b.registro_id,
    b.tipo_entidad,
    b.huella,
    b.huella_padre ?? '',
    b.usuario,
    b.fecha_hora
  ].join(','));
  const csv = encabezado + lineas.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `cadena_demo_${new Date().toISOString().slice(0, 19)}.csv`);
}

export async function exportarCadenaPDF(bloques) {
  const cadena = bloques ?? obtenerStorage();
  if (!cadena.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
  doc.setFont('Helvetica', '');
  doc.setFontSize(16);
  doc.text('Reporte demostrativo - Cadena de registros', 40, 60);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 40, 80);
  doc.text(`Total de bloques: ${cadena.length}`, 40, 95);

  cadena.forEach((bloque, idx) => {
    const yBase = 120 + idx * 90;
    if (yBase > 760) {
      doc.addPage();
    }
    doc.setFontSize(12);
    doc.text(`Bloque #${bloque.index} · ${bloque.registro_id}`, 40, yBase);
    doc.setFontSize(10);
    doc.text(`Usuario: ${bloque.usuario} · Fecha: ${new Date(bloque.fecha_hora).toLocaleString('es-CL')}`, 40, yBase + 16);
    doc.text(`Huella: ${bloque.huella}`, 40, yBase + 32);
    doc.text(`Huella padre: ${bloque.huella_padre || 'Bloque génesis'}`, 40, yBase + 48);
  });

  const pdfBlob = doc.output('blob');
  saveAs(pdfBlob, `reporte_cadena_demo_${new Date().toISOString().slice(0, 19)}.pdf`);
}

export async function generarPruebaFirmaSimulada(bloques) {
  const cadena = bloques ?? obtenerStorage();
  if (!cadena.length) return;
  const huellaGlobal = await calcularSHA256Base64(cadena.map(b => b.huella).join(''));
  const contenido = {
    descripcion: 'Prueba de firma simulada para la cadena de registros demostrativa',
    fecha: new Date().toISOString(),
    total_bloques: cadena.length,
    huella_global: huellaGlobal,
    sello: SELLO_DEMO
  };
  const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `prueba_firma_cadena_demo_${new Date().toISOString().slice(0, 19)}.json`);
}

export async function descargarBloqueJSON(bloque) {
  const blob = new Blob([JSON.stringify(bloque, null, 2)], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `bloque_${bloque.index}.json`);
}

export default {
  inicializarCadenaDemo,
  limpiarCadenaDemo,
  crearBloque,
  listarBloques,
  obtenerBloquePorRegistro,
  verificarBloque,
  exportarCadenaCSV,
  exportarCadenaPDF,
  generarPruebaFirmaSimulada,
  descargarBloqueJSON,
  recalcularHuellaBloque
};
