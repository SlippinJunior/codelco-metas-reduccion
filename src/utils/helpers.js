/**
 * Utilidades para formateo de fechas, números y validaciones
 * Funciones helper para el proyecto de metas de reducción Codelco
 */

/**
 * Formatea una fecha a formato local chileno
 * @param {string|Date} fecha - Fecha a formatear
 * @param {boolean} incluirHora - Si incluir la hora en el formato
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fecha, incluirHora = false) {
  if (!fecha) return '';
  
  const fechaObj = new Date(fecha);
  if (isNaN(fechaObj.getTime())) return '';
  
  const opciones = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Santiago'
  };
  
  if (incluirHora) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }
  
  return fechaObj.toLocaleDateString('es-CL', opciones);
}

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Número formateado
 */
export function formatearNumero(numero, decimales = 2) {
  if (numero == null || isNaN(numero)) return '0';
  
  return Number(numero).toLocaleString('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string|Date} fechaInicio - Fecha inicial
 * @param {string|Date} fechaFin - Fecha final
 * @returns {number} Diferencia en días
 */
export function calcularDiferenciaDias(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;
  
  const diferencia = fin.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

/**
 * Valida si una fecha está en el futuro
 * @param {string|Date} fecha - Fecha a validar
 * @returns {boolean} True si la fecha es futura
 */
export function esFechaFutura(fecha) {
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
  
  return fechaObj > hoy;
}

/**
 * Genera un color único basado en un string (para gráficos)
 * @param {string} str - String base para generar el color
 * @returns {string} Color en formato hex
 */
export function generarColorDesdeString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = ((hash & 0x00FFFFFF) | 0x1000000).toString(16).substring(1);
  return `#${color}`;
}

/**
 * Trunca un texto a una longitud específica añadiendo "..."
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncarTexto(texto, longitud = 50) {
  if (!texto || texto.length <= longitud) return texto || '';
  return texto.substring(0, longitud) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalizarTexto(texto) {
  if (!texto) return '';
  return texto.toLowerCase().replace(/\b\w/g, letra => letra.toUpperCase());
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Debounce para evitar llamadas excesivas a funciones
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce aplicado
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calcula el progreso porcentual entre un valor inicial y objetivo
 * @param {number} valorInicial - Valor de línea base
 * @param {number} valorActual - Valor actual
 * @param {number} valorObjetivo - Valor objetivo (opcional, asume reducción del 25% si no se especifica)
 * @returns {number} Porcentaje de progreso (0-100)
 */
export function calcularProgreso(valorInicial, valorActual, valorObjetivo = null) {
  if (!valorInicial || !valorActual) return 0;
  
  // Si no hay valor objetivo, asumir reducción del 25%
  const objetivo = valorObjetivo || (valorInicial * 0.75);
  
  // Calcular la reducción lograda
  const reduccionLograda = valorInicial - valorActual;
  const reduccionObjetivo = valorInicial - objetivo;
  
  if (reduccionObjetivo <= 0) return 0;
  
  const progreso = (reduccionLograda / reduccionObjetivo) * 100;
  return Math.max(0, Math.min(100, progreso)); // Limitar entre 0 y 100
}

/**
 * Convierte un objeto a query string para URLs
 * @param {Object} obj - Objeto con parámetros
 * @returns {string} Query string
 */
export function objetoAQueryString(obj) {
  const params = new URLSearchParams();
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  
  return params.toString();
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export async function copiarAlPortapapeles(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
}

/**
 * Genera un ID único simple
 * @param {string} prefijo - Prefijo para el ID
 * @returns {string} ID único
 */
export function generarId(prefijo = 'id') {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea bytes a unidades legibles
 * @param {number} bytes - Cantidad de bytes
 * @param {number} decimales - Decimales a mostrar
 * @returns {string} Tamaño formateado
 */
export function formatearTamañoArchivo(bytes, decimales = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimales < 0 ? 0 : decimales;
  const tamaños = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
}

/**
 * Constantes útiles para el proyecto
 */
export const CONSTANTES = {
  // Colores de estado
  COLORES_ESTADO: {
    activa: '#059669',
    pausada: '#ea580c',
    completada: '#1e3a8a',
    vencida: '#dc2626'
  },
  
  // Límites de validación
  LIMITES: {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 100,
    DESCRIPCION_MAX: 500,
    AÑO_MIN: 2015,
    AÑO_MAX: new Date().getFullYear() + 10
  },
  
  // Formatos de fecha
  FORMATOS_FECHA: {
    CORTO: 'dd/MM/yyyy',
    LARGO: 'dd \'de\' MMMM \'de\' yyyy',
    CON_HORA: 'dd/MM/yyyy HH:mm'
  }
};
