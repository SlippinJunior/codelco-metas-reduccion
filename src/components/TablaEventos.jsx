import React, { useState } from 'react';
import ModalDetalleEvento from './ModalDetalleEvento';

function TablaEventos({ eventos = [], loading = false, onPage }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="rounded shadow overflow-hidden bg-white border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-3 text-xs text-gray-600 text-left">Fecha</th>
            <th className="p-3 text-xs text-gray-600 text-left">Usuario</th>
            <th className="p-3 text-xs text-gray-600 text-left">Acción</th>
            <th className="p-3 text-xs text-gray-600 text-left">Entidad</th>
            <th className="p-3 text-xs text-gray-600 text-left">Motivo</th>
            <th className="p-3 text-xs text-gray-600 text-left">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="p-4">Cargando...</td></tr>
          ) : eventos.length === 0 ? (
            <tr><td colSpan={6} className="p-4">No hay eventos</td></tr>
          ) : eventos.map(ev => (
            <tr key={ev.id} className="border-t">
              <td className="p-3 align-top">{new Date(ev.fecha_hora).toLocaleString()}</td>
              <td className="p-3 align-top">{ev.usuario} <div className="text-xs text-gray-400">{ev.rol}</div></td>
              <td className="p-3 align-top">{ev.accion}</td>
              <td className="p-3 align-top">{ev.entidad} <div className="text-xs text-gray-400">{ev.entidad_id}</div></td>
              <td className="p-3 align-top">{ev.motivo}</td>
              <td className="p-3 align-top"><button onClick={()=>setSelected(ev)} className="text-codelco-accent underline">Ver</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 border-t bg-gray-50 flex justify-end space-x-2">
        <button onClick={()=>onPage && onPage(1)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded">Primera</button>
        <button onClick={()=>onPage && onPage('prev')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded">Anterior</button>
        <button onClick={()=>onPage && onPage('next')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded">Siguiente</button>
      </div>

      {selected && <ModalDetalleEvento evento={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

export default TablaEventos;
