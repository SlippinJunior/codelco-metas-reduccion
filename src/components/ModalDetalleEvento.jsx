import React from 'react';

function ModalDetalleEvento({ evento, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Detalle Evento {evento.id}</h3>
          <button onClick={onClose} className="text-gray-500">Cerrar</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium">Anterior</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded max-h-64 overflow-auto">{JSON.stringify(evento.detalle_anterior, null, 2)}</pre>
          </div>
          <div>
            <h4 className="text-sm font-medium">Nuevo</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded max-h-64 overflow-auto">{JSON.stringify(evento.detalle_nuevo, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalleEvento;
