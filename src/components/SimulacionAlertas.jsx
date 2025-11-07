import React, { useMemo } from 'react';

const DEFAULT_SIMULADA = {
  id: 'SIM-ALERT-001',
  simulada: true,
  fecha: new Date().toISOString(),
  indicador: 'tco2e_por_ton',
  indicadorNombre: 'tCO₂e/ton Cu',
  ambito: { division: 'El Teniente', proceso: 'Fundición', tags: [] },
  ventana: { desde: '2025-10-13', hasta: '2025-10-17', metodo: 'media' },
  unidad: 'tCO₂e/ton',
  valorCalculado: 2.93,
  umbral: 2.50,
  excesoAbs: 0.43,
  excesoPct: 0.172,
  severidad: 'Alta',
  reglaId: 'R-CO2-001'
};

function SeverityPill({ nivel }) {
  const map = {
    Baja: 'bg-gray-100 text-gray-800',
    baja: 'bg-gray-100 text-gray-800',
    Media: 'bg-blue-100 text-blue-800',
    media: 'bg-blue-100 text-blue-800',
    Alta: 'bg-orange-100 text-orange-800',
    alta: 'bg-orange-100 text-orange-800',
    Critica: 'bg-red-100 text-red-800',
    critica: 'bg-red-100 text-red-800'
  };
  const cls = map[nivel] || 'bg-gray-100 text-gray-800';
  return <span className={`${cls} px-2 py-1 rounded-full text-sm`}>{nivel}</span>;
}

export default function SimulacionAlertas({ resultados, onSimular, onExport }) {
  const tarjeta = DEFAULT_SIMULADA;

  const resumen = useMemo(() => {
    if (!resultados || resultados.length === 0) return null;
    const severidades = resultados.reduce((acc, r) => {
      acc[r.severidad] = (acc[r.severidad] || 0) + 1;
      return acc;
    }, {});
    const indicadores = Array.from(new Set(resultados.map(r => r.indicadorNombre || r.indicador))).slice(0, 4);
    const ventana = resultados[0].ventana || null;
    return { severidades, indicadores, ventana, total: resultados.length };
  }, [resultados]);

  return (
    <div>
      <div className="flex items-center justify-end mb-3 space-x-2">
        <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2" onClick={onSimular}>Simular con datos históricos</button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700" onClick={onExport}>Exportar CSV</button>
      </div>

      {(!resultados || resultados.length === 0) ? (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">ALERTA <span className="ml-1 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">SIMULADA</span></span>
                <div className="text-xs text-gray-500">Regla: <strong>{tarjeta.reglaId}</strong></div>
              </div>
              <div className="mt-2">
                <SeverityPill nivel={tarjeta.severidad} />
              </div>
            </div>
            <div className="text-sm text-gray-500">ID: {tarjeta.id}</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600"><strong>Fecha:</strong> {new Date(tarjeta.fecha).toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-2"><strong>Ventana:</strong> {tarjeta.ventana.desde} → {tarjeta.ventana.hasta} ({tarjeta.ventana.metodo})</div>
              <div className="text-sm text-gray-600 mt-2"><strong>Indicador:</strong> {tarjeta.indicadorNombre} <span className="text-xs text-gray-500">({tarjeta.unidad})</span></div>
              <div className="text-sm text-gray-600 mt-2"><strong>Ámbito:</strong> {tarjeta.ambito.division} / {tarjeta.ambito.proceso}</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{tarjeta.valorCalculado} {tarjeta.unidad}</div>
              <div className="text-sm text-gray-600 mt-1">Umbral: {tarjeta.umbral} {tarjeta.unidad}</div>
              <div className="text-sm text-gray-600 mt-1">Exceso: {tarjeta.excesoAbs} ({(tarjeta.excesoPct * 100).toFixed(1)}%)</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-3">Esta alerta es SIMULADA a partir de la política actual. Los resultados reales aparecerán aquí cuando ejecutes la simulación o en operación.</div>
        </div>
      ) : (
        <div>
          {resumen && (
            <div className="grid gap-3 md:grid-cols-3 mb-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Total de alertas</div>
                <div className="text-2xl font-semibold">{resumen.total}</div>
                {resumen.ventana && (
                  <div className="mt-2 text-sm text-gray-600">
                    Ventana {resumen.ventana.dias}d · {resumen.ventana.metodo}
                    <div className="text-xs text-gray-500">{resumen.ventana.desde?.slice(0, 10)} → {resumen.ventana.hasta?.slice(0, 10)}</div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Severidades</div>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {Object.entries(resumen.severidades).sort((a, b) => (b[1] - a[1])).map(([sev, cantidad]) => (
                    <li key={sev} className="flex justify-between">
                      <span>{sev}</span>
                      <span className="font-medium">{cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Indicadores</div>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {resumen.indicadores.map(ind => (
                    <li key={ind}>{ind}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {/* If resultados exist, render a table - parent may render same table, but include basic fallback here */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left bg-gray-100">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Indicador</th>
                  <th className="p-2">Ámbito</th>
                  <th className="p-2">Valor</th>
                  <th className="p-2">Umbral</th>
                  <th className="p-2">Exceso</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Severidad</th>
                  <th className="p-2">Dirección</th>
                  <th className="p-2">Regla</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2 text-sm">{new Date(r.timestamp || r.fecha || Date.now()).toLocaleString()}</td>
                    <td className="p-2 text-sm">{r.indicador || r.indicadorNombre}</td>
                    <td className="p-2 text-sm">{typeof r.ambito === 'string' ? r.ambito : (r.ambito.division || r.ambito.proceso || JSON.stringify(r.ambito.tags || []))}</td>
                    <td className="p-2 text-sm">{r.valor ?? r.valorCalculado}</td>
                    <td className="p-2 text-sm">{r.umbral}</td>
                    <td className="p-2 text-sm">{Number(((r.excesoAbs ?? r.exceso) || 0).toFixed(2))}</td>
                    <td className="p-2 text-sm">{((r.excesoPct ?? r.pct) ? (Math.round((r.excesoPct ?? r.pct) * 100) / 100) : '')}%</td>
                    <td className="p-2 text-sm">{r.severidad}</td>
                    <td className="p-2 text-sm">{r.direccion || '>'}</td>
                    <td className="p-2 text-sm">{r.regla || r.reglaId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resumen?.ventana?.valorVentana != null && (
            <div className="mt-3 text-xs text-gray-600">
              Promedio de ventana ({resumen.ventana.metodo}): <strong>{resumen.ventana.valorVentana}</strong> ({resumen.ventana.muestras} mediciones).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
