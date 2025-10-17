import React from 'react';
import Tooltip from './Tooltip';

export default function PoliticaEvaluacion({ politica, onChange }) {
  const patch = (patchObj) => onChange({ ...politica, ...patchObj });

  return (
    <div>
      <label className="block mb-3">Nombre de la política <Tooltip>Etiqueta para identificar este conjunto de reglas y ventana de evaluación.</Tooltip>
        <input type="text" className="w-full rounded-lg border px-3 py-2 mt-1" value={politica.nombre || ''} onChange={e => patch({ nombre: e.target.value })} />
      </label>

      <label className="block mb-3">Método de agregación <Tooltip>Cómo se agrega la ventana móvil: Media suaviza, Máximo captura picos, Percentil ajusta sensibilidad (p).</Tooltip>
        <select className="w-full rounded-lg border px-3 py-2 mt-1" value={politica.metodo || 'media'} onChange={e => patch({ metodo: e.target.value })}>
          <option value="media">Media</option>
          <option value="maximo">Máximo</option>
          <option value="percentil">Percentil</option>
        </select>
      </label>

      {politica.metodo === 'percentil' && (
        <label className="block mb-3">Percentil p (1–99) <Tooltip>Usado solo si el método es Percentil. Recomendado 90–95 para detectar colas altas.</Tooltip>
          <input type="number" min={1} max={99} className="w-full rounded-lg border px-3 py-2 mt-1" value={politica.percentilP ?? 95} onChange={e => {
            const v = e.target.value === '' ? '' : Number(e.target.value);
            if (v !== '' && (v < 1 || v > 99)) return;
            patch({ percentilP: v });
          }} />
        </label>
      )}

      <label className="block mb-3">Ventana de evaluación (días) <Tooltip>Número de días para la ventana móvil (≥1).</Tooltip>
        <input type="number" min={1} className="w-full rounded-lg border px-3 py-2 mt-1" value={politica.ventanaDias ?? 1} onChange={e => {
          const v = Number(e.target.value) || 1; if (v < 1) return; patch({ ventanaDias: v });
        }} />
      </label>

      <label className="block mb-3">Severidad por defecto <Tooltip>Se aplica si una regla no define su propia severidad.</Tooltip>
        <select className="w-full rounded-lg border px-3 py-2 mt-1" value={politica.severidadPorDefecto || 'baja'} onChange={e => patch({ severidadPorDefecto: e.target.value })}>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </label>
    </div>
  );
}
