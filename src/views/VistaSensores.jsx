import React, { useEffect, useState, useCallback } from 'react';
import FormularioAltaSensor from '../components/FormularioAltaSensor';
import ListaSensores from '../components/ListaSensores';
import DetalleSensor from '../components/DetalleSensor';
import servicioSensores, {
  listarSensores,
  obtenerSensor,
  eliminarSensor,
  simularRecepcion
} from '../services/servicioSensores';

const VistaSensores = () => {
  const [sensores, setSensores] = useState([]);
  const [sensorSeleccionado, setSensorSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [estadoGlobal, setEstadoGlobal] = useState({ tipo: '', mensaje: '' });

  const mostrarMensaje = useCallback((tipo, mensaje) => {
    setEstadoGlobal({ tipo, mensaje });
    if (mensaje) {
      setTimeout(() => {
        setEstadoGlobal({ tipo: '', mensaje: '' });
      }, 5000);
    }
  }, []);

  const refrescarSensores = useCallback(async () => {
    const resultado = await listarSensores();
    if (resultado.success) {
      setSensores(resultado.data);
    }
    setCargando(false);
  }, []);

  const refrescarDetalle = useCallback(async (sensorId) => {
    if (!sensorId) return;
    const detalle = await obtenerSensor(sensorId);
    if (detalle.success) {
      setSensorSeleccionado(detalle.data);
    } else {
      setSensorSeleccionado(null);
    }
  }, []);

  useEffect(() => {
    refrescarSensores();

    const subscription = servicioSensores.suscribirseActualizaciones(async ({ sensorId }) => {
      await refrescarSensores();
      if (sensorSeleccionado?.id === sensorId) {
        await refrescarDetalle(sensorId);
      }
    });

    return () => subscription.unsubscribe();
  }, [refrescarSensores, refrescarDetalle, sensorSeleccionado?.id]);

  const manejarAlta = async () => {
    await refrescarSensores();
  mostrarMensaje('success', 'Sensor registrado en el prototipo.');
  };

  const manejarVerDetalle = async (sensorId) => {
    await refrescarDetalle(sensorId);
  };

  const manejarEliminar = async (sensorId) => {
    const resultado = await eliminarSensor(sensorId);
    if (resultado.success) {
      mostrarMensaje('success', 'Sensor eliminado exitosamente.');
      await refrescarSensores();
      if (sensorSeleccionado?.id === sensorId) {
        setSensorSeleccionado(null);
      }
    } else {
      mostrarMensaje('error', resultado.message || 'No se pudo eliminar el sensor.');
    }
  };

  const manejarSimular = async (sensorId) => {
    const resultado = await simularRecepcion(sensorId);
    if (resultado.success) {
      mostrarMensaje('success', 'Paquete simulado recibido y acuse generado.');
      await refrescarSensores();
      if (sensorSeleccionado?.id === sensorId) {
        await refrescarDetalle(sensorId);
      }
    } else {
      mostrarMensaje('error', resultado.message || 'No fue posible simular el paquete.');
    }
  };

  const manejarCerrarDetalle = () => {
    setSensorSeleccionado(null);
  };

  const manejarActualizarDetalle = async () => {
    await refrescarSensores();
    if (sensorSeleccionado?.id) {
      await refrescarDetalle(sensorSeleccionado.id);
    }
  };

  return (
    <div className="min-h-screen bg-codelco-light py-8">
      <div className="container mx-auto px-4 space-y-6">
        <header className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-codelco-dark mb-2">Simulador de Sensores</h1>
          <p className="text-sm text-codelco-secondary max-w-3xl">
            Este módulo permite dar de alta sensores y simular la recepción de paquetes mediante protocolos estándar como MQTT y HTTP.
            Active la simulación automática para ver cómo los paquetes se reciben cada N segundos y cómo se registra el acuse de recibo en tiempo real.
          </p>
        </header>

        {estadoGlobal.mensaje && (
          <div role="status" aria-live="polite">
            <div
              className={[
                'rounded-md border px-4 py-3 text-sm',
                estadoGlobal.tipo === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              ].join(' ')}
            >
              {estadoGlobal.mensaje}
            </div>
          </div>
        )}

        <FormularioAltaSensor onSensorCreado={manejarAlta} />

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-codelco-dark">Sensores dados de alta</h2>
              {cargando && <span className="text-xs text-codelco-secondary">Cargando...</span>}
            </div>
            <ListaSensores
              sensores={sensores}
              onVerDetalle={manejarVerDetalle}
              onSimular={manejarSimular}
              onEliminar={manejarEliminar}
            />
          </div>

          <DetalleSensor
            sensor={sensorSeleccionado}
            onCerrar={manejarCerrarDetalle}
            onActualizar={manejarActualizarDetalle}
          />
        </div>
      </div>
    </div>
  );
};

export default VistaSensores;
