import React, { useEffect, useMemo, useState } from 'react';
import {
  listarEscenarios,
  actualizarEscenario,
  agregarEscenario,
  eliminarEscenario,
  duplicarEscenario,
  resetEscenarios,
  descargarAnexo,
  calcularIndicadores
} from '../services/servicioEscenariosMitigacion';
import { DIVISIONES } from '../services/servicioMetas';
import { formatearNumero } from '../utils/helpers';

const CAMPOS_NUMERICOS = new Set([
  'horizonte',
  'capex',
  'costoOperacionAnual',
  'ahorroOpexAnual',
  'baselineEmisiones'
]);

const CAMPOS_PORCENTAJE = new Set(['reduccionPorcentaje']);

function formatoSupuesto(key) {
  if (!key) return '';
  const conEspacios = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/([0-9]+)([A-Za-z]+)/g, '$1 $2');
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}

function VistaEscenariosMitigacion() {
  const [escenarios, setEscenarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState(null);
  const [draftSupuestos, setDraftSupuestos] = useState({});

  useEffect(() => {
    try {
      const res = listarEscenarios();
      if (res.success) {
        setEscenarios(res.data);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!alerta) return;
    const timeout = setTimeout(() => setAlerta(null), 4000);
    return () => clearTimeout(timeout);
  }, [alerta]);

  const actualizarEstadoEscenario = (id, cambios) => {
    setEscenarios(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const actualizado = { ...item, ...cambios };
        const indicadores = calcularIndicadores(actualizado);
        return { ...actualizado, indicadores };
      })
    );
  };

  const manejarCambio = (id, campo, valorRaw) => {
    let valor = valorRaw;
    if (CAMPOS_NUMERICOS.has(campo)) {
      valor = valorRaw === '' ? 0 : Number(valorRaw);
    } else if (CAMPOS_PORCENTAJE.has(campo)) {
      valor = valorRaw === '' ? 0 : Number(valorRaw) / 100;
    }
    const resultado = actualizarEscenario(id, { [campo]: valor });
    if (resultado.success) {
      actualizarEstadoEscenario(id, resultado.data);
    } else {
      setAlerta({ tipo: 'error', mensaje: resultado.message || 'No se pudo actualizar el escenario' });
    }
  };

  const manejarSupuesto = (id, clave, valor) => {
    const resultado = actualizarEscenario(id, { supuestos: { [clave]: valor } });
    if (resultado.success) {
      actualizarEstadoEscenario(id, resultado.data);
    } else {
      setAlerta({ tipo: 'error', mensaje: 'No se pudo actualizar el supuesto' });
    }
  };

  const manejarEliminarSupuesto = (id, clave) => {
    const resultado = actualizarEscenario(id, { supuestos: { [clave]: '__delete__' } });
    if (resultado.success) {
      actualizarEstadoEscenario(id, resultado.data);
    } else {
      setAlerta({ tipo: 'error', mensaje: 'No se pudo eliminar el supuesto' });
    }
  };

  const manejarAgregarSupuesto = id => {
    const draft = draftSupuestos[id] || {};
    if (!draft.clave || !draft.valor) {
      setAlerta({ tipo: 'info', mensaje: 'Debe ingresar nombre y valor del supuesto' });
      return;
    }
    const claveNormalizada = draft.clave.trim();
    const resultado = actualizarEscenario(id, {
      supuestos: { [claveNormalizada]: draft.valor }
    });
    if (resultado.success) {
      actualizarEstadoEscenario(id, resultado.data);
      setDraftSupuestos(prev => ({ ...prev, [id]: { clave: '', valor: '' } }));
      setAlerta({ tipo: 'success', mensaje: 'Supuesto agregado' });
    } else {
      setAlerta({ tipo: 'error', mensaje: 'No se pudo agregar el supuesto' });
    }
  };

  const manejarAgregarEscenario = () => {
    const resultado = agregarEscenario();
    if (resultado.success) {
      const nuevo = { ...resultado.data, indicadores: calcularIndicadores(resultado.data) };
      setEscenarios(prev => [...prev, nuevo]);
      setAlerta({ tipo: 'success', mensaje: 'Escenario creado' });
    }
  };

  const manejarDuplicar = id => {
    const resultado = duplicarEscenario(id);
    if (resultado.success) {
      const copia = { ...resultado.data, indicadores: calcularIndicadores(resultado.data) };
      setEscenarios(prev => [...prev, copia]);
      setAlerta({ tipo: 'success', mensaje: 'Escenario duplicado' });
    }
  };

  const manejarEliminar = id => {
    if (escenarios.length <= 3) {
      setAlerta({ tipo: 'info', mensaje: 'Debe mantener al menos 3 escenarios' });
      return;
    }
    const resultado = eliminarEscenario(id);
    if (resultado.success) {
      setEscenarios(prev => prev.filter(item => item.id !== id));
      setAlerta({ tipo: 'success', mensaje: 'Escenario eliminado' });
    }
  };

  const manejarReset = () => {
    const resultado = resetEscenarios();
    if (resultado.success) {
      const normalizados = resultado.data.map(item => ({
        ...item,
        indicadores: calcularIndicadores(item)
      }));
      setEscenarios(normalizados);
      setAlerta({ tipo: 'success', mensaje: 'Escenarios restaurados' });
    }
  };

  const manejarDescarga = () => {
    try {
      const resultado = descargarAnexo(escenarios);
      if (resultado.success) {
        setAlerta({ tipo: 'success', mensaje: `Anexo descargado (${resultado.nombre})` });
      }
    } catch (error) {
      setAlerta({ tipo: 'error', mensaje: 'No se pudo generar el anexo' });
    }
  };

  const resumen = useMemo(() => {
    if (!escenarios.length) return null;
    const totalReducido = escenarios.reduce(
      (acc, item) => acc + (item.indicadores?.reduccionTon || 0),
      0
    );
    const mejorRoi = escenarios.reduce(
      (acc, item) => {
        const roi = item.indicadores?.roi ?? -Infinity;
        if (roi > acc.valor) {
          return { valor: roi, id: item.id, nombre: item.nombre };
        }
        return acc;
      },
      { valor: -Infinity, id: null, nombre: '' }
    );
    const mejorAbatimiento = escenarios.reduce(
      (acc, item) => {
        const abat = item.indicadores?.costoAbatimiento ?? Infinity;
        if (abat < acc.valor) {
          return { valor: abat, id: item.id, nombre: item.nombre };
        }
        return acc;
      },
      { valor: Infinity, id: null, nombre: '' }
    );
    return {
      totalReducido,
      mejorRoi,
      mejorAbatimiento
    };
  }, [escenarios]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-codelco-light flex items-center justify-center">
        <div className="text-codelco-secondary">Cargando escenarios...</div>
      </div>
    );
  }

  return (
    <div className="bg-codelco-light min-h-screen py-10">
      <div className="container mx-auto px-4 space-y-8">
        <section className="bg-white shadow rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-codelco-dark">
                Comparador de escenarios de mitigacion
              </h1>
              <p className="text-codelco-secondary mt-1 text-sm md:text-base max-w-2xl">
                Evalua alternativas de mitigacion como electrificacion, hidrogeno verde o eficiencia
                operacional. Ajusta variables clave para proyectar reducciones de tCO2e, costos y
                retornos financieros antes de priorizar inversiones.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={manejarAgregarEscenario}
                className="btn-primary"
              >
                Agregar escenario
              </button>
              <button
                onClick={manejarReset}
                className="btn-secondary"
              >
                Restaurar base
              </button>
              <button
                onClick={manejarDescarga}
                className="btn-accent"
              >
                Descargar anexo (CSV)
              </button>
            </div>
          </div>
          {resumen && (
            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                  Reduccion anual agregada
                </h3>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatearNumero(resumen.totalReducido, 0)} tCO2e/a
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Suma de tCO2e evitadas por los escenarios activos
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">
                  ROI mas alto
                </h3>
                <p className="text-lg font-semibold text-emerald-700 mt-1">
                  {resumen.mejorRoi.nombre
                    ? `${resumen.mejorRoi.nombre} (${formatearNumero(resumen.mejorRoi.valor * 100, 1)}%)`
                    : 'N/A'}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Mejores retornos acumulados sobre el CAPEX
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                  Menor costo de abatimiento
                </h3>
                <p className="text-lg font-semibold text-amber-700 mt-1">
                  {resumen.mejorAbatimiento.nombre
                    ? `${resumen.mejorAbatimiento.nombre} (${formatearNumero(resumen.mejorAbatimiento.valor, 2)} USD/tCO2e)`
                    : 'N/A'}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Considera costo neto y reduccion total a lo largo del horizonte
                </p>
              </div>
            </div>
          )}
        </section>

        {alerta && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              alerta.tipo === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : alerta.tipo === 'info'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {alerta.mensaje}
          </div>
        )}

        <section className="grid gap-6">
          {escenarios.map(escenario => (
            <article key={escenario.id} className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="w-full md:flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-codelco-dark mb-1">
                      Nombre del escenario
                    </label>
                    <input
                      type="text"
                      value={escenario.nombre}
                      onChange={e => manejarCambio(escenario.id, 'nombre', e.target.value)}
                      className="form-input"
                      placeholder="Ej: Electrificacion de flota subterranea"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-codelco-dark mb-1">
                      Enfoque tecnologico / descripcion
                    </label>
                    <textarea
                      value={escenario.tecnologia}
                      onChange={e => manejarCambio(escenario.id, 'tecnologia', e.target.value)}
                      className="form-input h-20"
                      placeholder="Detalle de la medida o tecnologia principal"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Division foco
                      </label>
                      <select
                        value={escenario.division}
                        onChange={e => manejarCambio(escenario.id, 'division', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Corporativo</option>
                        {DIVISIONES.map(div => (
                          <option key={div.id} value={div.nombre}>
                            {div.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Horizonte (anios)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={escenario.horizonte}
                        onChange={e => manejarCambio(escenario.id, 'horizonte', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Reduccion esperada (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={Math.round((escenario.reduccionPorcentaje || 0) * 1000) / 10}
                        onChange={e => manejarCambio(escenario.id, 'reduccionPorcentaje', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        CAPEX (MMUSD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={escenario.capex}
                        onChange={e => manejarCambio(escenario.id, 'capex', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Costo OPEX anual (MMUSD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={escenario.costoOperacionAnual}
                        onChange={e => manejarCambio(escenario.id, 'costoOperacionAnual', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Ahorro esperado anual (MMUSD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={escenario.ahorroOpexAnual}
                        onChange={e => manejarCambio(escenario.id, 'ahorroOpexAnual', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Emisiones base (tCO2e/a)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={escenario.baselineEmisiones}
                        onChange={e => manejarCambio(escenario.id, 'baselineEmisiones', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-codelco-dark mb-1">
                        Supuestos clave
                      </label>
                      <div className="space-y-2">
                        {Object.entries(escenario.supuestos || {}).map(([clave, valor]) => (
                          <div key={clave} className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-xs text-codelco-secondary uppercase tracking-wide">
                                {formatoSupuesto(clave)}
                              </div>
                              <input
                                type="text"
                                value={valor}
                                onChange={e => manejarSupuesto(escenario.id, clave, e.target.value)}
                                className="form-input mt-1"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => manejarEliminarSupuesto(escenario.id, clave)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                          <input
                            type="text"
                            placeholder="Nombre del supuesto"
                            value={draftSupuestos[escenario.id]?.clave || ''}
                            onChange={e =>
                              setDraftSupuestos(prev => ({
                                ...prev,
                                [escenario.id]: {
                                  ...prev[escenario.id],
                                  clave: e.target.value
                                }
                              }))
                            }
                            className="form-input flex-1"
                          />
                          <input
                            type="text"
                            placeholder="Valor"
                            value={draftSupuestos[escenario.id]?.valor || ''}
                            onChange={e =>
                              setDraftSupuestos(prev => ({
                                ...prev,
                                [escenario.id]: {
                                  ...prev[escenario.id],
                                  valor: e.target.value
                                }
                              }))
                            }
                            className="form-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => manejarAgregarSupuesto(escenario.id)}
                            className="btn-accent"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Indicadores clave
                    </h3>
                    <p className="text-xs text-slate-500">
                      Resultados recalculados automaticamente con cada cambio
                    </p>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">tCO2e residual</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatearNumero(escenario.indicadores?.emisionesPosteriores || 0, 0)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Reduccion anual</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatearNumero(escenario.indicadores?.reduccionTon || 0, 0)} tCO2e
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Costo total</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatearNumero(escenario.indicadores?.costoTotal || 0, 2)} MMUSD
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">ROI</dt>
                      <dd className="font-semibold text-slate-900">
                        {escenario.indicadores?.roi != null
                          ? `${formatearNumero(escenario.indicadores.roi * 100, 1)}%`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Payback</dt>
                      <dd className="font-semibold text-slate-900">
                        {escenario.indicadores?.payback != null
                          ? `${formatearNumero(escenario.indicadores.payback, 1)} anios`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Costo abatimiento</dt>
                      <dd className="font-semibold text-slate-900">
                        {escenario.indicadores?.costoAbatimiento != null
                          ? `${formatearNumero(escenario.indicadores.costoAbatimiento, 2)} USD/t`
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => manejarDuplicar(escenario.id)}
                      className="text-sm text-codelco-primary hover:text-blue-900"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => manejarEliminar(escenario.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="bg-white shadow rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-codelco-dark mb-4">
            Tabla comparativa de escenarios
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Escenario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tecnologia
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    tCO2e residual
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reduccion tCO2e/a
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Costo total (MMUSD)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payback (anios)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Costo abatimiento (USD/tCO2e)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {escenarios.map(escenario => {
                  const indicadores = escenario.indicadores || calcularIndicadores(escenario);
                  const destacado =
                    resumen?.mejorRoi.id === escenario.id || resumen?.mejorAbatimiento.id === escenario.id;
                  return (
                    <tr
                      key={`tabla-${escenario.id}`}
                      className={destacado ? 'bg-blue-50/70' : undefined}
                    >
                      <td className="px-4 py-3 text-sm text-codelco-dark font-semibold">
                        {escenario.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-codelco-secondary">
                        {escenario.tecnologia}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {formatearNumero(indicadores?.emisionesPosteriores || 0, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {formatearNumero(indicadores?.reduccionTon || 0, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {formatearNumero(indicadores?.costoTotal || 0, 2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {indicadores?.roi != null ? `${formatearNumero(indicadores.roi * 100, 1)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {indicadores?.payback != null
                          ? formatearNumero(indicadores.payback, 1)
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700">
                        {indicadores?.costoAbatimiento != null
                          ? formatearNumero(indicadores.costoAbatimiento, 2)
                          : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-codelco-secondary mt-3">
            Los indicadores consideran CAPEX inicial, costos operacionales estimados, ahorros declarados y
            reducciones de emisiones informadas para cada escenario.
          </p>
        </section>
      </div>
    </div>
  );
}

export default VistaEscenariosMitigacion;
