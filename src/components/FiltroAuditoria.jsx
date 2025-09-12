import React, { useState } from 'react';

function FiltroAuditoria({ onChange, initial = {} }) {
  const [usuario, setUsuario] = useState(initial.usuario || '');
  const [entidad, setEntidad] = useState(initial.entidad || '');
  const [accion, setAccion] = useState(initial.accion || '');
  const [q, setQ] = useState(initial.q || '');

  const submit = (e) => {
    e && e.preventDefault();
    onChange({ ...initial, usuario: usuario || undefined, entidad: entidad || undefined, accion: accion || undefined, q: q || undefined, page: 1 });
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow-sm flex space-x-3 items-end">
      <div>
        <label className="text-sm block text-gray-600">Usuario</label>
        <input value={usuario} onChange={e=>setUsuario(e.target.value)} className="input" placeholder="usuario" />
      </div>
      <div>
        <label className="text-sm block text-gray-600">Entidad</label>
        <input value={entidad} onChange={e=>setEntidad(e.target.value)} className="input" placeholder="metas|sensores|reportes" />
      </div>
      <div>
        <label className="text-sm block text-gray-600">Acción</label>
        <select value={accion} onChange={e=>setAccion(e.target.value)} className="input">
          <option value="">(todas)</option>
          <option value="crear">crear</option>
          <option value="modificar">modificar</option>
          <option value="eliminar">eliminar</option>
          <option value="ver">ver</option>
          <option value="exportar">exportar</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="text-sm block text-gray-600">Buscar</label>
        <input value={q} onChange={e=>setQ(e.target.value)} className="input w-full" placeholder="texto libre" />
      </div>
      <div>
        <button className="btn-secondary" onClick={submit}>Filtrar</button>
      </div>
    </form>
  );
}

export default FiltroAuditoria;
