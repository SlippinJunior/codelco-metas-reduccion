import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import servicioAuditoria from '../services/servicioAuditoria';
import FiltroAuditoria from '../components/FiltroAuditoria';
import TablaEventos from '../components/TablaEventos';

function VistaAuditoria() {
  const nav = useNavigate();
  const [filtros, setFiltros] = useState({ page: 1, pageSize: 20 });
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // simple role-based access: expects localStorage.currentUser = JSON.stringify({ usuario, rol })
    const cu = localStorage.getItem('currentUser');
    if (!cu) { nav('/'); return; }
    const { rol } = JSON.parse(cu);
    if (!['control-interno','auditor'].includes(rol)) { nav('/'); }
  }, [nav]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    servicioAuditoria.listarEventos(filtros).then(r => {
      if (!active) return;
      setResult({ data: r.data, total: r.total });
      setLoading(false);
    }).catch(()=>setLoading(false));
    return () => { active = false; };
  }, [filtros]);

  const onExport = async () => {
    await servicioAuditoria.exportarEventosCSV(filtros);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Panel de Auditoría</h1>
      <FiltroAuditoria onChange={setFiltros} initial={filtros} />
      <div className="mt-4 mb-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {result.total}</div>
        <div>
          <button onClick={onExport} className="btn-primary">Exportar CSV</button>
        </div>
      </div>
      <TablaEventos eventos={result.data} loading={loading} onPage={(p) => setFiltros(s => ({ ...s, page: p }))} />
    </div>
  );
}

export default VistaAuditoria;
