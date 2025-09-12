import React from 'react';
import { DIVISIONES, PROCESOS } from '../services/servicioMetas';

export default function FiltroDivisionProceso({ division, proceso, onChangeDivision, onChangeProceso }) {
  return (
    <div className="p-3 border rounded bg-white">
      <label className="block text-sm text-codelco-secondary mb-1">Filtros</label>
      <div className="flex flex-col space-y-2">
        <select aria-label="Seleccionar división" value={division || ''} onChange={(e) => onChangeDivision(e.target.value || null)} className="border p-2 rounded">
          <option value="">Todas las divisiones</option>
          {DIVISIONES.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>

        <select aria-label="Seleccionar proceso" value={proceso || ''} onChange={(e) => onChangeProceso(e.target.value || null)} className="border p-2 rounded">
          <option value="">Todos los procesos</option>
          {PROCESOS.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
