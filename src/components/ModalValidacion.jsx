import React, { useMemo, useState } from 'react';
import { formatearFecha } from '../utils/helpers';

function construirSparkline(historial = [], width = 220, height = 80) {
  if (!historial.length) return '';
  const valoresOrdenados = [...historial].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const valores = valoresOrdenados.map(item => item.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const stepX = valores.length > 1 ? width / (valores.length - 1) : width;

  return valoresOrdenados
    .map((item, index) => {
      const x = index * stepX;
      const normalizado = (item.valor - min) / rango;
      const y = height - normalizado * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

const ModalValidacion = ({
  abierto,
  lectura,
  historial = [],
  onCerrar,
  onAprobar,
  onRechazar,
  procesando = false,
  error
}) => {
  const [comentario, setComentario] = useState('');
  const [mostrarError, setMostrarError] = useState(false);

  React.useEffect(() => {
    if (abierto) {
      setComentario('');
      setMostrarError(false);
    }
  }, [abierto, lectura?.id]);

  const sparkline = useMemo(() => construirSparkline(historial), [historial]);

  if (!abierto || !lectura) {
    return null;
  }

  const estadoActual = lectura.valida?.estado || 'pendiente';
  const requiereComentario = comentario.trim().length === 0;

  const manejarRechazo = () => {
    if (requiereComentario) {
      setMostrarError(true);
      return;
    }
    onRechazar?.(comentario.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="relative max-w-3xl w-full bg-white rounded-xl shadow-xl">
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-3 right-3 text-codelco-secondary hover:text-codelco-dark"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <header className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-codelco-dark">Validación de lectura</h3>
          <p className="text-sm text-codelco-secondary">
            Revisa el contexto antes de aprobar o rechazar. Esta simulación está pensada para demostraciones.
          </p>
        </header>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <section>
            <h4 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Resumen</h4>
            <dl className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-xs text-codelco-secondary uppercase">Fecha</dt>
                <dd className="text-sm font-medium text-codelco-dark">{formatearFecha(lectura.timestamp, true)}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-xs text-codelco-secondary uppercase">Sensor</dt>
                <dd className="text-sm font-medium text-codelco-dark">{lectura.sensorId}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-xs text-codelco-secondary uppercase">Valor</dt>
                <dd className="text-sm font-medium text-codelco-dark">
                  {lectura.valor} <span className="text-xs text-codelco-secondary">{lectura.unidad}</span>
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-xs text-codelco-secondary uppercase">Score</dt>
                <dd className="text-sm font-medium text-codelco-dark">{Number(lectura.scoreAnomalia ?? 0).toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Motivos de la detección</h4>
            <ul className="mt-3 space-y-2">
              {lectura.motivos && lectura.motivos.length > 0 ? (
                lectura.motivos.map((motivo, index) => (
                  <li key={`${lectura.id}-motivo-modal-${index}`} className="flex items-start gap-2 text-sm text-codelco-dark">
                    <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-codelco-accent/10 text-codelco-accent text-xs font-semibold uppercase">
                      {motivo.regla?.[0] ?? '?'}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{motivo.regla}</p>
                      <p className="text-xs text-codelco-secondary">{motivo.detalle}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-codelco-secondary">No se registraron motivos (lectura considerada normal).</li>
              )}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Histórico cercano</h4>
            <div className="mt-3 grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-3">
                <svg width="220" height="80" viewBox="0 0 220 80" role="img" aria-label="Serie histórica de lecturas" className="text-codelco-primary">
                  <path d="M0 40 L220 40" stroke="#e2e8f0" strokeWidth="1" fill="none" />
                  <path d={sparkline || 'M0 40 L220 40'} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 text-xs text-codelco-secondary">Sparkline demostrativo (últimas lecturas)</span>
              </div>
              <ul className="space-y-2 text-sm">
                {historial.length === 0 && (
                  <li className="text-codelco-secondary">Sin lecturas históricas disponibles.</li>
                )}
                {historial.map(item => (
                  <li key={item.id} className={`flex items-center justify-between p-2 rounded-md border ${item.id === lectura.id ? 'border-codelco-accent bg-codelco-accent/5' : 'border-gray-100'}`}>
                    <div>
                      <p className="font-medium text-codelco-dark">{formatearFecha(item.timestamp, true)}</p>
                      <p className="text-xs text-codelco-secondary">{item.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-codelco-dark">{item.valor}</p>
                      <p className="text-xs text-codelco-secondary">{lectura.unidad}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-codelco-dark uppercase tracking-wide">Validación técnica</h4>
            <div className="mt-3 space-y-3">
              <p className="text-sm text-codelco-secondary">
                Estado actual: <strong className="text-codelco-dark uppercase">{estadoActual}</strong>. Puedes aprobarla para incluirla en cálculos o rechazarla para excluirla.
              </p>
              <textarea
                rows={3}
                className="form-input w-full"
                placeholder="Comentario (obligatorio si rechazas)"
                value={comentario}
                onChange={(event) => {
                  setComentario(event.target.value);
                  setMostrarError(false);
                }}
              />
              {(mostrarError || error) && (
                <p className="text-xs text-red-600" role="alert">
                  {error || 'Agrega un comentario antes de rechazar la lectura.'}
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-codelco-dark hover:bg-gray-100 transition disabled:opacity-50"
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAprobar?.(comentario.trim())}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold shadow hover:bg-green-700 transition disabled:opacity-50"
            disabled={procesando}
          >
            Aprobar lectura
          </button>
          <button
            type="button"
            onClick={manejarRechazo}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold shadow hover:bg-red-700 transition disabled:opacity-50"
            disabled={procesando}
          >
            Rechazar lectura
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalValidacion;