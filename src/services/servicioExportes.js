import { arrayToCsv, downloadCsv, downloadFile } from '../utils/csv';

let logoCache = null;
let jsPdfModuleCache = null;

async function obtenerJsPDF() {
  if (!jsPdfModuleCache) {
    jsPdfModuleCache = import('jspdf').then(mod => mod.jsPDF || mod.default);
  }
  const JsPDF = await jsPdfModuleCache;
  return JsPDF;
}

async function obtenerLogo() {
  if (logoCache) return logoCache;
  try {
    const respuesta = await fetch('/logo-codelco.svg');
    const svg = await respuesta.text();
    const base64 = window.btoa(unescape(encodeURIComponent(svg)));
    logoCache = `data:image/svg+xml;base64,${base64}`;
    return logoCache;
  } catch (error) {
    console.warn('No se pudo cargar el logo, se usará marcador simple.', error);
    logoCache = null;
    return null;
  }
}

function ensureArrayBuffer(contenido) {
  if (contenido instanceof ArrayBuffer) {
    return contenido;
  }
  if (contenido instanceof Uint8Array) {
    return contenido.buffer;
  }
  if (typeof contenido === 'string') {
    const encoder = new TextEncoder();
    return encoder.encode(contenido).buffer;
  }
  throw new Error('El contenido para firmar debe ser ArrayBuffer, Uint8Array o string');
}

function obtenerBtoa() {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa.bind(window);
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
    return globalThis.btoa.bind(globalThis);
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'function') {
    return data => globalThis.Buffer.from(data, 'binary').toString('base64');
  }
  throw new Error('Función btoa no disponible en este entorno');
}

const btoaSafe = obtenerBtoa();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoaSafe(binary);
}

export async function firmarSimulado(contenido, firmante = 'Firmante Demo') {
  const fechaFirma = new Date();
  const arrayBuffer = ensureArrayBuffer(contenido);
  const cryptoObj = globalThis?.crypto?.subtle
    ? globalThis.crypto
    : (typeof window !== 'undefined' && window.crypto?.subtle)
      ? window.crypto
      : null;

  let hashBuffer;
  if (cryptoObj?.subtle?.digest) {
    hashBuffer = await cryptoObj.subtle.digest('SHA-256', arrayBuffer);
  } else if (typeof globalThis.__digestSha256 === 'function') {
    hashBuffer = await globalThis.__digestSha256('SHA-256', arrayBuffer);
  } else {
    throw new Error('API Crypto no disponible para firmar el documento');
  }
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashBase64 = arrayBufferToBase64(hashBuffer);

  return {
    firmante,
    fechaISO: fechaFirma.toISOString(),
    hashHex,
    hashBase64,
    nota: 'Firma digital simulada — para demostración'
  };
}

function drawFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor('#1e293b');
    doc.text('Documento de demostración', 40, pageHeight - 30);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 120, pageHeight - 30);
  }
}

function agregarPortada(doc, data, opciones, logoDataUrl) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor('#0f172a');
  doc.rect(0, 0, pageWidth, 120, 'F');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 50, 30, 100, 100, undefined, 'FAST');
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor('#f97316');
    doc.text('CODELCO', pageWidth / 2 - 60, 90);
  }

  doc.setTextColor('#0f172a');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Reporte comparativo de metas', 40, 200);

  doc.setFontSize(16);
  doc.setTextColor('#1e3a8a');
  doc.text(`Periodo: ${data.periodoEtiqueta}`, 40, 240);
  doc.text(`Divisiones seleccionadas: ${data.divisiones.join(', ') || 'Todas'}`, 40, 270);

  doc.setTextColor('#0f172a');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 40, 310);
  doc.text(`Firmante: ${opciones.firmante || 'No indicado'}`, 40, 330);
}

function agregarIndice(doc, data) {
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor('#0f172a');
  doc.text('Índice de contenidos', 40, 80);

  const items = [
    { titulo: 'Resumen ejecutivo', pagina: 3 },
    ...data.divisiones.map((div, index) => ({ titulo: `Metas - ${div}`, pagina: 4 + index })),
  ];
  if (data.incluirHistorial) {
    items.push({ titulo: 'Historial de cambios', pagina: 4 + data.divisiones.length });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  let y = 120;
  items.forEach(item => {
    doc.setTextColor('#0f172a');
    doc.text(item.titulo, 60, y);
    doc.setTextColor('#ea580c');
    doc.text(`Pág. ${item.pagina}`, 400, y);
    y += 28;
  });
}

function agregarResumenEjecutivo(doc, data) {
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor('#0f172a');
  doc.text('Resumen ejecutivo', 40, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');

  const parrafos = [
    `Este informe resume ${data.totalMetas} metas de reducción activas, con un progreso promedio de ${data.promedioProgreso}% en las divisiones seleccionadas.`,
    `Las divisiones con mayor avance son ${data.topDivisiones.join(', ') || 'sin variación destacable'} y el énfasis del periodo ${data.periodoEtiqueta} se centra en procesos de ${data.topProcesos.join(', ') || 'producción general'}.`,
    'Los factores de riesgo se monitorean mediante indicadores energéticos y de emisiones alineados con la estrategia de sustentabilidad corporativa.'
  ];

  let y = 110;
  parrafos.forEach(texto => {
    const lineas = doc.splitTextToSize(texto, 500);
    lineas.forEach(linea => {
      doc.text(linea, 40, y);
      y += 18;
    });
    y += 10;
  });
}

function dibujarTablaMetas(doc, metas, startY) {
  let y = startY;
  const x = 40;
  const columnas = [
    { titulo: 'Meta', ancho: 140, key: 'nombre' },
    { titulo: 'Proceso', ancho: 80, key: 'proceso' },
    { titulo: 'Indicador', ancho: 80, key: 'indicador' },
    { titulo: 'Línea base', ancho: 70, key: 'lineaBase' },
    { titulo: 'Meta anual', ancho: 70, key: 'metaAnual' },
    { titulo: 'Real anual', ancho: 70, key: 'realAnual' }
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setFillColor('#1e3a8a');
  doc.setTextColor('#ffffff');
  doc.rect(x, y - 14, columnas.reduce((acc, col) => acc + col.ancho, 0), 18, 'F');
  let cursorX = x + 6;
  columnas.forEach(col => {
    doc.text(col.titulo, cursorX, y);
    cursorX += col.ancho;
  });

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#1f2937');

  metas.forEach(meta => {
    if (y > 760) {
      doc.addPage();
      y = 80;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#0f172a');
      doc.text('Continuación - Tabla comparativa', x, y);
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFillColor('#1e3a8a');
      doc.setTextColor('#ffffff');
      doc.rect(x, y - 14, columnas.reduce((acc, col) => acc + col.ancho, 0), 18, 'F');
      let cx = x + 6;
      columnas.forEach(col => {
        doc.text(col.titulo, cx, y);
        cx += col.ancho;
      });
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#1f2937');
    }

    let colX = x + 6;
    columnas.forEach(col => {
      const valor = meta[col.key];
      const texto = Array.isArray(valor) ? valor.join(' / ') : valor;
      const lineas = doc.splitTextToSize(String(texto ?? ''), col.ancho - 10);
      lineas.forEach((linea, idx) => {
        doc.text(linea, colX, y + idx * 12);
      });
      colX += col.ancho;
    });
    y += 20;
  });

  return y;
}

function agregarGraficoSimple(doc, serie, startY) {
  const x = 60;
  const width = 460;
  const height = 120;
  const max = Math.max(...serie.map(p => Math.max(p.valorMeta, p.valorReal)));
  const min = Math.min(...serie.map(p => Math.min(p.valorMeta, p.valorReal)));
  const scale = value => height - ((value - min) / Math.max(0.001, max - min)) * height;

  doc.setDrawColor('#e2e8f0');
  doc.rect(x, startY, width, height);
  doc.setFontSize(10);
  doc.setTextColor('#1e293b');
  doc.text('Meta vs Real (mensual)', x, startY - 8);

  const step = width / Math.max(1, serie.length - 1);

  const drawLine = (points, color) => {
    doc.setDrawColor(color);
    doc.setLineWidth(1.2);
    points.forEach((punto, idx) => {
      const px = x + step * idx;
      const py = startY + scale(punto);
      if (idx === 0) {
        doc.moveTo(px, py);
      } else {
        doc.lineTo(px, py);
      }
    });
    doc.stroke();
  };

  doc.setDrawColor('#1e3a8a');
  doc.setLineWidth(1.2);
  let prevX = null;
  let prevY = null;
  serie.forEach((punto, idx) => {
    const px = x + step * idx;
    const pyMeta = startY + scale(punto.valorMeta);
    if (prevX !== null) {
      doc.setDrawColor('#1e3a8a');
      doc.line(prevX, prevY, px, pyMeta);
    }
    doc.circle(px, pyMeta, 2, 'F');
    prevX = px;
    prevY = pyMeta;
  });

  prevX = null;
  prevY = null;
  serie.forEach((punto, idx) => {
    const px = x + step * idx;
    const pyReal = startY + scale(punto.valorReal);
    if (prevX !== null) {
      doc.setDrawColor('#f97316');
      doc.line(prevX, prevY, px, pyReal);
    }
    doc.circle(px, pyReal, 2, 'S');
    prevX = px;
    prevY = pyReal;
  });

  doc.setFontSize(9);
  doc.setTextColor('#475569');
  serie.forEach((punto, idx) => {
    const px = x + step * idx;
    doc.text(punto.etiqueta.slice(-2), px - 4, startY + height + 12);
  });
}

function prepararMetasDivision(metasDivision) {
  return metasDivision.map(meta => ({
    nombre: meta.nombre,
    proceso: meta.proceso,
    indicador: meta.indicador,
    lineaBase: `${meta.lineaBase?.valor ?? '-'} (${meta.lineaBase?.año ?? '-'})`,
    metaAnual: meta.metaAnual ?? (meta.objetivoAnual ?? meta.metaObjetivo ?? meta.progreso?.objetivo ?? '-'),
    realAnual: meta.progreso?.valorActual ?? '-'
  }));
}

function extraerMetaPrincipal(metas) {
  return metas[0];
}

function construirPeriodoEtiqueta(periodoSeleccion) {
  if (!periodoSeleccion) return 'Año completo';
  const { tipo, año, indice } = periodoSeleccion;
  if (tipo === 'anio') return `Año ${año}`;
  if (tipo === 'semestre') return `${indice === 2 ? 'Segundo' : 'Primer'} semestre ${año}`;
  if (tipo === 'trimestre') return `Trimestre ${indice} ${año}`;
  return 'Periodo personalizado';
}

export async function generarPDF(reporteData, opciones = {}) {
  const JsPDF = await obtenerJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  const logo = await obtenerLogo();
  const periodoEtiqueta = construirPeriodoEtiqueta(reporteData.periodoSeleccionado);

  agregarPortada(doc, {
    periodoEtiqueta,
    divisiones: reporteData.divisionesSeleccionadas,
    totalMetas: reporteData.metas.length
  }, opciones, logo);
  agregarIndice(doc, {
    divisiones: reporteData.divisionesSeleccionadas,
    incluirHistorial: opciones.incluirHistorial
  });
  agregarResumenEjecutivo(doc, {
    totalMetas: reporteData.metas.length,
    promedioProgreso: reporteData.resumen.promedioProgreso,
    topDivisiones: reporteData.resumen.topDivisiones,
    topProcesos: reporteData.resumen.topProcesos,
    periodoEtiqueta
  });

  let pagina = doc.getNumberOfPages();
  let y = 100;

  reporteData.divisionesSeleccionadas.forEach(division => {
    const metasDivision = reporteData.metasPorDivision[division] || [];
    if (metasDivision.length === 0) return;
    if (doc.getCurrentPageInfo().pageNumber !== pagina) {
      doc.addPage();
      pagina = doc.getCurrentPageInfo().pageNumber;
      y = 80;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#0f172a');
    doc.text(`División ${division}`, 40, y);
    y += 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#1f2937');
    const resumenDivision = reporteData.resumenPorDivision[division];
    const textoResumen = resumenDivision ?? `Resumen no disponible para ${division}.`;
    const lineasResumen = doc.splitTextToSize(textoResumen, 500);
    lineasResumen.forEach(linea => {
      doc.text(linea, 40, y);
      y += 16;
    });
    y += 10;

    const tabla = prepararMetasDivision(metasDivision);
    y = dibujarTablaMetas(doc, tabla, y + 10) + 20;

    if (reporteData.seriesPorDivision[division]) {
      agregarGraficoSimple(doc, reporteData.seriesPorDivision[division], y);
      y += 160;
    }

    if (y > 700) {
      doc.addPage();
      pagina = doc.getCurrentPageInfo().pageNumber;
      y = 80;
    }
  });

  if (opciones.incluirHistorial && reporteData.historial?.length) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#0f172a');
    doc.text('Historial de cambios', 40, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor('#1f2937');
    let yHist = 120;
    reporteData.historial.forEach(evento => {
      if (yHist > 760) {
        doc.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Historial de cambios (continuación)', 40, 80);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        yHist = 120;
      }
      doc.text(`${new Date(evento.fecha_hora).toLocaleString('es-CL')} — ${evento.usuario} (${evento.rol})`, 40, yHist);
      yHist += 14;
      doc.text(`Acción: ${evento.accion} en ${evento.entidad} (${evento.entidad_id})`, 40, yHist);
      yHist += 14;
      const lineasMotivo = doc.splitTextToSize(`Motivo: ${evento.motivo || 'Sin detalle'}`, 480);
      lineasMotivo.forEach(linea => {
        doc.text(linea, 40, yHist);
        yHist += 12;
      });
      yHist += 12;
    });
  }

  const signaturePage = doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor('#0f172a');
  doc.text('Bloque de firma digital simulada', 40, 80);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#1f2937');
  doc.text('Nombre del firmante:', 40, 120);
  doc.text(opciones.firmante || 'No indicado', 200, 120);
  doc.text('Fecha y hora de firma:', 40, 150);
  doc.text(new Date().toLocaleString('es-CL'), 200, 150);
  doc.text('Hash SHA-256 (Base64):', 40, 180);
  const hashY = 200;
  doc.text('Calculando hash...', 40, hashY);
  doc.text('Firma digital simulada — para demostración', 40, 240);

  drawFooter(doc);

  const bufferInicial = doc.output('arraybuffer');
  const firma = await firmarSimulado(bufferInicial, opciones.firmante || 'Firmante Demo');

  doc.setPage(signaturePage);
  doc.setFillColor('#ffffff');
  doc.rect(40, hashY - 12, 520, 32, 'F');
  doc.setTextColor('#1f2937');
  doc.text(firma.hashBase64, 40, hashY);

  const bufferFinal = doc.output('arraybuffer');
  const blob = new Blob([bufferFinal], { type: 'application/pdf' });
  const nombreArchivo = opciones.nombreArchivo || `reporte_comparativo_${Date.now()}.pdf`;
  downloadFile(nombreArchivo, blob);

  return {
    blob,
    nombreArchivo,
    firma,
    urlDescarga: nombreArchivo
  };
}

function construirFilasCSV(metas, mapaCreadores = {}) {
  return metas.map(meta => {
    const creador = mapaCreadores[meta.id];
    return {
      division: meta.division,
      meta_id: meta.id,
      nombre_meta: meta.nombre,
      proceso: meta.proceso,
      indicador: meta.indicador,
      linea_base: meta.lineaBase?.valor ?? '',
      fecha_objetivo: meta.fechaObjetivo,
      valor_meta_anual: meta.metaAnual ?? meta.progreso?.objetivo ?? '',
      valor_real_anual: meta.progreso?.valorActual ?? '',
      usuario_creador: creador?.usuario || 'Desconocido',
      fecha_creacion: creador?.fecha || meta.fechaCreacion || ''
    };
  });
}

function construirFilasHistorial(historial) {
  return historial.map(evt => ({
    id_evento: evt.id,
    fecha_hora: evt.fecha_hora,
    usuario: evt.usuario,
    rol: evt.rol,
    accion: evt.accion,
    entidad: evt.entidad,
    entidad_id: evt.entidad_id,
    motivo: evt.motivo || ''
  }));
}

export async function generarCSV(reporteData, opciones = {}) {
  const filas = construirFilasCSV(reporteData.metas, reporteData.creadoresPorMeta);
  const headers = [
    { key: 'division', label: 'division' },
    { key: 'meta_id', label: 'meta_id' },
    { key: 'nombre_meta', label: 'nombre_meta' },
    { key: 'proceso', label: 'proceso' },
    { key: 'indicador', label: 'indicador' },
    { key: 'linea_base', label: 'linea_base' },
    { key: 'fecha_objetivo', label: 'fecha_objetivo' },
    { key: 'valor_meta_anual', label: 'valor_meta_anual' },
    { key: 'valor_real_anual', label: 'valor_real_anual' },
    { key: 'usuario_creador', label: 'usuario_creador' },
    { key: 'fecha_creacion', label: 'fecha_creacion' }
  ];
  const contenidoPrincipal = arrayToCsv(headers, filas);
  const nombrePrincipal = opciones.nombreArchivo || `reporte_comparativo_${Date.now()}.csv`;
  const blobPrincipal = downloadCsv(nombrePrincipal, contenidoPrincipal);

  let contenidoHistorial = '';
  if (opciones.incluirHistorial && reporteData.historial?.length) {
    const filasHistorial = construirFilasHistorial(reporteData.historial);
    const headersHistorial = [
      { key: 'id_evento', label: 'id_evento' },
      { key: 'fecha_hora', label: 'fecha_hora' },
      { key: 'usuario', label: 'usuario' },
      { key: 'rol', label: 'rol' },
      { key: 'accion', label: 'accion' },
      { key: 'entidad', label: 'entidad' },
      { key: 'entidad_id', label: 'entidad_id' },
      { key: 'motivo', label: 'motivo' }
    ];
    contenidoHistorial = arrayToCsv(headersHistorial, filasHistorial);
    downloadCsv('historial_cambios.csv', contenidoHistorial);
  }

  const contenidoFirma = `${contenidoPrincipal}\n${contenidoHistorial}`;
  const firma = await firmarSimulado(contenidoFirma, opciones.firmante || 'Firmante Demo');

  const contenidoTxt = [
    `Documento: ${nombrePrincipal}`,
    `Firmante: ${firma.firmante}`,
    `Fecha de firma: ${new Date(firma.fechaISO).toLocaleString('es-CL')}`,
    `Hash SHA-256 (Base64): ${firma.hashBase64}`,
    `${firma.nota}`
  ].join('\n');

  const blobTxt = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8;' });
  downloadFile('firma_reporte.txt', blobTxt);

  return {
    principal: { nombre: nombrePrincipal, blob: blobPrincipal },
    historial: contenidoHistorial ? { nombre: 'historial_cambios.csv', contenido: contenidoHistorial } : null,
    firma,
    firmaArchivo: { nombre: 'firma_reporte.txt', contenido: contenidoTxt }
  };
}

export default {
  generarPDF,
  generarCSV,
  firmarSimulado
};
