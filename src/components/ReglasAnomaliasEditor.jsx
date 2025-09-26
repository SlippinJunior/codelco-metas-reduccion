import React, { useEffect, useState } from 'react';

const campos = [
  { categoria: 'rango', campo: 'min', label: 'Mínimo aceptable', step: 'any' },
  { categoria: 'rango', campo: 'max', label: 'Máximo aceptable', step: 'any' },
  { categoria: 'salto', campo: 'deltaMax', label: 'Salto máximo permitido', step: 'any' },
  { categoria: 'zscore', campo: 'ventana', label: 'Ventana Z-score', step: 1, min: 3 },
  { categoria: 'zscore', campo: 'umbral', label: 'Umbral Z-score', step: 'any' }
];

const ReglasAnomaliasEditor = ({ reglas, onGuardar, onReset }) => {
  const [localReglas, setLocalReglas] = useState(() => JSON.parse(JSON.stringify(reglas || {})));
  const [mensajeGuardado, setMensajeGuardado] = useState(null);

  useEffect(() => {
    setLocalReglas(JSON.parse(JSON.stringify(reglas || {})));
  }, [reglas]);

  const handleChange = (tipo, categoria, campo, valor) => {
    setLocalReglas(prev => ({
      ...prev,
      [tipo]: {
        ...(prev[tipo] || {}),
        [categoria]: {
          ...(prev[tipo]?.[categoria] || {}),
          [campo]: valor === '' ? '' : Number(valor)
        }
      }
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMensajeGuardado(null);
    onGuardar?.(localReglas);
    setMensajeGuardado('Parámetros actualizados (recálculo inmediato).');
    setTimeout(() => setMensajeGuardado(null), 4000);
  };

  const tiposOrdenados = Object.entries(localReglas || {});

  return (
    <section className="card space-y-4" aria-labelledby="reglas-anomalias-titulo">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 id="reglas-anomalias-titulo" className="text-lg font-semibold text-codelco-dark">
            Parámetros de reglas (demo)
          </h3>
          <p className="text-sm text-codelco-secondary max-w-xl">
            Ajusta los parámetros de detección para explorar distintos escenarios durante la demostración. Los cambios se guardan en el navegador.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-md border border-gray-300 text-sm text-codelco-dark hover:bg-gray-100 transition"
        >
          Restaurar valores por defecto
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {tiposOrdenados.map(([tipo, config]) => (
          <fieldset key={tipo} className="border border-gray-100 rounded-lg p-4">
            <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-codelco-secondary">
              {config?.etiqueta || tipo}
            </legend>
            <div className="grid gap-4 md:grid-cols-5 mt-3">
              {campos.map(campo => (
                <label key={`${tipo}-${campo.categoria}-${campo.campo}`} className="block text-sm">
                  <span className="block text-xs uppercase tracking-wide text-codelco-secondary mb-1">
                    {campo.label}
                  </span>
                  <input
                    type="number"
                    step={campo.step}
                    min={campo.min}
                    value={config?.[campo.categoria]?.[campo.campo] ?? ''}
                    onChange={(event) => handleChange(tipo, campo.categoria, campo.campo, event.target.value)}
                    className="form-input"
                  />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-codelco-secondary">
              Nota: Esta lógica estadística es simplificada y se ejecuta en el navegador para efectos demo.
            </p>
          </fieldset>
        ))}

        <div className="flex items-center justify-between flex-wrap gap-2">
          {mensajeGuardado && (
            <p className="text-sm text-green-600">{mensajeGuardado}</p>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-codelco-primary text-white text-sm font-semibold shadow hover:bg-blue-800 transition"
          >
            Guardar configuración
          </button>
        </div>
      </form>
    </section>
  );
};

export default ReglasAnomaliasEditor;