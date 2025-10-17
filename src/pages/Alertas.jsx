import React, { useEffect, useMemo, useState } from 'react';
import servicioAlertas, { DEFAULT_ALERTAS } from '../services/servicioAlertas';
import PoliticaEvaluacion from '../components/PoliticaEvaluacion';
import SimulacionAlertas from '../components/SimulacionAlertas';
import Tooltip from '../components/Tooltip';
import servicioNotificaciones from '../services/servicioNotificaciones';

const Placeholder = ({ name }) => (
  <code className="bg-gray-100 px-1 py-0.5 rounded">{`{{${name}}}`}</code>
);

function Alertas() {
  const [config, setConfig] = useState(servicioAlertas.obtenerConfig());
  const [historial, setHistorial] = useState([]);
  const [simulacion, setSimulacion] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [reglasEdit, setReglasEdit] = useState(config.reglas || {});
  const [histFromService, setHistFromService] = useState([]);
  // Notificaciones multicanal (R11)
  const [notifSettings, setNotifSettings] = useState(() => servicioNotificaciones.getSettings());
  const [centro, setCentro] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [emailLog, setEmailLog] = useState([]);
  const isBrowser = typeof window !== 'undefined';
  const currentUser = useMemo(() => {
    if (!isBrowser) return {};
    try {
      return JSON.parse(window.localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }, [isBrowser]);
  const usuarioActual = currentUser?.usuario || 'ops';
  const emailActual = currentUser?.email || 'ops@example.com';

  useEffect(() => {
    setConfig(servicioAlertas.obtenerConfig());
    setReglasEdit(servicioAlertas.obtenerConfig().reglas || {});
    setHistFromService(servicioAlertas.obtenerHistorial());
    if (!isBrowser) return undefined;
    // R11: iniciar worker y refrescar vistas
    try { servicioNotificaciones.startWorker(); } catch {}
    const tick = setInterval(() => {
      try {
        setOutbox(servicioNotificaciones.listarOutbox());
        setEmailLog(servicioNotificaciones.listarEmailLog());
        setCentro(servicioNotificaciones.listarCentro(usuarioActual));
      } catch {}
    }, 1500);
    setOutbox(servicioNotificaciones.listarOutbox());
    setEmailLog(servicioNotificaciones.listarEmailLog());
    setCentro(servicioNotificaciones.listarCentro(usuarioActual));
    return () => {
      clearInterval(tick);
      servicioNotificaciones.stopWorker();
    };
  }, [isBrowser, usuarioActual]);

  const handleGuardar = async () => {
    setGuardando(true);
    // Ensure reglasEdit are part of the config before saving
    const configToSave = { ...config, reglas: { ...(config.reglas || {}), ...(reglasEdit || {}) } };
    const resultado = await servicioAlertas.guardarConfigVersionada(configToSave, { usuario: JSON.parse(localStorage.getItem('currentUser') || '{}').usuario || 'anon' });
    setGuardando(false);
    if (resultado.success) {
      // refresh history from service
      setHistorial(resultado.historial || []);
      setHistFromService(servicioAlertas.obtenerHistorial());
      alert('Configuración guardada (versionada)');
    } else {
      alert('Error guardando configuración');
    }
  };

  const handleSimular = () => {
    const alerts = servicioAlertas.simularAlertas();
    if (alerts && alerts.length > 0) {
      setSimulacion(alerts);
      return;
    }

    // Fallback: generar alertas hipotéticas a partir de las reglas configuradas
    const reglas = servicioAlertas.obtenerConfig().reglas || reglasEdit || {};
    const fake = Object.entries(reglas).map(([tipo, r], idx) => ({
      id: `hipo-${tipo}-${idx}`,
      titulo: `${r.etiqueta || tipo} supera umbral hipotético`,
      detalle: `Valor simulado por encima del umbral (${r.umbral ?? 'N/A'} ${r.unidad || ''}). Esta alerta es hipotética.`,
      severidad: r.severidad || servicioAlertas.obtenerConfig().severidadPorDefecto || 'media',
      timestamp: new Date().toISOString()
    }));
    setSimulacion(fake);
  };

  return (
    <div className="min-h-screen bg-codelco-light p-6">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Configuración de Alertas</h1>

        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Política de evaluación (emisiones)</h2>
          <PoliticaEvaluacion politica={config} onChange={p => setConfig(p)} />
          <div className="mt-3 flex space-x-2">
            <button onClick={handleGuardar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar (versionar)'}</button>
          </div>
        </section>

        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Reglas por indicador</h2>
          <div className="mb-4 border rounded p-3 bg-white">
            <div className="font-semibold mb-2">Crear / Editar regla completa</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Clave (indicador) <Tooltip>Variable a evaluar (p.ej., tCO₂e/ton Cu, consumo_diesel, SO₂).</Tooltip>
                <input placeholder="Clave (indicador)" className="w-full rounded-lg border px-3 py-2" id="form-clave" value={config._formClave || ''} onChange={e=>setConfig({...config, _formClave: e.target.value})} aria-label="Clave indicador" />
              </label>
              <label className="block">Etiqueta (nombre)
                <input placeholder="Etiqueta (nombre)" className="w-full rounded-lg border px-3 py-2" id="form-etiqueta" value={config._formEtiqueta || ''} onChange={e=>setConfig({...config, _formEtiqueta: e.target.value})} aria-label="Etiqueta" />
              </label>
              <label className="block">Unidad
                <input placeholder="Unidad (ej. L)" className="w-full rounded-lg border px-3 py-2" id="form-unidad" value={config._formUnidad || ''} onChange={e=>setConfig({...config, _formUnidad: e.target.value})} aria-label="Unidad" />
              </label>
              <label className="block">Umbral <Tooltip>Valor límite en la misma unidad del indicador.</Tooltip>
                <input placeholder="Umbral" type="number" className="w-full rounded-lg border px-3 py-2" id="form-umbral" value={config._formUmbral ?? ''} onChange={e=>setConfig({...config, _formUmbral: e.target.value === '' ? '' : Number(e.target.value)})} aria-label="Umbral" />
              </label>
              <label className="block">Dirección <Tooltip>Condición de disparo: '' excedencia, '&lt;' umbral inferior. Usa la unidad del indicador.</Tooltip>
                <select className="w-full rounded-lg border px-3 py-2" id="form-direccion" value={config._formDireccion || '>'} onChange={e=>setConfig({...config, _formDireccion: e.target.value})} aria-label="Dirección">
                  <option value=">">Mayor que (&gt;)</option>
                  <option value="<">Menor que (&lt;)</option>
                </select>
              </label>
              <label className="block">Severidad <Tooltip>Prioridad de la alerta generada. Puede sobrescribir la severidad por defecto de la política.</Tooltip>
                <select className="w-full rounded-lg border px-3 py-2" id="form-severidad" value={config._formSeveridad || 'media'} onChange={e=>setConfig({...config, _formSeveridad: e.target.value})} aria-label="Severidad">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </label>
              <label className="block col-span-2">Ámbito <Tooltip>Dónde aplica: División / Proceso / Tags de equipo.</Tooltip>
                <input placeholder="Ámbito (division/proceso)" className="w-full rounded-lg border px-3 py-2" id="form-ambito" value={config._formAmbito || ''} onChange={e=>setConfig({...config, _formAmbito: e.target.value})} aria-label="Ámbito" />
              </label>
            </div>
            <div className="mt-3 flex space-x-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700" onClick={() => {
                const clave = (config._formClave || '').trim();
                if (!clave) { alert('Clave es obligatoria'); return; }
                const nueva = {
                  etiqueta: config._formEtiqueta || clave,
                  unidad: config._formUnidad || '',
                  umbral: config._formUmbral === '' ? null : config._formUmbral,
                  direccion: config._formDireccion || '>',
                  severidad: config._formSeveridad || config.severidadPorDefecto || 'media',
                  ambito: config._formAmbito || 'global'
                };
                setReglasEdit(prev => ({ ...prev, [clave]: nueva }));
                // clear
                setConfig({...config, _formClave: '', _formEtiqueta: '', _formUnidad: '', _formUmbral: '', _formDireccion: '>', _formSeveridad: 'media', _formAmbito: ''});
                alert('Regla creada/actualizada en borrador');
              }}>Guardar regla</button>
              <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2" onClick={() => {
                // cancel / clear
                setConfig({...config, _formClave: '', _formEtiqueta: '', _formUnidad: '', _formUmbral: '', _formDireccion: '>', _formSeveridad: 'media', _formAmbito: ''});
              }}>Limpiar</button>
            </div>
          </div>

          {Object.entries(reglasEdit).length === 0 && <div className="text-sm text-gray-500">No hay reglas definidas.</div>}
          {Object.entries(reglasEdit).map(([tipo, regla]) => (
            <div key={tipo} className="mb-3 border p-3 rounded flex justify-between items-start">
              <div>
                <div className="font-semibold">{regla.etiqueta || tipo} <span className="text-xs text-gray-500">({tipo})</span></div>
                <div className="text-sm text-gray-600">Ámbito: {regla.ambito || 'global'} — Unidad: {regla.unidad || 'N/A'}</div>
                <div className="mt-2 text-sm">Umbral: {regla.umbral ?? 'N/A'} — Dirección: {regla.direccion || '>'} — Severidad: {regla.severidad}</div>
              </div>
              <div className="flex flex-col space-y-2">
                <button className="btn-secondary" onClick={() => {
                  // load into form for edit
                  setConfig({...config, _formClave: tipo, _formEtiqueta: regla.etiqueta, _formUnidad: regla.unidad, _formUmbral: regla.umbral, _formDireccion: regla.direccion || '>', _formSeveridad: regla.severidad, _formAmbito: regla.ambito});
                }}>Editar</button>
                <button className="btn-ghost" onClick={() => {
                  if (!confirm(`Eliminar regla ${tipo}?`)) return;
                  setReglasEdit(prev => { const copy = { ...prev }; delete copy[tipo]; return copy; });
                }}>Borrar</button>
              </div>
            </div>
          ))}
          <div className="flex space-x-2 mt-2">
            <button className="btn-secondary" onClick={() => {
              // aplicar reglas parciales al servicio
              const res = servicioAlertas.actualizarReglasParciales(reglasEdit);
              if (res.success) {
                alert('Reglas actualizadas');
                setConfig(servicioAlertas.obtenerConfig());
                setHistFromService(servicioAlertas.obtenerHistorial());
              } else {
                alert('Error actualizando reglas');
              }
            }}>Aplicar Reglas</button>
          </div>
          <p className="text-sm text-gray-600 mt-3">Qué hace "Aplicar Reglas": guarda los umbrales y severidades que has editado. En un sistema real esto reiniciaría la evaluación de lecturas y priorizaría notificaciones automáticas a operaciones y seguridad según la severidad.</p>
        </section>

        {/* Moved: description of severities now shown directly under global params for visibility (per user's screenshot) */}
        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Descripción de severidades</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li><strong>Alta</strong>: desviaciones críticas — por ejemplo, temperatura o emisiones &gt; 20% por encima del umbral o sobre un límite de seguridad (requiere acción inmediata y notificación a planta y seguridad).</li>
            <li><strong>Media</strong>: desviaciones relevantes — por ejemplo, consumo o energía 5-20% por encima del umbral (revisar en corto plazo y priorizar en reportes operativos).</li>
            <li><strong>Baja</strong>: desfases menores o informativos — por ejemplo, pequeñas variaciones o lecturas puntuales que no comprometen la operación (monitoreo y registro para tendencia).</li>
          </ul>
        </section>

        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Simulación de alertas</h2>
          <SimulacionAlertas
            resultados={simulacion}
            onSimular={() => {
              const cfg = servicioAlertas.getConfig ? servicioAlertas.getConfig() : servicioAlertas.obtenerConfig();
              const results = servicioAlertas.simular(cfg, null, cfg?.ventanaDias);
              const normalized = (results || []).map((r, idx) => ({ id: `sim-${idx}-${r.indicador}-${r.timestamp || r.fecha || idx}`, ...r }));
              setSimulacion(normalized);
            }}
            onExport={() => {
              if (!simulacion || simulacion.length === 0) { alert('No hay resultados para exportar'); return; }
              const headers = ['timestamp','indicador','ambito','valor','umbral','exceso','pct','severidad','regla'];
              const csv = [headers.join(',')].concat(simulacion.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'simulacion_alertas.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          />
          <div className="mt-3">
            <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2" onClick={() => { setSimulacion([]); }}>Limpiar resultados</button>
            <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 ml-2" onClick={() => {
              if (!simulacion || simulacion.length === 0) { alert('No hay resultados para crear'); return; }
              const res = servicioAlertas.registrarAlertas(simulacion);
              if (res && res.success) {
                alert(`Se registraron ${res.added} alertas en el historial`);
                setHistFromService(servicioAlertas.listarHistorial());
              } else alert('Error registrando alertas');
            }}>Crear alertas demo</button>
          </div>
        </section>

        {/* R11: Notificaciones Multicanal */}
        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Notificaciones multicanal (R11)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="font-medium">Plantilla de correo</div>
              <label className="block text-sm">
                Asunto (usa <Placeholder name="titulo" />, <Placeholder name="severidad" />)
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={notifSettings.email.asuntoTemplate}
                  onChange={e=> setNotifSettings(s=> ({...s, email:{...s.email, asuntoTemplate: e.target.value}}))}
                />
              </label>
              <label className="block text-sm">
                Cuerpo (placeholders: <Placeholder name="usuario" />, <Placeholder name="titulo" />, <Placeholder name="detalle" />, <Placeholder name="severidad" />, <Placeholder name="timestamp" />, <Placeholder name="link" />)
                <textarea
                  rows={6}
                  className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                  value={notifSettings.email.cuerpoTemplate}
                  onChange={e=> setNotifSettings(s=> ({...s, email:{...s.email, cuerpoTemplate: e.target.value}}))}
                />
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!notifSettings.canales?.web} onChange={e=> setNotifSettings(s=> ({...s, canales:{...s.canales, web: e.target.checked}}))} /> Web/App
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!notifSettings.canales?.email} onChange={e=> setNotifSettings(s=> ({...s, canales:{...s.canales, email: e.target.checked}}))} /> Correo
                </label>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={()=>{
                  const r = servicioNotificaciones.saveSettings(notifSettings);
                  if (r?.success) alert('Plantilla/ajustes guardados');
                }}>Guardar plantilla</button>
                <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2" onClick={()=>{
                  const alerta = (simulacion && simulacion[0]) || {
                    id: `demo-${Date.now()}`,
                    titulo: 'Emisiones SO2 por sobre umbral',
                    detalle: 'Línea 3 reportó 22% sobre el límite en la última hora',
                    severidad: 'alta',
                    timestamp: new Date().toISOString()
                  };
                  const destinatarios = [{ usuario: usuarioActual, email: emailActual }];
                  const res = servicioNotificaciones.enviarAlertaMulticanal(alerta, destinatarios);
                  setCentro(servicioNotificaciones.listarCentro(usuarioActual));
                  setOutbox(servicioNotificaciones.listarOutbox());
                  if (res?.success) alert('Alerta enviada (web) y encolada para correo');
                }}>Probar envío</button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="font-medium">Bandeja (Web/App)</div>
              <ul className="space-y-2 max-h-64 overflow-auto">
                {(centro||[]).map(n=> (
                  <li key={n.id} className="border rounded p-2 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{n.titulo}</div>
                      <div className="text-xs text-gray-600">Severidad: {n.severidad} · {new Date(n.creadoEn).toLocaleString()}</div>
                      {n.leidoEn && <div className="text-xs text-green-700">Leído: {new Date(n.leidoEn).toLocaleString()}</div>}
                      {n.cerrado && <div className="text-xs text-blue-700">Cerrado por {n.cerrado.usuario} · {new Date(n.cerrado.fecha).toLocaleString()}</div>}
                    </div>
                    <div className="flex gap-2">
                      {!n.leidoEn && <button className="text-sm rounded border px-2 py-1" onClick={()=>{ servicioNotificaciones.marcarLeido(n.id, usuarioActual); setCentro(servicioNotificaciones.listarCentro(usuarioActual)); }}>Marcar leído</button>}
                      {!n.cerrado && <button className="text-sm rounded border px-2 py-1" onClick={()=>{ servicioNotificaciones.cerrarNotificacion(n.id, usuarioActual, 'Atendido'); setCentro(servicioNotificaciones.listarCentro(usuarioActual)); }}>Cerrar</button>}
                    </div>
                  </li>
                ))}
                {(!centro || centro.length===0) && <li className="text-sm text-gray-500">Sin notificaciones</li>}
              </ul>
              <div className="font-medium mt-4">Envíos de correo (cola)</div>
              <ul className="space-y-2 max-h-64 overflow-auto">
                {(outbox||[]).map(o=> (
                  <li key={o.id} className="border rounded p-2 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{o.subject}</div>
                      <div className="text-xs text-gray-600">Para: {o.to} · Estado: {o.status} · Intentos: {o.attempts}/{o.maxAttempts}</div>
                      {o.lastError && <div className="text-xs text-red-600">Último error: {o.lastError}</div>}
                    </div>
                    <div className="flex gap-2">
                      {o.status !== 'sent' && <button className="text-sm rounded border px-2 py-1" onClick={()=>{ servicioNotificaciones.forceRetry(o.id); setOutbox(servicioNotificaciones.listarOutbox()); }}>Reintentar</button>}
                    </div>
                  </li>
                ))}
                {(!outbox || outbox.length===0) && <li className="text-sm text-gray-500">Sin elementos en cola</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold mb-2">Historial de configuraciones</h2>
          <p className="text-sm text-gray-600 mb-2">Versiones guardadas (las configuraciones se almacenan con versión y usuario):</p>
          <ul className="space-y-4">
            {(histFromService || []).map((h, i) => (
              <li key={h.version} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Versión {i+1} — {h.version}</div>
                    <div className="text-xs text-gray-500">Guardado: {new Date(h.fecha).toLocaleString()} — Usuario: {h.usuario}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <div className="font-medium">Resumen de reglas:</div>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.entries(h.config?.reglas || {}).map(([tipo, r]) => (
                      <li key={tipo}>{r.etiqueta || tipo}: Umbral {r.umbral ?? 'N/A'} {r.unidad || ''} — Severidad: {r.severidad}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            {(!histFromService || histFromService.length === 0) && <li className="text-sm text-gray-500">No hay versiones guardadas aún.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Alertas;
