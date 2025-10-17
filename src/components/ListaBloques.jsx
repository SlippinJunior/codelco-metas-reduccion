import React, { useMemo, useState } from 'react';

function formatearFecha(fechaIso) {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(fechaIso));
  } catch (error) {
    return fechaIso;
  }
}

function truncarHuella(huella = '', visible = 16) {
  if (!huella) return '—';
  if (huella.length <= visible) return huella;
  return `${huella.slice(0, visible)}…${huella.slice(-visible)}`;
}

function ListaBloques({ bloques = [], onVerDetalle }) {
  const [hashesExtendidos, setHashesExtendidos] = useState(() => new Set());

  const bloquesOrdenados = useMemo(() => {
    return [...bloques].sort((a, b) => b.index - a.index);
  }, [bloques]);

  const toggleHashCompleto = (index) => {
    setHashesExtendidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(index)) {
        nuevo.delete(index);
      } else {
        nuevo.add(index);
      }
      return nuevo;
    });
  };

  if (!bloquesOrdenados.length) {
    return (
      <div className="card text-center">
        <h3 className="text-lg font-semibold text-codelco-dark">Sin bloques registrados todavía</h3>
        <p className="text-sm text-codelco-secondary mt-2">
          Cuando generes un nuevo registro, aparecerá aquí con su enlace a la cadena.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-codelco-dark">Cadena de bloques simulada</h2>
          <p className="text-sm text-codelco-secondary">
            Los bloques están ordenados de más reciente a más antiguo. Cada elemento referencia la huella del bloque anterior.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-codelco-secondary">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-codelco-primary"></span>
            Bloque confirmado
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-codelco-accent"></span>
            Huella padre enlazada
          </span>
        </div>
      </header>

      <ol className="space-y-6">
        {bloquesOrdenados.map((bloque, idx) => {
          const hashExpandido = hashesExtendidos.has(bloque.index);
          const hashPadreExpandido = hashesExtendidos.has(`padre-${bloque.index}`);
          const esGenesis = !bloque.huella_padre;
          const huellaVisible = hashExpandido ? bloque.huella : truncarHuella(bloque.huella);
          const huellaPadreVisible = esGenesis
            ? 'Bloque génesis'
            : hashPadreExpandido
              ? bloque.huella_padre
              : truncarHuella(bloque.huella_padre);

          return (
            <li key={bloque.index} className="flex gap-6">
              <div className="flex flex-col items-center" aria-hidden="true">
                <span className="w-4 h-4 rounded-full bg-codelco-primary shadow-inner shadow-codelco-primary/40"></span>
                {idx < bloquesOrdenados.length - 1 && (
                  <span className="w-[2px] flex-1 bg-gradient-to-b from-codelco-primary/40 to-transparent"></span>
                )}
              </div>

              <article className="flex-1 rounded-xl border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-md" aria-label={`Bloque ${bloque.index}`}>
                <div className="border-b border-slate-100 px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-codelco-secondary">
                      Bloque #{bloque.index}
                    </p>
                    <h3 className="text-lg font-semibold text-codelco-dark leading-tight">
                      Registro {bloque.registro_id}
                    </h3>
                    <p className="text-xs text-codelco-secondary mt-1">
                      {bloque.tipo_entidad?.toUpperCase()} · Confirmado por {bloque.usuario}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2 text-xs text-codelco-secondary">
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-codelco-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      {formatearFecha(bloque.fecha_hora)}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-codelco-primary/10 text-codelco-primary px-2 py-1 rounded-full font-medium">
                      {bloque.sello || 'Registro no vinculante'}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-codelco-secondary uppercase">Huella del bloque</p>
                      <p className="text-sm font-mono text-codelco-dark break-all bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mt-1">
                        {huellaVisible}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleHashCompleto(bloque.index)}
                        className="text-xs text-codelco-primary hover:underline mt-1"
                      >
                        {hashExpandido ? 'Ocultar huella completa' : 'Ver huella completa'}
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-codelco-secondary uppercase">Huella padre</p>
                      <p className={`text-sm font-mono break-all border rounded-md px-3 py-2 mt-1 ${
                        esGenesis
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-codelco-dark'
                      }`}>
                        {huellaPadreVisible}
                      </p>
                      {!esGenesis && (
                        <button
                          type="button"
                          onClick={() => toggleHashCompleto(`padre-${bloque.index}`)}
                          className="text-xs text-codelco-primary hover:underline mt-1"
                        >
                          {hashPadreExpandido ? 'Ocultar huella padre completa' : 'Ver huella padre completa'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-codelco-secondary">
                    <p className="font-semibold text-codelco-dark">Motivo / Nota:</p>
                    <p className="mt-1 whitespace-pre-wrap">{bloque.motivo || 'Sin motivo asociado.'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-b-xl border-t border-slate-200">
                  <p className="text-xs text-codelco-secondary">
                    Referencia: <span className="font-mono text-codelco-dark">{bloque.referencia || `BLOQUE-${bloque.index}`}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onVerDetalle?.(bloque)}
                    className="btn-secondary text-sm"
                  >
                    Ver detalle y verificar integridad
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ListaBloques;
