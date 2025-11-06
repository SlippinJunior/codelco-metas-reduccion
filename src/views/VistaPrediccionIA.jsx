import React, { useMemo, useState } from 'react';
import {
  obtenerModeloPrediccion,
  predecirDesvio,
  obtenerExplicacionVariables,
  obtenerDatosEntrenamiento
} from '../services/servicioPrediccionIA';

const modelo = obtenerModeloPrediccion();
const explicacion = obtenerExplicacionVariables();
const datosEntrenamiento = obtenerDatosEntrenamiento();

const formatoNumero = (valor, decimales = 2) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor);

const VistaPrediccionIA = () => {
  const ultimoRegistro = datosEntrenamiento[datosEntrenamiento.length - 1];
  const [escenario, setEscenario] = useState({
    intensidadEnergetica: ultimoRegistro.intensidadEnergetica,
    factorEmision: ultimoRegistro.factorEmision,
    progresoMeta: ultimoRegistro.progresoMeta
  });

  const resultado = useMemo(() => predecirDesvio(escenario), [escenario]);

  const riesgoColor =
    resultado.prediccion > 1.5
      ? 'bg-red-100 text-red-800 border-red-200'
      : resultado.prediccion > 0.5
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <main className="bg-slate-900 text-white min-h-screen">
      <div className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501491976870-3b1c33f0b4cc?auto=format&fit=crop&w=1600&q=80')] opacity-20"
          aria-hidden="true"
        />
        <div className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.35em] text-xs text-amber-300 font-semibold">
            IA predictiva - metas 2030
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
            Prediccion de desvios con modelo demostrativo
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-white/90">
            Entrenamos un modelo lineal sencillo con 12 meses de datos simulados para anticipar el
            desvio esperado respecto de la meta 2030. Todas las metricas y supuestos se encuentran
            documentados para apoyar decisiones de riesgo.
          </p>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-t-3xl shadow-2xl -mt-8">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-10">
          <section aria-labelledby="metricas" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="metricas" className="text-xl font-bold text-slate-900">
                  Metricas del modelo
                </h2>
                <p className="text-sm text-slate-600">
                  Entrenamiento con 12 meses de datos simulados (CA-R12-1). Las metricas presentadas
                  corresponden a la serie utilizada para ajustar el modelo.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  modelo.umbral.cumple ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'
                }`}
              >
                Umbral MAPE permitido: {modelo.umbral.mapeMaximo}% -{' '}
                {modelo.umbral.cumple ? 'Cumple requisito' : 'Fuera de umbral'}
              </span>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm focus-within:ring-2 focus-within:ring-amber-500" tabIndex={0}>
                <dt className="text-sm text-slate-600">MAE (puntos de desvio)</dt>
                <dd className="mt-2 text-3xl font-bold text-slate-900">{formatoNumero(modelo.mae, 2)}</dd>
                <p className="mt-1 text-xs text-slate-500">
                  Error medio absoluto entre la prediccion y el desvio observado.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm focus-within:ring-2 focus-within:ring-amber-500" tabIndex={0}>
                <dt className="text-sm text-slate-600">MAPE (%)</dt>
                <dd className="mt-2 text-3xl font-bold text-slate-900">{formatoNumero(modelo.mape, 1)}%</dd>
                <p className="mt-1 text-xs text-slate-500">
                  Error porcentual medio respecto al valor real (CA-R12-2).
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm focus-within:ring-2 focus-within:ring-amber-500" tabIndex={0}>
                <dt className="text-sm text-slate-600">Datos utilizados</dt>
                <dd className="mt-2 text-3xl font-bold text-slate-900">{datosEntrenamiento.length}</dd>
                <p className="mt-1 text-xs text-slate-500">
                  Meses consecutivos con variables operacionales y de progreso.
                </p>
              </div>
            </dl>
          </section>

          <section aria-labelledby="prediccion" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="prediccion" className="text-xl font-bold text-slate-900">
                Escenario de prediccion
              </h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riesgoColor}`}>
                {resultado.mensaje}
              </span>
            </div>
            <form className="grid gap-4 md:grid-cols-3" aria-describedby="ayuda-escenario">
              <div>
                <label htmlFor="inp-intensidad" className="block text-sm font-semibold text-slate-800">
                  Intensidad energetica (MWh/ton)
                </label>
                <input
                  id="inp-intensidad"
                  type="number"
                  step="0.01"
                  min="0"
                  value={escenario.intensidadEnergetica}
                  onChange={event =>
                    setEscenario(prev => ({ ...prev, intensidadEnergetica: Number(event.target.value) }))
                  }
                  className="form-input mt-2"
                />
              </div>
              <div>
                <label htmlFor="inp-factor" className="block text-sm font-semibold text-slate-800">
                  Factor de emission (tCO2e/MWh)
                </label>
                <input
                  id="inp-factor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={escenario.factorEmision}
                  onChange={event =>
                    setEscenario(prev => ({ ...prev, factorEmision: Number(event.target.value) }))
                  }
                  className="form-input mt-2"
                />
              </div>
              <div>
                <label htmlFor="inp-progreso" className="block text-sm font-semibold text-slate-800">
                  Avance de meta (%)
                </label>
                <input
                  id="inp-progreso"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={escenario.progresoMeta}
                  onChange={event =>
                    setEscenario(prev => ({ ...prev, progresoMeta: Number(event.target.value) }))
                  }
                  className="form-input mt-2"
                />
              </div>
            </form>
            <p id="ayuda-escenario" className="text-xs text-slate-500">
              Ingresa supuestos para el siguiente periodo. El modelo entrega el desvio esperado en puntos porcentuales.
            </p>
            <div
              className={`rounded-3xl border ${riesgoColor} px-6 py-5 text-center`}
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-semibold uppercase tracking-widest">Prediccion esperada</p>
              <p className="mt-2 text-4xl font-extrabold">
                {formatoNumero(resultado.prediccion, 2)} pp
              </p>
              <p className="mt-2 text-xs">
                Valores positivos indican riesgo de sobrepasar la meta; valores negativos implican desempeno superior.
              </p>
            </div>
          </section>

          <section aria-labelledby="variables" className="space-y-3">
            <h2 id="variables" className="text-xl font-bold text-slate-900">
              Explicacion simple de las variables (CA-R12-3)
            </h2>
            <p className="text-sm text-slate-600">
              La importancia relativa se calcula usando el valor absoluto de cada coeficiente del modelo lineal.
            </p>
            <ul className="space-y-3" aria-label="Orden de importancia de las variables">
              {explicacion.map(variable => (
                <li
                  key={variable.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm focus-within:ring-2 focus-within:ring-amber-500"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">{variable.label}</h3>
                    <span className="text-xs font-semibold text-slate-600">
                      Importancia: {formatoNumero(variable.importancia * 100, 1)}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{variable.descripcion}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Coeficiente: {formatoNumero(variable.peso, 4)} (signo positivo aumenta el desvio).
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="datos-entrenamiento" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="datos-entrenamiento" className="text-xl font-bold text-slate-900">
                Datos de entrenamiento (12 meses)
              </h2>
              <span className="text-xs text-slate-500">Serie ficticia - uso interno de innovacion</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                      Mes
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                      Intensidad (MWh/ton)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                      Factor de emission
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                      Progreso (%)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                      Desvio real (pp)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {datosEntrenamiento.map(dato => (
                    <tr key={dato.mes} className="hover:bg-slate-50 focus-within:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">{dato.mes}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dato.intensidadEnergetica}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dato.factorEmision}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dato.progresoMeta}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dato.desvio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              Este set se utiliza unicamente para ilustrar la metrica y el flujo de prediccion del prototipo.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default VistaPrediccionIA;
