import React from 'react';

const GLOSARIO = [
  {
    termino: 'Avance (%)',
    definicion: 'Porcentaje que indica cuanto se ha completado un proyecto en comparacion con la meta comprometida.'
  },
  {
    termino: 'Emisiones evitadas',
    definicion: 'Toneladas estimadas de gases de efecto invernadero que no se liberan a la atmosfera gracias a una iniciativa.'
  },
  {
    termino: 'Mesa de vinculacion',
    definicion: 'Instancia periodica donde representantes de la comunidad y Codelco revisan compromisos y resuelven dudas.'
  },
  {
    termino: 'Microred',
    definicion: 'Sistema de energia local que puede utilizar fuentes renovables y entregar electricidad a hogares cercanos.'
  },
  {
    termino: 'Plan de monitoreo',
    definicion: 'Programa coordinado para medir un elemento (por ejemplo, la calidad del aire) y compartir los resultados con la ciudadania.'
  },
  {
    termino: 'Reforestacion participativa',
    definicion: 'Actividad donde la comunidad planta arboles nativos y aprende sobre el cuidado del entorno.'
  }
];

const VistaGlosarioCiudadano = () => (
  <main className="bg-slate-900 text-white min-h-screen py-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="uppercase tracking-[0.3em] text-xs text-amber-300 font-semibold">
          Glosario Ciudadano
        </p>
        <h1 className="text-4xl font-extrabold">Lenguaje claro para nuestras comunidades</h1>
        <p className="text-slate-200 text-lg">
          Aqui encontraras explicaciones sencillas y de facil lectura sobre los terminos que utilizamos en el portal.
          Puedes navegar con teclado, copiar definiciones y volver al portal cuando quieras.
        </p>
        <a
          href="/comunidades"
          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Volver al Portal Ciudadano
        </a>
      </header>

      <section className="mt-10 bg-white text-slate-900 rounded-3xl p-8 shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Definiciones clave</h2>
        <p className="mt-2 text-sm text-slate-600">
          Si necesitas ms detalles, escribe a <a href="mailto:comunidades@codelco.cl" className="text-amber-700 underline">comunidades@codelco.cl</a>.
        </p>
        <dl className="mt-6 space-y-5">
          {GLOSARIO.map(item => (
            <div key={item.termino} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 focus-within:ring-2 focus-within:ring-amber-500" tabIndex={0}>
              <dt className="text-lg font-semibold text-slate-900">{item.termino}</dt>
              <dd className="mt-2 text-sm text-slate-700">{item.definicion}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  </main>
);

export default VistaGlosarioCiudadano;
