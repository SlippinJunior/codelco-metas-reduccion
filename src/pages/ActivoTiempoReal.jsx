import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import servicioTR, { getUmbralActivo } from '../services/servicioTiempoReal';
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
  const [lastRefreshAt, setLastRefreshAt] = useState(Date.now());
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
      setLastRefreshAt(Date.now());
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

  const umbral = getUmbralActivo(id);
  const lastValue = valores.length ? valores[valores.length-1] : 0;
  const ratio = umbral > 0 ? (lastValue / umbral) : 0;
  let estado = {label:'Normal', cls:'bg-green-100 text-green-800'};
  if (ratio >= 1) estado = {label:'Alto (sobre umbral)', cls:'bg-red-100 text-red-800'};
  else if (ratio >= 0.8) estado = {label:'Cercano al umbral', cls:'bg-yellow-100 text-yellow-800'};

  const ageSec = Math.floor((Date.now() - lastRefreshAt)/1000);
  let net = {label:'Conectado', dot:'bg-green-500'};
  if (ageSec > 180) net = {label:'Sin conexión', dot:'bg-red-500'};
  else if (ageSec > 90) net = {label:'Retraso leve', dot:'bg-yellow-500'};

  const colorEvento = (t) => t.includes('Inicio') ? '#16a34a' : t.includes('Cambio') ? '#2563eb' : '#ea580c';
  const iconEvento  = (t) => t.includes('Inicio') ? '▶' : t.includes('Cambio') ? '⚙' : '🧰';

  return (
  <div className="min-h-screen p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{titulo} — Emisiones tCO₂e/hr (última hora)</h1>
            <div className="text-sm text-gray-600">Datos SIMULADOS para demostración.</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">SIMULADO</span>
            <span className="text-xs text-gray-600">Auto-refresh: 60s</span>
            <span className={`px-2 py-1 rounded text-xs ${estado.cls}`} title={`Umbral: ${umbral.toFixed(2)} tCO₂e/hr — Comparado contra umbral del activo (tCO₂e/hr)`}>
              {estado.label}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${net.dot}`} />
              <span className="text-gray-600">{net.label}</span>
              <span className="text-gray-400">· actualizado {new Date(lastRefreshAt).toLocaleTimeString()}</span>
            </div>
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
                    {eventos.map((ev, idx) => {
                      const ts = new Date(ev.timestamp).toLocaleTimeString();
                      const c = colorEvento(ev.tipo);
                      return (
                        <ReferenceLine key={idx} x={ts} stroke={c} strokeWidth={2}
                          label={{ value: `${iconEvento(ev.tipo)} ${ev.tipo}`, position: 'top', fill: c }}
                        />
                      );
                    })}
                    <ReferenceLine y={umbral} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Umbral ${umbral.toFixed(2)}`, position: 'right', fill: '#ef4444' }} />
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

        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">Últimos eventos (60 min)</div>
            <ul className="grid md:grid-cols-3 gap-2">
            { (eventos || []).slice(-6).map((e, i) => (
              <li key={i} className="rounded border bg-white p-2 flex items-center gap-2">
                <span className="text-lg" style={{color: colorEvento(e.tipo)}}>{iconEvento(e.tipo)}</span>
                <div>
                  <div className="font-medium">{e.tipo}</div>
                  <div className="text-xs text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</div>
                </div>
              </li>
            )) }
          </ul>
        </div>
      </div>
    </div>
  );
}
