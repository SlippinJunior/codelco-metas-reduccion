import React, { useState } from 'react';
import ModalDetalleEvento from './ModalDetalleEvento';

function TablaEventos({ eventos = [], loading = false, onPage }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-2">Fecha</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Acción</th>
            <th className="p-2">Entidad</th>
            <th className="p-2">Motivo</th>
            <th className="p-2">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="p-4">Cargando...</td></tr>
          ) : eventos.length === 0 ? (
            <tr><td colSpan={6} className="p-4">No hay eventos</td></tr>
          ) : eventos.map(ev => (
            <tr key={ev.id} className="border-t">
              <td className="p-2 align-top">{new Date(ev.fecha_hora).toLocaleString()}</td>
              <td className="p-2 align-top">{ev.usuario} <div className="text-xs text-gray-400">{ev.rol}</div></td>
              <td className="p-2 align-top">{ev.accion}</td>
              <td className="p-2 align-top">{ev.entidad} <div className="text-xs text-gray-400">{ev.entidad_id}</div></td>
              <td className="p-2 align-top">{ev.motivo}</td>
              <td className="p-2 align-top"><button onClick={()=>setSelected(ev)} className="text-blue-600 underline">Ver</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 border-t bg-gray-50 flex justify-end">
        <button onClick={()=>onPage && onPage(1)} className="btn-small mr-2">Primera</button>
        <button onClick={()=>onPage && onPage( (ev=>ev) )} className="btn-small">Anterior</button>
      </div>

      {selected && <ModalDetalleEvento evento={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

export default TablaEventos;
