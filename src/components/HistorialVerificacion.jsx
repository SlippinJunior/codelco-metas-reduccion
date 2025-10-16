import React from 'react';

function HistorialVerificacion({ registros = [], onReintentar }) {
  if (!registros.length) {
    return null;
  }

  return (
    <section className="card border border-slate-200 shadow-sm space-y-3" aria-label="Historial de verificaciones">
      <header>
        <h3 className="text-lg font-semibold text-codelco-dark flex items-center gap-2">
          <span role="img" aria-hidden="true">🕒</span>
          Historial de verificaciones de la sesión
        </h3>
        <p className="text-sm text-codelco-secondary">
          Revisa los resultados recientes o vuelve a ejecutar una verificación con los mismos parámetros.
        </p>
      </header>

      <div className="divide-y divide-slate-100" role="list">
        {registros.map((item) => (
          <article
            key={`${item.registroId}-${item.timestamp}`}
            className="py-3 flex flex-col gap-2" role="listitem"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-codelco-dark">{item.registroId}</p>
                <p className="text-xs text-codelco-secondary">
                  {new Date(item.timestamp).toLocaleString('es-CL')} · Tiempo: {item.tiempo_ms} ms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.valido ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.valido ? 'VÁLIDO' : 'INVÁLIDO'}
                </span>
                {onReintentar && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => onReintentar(item)}
                  >
                    Re-verificar
                  </button>
                )}
              </div>
            </div>
            {item.resumen && (
              <p className="text-xs text-codelco-secondary">
                {item.resumen}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default HistorialVerificacion;
