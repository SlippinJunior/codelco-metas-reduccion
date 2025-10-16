import React, { useMemo } from 'react';

function ResultadoVerificacion({
  resultado,
  enProgreso = false,
  onVerHuellaCompleta,
  onVerDivergencias,
  onDescargarInforme,
  advertirLentitud = false
}) {
  const estado = useMemo(() => {
    if (enProgreso) {
      return {
        etiqueta: 'Verificando…',
        descripcion: 'Calculando huella y comparando contenido actual.',
        color: 'text-codelco-dark',
        badge: 'bg-codelco-secondary/10 text-codelco-secondary'
      };
    }
    if (!resultado) {
      return {
        etiqueta: 'Sin verificación',
        descripcion: 'Selecciona un registro y ejecuta la verificación para visualizar los resultados.',
        color: 'text-codelco-secondary',
        badge: 'bg-slate-200 text-slate-700'
      };
    }
    return resultado.valido
      ? {
          etiqueta: 'VÁLIDO',
          descripcion: 'La huella recalculada coincide con la almacenada. No se detectaron manipulaciones.',
          color: 'text-green-700',
          badge: 'bg-green-100 text-green-700'
        }
      : {
          etiqueta: 'INVÁLIDO',
          descripcion: 'La huella recalculada no coincide con la almacenada. Existen divergencias en el contenido.',
          color: 'text-red-700',
          badge: 'bg-red-100 text-red-700'
        };
  }, [enProgreso, resultado]);

  const truncated = (valor) => {
    if (!valor) return '—';
    if (valor.length <= 16) return valor;
    return `${valor.slice(0, 12)}…${valor.slice(-8)}`;
  };

  return (
    <section
      className={`card border-2 transition-all duration-300 ${resultado ? (resultado.valido ? 'border-green-200' : 'border-red-200') : 'border-codelco-primary/10'}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold tracking-[0.15em] uppercase ${estado.badge} inline-flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300`}> 
            {estado.etiqueta}
          </p>
          <h2 className={`mt-3 text-2xl font-semibold ${estado.color} transition-colors`}>Verificación criptográfica</h2>
          <p className="text-sm text-codelco-secondary mt-2">
            {estado.descripcion}
          </p>
        </div>
        {resultado && (
          <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
            <span className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
              <span role="img" aria-label="Tiempo de verificación">⏱️</span>
              {resultado.tiempo_ms} ms
            </span>
            {advertirLentitud && (
              <span className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full shadow-sm animate-pulse" role="alert">
                ⚠️ Tiempo de verificación excede 1 segundo
              </span>
            )}
          </div>
        )}
      </header>

      {enProgreso ? (
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-codelco-secondary" role="status">
          <div className="animate-spin h-10 w-10 border-4 border-codelco-primary/30 border-t-codelco-primary rounded-full"></div>
          Procesando verificación demostrativa…
        </div>
      ) : !resultado ? (
        <div className="mt-6 text-sm text-codelco-secondary bg-codelco-light/40 border border-codelco-primary/20 rounded-lg p-4">
          Esta experiencia recalcula la huella SHA-256 en el navegador usando la API Web Crypto. Los datos y resultados son de carácter demostrativo.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-codelco-dark flex items-center gap-2">
                Huella almacenada
                <button
                  type="button"
                  className="text-xs text-codelco-primary hover:underline"
                  onClick={() => onVerHuellaCompleta && onVerHuellaCompleta('almacenada', resultado.huella_almacenada)}
                >
                  Ver completa
                </button>
              </h3>
              <p className="font-mono text-sm text-codelco-secondary mt-2 break-all" title={resultado.huella_almacenada}>
                {truncated(resultado.huella_almacenada)}
              </p>
            </article>
            <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-codelco-dark flex items-center gap-2">
                Huella recalculada
                <button
                  type="button"
                  className="text-xs text-codelco-primary hover:underline"
                  onClick={() => onVerHuellaCompleta && onVerHuellaCompleta('recalculada', resultado.huella_recalculada)}
                >
                  Ver completa
                </button>
              </h3>
              <p className="font-mono text-sm text-codelco-secondary mt-2 break-all" title={resultado.huella_recalculada}>
                {truncated(resultado.huella_recalculada)}
              </p>
            </article>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              ¿Qué significa este resultado?
            </h3>
            <p className="mt-1">
              La huella criptográfica se obtiene aplicando SHA-256 sobre el contenido serializado del registro. Si alguien modifica el contenido, la huella cambia y la verificación indica estado inválido.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onDescargarInforme && onDescargarInforme('json')}
            >
              Descargar informe (JSON)
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onDescargarInforme && onDescargarInforme('pdf')}
            >
              Descargar informe (PDF)
            </button>
            {resultado.divergencias?.length > 0 && (
              <button
                type="button"
                className="btn-accent"
                onClick={() => onVerDivergencias && onVerDivergencias()}
              >
                Ver detalles de divergencia ({resultado.divergencias.length})
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default ResultadoVerificacion;
