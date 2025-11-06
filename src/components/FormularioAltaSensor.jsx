import React, { useState } from 'react';
import CampoInput from './CampoInput';
import Selector from './Selector';
import servicioSensores, { crearSensor } from '../services/servicioSensores';

const TIPOS_SENSOR = [
  { value: '', label: 'Seleccione tipo de sensor' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'temperatura', label: 'Temperatura' },
  { value: 'flujo', label: 'Flujo' }
];

const PROTOCOLOS = [
  { value: '', label: 'Seleccione protocolo' },
  { value: 'MQTT', label: 'MQTT (broker)' },
  { value: 'HTTP', label: 'HTTP (API REST)' }
];

const initialState = {
  nombre: '',
  tipo: '',
  division: '',
  protocolo: '',
  latitud: '',
  longitud: '',
  credenciales: {
    topic: '',
    endpoint: '',
    secreto: ''
  },
  frecuenciaSegundos: 10,
  descripcion: ''
};

const FormularioAltaSensor = ({ onSensorCreado }) => {
  const [formData, setFormData] = useState(initialState);
  const [errores, setErrores] = useState({});
  const [estadoEnvio, setEstadoEnvio] = useState({ tipo: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);

  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const actualizarCredencial = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      credenciales: {
        ...prev.credenciales,
        [campo]: valor
      }
    }));
  };

  const limpiarFormulario = () => {
    setFormData(initialState);
    setErrores({});
  };

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setEstadoEnvio({ tipo: '', mensaje: '' });

    const validacion = servicioSensores.validarSensor(formData);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      setEstadoEnvio({ tipo: 'error', mensaje: 'Revise los campos obligatorios del formulario.' });
      return;
    }

    setErrores({});
    setEnviando(true);

    const resultado = await crearSensor(formData);
    setEnviando(false);

    if (!resultado.success) {
      setErrores(resultado.errors || {});
      setEstadoEnvio({ tipo: 'error', mensaje: 'No fue posible dar de alta el sensor. Intente nuevamente.' });
      return;
    }

    setEstadoEnvio({ tipo: 'success', mensaje: 'Sensor creado exitosamente. Puede verlo en la lista inferior.' });
    limpiarFormulario();
    onSensorCreado?.(resultado.data);
  };

  const mostrarCampoMQTT = formData.protocolo === 'MQTT';
  const mostrarCampoHTTP = formData.protocolo === 'HTTP';

  return (
    <section className="card" aria-labelledby="alta-sensor-heading">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 id="alta-sensor-heading" className="text-xl font-semibold text-codelco-dark">
            Dar de alta un nuevo sensor
          </h2>
          <p className="text-sm text-codelco-secondary">
            Ingrese la configuración del sensor según el protocolo y la frecuencia de muestreo requerida.
          </p>
        </div>
        <span className="text-xs text-codelco-secondary" aria-live="polite">
          Campos marcados con <span className="text-red-600">*</span> son obligatorios.
        </span>
      </div>

      <form onSubmit={manejarSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CampoInput
          name="nombre"
          label="Nombre del sensor"
          value={formData.nombre}
          onChange={(e) => actualizarCampo('nombre', e.target.value)}
          required
          error={errores.nombre}
        />

        <Selector
          name="tipo"
          label="Tipo de sensor"
          value={formData.tipo}
          onChange={(e) => actualizarCampo('tipo', e.target.value)}
          options={TIPOS_SENSOR}
          required
          error={errores.tipo}
        />

        <CampoInput
          name="division"
          label="División / Ubicación"
          value={formData.division}
          onChange={(e) => actualizarCampo('division', e.target.value)}
          required
          error={errores.division}
        />

        <Selector
          name="protocolo"
          label="Protocolo"
          value={formData.protocolo}
          onChange={(e) => actualizarCampo('protocolo', e.target.value)}
          options={PROTOCOLOS}
          required
          error={errores.protocolo}
        />

        <CampoInput
          name="latitud"
          label="Latitud"
          type="number"
          step="0.000001"
          value={formData.latitud}
          onChange={(e) => actualizarCampo('latitud', e.target.value)}
          required
          error={errores.latitud}
          helpText="Ejemplo: -22.3296"
        />

        <CampoInput
          name="longitud"
          label="Longitud"
          type="number"
          step="0.000001"
          value={formData.longitud}
          onChange={(e) => actualizarCampo('longitud', e.target.value)}
          required
          error={errores.longitud}
          helpText="Ejemplo: -68.9147"
        />

        {mostrarCampoMQTT && (
          <CampoInput
            name="topic"
            label="Topic MQTT"
            value={formData.credenciales.topic}
            onChange={(e) => actualizarCredencial('topic', e.target.value)}
            required
            error={errores.topic}
            helpText="Ejemplo: codelco/sensores/m1"
            className="md:col-span-2"
          />
        )}

        {mostrarCampoHTTP && (
          <CampoInput
            name="endpoint"
            label="Endpoint HTTP"
            value={formData.credenciales.endpoint}
            onChange={(e) => actualizarCredencial('endpoint', e.target.value)}
            required
            error={errores.endpoint}
            helpText="Debe incluir http:// o https://"
            className="md:col-span-2"
          />
        )}

        <CampoInput
          name="secreto"
          label="Secreto / Token (opcional)"
          value={formData.credenciales.secreto}
          onChange={(e) => actualizarCredencial('secreto', e.target.value)}
          helpText="Utilice un API token o password cuando aplique."
        />

        <CampoInput
          name="frecuencia"
          label="Frecuencia de muestreo (segundos)"
          type="number"
          min="1"
          value={formData.frecuenciaSegundos}
          onChange={(e) => actualizarCampo('frecuenciaSegundos', e.target.value)}
          required
          error={errores.frecuenciaSegundos}
          helpText="El simulador utilizará este valor para programar los paquetes automáticos."
        />

        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="block text-sm font-medium text-codelco-dark">
            Descripción (opcional)
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            rows={3}
            className="form-input w-full mt-1"
            placeholder="Detalle brevemente la finalidad del sensor"
          />
        </div>

        {estadoEnvio.mensaje && (
          <div className="md:col-span-2" role="status" aria-live="polite">
            <div
              className={[
                'rounded-md border px-4 py-3 text-sm',
                estadoEnvio.tipo === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              ].join(' ')}
            >
              {estadoEnvio.mensaje}
            </div>
          </div>
        )}

        <div className="md:col-span-2 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={limpiarFormulario}
            disabled={enviando}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={enviando}
          >
            {enviando && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            Dar de alta
          </button>
        </div>
      </form>
    </section>
  );
};

export default FormularioAltaSensor;
