import React from 'react';
import { construirPeriodo } from '../services/servicioDatosSimulados';

export default function SelectorPeriodo({ periodo, onChange }) {
  // periodo: { tipo, año, indice }
  const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  function handleTipoChange(e) {
    const tipo = e.target.value;
    onChange(construirPeriodo(tipo, periodo.año, periodo.indice || 1));
  }

  function handleAñoChange(e) {
    onChange(construirPeriodo(periodo.tipo, Number(e.target.value), periodo.indice || 1));
  }

  function handleIndiceChange(e) {
    onChange(construirPeriodo(periodo.tipo, periodo.año, Number(e.target.value)));
  }

  return (
    <div className="p-3 border rounded bg-white">
      <label className="block text-sm text-codelco-secondary mb-1">Periodo</label>
      <div className="flex items-center space-x-2">
        <select aria-label="Tipo de periodo" value={periodo.tipo} onChange={handleTipoChange} className="border p-2 rounded w-32">
          <option value="anio">Año</option>
          <option value="semestre">Semestre</option>
          <option value="trimestre">Trimestre</option>
        </select>

        <select aria-label="Año" value={periodo.año} onChange={handleAñoChange} className="border p-2 rounded">
          {años.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {periodo.tipo === 'semestre' && (
          <select aria-label="Semestre" value={periodo.indice || 1} onChange={handleIndiceChange} className="border p-2 rounded w-32">
            <option value={1}>1er Semestre</option>
            <option value={2}>2do Semestre</option>
          </select>
        )}

        {periodo.tipo === 'trimestre' && (
          <select aria-label="Trimestre" value={periodo.indice || 1} onChange={handleIndiceChange} className="border p-2 rounded w-32">
            <option value={1}>T1</option>
            <option value={2}>T2</option>
            <option value={3}>T3</option>
            <option value={4}>T4</option>
          </select>
        )}
      </div>
    </div>
  );
}
