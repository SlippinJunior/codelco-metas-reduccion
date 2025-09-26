import React, { useMemo, useState } from 'react';
import TablaPaginar from './TablaPaginar';
import { formatearFecha } from '../utils/helpers';
import {
  simularRecepcion,
  iniciarSimulacionAutomatica,
  detenerSimulacionAutomatica
} from '../services/servicioSensores';

const resumenPayload = (payload = {}) => {
  const entradas = Object.entries(payload);
  if (!entradas.length) return 'Sin datos';
  return entradas
    .slice(0, 3)
    .map(([clave, valor]) => `${clave}: ${typeof valor === 'number' ? valor : JSON.stringify(valor)}`)
    .join(' · ');
};

const DetalleSensor = ({ sensor, onCerrar, onActualizar }) => {
  const [estadoAccion, setEstadoAccion] = useState({ tipo: '', mensaje: '' });
  const [procesando, setProcesando] = useState(false);

  const ultimaTransmision = sensor?.historialTransmisiones?.[0];

  const columnasHistorial = useMemo(() => ([
    {
      key: 'timestamp',
      header: 'Fecha y hora',
      render: (valor) => formatearFecha(valor, true)
    },
    {
      key: 'payload',
      header: 'Payload (resumen)',
      render: (valor) => (
        <span className="font-mono text-xs text-codelco-dark break-words">
          {resumenPayload(valor)}
        </span>
      )
    },
    {
      key: 'detalle',
      header: 'Detalle',
      render: (_, fila) => (
        <details>
          <summary className="cursor-pointer text-codelco-accent text-xs">Ver JSON</summary>
          <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto mt-2">
            {JSON.stringify(fila.payload, null, 2)}
          </pre>
        </details>
      )
    }
  ]), []);

  const columnasAcuses = useMemo(() => ([
    {
      key: 'fecha_hora_acuse',
      header: 'Fecha acuse',
      render: (valor) => formatearFecha(valor, true)
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (valor) => (
        <span className={[
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
          valor === 'recibido' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        ].join(' ')}>
          {valor}
        </span>
      )
    },
    {
      key: 'mensaje',
      header: 'Mensaje',
      render: (valor) => <span className="text-sm text-gray-700">{valor}</span>
    }
  ]), []);

  if (!sensor) {
    return (
      <aside className="card" role="status">
        <p className="text-sm text-codelco-secondary">Seleccione un sensor para ver el detalle.</p>
      </aside>
    );
  }

  const manejarSimulacionManual = async () => {
    setProcesando(true);
    const resultado = await simularRecepcion(sensor.id);
    setProcesando(false);
    if (resultado.success) {
      setEstadoAccion({ tipo: 'success', mensaje: 'Paquete simulado recibido correctamente.' });
      onActualizar?.();
    } else {
      setEstadoAccion({ tipo: 'error', mensaje: resultado.message || 'No fue posible simular el paquete.' });
    }
  };

  const manejarToggleAutomatica = async () => {
    setProcesando(true);
    const yaActiva = sensor.simulacionActiva;
    const respuesta = yaActiva
      ? await detenerSimulacionAutomatica(sensor.id)
      : await iniciarSimulacionAutomatica(sensor.id);
    setProcesando(false);

    if (respuesta.success) {
      setEstadoAccion({
        tipo: 'success',
        mensaje: yaActiva
          ? 'Simulación automática detenida.'
          : `Simulación automática iniciada. Se generará un paquete cada ${sensor.frecuenciaSegundos} segundos.`
      });
      onActualizar?.();
    } else {
      setEstadoAccion({ tipo: 'error', mensaje: respuesta.message || 'No fue posible actualizar la simulación.' });
    }
  };

  const manejarExportarCSV = () => {
    if (!sensor.historialTransmisiones?.length) {
      setEstadoAccion({ tipo: 'error', mensaje: 'No hay datos para exportar.' });
      return;
    }

    const headers = ['ID', 'Sensor', 'Fecha', 'Protocolo', 'Payload'];
    const rows = sensor.historialTransmisiones.map(registro => ([
      registro.id,
      sensor.nombre,
      formatearFecha(registro.timestamp, true),
      registro.protocolo,
      JSON.stringify(registro.payload)
    ]));

    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.setAttribute('download', `historial-${sensor.id}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    setEstadoAccion({ tipo: 'success', mensaje: 'Historial exportado correctamente en CSV.' });
  };

  return (
    <aside className="card space-y-6" aria-label={`Detalle del sensor ${sensor.nombre}`}>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-codelco-dark">{sensor.nombre}</h2>
          <p className="text-sm text-codelco-secondary">{sensor.descripcion || 'Sin descripción proporcionada.'}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{sensor.tipo}</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">{sensor.protocolo}</span>
            <span className={sensor.simulacionActiva ? 'bg-green-100 text-green-800 px-2 py-1 rounded' : 'bg-gray-100 text-gray-700 px-2 py-1 rounded'}>
              {sensor.simulacionActiva ? 'Simulación automática activa' : 'Simulación manual'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCerrar}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={manejarExportarCSV}
            className="btn-accent"
          >
            Exportar historial CSV
          </button>
        </div>
      </header>

      <section className="bg-gray-50 border border-gray-200 rounded-lg p-4" aria-live="polite">
        <h3 className="text-lg font-semibold mb-3">Última transmisión</h3>
        {ultimaTransmision ? (
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Fecha:</strong> {formatearFecha(ultimaTransmision.timestamp, true)}</p>
            <p><strong>Resumen:</strong> {resumenPayload(ultimaTransmision.payload)}</p>
            <details>
              <summary className="cursor-pointer text-codelco-accent">Ver payload completo</summary>
              <pre className="bg-white border border-gray-200 rounded mt-2 p-3 text-xs overflow-x-auto">
{JSON.stringify(ultimaTransmision.payload, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-sm text-codelco-secondary">Aún no se reciben transmisiones para este sensor.</p>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-codelco-dark mb-2">Configuración</h3>
          <dl className="text-sm text-gray-700 space-y-1">
            <div>
              <dt className="font-medium text-codelco-secondary">División / Ubicación</dt>
              <dd>{sensor.division}</dd>
            </div>
            <div>
              <dt className="font-medium text-codelco-secondary">Frecuencia</dt>
              <dd>Cada {sensor.frecuenciaSegundos} segundos</dd>
            </div>
            <div>
              <dt className="font-medium text-codelco-secondary">Credencial</dt>
              <dd>
                {sensor.protocolo === 'MQTT' && (
                  <div className="font-mono text-xs break-words">Topic: {sensor.credenciales?.topic || 'N/D'}</div>
                )}
                {sensor.protocolo === 'HTTP' && (
                  <div className="font-mono text-xs break-words">Endpoint: {sensor.credenciales?.endpoint || 'N/D'}</div>
                )}
                {sensor.credenciales?.secreto && (
                  <div className="font-mono text-xs break-words">Secreto: ••••••••</div>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-codelco-dark">Acciones de simulación</h3>
          <p className="text-xs text-codelco-secondary">
            Active la simulación automática para generar paquetes cada N segundos o envíe un paquete manual para comprobar el flujo de acuse de recibo.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={manejarToggleAutomatica}
              className="btn-primary"
              disabled={procesando}
            >
              {sensor.simulacionActiva ? 'Detener simulación automática' : 'Activar simulación automática'}
            </button>
            <button
              type="button"
              onClick={manejarSimulacionManual}
              className="btn-secondary"
              disabled={procesando}
            >
              Simular paquete ahora
            </button>
          </div>
        </div>
      </section>

      {estadoAccion.mensaje && (
        <div role="status" aria-live="polite">
          <div
            className={[
              'rounded-md border px-4 py-3 text-sm',
              estadoAccion.tipo === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            ].join(' ')}
          >
            {estadoAccion.mensaje}
          </div>
        </div>
      )}

      <section aria-label="Historial de transmisiones">
        <h3 className="text-lg font-semibold text-codelco-dark mb-3">Historial de transmisiones</h3>
        <TablaPaginar
          columns={columnasHistorial}
          data={sensor.historialTransmisiones || []}
          emptyMessage="Sin transmisiones registradas aún."
          ariaLabel="Tabla de historial de transmisiones"
        />
      </section>

      <section aria-label="Acuses de recibo">
        <h3 className="text-lg font-semibold text-codelco-dark mb-3">Acuses de recibo recientes</h3>
        <TablaPaginar
          columns={columnasAcuses}
          data={sensor.acuses || []}
          emptyMessage="Sin acuses registrados"
          ariaLabel="Tabla de acuses de recibo"
        />
      </section>
    </aside>
  );
};

export default DetalleSensor;
