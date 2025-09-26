import React from 'react';
import { DIVISIONES, PROCESOS } from '../services/servicioMetas';

export default function FiltroDivisionProceso({ division, proceso, onChangeDivision, onChangeProceso }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="filtro-division" className="form-label">División</label>
        <select
          id="filtro-division"
          aria-label="Seleccionar división"
          value={division || ''}
          onChange={(e) => onChangeDivision(e.target.value || null)}
          className="input"
        >
          <option value="">Todas las divisiones</option>
          {DIVISIONES.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Limita los resultados al territorio operativo deseado.</p>
      </div>

      <div>
        <label htmlFor="filtro-proceso" className="form-label">Proceso</label>
        <select
          id="filtro-proceso"
          aria-label="Seleccionar proceso"
          value={proceso || ''}
          onChange={(e) => onChangeProceso(e.target.value || null)}
          className="input"
        >
          <option value="">Todos los procesos</option>
          {PROCESOS.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Analiza procesos específicos para detectar desviaciones puntuales.</p>
      </div>
    </div>
  );
}
