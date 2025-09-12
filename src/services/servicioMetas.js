/**
 * Servicio para gestión de metas de reducción de emisiones
 * 
 * Este servicio maneja el almacenamiento local para el prototipo.
 * Para conectar con la API real de Codelco, reemplazar las funciones
 * de localStorage por llamadas HTTP a los endpoints correspondientes.
 * 
 * Endpoints sugeridos para integración futura:
 * - GET /api/metas - Listar todas las metas
 * - POST /api/metas - Crear nueva meta
 * - PUT /api/metas/:id - Actualizar meta
 * - DELETE /api/metas/:id - Eliminar meta
 * - GET /api/divisiones - Obtener catálogo de divisiones
 * - GET /api/procesos - Obtener catálogo de procesos
 */

import metasEjemplo from '../../data/metas-ejemplo.json';
import servicioAuditoria from './servicioAuditoria';

// Clave para almacenamiento local
const STORAGE_KEY = 'codelco_metas_reduccion';

// Catálogos - En producción estos vendrían de la API
export const DIVISIONES = [
  { id: 'el-teniente', nombre: 'El Teniente' },
  { id: 'radomiro-tomic', nombre: 'Radomiro Tomic' },
  { id: 'ministro-hales', nombre: 'Ministro Hales' },
  { id: 'chuquicamata', nombre: 'Chuquicamata' },
  { id: 'salvador', nombre: 'Salvador' },
  { id: 'andina', nombre: 'Andina' }
];

export const PROCESOS = [
  { id: 'molienda', nombre: 'Molienda' },
  { id: 'chancado', nombre: 'Chancado' },
  { id: 'fundicion', nombre: 'Fundición' },
  { id: 'flotacion', nombre: 'Flotación' },
  { id: 'transporte', nombre: 'Transporte' }
];

export const INDICADORES = [
  { id: 'tco2e-ton-cu', nombre: 'tCO₂e/ton Cu', descripcion: 'Toneladas de CO₂ equivalente por tonelada de cobre' },
  { id: 'kwh-ton-cu', nombre: 'kWh/ton Cu', descripcion: 'Kilowatt hora por tonelada de cobre' },
  { id: 'gj-ton-cu', nombre: 'GJ/ton Cu', descripcion: 'Gigajoules por tonelada de cobre' }
];

/**
 * Inicializa el almacenamiento local con datos de ejemplo si está vacío
 */
function inicializarStorage() {
  const metasExistentes = localStorage.getItem(STORAGE_KEY);
  if (!metasExistentes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metasEjemplo));
  }
}

/**
 * Obtiene todas las metas desde el almacenamiento local
 * @returns {Array} Lista de metas
 */
export async function listarMetas() {
  try {
    inicializarStorage();
    const metas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Simular delay de red para demo
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: metas,
      message: 'Metas obtenidas exitosamente'
    };
  } catch (error) {
    console.error('Error al listar metas:', error);
    return {
      success: false,
      data: [],
      message: 'Error al obtener las metas'
    };
  }
}

/**
 * Crea una nueva meta
 * @param {Object} metaData - Datos de la meta a crear
 * @returns {Object} Resultado de la operación
 */
export async function crearMeta(metaData) {
  try {
    inicializarStorage();
    const metas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Generar ID único
    const nuevoId = `meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear objeto meta completo
    const nuevaMeta = {
      id: nuevoId,
      ...metaData,
      progreso: {
        porcentaje: 0,
        valorActual: metaData.lineaBase.valor
      },
      fechaCreacion: new Date().toISOString(),
      estado: 'activa'
    };
    
    // Agregar a la lista
    metas.push(nuevaMeta);
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
    
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));

  // Registrar auditoría (no bloquear flujo)
  registrarCreacionAudit(nuevaMeta);
    
    return {
      success: true,
      data: nuevaMeta,
      message: 'Meta creada exitosamente'
    };
  } catch (error) {
    console.error('Error al crear meta:', error);
    return {
      success: false,
      data: null,
      message: 'Error al crear la meta'
    };
  }
}

// Integración de auditoría: registrar creación de meta
// Nota: ya se registra en crearMeta para pruebas; para update/delete seguir patrón similar.
async function registrarCreacionAudit(meta) {
  try {
    await servicioAuditoria.agregarEvento({
      usuario: (JSON.parse(localStorage.getItem('currentUser') || '{}').usuario) || 'anon',
      rol: (JSON.parse(localStorage.getItem('currentUser') || '{}').rol) || 'usuario',
      accion: 'crear',
      entidad: 'metas',
      entidad_id: meta.id,
      fecha_hora: new Date().toISOString(),
      motivo: 'Creación desde UI',
      detalle_anterior: null,
      detalle_nuevo: meta,
      ip_origen: '127.0.0.1'
    });
  } catch (e) { /* ignore */ }
}

/**
 * Filtra metas por división y/o período
 * @param {string} division - ID de la división (opcional)
 * @param {number} año - Año para filtrar (opcional)
 * @returns {Array} Metas filtradas
 */
export async function filtrarMetas(division = null, año = null) {
  try {
    const resultado = await listarMetas();
    if (!resultado.success) return resultado;
    
    let metasFiltradas = resultado.data;
    
    if (division) {
      metasFiltradas = metasFiltradas.filter(meta => 
        meta.division.toLowerCase().replace(/\s+/g, '-') === division
      );
    }
    
    if (año) {
      metasFiltradas = metasFiltradas.filter(meta => {
        const fechaObjetivo = new Date(meta.fechaObjetivo);
        return fechaObjetivo.getFullYear() === año;
      });
    }
    
    return {
      success: true,
      data: metasFiltradas,
      message: `${metasFiltradas.length} metas encontradas`
    };
  } catch (error) {
    console.error('Error al filtrar metas:', error);
    return {
      success: false,
      data: [],
      message: 'Error al filtrar las metas'
    };
  }
}

/**
 * Genera y descarga un archivo CSV con las metas
 * @param {Array} metas - Lista de metas a exportar (opcional, usa todas si no se especifica)
 */
export async function exportarMetasCSV(metas = null) {
  try {
    let metasParaExportar = metas;
    
    if (!metasParaExportar) {
      const resultado = await listarMetas();
      if (!resultado.success) throw new Error('No se pudieron obtener las metas');
      metasParaExportar = resultado.data;
    }
    
    // Encabezados del CSV
    const headers = [
      'ID',
      'Nombre de Meta',
      'División',
      'Proceso',
      'Indicador',
      'Línea Base (Año)',
      'Línea Base (Valor)',
      'Fecha Objetivo',
      'Descripción',
      'Progreso (%)',
      'Valor Actual',
      'Estado',
      'Fecha Creación'
    ];
    
    // Convertir metas a filas CSV
    const filas = metasParaExportar.map(meta => [
      meta.id,
      `"${meta.nombre}"`,
      `"${meta.division}"`,
      `"${meta.proceso}"`,
      `"${meta.indicador}"`,
      meta.lineaBase.año,
      meta.lineaBase.valor,
      meta.fechaObjetivo,
      `"${meta.descripcion || ''}"`,
      meta.progreso.porcentaje,
      meta.progreso.valorActual,
      meta.estado,
      new Date(meta.fechaCreacion).toLocaleDateString('es-CL')
    ]);
    
    // Construir contenido CSV
    const csvContent = [
      headers.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `metas-reduccion-codelco-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return {
      success: true,
      message: `Archivo CSV generado con ${metasParaExportar.length} metas`
    };
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return {
      success: false,
      message: 'Error al generar el archivo CSV'
    };
  }
}

/**
 * Obtiene estadísticas resumidas de las metas
 * @returns {Object} Estadísticas
 */
export async function obtenerEstadisticas() {
  try {
    const resultado = await listarMetas();
    if (!resultado.success) return resultado;
    
    const metas = resultado.data;
    
    // Agrupar por división
    const metasPorDivision = metas.reduce((acc, meta) => {
      acc[meta.division] = (acc[meta.division] || 0) + 1;
      return acc;
    }, {});
    
    // Agrupar por proceso
    const metasPorProceso = metas.reduce((acc, meta) => {
      acc[meta.proceso] = (acc[meta.proceso] || 0) + 1;
      return acc;
    }, {});
    
    // Calcular progreso promedio
    const progresoPromedio = metas.length > 0 
      ? metas.reduce((sum, meta) => sum + meta.progreso.porcentaje, 0) / metas.length
      : 0;
    
    return {
      success: true,
      data: {
        totalMetas: metas.length,
        metasPorDivision,
        metasPorProceso,
        progresoPromedio: Math.round(progresoPromedio),
        metasActivas: metas.filter(m => m.estado === 'activa').length
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      success: false,
      data: null,
      message: 'Error al calcular estadísticas'
    };
  }
}

// Utilidades de validación
export const validadores = {
  /**
   * Valida los datos de una meta antes de crear/actualizar
   * @param {Object} metaData - Datos de la meta
   * @returns {Object} Resultado de validación
   */
  validarMeta(metaData) {
    const errores = {};
    
    if (!metaData.nombre || metaData.nombre.trim().length < 3) {
      errores.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!metaData.division) {
      errores.division = 'Debe seleccionar una división';
    }
    
    if (!metaData.proceso) {
      errores.proceso = 'Debe seleccionar un proceso';
    }
    
    if (!metaData.indicador) {
      errores.indicador = 'Debe seleccionar un indicador';
    }
    
    if (!metaData.lineaBase?.año) {
      errores.lineaBaseAño = 'Debe especificar el año de línea base';
    } else {
      const año = parseInt(metaData.lineaBase.año);
      const añoActual = new Date().getFullYear();
      if (año < 2015 || año > añoActual) {
        errores.lineaBaseAño = `El año debe estar entre 2015 y ${añoActual}`;
      }
    }
    
    if (!metaData.lineaBase?.valor || metaData.lineaBase.valor <= 0) {
      errores.lineaBaseValor = 'El valor de línea base debe ser mayor a 0';
    }
    
    if (!metaData.fechaObjetivo) {
      errores.fechaObjetivo = 'Debe especificar la fecha objetivo';
    } else {
      const fechaObj = new Date(metaData.fechaObjetivo);
      const hoy = new Date();
      if (fechaObj <= hoy) {
        errores.fechaObjetivo = 'La fecha objetivo debe ser futura';
      }
    }
    
    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }
};

/**
 * Actualiza una meta existente por ID
 * @param {string} id - ID de la meta a actualizar
 * @param {Object} cambios - Campos a modificar
 */
export async function actualizarMeta(id, cambios = {}) {
  try {
    inicializarStorage();
    const metas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = metas.findIndex(m => m.id === id);
    if (idx === -1) return { success: false, message: 'Meta no encontrada' };

    const anterior = { ...metas[idx] };
    metas[idx] = { ...metas[idx], ...cambios };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Registrar auditoría (no bloquear flujo)
    (async () => {
      try {
        await servicioAuditoria.agregarEvento({
          usuario: (JSON.parse(localStorage.getItem('currentUser') || '{}').usuario) || 'anon',
          rol: (JSON.parse(localStorage.getItem('currentUser') || '{}').rol) || 'usuario',
          accion: 'modificar',
          entidad: 'metas',
          entidad_id: id,
          fecha_hora: new Date().toISOString(),
          motivo: 'Actualización desde UI',
          detalle_anterior: anterior,
          detalle_nuevo: metas[idx],
          ip_origen: '127.0.0.1'
        });
      } catch (e) { /* ignore */ }
    })();

    return { success: true, data: metas[idx], message: 'Meta actualizada' };
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    return { success: false, message: 'Error al actualizar meta' };
  }
}

/**
 * Elimina una meta por ID
 * @param {string} id
 */
export async function eliminarMeta(id) {
  try {
    inicializarStorage();
    const metas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = metas.findIndex(m => m.id === id);
    if (idx === -1) return { success: false, message: 'Meta no encontrada' };

    const anterior = metas[idx];
    metas.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Registrar auditoría (no bloquear flujo)
    (async () => {
      try {
        await servicioAuditoria.agregarEvento({
          usuario: (JSON.parse(localStorage.getItem('currentUser') || '{}').usuario) || 'anon',
          rol: (JSON.parse(localStorage.getItem('currentUser') || '{}').rol) || 'usuario',
          accion: 'eliminar',
          entidad: 'metas',
          entidad_id: id,
          fecha_hora: new Date().toISOString(),
          motivo: 'Eliminación desde UI',
          detalle_anterior: anterior,
          detalle_nuevo: null,
          ip_origen: '127.0.0.1'
        });
      } catch (e) { /* ignore */ }
    })();

    return { success: true, message: 'Meta eliminada' };
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    return { success: false, message: 'Error al eliminar meta' };
  }
}
