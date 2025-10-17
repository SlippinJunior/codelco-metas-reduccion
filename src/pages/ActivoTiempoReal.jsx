import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import servicioTR from '../services/servicioTiempoReal';
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';

function smallKPI({ label, value }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function ActivoTiempoReal() {
  const { id } = useParams();
  const nav = useNavigate();
  const [serie, setSerie] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    servicioTR.listarActivosFundicion().then(list => {
      setActivos(list);
      const found = (list || []).find(a => a.id === id);
      if (!found) { nav('/operario/activos'); return; }
    });
  }, [id]);

  const cargar = async () => {
    setLoading(true);
    try {
      const lect = await servicioTR.getLecturasUltimaHora(id);
      const ev = await servicioTR.getEventosUltimaHora(id);
      setSerie(lect || []);
      setEventos(ev || []);
    } catch (e) {
      setSerie([]);
      setEventos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    timerRef.current = setInterval(cargar, 60000);
    return () => clearInterval(timerRef.current);
  }, [id]);

  const titulo = (activos.find(a => a.id === id)?.nombre) || id;

  const valores = serie.map(s => s.valor);
  const promedio = valores.length ? (valores.reduce((a,b)=>a+b,0)/valores.length).toFixed(3) : 'N/A';
  const maximo = valores.length ? Math.max(...valores).toFixed(3) : 'N/A';
  const ultimo = valores.length ? valores[valores.length-1].toFixed(3) : 'N/A';

  return (
    <div className="min-h-screen p-6 bg-codelco-light">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{titulo} — Emisiones tCO₂e/hr (última hora)</h1>
            <div className="text-sm text-gray-600">Datos SIMULADOS para demostración.</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">SIMULADO</span>
            <span className="text-xs text-gray-600">Auto-refresh: 60s</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm mr-2">Seleccionar activo:</label>
          <select className="rounded-lg border px-3 py-2" value={id} onChange={e => nav(`/operario/activo/${e.target.value}`)} aria-label="Seleccionar activo">
            {(activos || []).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">Cargando lecturas...</div>
              ) : serie.length === 0 ? (
                <div className="text-center p-6">Sin lecturas en los últimos 60 min. <button className="ml-3 inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-1" onClick={cargar}>Reintentar</button></div>
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={serie.map(s=>({ time: new Date(s.timestamp).toLocaleTimeString(), valor: s.valor }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{fontSize:10}} aria-label="Tiempo (última hora)" />
                    <YAxis dataKey="valor" tick={{fontSize:10}} aria-label="tCO2e/hr" />
                    <RTooltip formatter={(v)=>[v,'tCO₂e/hr']} labelFormatter={(l)=>`Hora: ${l}`} />
                    <Line type="monotone" dataKey="valor" stroke="#2563eb" dot={false} strokeWidth={2} name="tCO₂e/hr" />
                    {eventos.map((ev, idx) => (
                      <ReferenceLine key={idx} x={new Date(ev.timestamp).toLocaleTimeString()} stroke="red" label={ev.tipo} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {smallKPI({ label: 'Promedio (60m)', value: promedio })}
              {smallKPI({ label: 'Máximo (60m)', value: maximo })}
              {smallKPI({ label: 'Último valor', value: ultimo })}
              {smallKPI({ label: '#Eventos', value: eventos.length })}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600">Marcadores: <span title="Marcadores de eventos operativos (Inicio de ciclo, Mantención, Cambio de carga).">Eventos operativos superpuestos</span></div>
      </div>
    </div>
  );
}
