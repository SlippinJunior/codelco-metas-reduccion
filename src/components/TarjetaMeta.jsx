import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente TarjetaMeta
 * 
 * Muestra la información de una meta individual en formato de tarjeta.
 * Incluye indicadores visuales de progreso y información accesible.
 * 
 * Props:
 * - meta: objeto con los datos de la meta
 * - onEditar: función callback para editar la meta (opcional)
 * - onEliminar: función callback para eliminar la meta (opcional)
 */
const TarjetaMeta = ({ meta, onEditar, onEliminar }) => {
  if (!meta) return null;

  // Formatear fechas
  const fechaObjetivo = new Date(meta.fechaObjetivo);
  const fechaCreacion = new Date(meta.fechaCreacion);
  const esVencida = fechaObjetivo < new Date();
  
  // Calcular días restantes
  const diasRestantes = Math.ceil((fechaObjetivo - new Date()) / (1000 * 60 * 60 * 24));
  
  // Determinar color del progreso
  const obtenerColorProgreso = (porcentaje) => {
    if (porcentaje >= 75) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    if (porcentaje >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Determinar estado visual
  const obtenerEstadoVisual = () => {
    if (esVencida && meta.progreso.porcentaje < 100) {
      return {
        clase: 'border-red-300 bg-red-50',
        etiqueta: 'Vencida',
        etiquetaClase: 'bg-red-100 text-red-800'
      };
    }
    if (meta.progreso.porcentaje >= 100) {
      return {
        clase: 'border-green-300 bg-green-50',
        etiqueta: 'Completada',
        etiquetaClase: 'bg-green-100 text-green-800'
      };
    }
    return {
      clase: 'border-gray-200 bg-white',
      etiqueta: 'En Progreso',
      etiquetaClase: 'bg-blue-100 text-blue-800'
    };
  };

  const estadoVisual = obtenerEstadoVisual();

  return (
    <article 
      className={`rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg ${estadoVisual.clase}`}
      aria-labelledby={`meta-titulo-${meta.id}`}
    >
      {/* Encabezado con título y estado */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 
            id={`meta-titulo-${meta.id}`}
            className="text-lg font-semibold text-codelco-dark mb-1 line-clamp-2"
          >
            {meta.nombre}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-codelco-secondary">
              <span className="font-medium">{meta.division}</span> • {meta.proceso}
            </span>
          </div>
        </div>
        
        {/* Etiqueta de estado */}
        <span 
          className={`px-2 py-1 text-xs font-medium rounded-full ${estadoVisual.etiquetaClase}`}
          aria-label={`Estado: ${estadoVisual.etiqueta}`}
        >
          {estadoVisual.etiqueta}
        </span>
      </div>

      {/* Información de la meta */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <dt className="text-codelco-secondary font-medium mb-1">Indicador</dt>
          <dd className="text-codelco-dark">{meta.indicador}</dd>
        </div>
        <div>
          <dt className="text-codelco-secondary font-medium mb-1">Línea Base</dt>
          <dd className="text-codelco-dark">
            {meta.lineaBase.valor} ({meta.lineaBase.año})
          </dd>
        </div>
        <div>
          <dt className="text-codelco-secondary font-medium mb-1">Valor Actual</dt>
          <dd className="text-codelco-dark font-semibold">
            {meta.progreso.valorActual}
          </dd>
        </div>
        <div>
          <dt className="text-codelco-secondary font-medium mb-1">Fecha Objetivo</dt>
          <dd className={`text-codelco-dark ${esVencida ? 'text-red-600 font-medium' : ''}`}>
            {format(fechaObjetivo, 'dd/MM/yyyy', { locale: es })}
          </dd>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-codelco-secondary">Progreso</span>
          <span 
            className="text-sm font-semibold text-codelco-dark"
            aria-label={`Progreso: ${meta.progreso.porcentaje} por ciento`}
          >
            {meta.progreso.porcentaje}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${obtenerColorProgreso(meta.progreso.porcentaje)}`}
            style={{ width: `${Math.min(meta.progreso.porcentaje, 100)}%` }}
            role="progressbar"
            aria-valuenow={meta.progreso.porcentaje}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Progreso de la meta: ${meta.progreso.porcentaje}%`}
          />
        </div>
      </div>

      {/* Información adicional */}
      <div className="mb-4">
        {/* Días restantes o información de vencimiento */}
        {!esVencida ? (
          <div className="text-sm text-codelco-secondary">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {diasRestantes > 0 
                ? `${diasRestantes} días restantes`
                : diasRestantes === 0 
                  ? 'Vence hoy'
                  : `Venció hace ${Math.abs(diasRestantes)} días`
              }
            </span>
          </div>
        ) : (
          <div className="text-sm text-red-600 font-medium">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Meta vencida
            </span>
          </div>
        )}

        {/* Descripción si existe */}
        {meta.descripcion && (
          <details className="mt-3 group">
            <summary className="text-sm text-codelco-accent cursor-pointer hover:text-orange-700 transition-colors">
              Ver descripción
              <span className="ml-1 group-open:rotate-90 transition-transform inline-block">▶</span>
            </summary>
            <p className="mt-2 text-sm text-codelco-secondary leading-relaxed">
              {meta.descripcion}
            </p>
          </details>
        )}
      </div>

      {/* Metadatos */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-codelco-secondary">
          <span>
            Creada: {format(fechaCreacion, 'dd/MM/yyyy', { locale: es })}
          </span>
          <span className="font-mono">
            ID: {meta.id.split('-').pop()}
          </span>
        </div>
      </div>

      {/* Botones de acción (si están disponibles) */}
      {(onEditar || onEliminar) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {onEditar && (
            <button
              onClick={() => onEditar(meta)}
              className="text-sm text-codelco-accent hover:text-orange-700 transition-colors"
              aria-label={`Editar meta: ${meta.nombre}`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </span>
            </button>
          )}
          {onEliminar && (
            <button
              onClick={() => onEliminar(meta)}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
              aria-label={`Eliminar meta: ${meta.nombre}`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </span>
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default TarjetaMeta;
