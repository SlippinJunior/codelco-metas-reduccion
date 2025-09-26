import React from 'react';
import { construirPeriodo } from '../services/servicioDatosSimulados';

export default function SelectorPeriodo({ periodo, onChange }) {
  const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    onChange(construirPeriodo(tipo, periodo.año, periodo.indice || 1));
  };

  const handleAñoChange = (e) => {
    onChange(construirPeriodo(periodo.tipo, Number(e.target.value), periodo.indice || 1));
  };

  const handleIndiceChange = (e) => {
    onChange(construirPeriodo(periodo.tipo, periodo.año, Number(e.target.value)));
  };

  const gridClass = periodo.tipo === 'anio'
    ? 'grid gap-4 sm:grid-cols-2'
    : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-codelco-secondary">Periodo</h3>
        <p className="text-xs text-gray-500">Define el rango temporal para generar la serie simulada.</p>
      </div>

      <div className={gridClass}>
        <div>
          <label htmlFor="selector-tipo-periodo" className="form-label">Tipo de periodo</label>
          <select
            id="selector-tipo-periodo"
            aria-label="Tipo de periodo"
            value={periodo.tipo}
            onChange={handleTipoChange}
            className="input"
          >
            <option value="anio">Año</option>
            <option value="semestre">Semestre</option>
            <option value="trimestre">Trimestre</option>
          </select>
        </div>

        <div>
          <label htmlFor="selector-anio" className="form-label">Año</label>
          <select
            id="selector-anio"
            aria-label="Año"
            value={periodo.año}
            onChange={handleAñoChange}
            className="input"
          >
            {años.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {periodo.tipo === 'semestre' && (
          <div>
            <label htmlFor="selector-semestre" className="form-label">Semestre</label>
            <select
              id="selector-semestre"
              aria-label="Semestre"
              value={periodo.indice || 1}
              onChange={handleIndiceChange}
              className="input"
            >
              <option value={1}>1er Semestre</option>
              <option value={2}>2do Semestre</option>
            </select>
          </div>
        )}

        {periodo.tipo === 'trimestre' && (
          <div>
            <label htmlFor="selector-trimestre" className="form-label">Trimestre</label>
            <select
              id="selector-trimestre"
              aria-label="Trimestre"
              value={periodo.indice || 1}
              onChange={handleIndiceChange}
              className="input"
            >
              <option value={1}>T1</option>
              <option value={2}>T2</option>
              <option value={3}>T3</option>
              <option value={4}>T4</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
