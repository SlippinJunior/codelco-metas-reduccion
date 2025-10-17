import React, { useEffect, useState } from 'react';
import servicioAlertas, { DEFAULT_ALERTAS } from '../services/servicioAlertas';

function Alertas() {
  const [config, setConfig] = useState(servicioAlertas.obtenerConfig());
  const [historial, setHistorial] = useState([]);
  const [simulacion, setSimulacion] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [reglasEdit, setReglasEdit] = useState(config.reglas || {});
  const [histFromService, setHistFromService] = useState([]);

  useEffect(() => {
    setConfig(servicioAlertas.obtenerConfig());
    setReglasEdit(servicioAlertas.obtenerConfig().reglas || {});
    setHistFromService(servicioAlertas.obtenerHistorial());
  }, []);

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
          <label className="block mb-2">Nombre de la política
            <input type="text" className="input mt-1" value={config.nombre || ''} onChange={e=>setConfig({...config, nombre: e.target.value})} aria-label="Nombre de política" />
          </label>
          <label className="block mb-2">
            Método de agregación
            <select className="input mt-1" value={config.metodo || 'media'} onChange={e=>setConfig({...config, metodo: e.target.value})} aria-label="Método de agregación">
              <option value="media">Media</option>
              <option value="maximo">Máximo</option>
              <option value="percentil">Percentil (p)</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">Micro-ayuda: elige cómo se agrega el conjunto de lecturas en la ventana móvil. Percentil permite ajustar sensibilidad (p).</div>
          </label>
          <label className="block mb-2">Percentil p (1-99)
            <input type="number" className="input mt-1" value={config.percentilP ?? 95} onChange={e=>{
              const v = e.target.value === '' ? '' : Number(e.target.value);
              if (v !== '' && (v < 1 || v > 99)) { alert('Percentil debe estar entre 1 y 99'); return; }
              setConfig({...config, percentilP: v});
            }} aria-label="Percentil p" />
          </label>
          <label className="block mb-2">
            Ventana de evaluación (días)
            <input type="number" className="input mt-1" value={config.ventanaDias} onChange={e=>setConfig({...config, ventanaDias: Number(e.target.value)})} />
          </label>
          <label className="block mb-2">
            Severidad por defecto
            <select className="input mt-1" value={config.severidadPorDefecto} onChange={e=>setConfig({...config, severidadPorDefecto: e.target.value})}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>

          {/* New: quick add/edit rule from global params */}
          <div className="mt-4 border rounded p-3 bg-white">
            <div className="font-semibold mb-2">Crear / editar regla rápida</div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Clave (ej. consumo_diesel)" className="input" value={config._nuevaClave || ''} onChange={e=>setConfig({...config, _nuevaClave: e.target.value})} />
              <input placeholder="Nombre visual (ej. Consumo Diésel)" className="input" value={config._nuevaNombre || ''} onChange={e=>setConfig({...config, _nuevaNombre: e.target.value})} />
              <input placeholder="Unidad (ej. L)" className="input" value={config._nuevaUnidad || ''} onChange={e=>setConfig({...config, _nuevaUnidad: e.target.value})} />
              <input placeholder="Umbral" type="number" className="input" value={config._nuevaUmbral ?? ''} onChange={e=>setConfig({...config, _nuevaUmbral: e.target.value === '' ? '' : Number(e.target.value)})} />
              <select className="input col-span-2" value={config._nuevaSeveridad || 'media'} onChange={e=>setConfig({...config, _nuevaSeveridad: e.target.value})}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="mt-3 flex space-x-2">
              <button className="btn-secondary" onClick={() => {
                const clave = (config._nuevaClave || '').trim();
                if (!clave) { alert('La clave de la regla es obligatoria'); return; }
                const nueva = {
                  etiqueta: config._nuevaNombre || clave,
                  unidad: config._nuevaUnidad || '',
                  umbral: config._nuevaUmbral === '' ? null : config._nuevaUmbral,
                  severidad: config._nuevaSeveridad || config.severidadPorDefecto || 'media'
                };
                setReglasEdit(prev => ({ ...prev, [clave]: nueva }));
                // clear inputs
                setConfig({...config, _nuevaClave: '', _nuevaNombre: '', _nuevaUnidad: '', _nuevaUmbral: '', _nuevaSeveridad: 'media'});
                alert('Regla agregada al borrador. Puedes "Aplicar Reglas" o Guardar la configuración.');
              }}>Agregar regla</button>
              <button onClick={handleSimular} className="btn-secondary">Simular con datos históricos</button>
              <button onClick={handleGuardar} className="btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar (versionar)'}</button>
              <button onClick={async () => {
                try {
                  const resp = await fetch('/data/caso-alerta-ejemplo.json');
                  const datos = await resp.json();
                  const alerts = servicioAlertas.simularAlertas(datos);
                  setSimulacion(alerts);
                  alert(`Simulación cargada: ${alerts.length} alertas`);
                } catch (e) {
                  alert('No se pudo cargar el caso de ejemplo');
                }
              }} className="btn-ghost">Cargar caso de ejemplo</button>
            </div>
          </div>
        </section>

        <section className="mb-6 card p-4">
          <h2 className="font-semibold mb-2">Reglas por indicador</h2>
          <div className="mb-4 border rounded p-3 bg-white">
            <div className="font-semibold mb-2">Crear / Editar regla completa</div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Clave (indicador)" className="input" id="form-clave" value={config._formClave || ''} onChange={e=>setConfig({...config, _formClave: e.target.value})} aria-label="Clave indicador" />
              <input placeholder="Etiqueta (nombre)" className="input" id="form-etiqueta" value={config._formEtiqueta || ''} onChange={e=>setConfig({...config, _formEtiqueta: e.target.value})} aria-label="Etiqueta" />
              <input placeholder="Unidad (ej. L)" className="input" id="form-unidad" value={config._formUnidad || ''} onChange={e=>setConfig({...config, _formUnidad: e.target.value})} aria-label="Unidad" />
              <input placeholder="Umbral" type="number" className="input" id="form-umbral" value={config._formUmbral ?? ''} onChange={e=>setConfig({...config, _formUmbral: e.target.value === '' ? '' : Number(e.target.value)})} aria-label="Umbral" />
              <select className="input" id="form-direccion" value={config._formDireccion || '>'} onChange={e=>setConfig({...config, _formDireccion: e.target.value})} aria-label="Dirección">
                <option value=">">Mayor que (&gt;)</option>
                <option value="<">Menor que (&lt;)</option>
              </select>
              <select className="input" id="form-severidad" value={config._formSeveridad || 'media'} onChange={e=>setConfig({...config, _formSeveridad: e.target.value})} aria-label="Severidad">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
              <input placeholder="Ámbito (division/proceso)" className="input col-span-2" id="form-ambito" value={config._formAmbito || ''} onChange={e=>setConfig({...config, _formAmbito: e.target.value})} aria-label="Ámbito" />
            </div>
            <div className="mt-3 flex space-x-2">
              <button className="btn-primary" onClick={() => {
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
              <button className="btn-secondary" onClick={() => {
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
          <div className="flex items-center space-x-2 mb-3">
            <button className="btn-secondary" onClick={() => {
              const cfg = servicioAlertas.getConfig ? servicioAlertas.getConfig() : null;
              const results = servicioAlertas.simular(cfg, null, cfg?.ventanaDias);
              // normalize to include id
              const normalized = results.map((r, idx) => ({ id: `sim-${idx}-${r.indicador}-${r.timestamp}`, ...r }));
              setSimulacion(normalized);
            }}>Ejecutar simulador</button>
            <button className="btn-ghost" onClick={() => {
              setSimulacion([]);
            }}>Limpiar resultados</button>
            <button className="btn-primary" onClick={() => {
              // export CSV
              if (!simulacion || simulacion.length === 0) { alert('No hay resultados para exportar'); return; }
              const headers = ['timestamp','indicador','ambito','valor','umbral','exceso','pct','severidad','regla'];
              const csv = [headers.join(',')].concat(simulacion.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'simulacion_alertas.csv'; a.click();
              URL.revokeObjectURL(url);
            }}>Exportar CSV</button>
            <button className="btn-secondary" onClick={() => {
              if (!simulacion || simulacion.length === 0) { alert('No hay resultados para crear'); return; }
              const res = servicioAlertas.registrarAlertas(simulacion);
              if (res.success) {
                alert(`Se registraron ${res.added} alertas en el historial`);
                setHistFromService(servicioAlertas.listarHistorial());
              } else alert('Error registrando alertas');
            }}>Crear alertas demo</button>
          </div>

          {simulacion.length === 0 ? (
            <p className="text-sm text-gray-600">Presiona "Ejecutar simulador" para generar alertas a partir de los datos históricos y las reglas configuradas.</p>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left bg-gray-100">
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Indicador</th>
                      <th className="p-2">Ámbito</th>
                      <th className="p-2">Valor</th>
                      <th className="p-2">Umbral</th>
                      <th className="p-2">Exceso</th>
                      <th className="p-2">%</th>
                      <th className="p-2">Severidad</th>
                      <th className="p-2">Regla</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulacion.map(r => (
                      <tr key={r.id} className="border-b">
                        <td className="p-2 text-sm">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="p-2 text-sm">{r.indicador}</td>
                        <td className="p-2 text-sm">{r.ambito}</td>
                        <td className="p-2 text-sm">{r.valor}</td>
                        <td className="p-2 text-sm">{r.umbral}</td>
                        <td className="p-2 text-sm">{Number((r.exceso || 0).toFixed(2))}</td>
                        <td className="p-2 text-sm">{r.pct}%</td>
                        <td className="p-2 text-sm">{r.severidad}</td>
                        <td className="p-2 text-sm">{r.regla}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simple per-indicator sparkline using SVG */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(new Set(simulacion.map(s=>s.indicador))).map(ind => {
                  const rows = simulacion.filter(s=>s.indicador === ind).map(x=>x.valor);
                  const max = Math.max(...rows);
                  const min = Math.min(...rows);
                  const points = rows.map((v,i)=> `${(i/(rows.length-1))*100},${100 - ((v - min)/(max-min || 1))*100}`);
                  const path = points.join(' ');
                  return (
                    <div key={ind} className="p-3 border rounded bg-white">
                      <div className="font-semibold mb-2">{ind}</div>
                      <svg viewBox="0 0 100 100" className="w-full h-24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <polyline fill="none" stroke="#2563eb" strokeWidth="1.5" points={path} />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
