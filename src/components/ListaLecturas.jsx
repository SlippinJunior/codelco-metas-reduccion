import React from 'react';
import { formatearFecha } from '../utils/helpers';

const estadoClases = {
  pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  aprobada: 'bg-green-100 text-green-700 border-green-200',
  rechazada: 'bg-red-100 text-red-700 border-red-200'
};

const motivoClases = {
  rango: 'bg-orange-100 text-orange-700 border-orange-200',
  salto: 'bg-blue-100 text-blue-700 border-blue-200',
  outlier: 'bg-purple-100 text-purple-700 border-purple-200'
};

const iconoPorMotivo = {
  rango: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.5a.75.75 0 001.5 0v-5a.75.75 0 00-1.5 0v5zm0 2.5a.75.75 0 101.5 0 .75.75 0 00-1.5 0z" clipRule="evenodd" />
    </svg>
  ),
  salto: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  outlier: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a1 1 0 01.894.553l7 14A1 1 0 0117 18H3a1 1 0 01-.894-1.447l7-14A1 1 0 0110 2z" />
    </svg>
  )
};

const ListaLecturas = ({
  lecturas = [],
  seleccionadas = [],
  onToggleSeleccion,
  onToggleSeleccionTodos,
  onVerDetalle,
  onOrdenar,
  orden,
  pagina,
  totalPaginas,
  total = 0,
  onCambiarPagina,
  cargando = false
}) => {
  const todasSeleccionadas = lecturas.length > 0 && lecturas.every(lectura => seleccionadas.includes(lectura.id));

  const handleOrden = (columna) => {
    if (!onOrdenar) return;
    const direccion = orden.columna === columna && orden.direccion === 'desc' ? 'asc' : 'desc';
    onOrdenar({ columna, direccion });
  };

  return (
    <section className="card space-y-3" aria-labelledby="tabla-lecturas-anomalias">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 id="tabla-lecturas-anomalias" className="text-lg font-semibold text-codelco-dark">
            Lecturas detectadas
          </h3>
          <p className="text-sm text-codelco-secondary">
            Selecciona múltiples lecturas para validar en lote o revisa cada anomalía en detalle.
          </p>
        </div>
        <div className="text-sm text-codelco-secondary">
          Mostrando {lecturas.length} de {total} lecturas detectadas
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="grid">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  className="accent-codelco-accent"
                  checked={todasSeleccionadas}
                  onChange={(event) => onToggleSeleccionTodos?.(event.target.checked)}
                  aria-label="Seleccionar todas las lecturas visibles"
                />
              </th>
              {[
                { clave: 'timestamp', titulo: 'Fecha y hora' },
                { clave: 'sensorId', titulo: 'Sensor' },
                { clave: 'valor', titulo: 'Valor' },
                { clave: 'tipo', titulo: 'Tipo' },
                { clave: 'motivos', titulo: 'Motivos detectados' },
                { clave: 'scoreAnomalia', titulo: 'Score' },
                { clave: 'estado', titulo: 'Estado' }
              ].map(col => (
                <th
                  key={col.clave}
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 cursor-pointer"
                  onClick={() => handleOrden(col.clave)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.titulo}</span>
                    {orden.columna === col.clave && (
                      <span aria-hidden="true" className="text-codelco-accent">
                        {orden.direccion === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {cargando && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-codelco-secondary">
                  Procesando lecturas...
                </td>
              </tr>
            )}

            {!cargando && lecturas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center">
                  <p className="text-sm text-codelco-secondary">
                    No hay lecturas que coincidan con los filtros actuales.
                  </p>
                </td>
              </tr>
            )}

            {!cargando && lecturas.map(lectura => {
              const seleccionada = seleccionadas.includes(lectura.id);
              const estado = lectura.valida?.estado || 'pendiente';
              const estadoEtiqueta = estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Desconocido';
              return (
                <tr key={lectura.id} className={seleccionada ? 'bg-blue-50/40' : undefined}>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      className="accent-codelco-accent"
                      checked={seleccionada}
                      onChange={(event) => onToggleSeleccion?.(lectura.id, event.target.checked)}
                      aria-label={`Seleccionar lectura ${lectura.id}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-codelco-dark align-top whitespace-nowrap">
                    <div className="font-semibold">{formatearFecha(lectura.timestamp, true)}</div>
                    <div className="text-xs text-codelco-secondary">{lectura.id}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-codelco-dark align-top">
                    <div className="font-medium">{lectura.sensorId}</div>
                    <div className="text-xs text-codelco-secondary">{lectura.division}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-codelco-dark align-top">
                    <span className="font-semibold">{lectura.valor}</span>
                    <span className="ml-1 text-xs text-codelco-secondary">{lectura.unidad}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-codelco-dark align-top">
                    <span className="uppercase text-xs tracking-wide text-codelco-secondary">{lectura.tipo}</span>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {lectura.motivos && lectura.motivos.length > 0 ? (
                        lectura.motivos.map((motivo, idx) => (
                          <span
                            key={`${lectura.id}-motivo-${idx}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${
                              motivoClases[motivo.regla] || 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {iconoPorMotivo[motivo.regla]}
                            {motivo.regla}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-codelco-secondary">Sin motivos registrados</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm align-top">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {Number(lectura.scoreAnomalia ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm align-top">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${estadoClases[estado] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {estadoEtiqueta}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right align-top">
                    <button
                      type="button"
                      onClick={() => onVerDetalle?.(lectura)}
                      className="btn-link text-sm"
                    >
                      Ver / Validar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-codelco-secondary">
          Seleccionadas: {seleccionadas.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCambiarPagina?.(Math.max(1, pagina - 1))}
            className="btn-secondary text-sm"
            disabled={pagina <= 1}
          >
            Anterior
          </button>
          <span className="text-sm text-codelco-secondary">
            Página {pagina} de {Math.max(totalPaginas, 1)}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina?.(Math.min(totalPaginas, pagina + 1))}
            className="btn-secondary text-sm"
            disabled={pagina >= totalPaginas}
          >
            Siguiente
          </button>
        </div>
      </footer>
    </section>
  );
};

export default ListaLecturas;