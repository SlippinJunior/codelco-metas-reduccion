import React, { useMemo, useState } from 'react';

function BuscadorRegistroVerificacion({
  registros = [],
  casos = [],
  onVerificar,
  onSeleccionar,
  cargando = false
}) {
  const [busqueda, setBusqueda] = useState('');

  const items = useMemo(() => {
    if (!busqueda) {
      return registros;
    }
    const query = busqueda.toLowerCase();
    return registros.filter((item) => {
      return (
        item.registro_id.toLowerCase().includes(query) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
        (item.tipo_entidad && item.tipo_entidad.toLowerCase().includes(query))
      );
    });
  }, [busqueda, registros]);

  const obtenerCaso = (registroId) => casos.find((caso) => caso.registro_id === registroId);

  return (
    <section className="card border border-codelco-primary/40 shadow-sm space-y-4" aria-labelledby="verificacion-buscador">
      <header className="space-y-2">
        <h2 id="verificacion-buscador" className="text-lg font-semibold text-codelco-dark flex items-center gap-2">
          <span role="img" aria-hidden="true">🔍</span>
          Buscar registro a verificar
        </h2>
        <p className="text-sm text-codelco-secondary">
          Introduce el identificador completo o parte de la descripción para localizar registros de la cadena.
        </p>
      </header>

      <div className="space-y-3">
        <label htmlFor="campo-busqueda-verificacion" className="text-sm font-medium text-codelco-dark">
          Identificador o descripción
        </label>
        <input
          id="campo-busqueda-verificacion"
          type="search"
          className="form-input"
          placeholder="Ejemplo: META-2025-ALC2-01"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          disabled={cargando}
        />
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg" role="list">
        {cargando ? (
          <div className="p-4 text-sm text-codelco-secondary" role="status">
            Cargando registros de la cadena...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-codelco-secondary" role="status">
            No se encontraron registros que coincidan con la búsqueda.
          </div>
        ) : (
          items.map((registro) => {
            const casoEncontrado = obtenerCaso(registro.registro_id);
            return (
              <article
                key={registro.registro_id}
                className="p-4 hover:bg-codelco-light/40 transition-colors" role="listitem"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-codelco-secondary uppercase tracking-wide">{registro.tipo_entidad}</p>
                      <h3 className="text-base font-semibold text-codelco-dark" aria-label={`Registro ${registro.registro_id}`}>
                        {registro.registro_id}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {onSeleccionar && (
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => onSeleccionar(registro.registro_id)}
                        >
                          Seleccionar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        onClick={() => onVerificar && onVerificar(registro.registro_id)}
                      >
                        Verificar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-codelco-secondary">
                    {casoEncontrado?.descripcion || registro.descripcion || 'Registro registrado en la cadena.'}
                  </p>
                  <div className="text-xs text-codelco-secondary flex flex-wrap items-center gap-3">
                    <span className="bg-white border border-codelco-primary/20 px-2 py-1 rounded">
                      Usuario: <span className="font-medium text-codelco-dark">{registro.usuario}</span>
                    </span>
                    <span className="bg-white border border-codelco-primary/20 px-2 py-1 rounded">
                      Fecha: {new Date(registro.fecha_hora).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default BuscadorRegistroVerificacion;
