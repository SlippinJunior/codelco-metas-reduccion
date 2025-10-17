import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import servicioTR from '../services/servicioTiempoReal';

export default function ActivosTiempoReal() {
  const [activos, setActivos] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    servicioTR.listarActivosFundicion().then(setActivos);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-codelco-light">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Vista Tiempo Real (DEMO) — datos simulados para evaluación operativa.</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activos.map(a => (
            <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="font-semibold">{a.nombre}</div>
              <div className="text-sm text-gray-600">{a.division} — {a.proceso}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEMO</span>
                <button className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700" onClick={() => nav(`/operario/activo/${a.id}`)}>Ver tiempo real</button>
              </div>
            </div>
          ))}
          {activos.length === 0 && <div className="text-sm text-gray-500">Cargando activos...</div>}
        </div>
      </div>
    </div>
  );
}
