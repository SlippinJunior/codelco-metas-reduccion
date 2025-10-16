import React, { useState } from 'react';

const OPCIONES_ENTIDAD = [
  { id: 'metas', label: 'Metas de reducción' },
  { id: 'sensores', label: 'Sensores ambientales' },
  { id: 'reportes', label: 'Reportes internos' }
];

const PLANTILLAS_DEMO = {
  metas: {
    registro_id: 'META-DEM-001',
    tipo_entidad: 'metas',
    contenido: '{"meta":"Reducir emisiones alcance 2","valor_proyectado":12.5,"unidad":"%"}',
    usuario: 'Auditor Demo',
    motivo: 'Validación de hito trimestral'
  },
  sensores: {
    registro_id: 'SENSOR-DEM-045',
    tipo_entidad: 'sensores',
    contenido: '{"sensor":"CHU-CO2-01","lectura_ppm":367,"umbral":400}',
    usuario: 'Control Interno Demo',
    motivo: 'Confirmación de calibración'
  },
  reportes: {
    registro_id: 'REP-DEM-2025-Q1',
    tipo_entidad: 'reportes',
    contenido: '{"titulo":"Reporte trimestral Q1","estado":"emitido","version":"1.0"}',
    usuario: 'Auditoría Integrada',
    motivo: 'Publicación oficial'
  }
};

function FormularioRegistrarHash({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    registro_id: '',
    tipo_entidad: 'metas',
    contenido: '',
    usuario: '',
    motivo: ''
  });
  const [feedback, setFeedback] = useState(null);

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handlePlantilla = (tipo) => {
    const plantilla = PLANTILLAS_DEMO[tipo];
    if (!plantilla) return;
    setForm({ ...plantilla });
    setFeedback({ tipo: 'info', mensaje: 'Campos cargados con datos demostrativos.' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.registro_id.trim() || !form.contenido.trim() || !form.usuario.trim()) {
      setFeedback({ tipo: 'error', mensaje: 'Completa al menos el identificador, el contenido y el usuario responsable.' });
      return;
    }

    try {
      const resultado = await onSubmit?.({
        registro_id: form.registro_id.trim(),
        tipo_entidad: form.tipo_entidad,
        contenido: form.contenido,
        usuario: form.usuario.trim(),
        motivo: form.motivo.trim()
      });

      if (resultado?.success) {
        setFeedback({ tipo: 'success', mensaje: resultado.message || 'Bloque generado correctamente.' });
        setForm(prev => ({ ...prev, registro_id: '', contenido: '', motivo: '' }));
      } else if (resultado) {
        setFeedback({ tipo: 'error', mensaje: resultado.message || 'No fue posible generar el bloque.' });
      }
    } catch (error) {
      console.error('Error al confirmar registro demo:', error);
      setFeedback({ tipo: 'error', mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.' });
    }
  };

  return (
    <form className="card h-full flex flex-col" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-codelco-dark">Confirmar registro (demo)</h2>
          <p className="text-sm text-codelco-secondary">Cada confirmación genera una huella criptográfica y un bloque enlazado.</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-codelco-accent font-semibold bg-codelco-accent/10 px-3 py-1 rounded-full">
          Demostración
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="registro-id" className="block text-sm font-medium text-codelco-dark mb-1">
            Identificador del registro
          </label>
          <input
            id="registro-id"
            name="registro_id"
            type="text"
            autoComplete="off"
            className="form-input"
            placeholder="Ej: META-ABC-001"
            value={form.registro_id}
            onChange={(e) => actualizarCampo('registro_id', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo-entidad" className="block text-sm font-medium text-codelco-dark mb-1">
              Tipo de entidad
            </label>
            <select
              id="tipo-entidad"
              name="tipo_entidad"
              className="form-input"
              value={form.tipo_entidad}
              onChange={(e) => actualizarCampo('tipo_entidad', e.target.value)}
            >
              {OPCIONES_ENTIDAD.map(opcion => (
                <option key={opcion.id} value={opcion.id}>{opcion.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="usuario-confirmador" className="block text-sm font-medium text-codelco-dark mb-1">
              Usuario que confirma
            </label>
            <input
              id="usuario-confirmador"
              name="usuario"
              type="text"
              className="form-input"
              placeholder="Auditor Demo"
              value={form.usuario}
              onChange={(e) => actualizarCampo('usuario', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="contenido-registro" className="block text-sm font-medium text-codelco-dark mb-1">
            Contenido validado
          </label>
          <textarea
            id="contenido-registro"
            name="contenido"
            className="form-textarea min-h-[150px]"
            placeholder='Acepta texto libre o JSON. Ej: {"meta":"Reducir X","valor":100}'
            value={form.contenido}
            onChange={(e) => actualizarCampo('contenido', e.target.value)}
            required
          />
          <p className="text-xs text-codelco-secondary mt-1">
            Para demostración, el contenido se serializa y firma con SHA-256 + sello “registro demostrativo - no vinculante”.
          </p>
        </div>

        <div>
          <label htmlFor="motivo-registro" className="block text-sm font-medium text-codelco-dark mb-1">
            Motivo (opcional)
          </label>
          <input
            id="motivo-registro"
            name="motivo"
            type="text"
            className="form-input"
            placeholder="Ej: Validación trimestral"
            value={form.motivo}
            onChange={(e) => actualizarCampo('motivo', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Generando bloque...' : 'Confirmar registro'}
        </button>
        <div className="flex items-center gap-2 text-xs text-codelco-secondary">
          <span>Autocompletar con:</span>
          {OPCIONES_ENTIDAD.map(opcion => (
            <button
              key={`plantilla-${opcion.id}`}
              type="button"
              onClick={() => handlePlantilla(opcion.id)}
              className="px-2 py-1 rounded-md bg-codelco-primary/10 text-codelco-primary hover:bg-codelco-primary/20 focus:ring-2 focus:ring-codelco-primary focus:outline-none"
            >
              {opcion.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 text-sm rounded-md px-3 py-2 border ${
            feedback.tipo === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : feedback.tipo === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.mensaje}
        </div>
      )}
    </form>
  );
}

export default FormularioRegistrarHash;
