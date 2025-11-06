import React from 'react';
import { formatearFecha } from '../utils/helpers';

const formatRelative = (timestamp) => {
  if (!timestamp) return 'Sin registros';
  const fecha = new Date(timestamp);
  if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';

  const ahora = new Date();
  const diffMs = fecha.getTime() - ahora.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const rtf = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 48) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
};

const badgeClasses = (estado) => {
  switch (estado) {
    case 'alta':
      return 'bg-sky-100 text-sky-800';
    case 'operativo':
      return 'bg-green-100 text-green-800';
    case 'mantenimiento':
      return 'bg-amber-100 text-amber-800';
    case 'baja':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const descripcionEstado = {
  alta: 'Alta',
  operativo: 'Operativo',
  mantenimiento: 'En mantenimiento',
  baja: 'Baja',
  default: 'Sin estado'
};

const ListaSensores = ({ sensores = [], onVerDetalle, onSimular, onEliminar }) => {
  if (!sensores.length) {
    return (
      <div className="card text-center" role="status">
        <h3 className="text-lg font-semibold text-codelco-dark mb-2">No hay sensores registrados</h3>
        <p className="text-codelco-secondary text-sm">
          Utilice el formulario superior para dar de alta el primer sensor del listado.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Sensores dados de alta">
      {sensores.map(sensor => (
        <article key={sensor.id} className="card" aria-labelledby={`sensor-${sensor.id}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <h3 id={`sensor-${sensor.id}`} className="text-lg font-semibold text-codelco-dark">
                {sensor.nombre}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {sensor.tipo}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {sensor.protocolo}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses(sensor.estado)}`}>
                  {descripcionEstado[sensor.estado] || descripcionEstado.default}
                </span>
              </div>
              <p className="text-sm text-codelco-secondary">
                <strong>División:</strong> {sensor.division || 'Sin referencia'}
              </p>
              {sensor.coordenadas && (
                <p className="text-xs text-gray-500">
                  Lat/Lon: {Number(sensor.coordenadas.lat || 0).toFixed(4)}, {Number(sensor.coordenadas.lng || 0).toFixed(4)}
                </p>
              )}
              {sensor.descripcion && (
                <p className="text-sm text-gray-600 max-w-xl">{sensor.descripcion}</p>
              )}
            </div>

            <div className="text-sm text-right space-y-1 min-w-[200px]">
              <p className="text-codelco-secondary">
                Frecuencia: cada <strong>{sensor.frecuenciaSegundos}</strong> segundos
              </p>
              <p className="text-codelco-secondary">
                Último heartbeat: <span className="font-semibold text-codelco-dark">{formatRelative(sensor.ultimaTransmision)}</span>
              </p>
              {sensor.ultimaTransmision && (
                <p className="text-xs text-gray-500">
                  {formatearFecha(sensor.ultimaTransmision, true)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onSimular?.(sensor.id)}
            >
              Simular enviar paquete ahora
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onVerDetalle?.(sensor.id)}
            >
              Ver detalle
            </button>
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              onClick={() => {
                const confirmado = window.confirm('¿Está seguro de eliminar el sensor? Esta acción forma parte del prototipo, pero es irreversible.');
                if (confirmado) {
                  onEliminar?.(sensor.id);
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </article>
      ))}
    </section>
  );
};

export default ListaSensores;
