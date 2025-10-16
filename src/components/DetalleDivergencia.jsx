import React from 'react';

function DetalleDivergencia({ divergencias = [], descripcionManipulacion, onClose }) {
  if (!divergencias.length) {
    return null;
  }

  const resumen = divergencias.length === 1
    ? 'Se detectó 1 campo diferente entre el contenido almacenado y el actual.'
    : `Se detectaron ${divergencias.length} campos con diferencias.`;

  return (
    <section className="card border border-red-200 bg-red-50/70 shadow-sm space-y-4" aria-live="polite">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <span role="img" aria-label="Advertencia">🚨</span>
            Divergencias detectadas
          </h3>
          <p className="text-sm text-red-800 mt-1">{resumen}</p>
          {descripcionManipulacion && (
            <p className="text-xs text-red-700 mt-2">
              Posible causa: {descripcionManipulacion}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="text-sm text-red-700 hover:text-red-900"
            onClick={onClose}
            aria-label="Cerrar detalle de divergencias"
          >
            Cerrar ✕
          </button>
        )}
      </header>

      <div className="bg-white border border-red-200 rounded-lg divide-y divide-red-100" role="list">
        {divergencias.map((diff) => (
          <article key={diff.campo} className="p-4" role="listitem">
            <h4 className="text-sm font-semibold text-red-700">{diff.campo}</h4>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <span className="text-xs uppercase tracking-wide text-red-600">Valor almacenado</span>
                <pre className="mt-2 text-sm text-red-800 whitespace-pre-wrap break-words font-mono">
{JSON.stringify(diff.valor_almacenado, null, 2)}
                </pre>
              </div>
              <div className="bg-white border border-red-100 rounded-lg p-3">
                <span className="text-xs uppercase tracking-wide text-red-600">Valor actual</span>
                <pre className="mt-2 text-sm text-red-800 whitespace-pre-wrap break-words font-mono">
{JSON.stringify(diff.valor_actual, null, 2)}
                </pre>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DetalleDivergencia;
