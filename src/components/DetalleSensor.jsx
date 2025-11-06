import React, { useEffect, useMemo, useState } from 'react';
import TablaPaginar from './TablaPaginar';
import MapaSensor from './MapaSensor';
import { formatearFecha } from '../utils/helpers';
import {
  simularRecepcion,
  iniciarSimulacionAutomatica,
  detenerSimulacionAutomatica,
  registrarEstadoSensor,
  exportarBitacoraSensor,
  ESTADOS_SENSOR
} from '../services/servicioSensores';

const estadoEtiquetas = {
  alta: 'Alta',
  operativo: 'Operativo',
  mantenimiento: 'Mantenimiento',
  baja: 'Baja',
  default: 'Sin estado'
};

const estadoClases = {
  alta: 'bg-sky-100 text-sky-800',
  operativo: 'bg-green-100 text-green-800',
  mantenimiento: 'bg-amber-100 text-amber-800',
  baja: 'bg-red-100 text-red-800'
};

const claseEstado = (estado) => estadoClases[estado] || 'bg-gray-100 text-gray-700';

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
  const [registrandoEstado, setRegistrandoEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(sensor?.estado || ESTADOS_SENSOR[0]);
  const [comentarioEstado, setComentarioEstado] = useState('');
  const [filtroFechas, setFiltroFechas] = useState({ desde: '', hasta: '' });

  useEffect(() => {
    setNuevoEstado(sensor?.estado || ESTADOS_SENSOR[0]);
    setComentarioEstado('');
    setFiltroFechas({ desde: '', hasta: '' });
  }, [sensor?.id, sensor?.estado]);

  const ultimaTransmision = sensor?.historialTransmisiones?.[0];
  const ultimoEvento = sensor?.bitacoraEstados?.[0] || null;

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

  const columnasBitacora = useMemo(() => ([
    {
      key: 'fecha',
      header: 'Fecha',
      render: (valor) => formatearFecha(valor, true)
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (valor) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${claseEstado(valor)}`}>
          {estadoEtiquetas[valor] || valor}
        </span>
      )
    },
    {
      key: 'usuario',
      header: 'Registrado por',
      render: (valor) => <span className="text-sm text-gray-700">{valor || '—'}</span>
    },
    {
      key: 'comentario',
      header: 'Comentario',
      render: (valor) => <span className="text-sm text-gray-600">{valor || 'Sin comentario'}</span>
    }
  ]), []);

  const normalizarFiltroFecha = (valor, esFin = false) => {
    if (!valor) return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return null;
    if (esFin) {
      fecha.setHours(23, 59, 59, 999);
    } else {
      fecha.setHours(0, 0, 0, 0);
    }
    return fecha;
  };

  const bitacoraFiltrada = useMemo(() => {
    if (!sensor?.bitacoraEstados) return [];
    const desde = normalizarFiltroFecha(filtroFechas.desde, false);
    const hasta = normalizarFiltroFecha(filtroFechas.hasta, true);
    return sensor.bitacoraEstados
      .filter(evento => {
        const fecha = new Date(evento.fecha);
        if (Number.isNaN(fecha.getTime())) return false;
        if (desde && fecha < desde) return false;
        if (hasta && fecha > hasta) return false;
        return true;
      });
  }, [sensor?.bitacoraEstados, filtroFechas]);

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

    const contenido = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${sensor.id}_historial.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEstadoAccion({ tipo: 'success', mensaje: 'Historial exportado en CSV (descarga simulada).' });
  };

  const manejarRegistrarEstado = async (event) => {
    event.preventDefault();
    if (!sensor?.id) return;
    setRegistrandoEstado(true);
    const resultado = await registrarEstadoSensor(sensor.id, nuevoEstado, comentarioEstado.trim());
    setRegistrandoEstado(false);
    if (resultado.success) {
      setEstadoAccion({
        tipo: 'success',
        mensaje: `Estado ${estadoEtiquetas[nuevoEstado] || nuevoEstado} registrado correctamente.`
      });
      setComentarioEstado('');
      onActualizar?.();
    } else {
      setEstadoAccion({ tipo: 'error', mensaje: resultado.message || 'No fue posible registrar el estado.' });
    }
  };

  const manejarExportarBitacora = () => {
    if (!sensor?.id) return;
    const resultado = exportarBitacoraSensor(sensor.id, filtroFechas.desde, filtroFechas.hasta);
    if (resultado.success) {
      setEstadoAccion({
        tipo: 'success',
        mensaje: `Bitácora exportada (${resultado.total} eventos).`
      });
    } else {
      setEstadoAccion({
        tipo: 'error',
        mensaje: resultado.message || 'No fue posible exportar la bitácora.'
      });
    }
  };

  const manejarCambioFiltro = (campo, valor) => {
    setFiltroFechas(prev => ({ ...prev, [campo]: valor }));
  };

  const manejarLimpiarFiltro = () => {
    setFiltroFechas({ desde: '', hasta: '' });
  };

  return (
    <aside className="card space-y-6" aria-live="polite">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-codelco-dark">{sensor.nombre}</h2>
          <p className="text-sm text-codelco-secondary">
            {sensor.tipo} · {sensor.protocolo} · {sensor.division}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${claseEstado(sensor.estado)}`}>
              {estadoEtiquetas[sensor.estado] || estadoEtiquetas.default}
            </span>
            {ultimoEvento && (
              <span className="text-codelco-secondary">
                Último cambio: {formatearFecha(ultimoEvento.fecha, true)} · {estadoEtiquetas[ultimoEvento.estado] || ultimoEvento.estado}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4" aria-label="Ubicación y última transmisión">
        <MapaSensor sensor={sensor} />
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" aria-live="polite">
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
        </div>
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
                  <div className="font-mono text-xs break-words">Secreto: ********</div>
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

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-4" aria-label="Bitácora de estados">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-codelco-dark">Bitácora de estados</h3>
            <p className="text-xs text-codelco-secondary">
              Registra transiciones: alta, operativo, mantenimiento y baja.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label htmlFor="filtro-desde" className="block font-medium text-codelco-secondary mb-1">Desde</label>
              <input
                id="filtro-desde"
                type="date"
                value={filtroFechas.desde}
                onChange={(e) => manejarCambioFiltro('desde', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="filtro-hasta" className="block font-medium text-codelco-secondary mb-1">Hasta</label>
              <input
                id="filtro-hasta"
                type="date"
                value={filtroFechas.hasta}
                onChange={(e) => manejarCambioFiltro('hasta', e.target.value)}
                className="form-input"
              />
            </div>
            <button type="button" className="btn-secondary" onClick={manejarLimpiarFiltro}>
              Limpiar
            </button>
            <button type="button" className="btn-accent" onClick={manejarExportarBitacora}>
              Exportar bitácora
            </button>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3" onSubmit={manejarRegistrarEstado}>
          <div>
            <label className="block text-xs font-medium text-codelco-secondary mb-1" htmlFor="estado-nuevo">
              Nuevo estado
            </label>
            <select
              id="estado-nuevo"
              className="form-input"
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
            >
              {ESTADOS_SENSOR.map(estado => (
                <option key={estado} value={estado}>
                  {estadoEtiquetas[estado] || estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-codelco-secondary mb-1" htmlFor="comentario-estado">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario-estado"
              className="form-input h-12"
              value={comentarioEstado}
              onChange={(e) => setComentarioEstado(e.target.value)}
              placeholder="Detalle breve de la intervención o motivo"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={registrandoEstado}
            >
              Registrar estado
            </button>
          </div>
        </form>

        <TablaPaginar
          columns={columnasBitacora}
          data={bitacoraFiltrada}
          emptyMessage="Sin eventos registrados en la bitácora."
          ariaLabel="Tabla de bitácora de estados del sensor"
        />
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
