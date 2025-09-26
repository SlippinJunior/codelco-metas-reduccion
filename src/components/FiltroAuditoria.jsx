import React, { useEffect, useMemo, useState } from 'react';
import { format, subDays, subMonths, subWeeks } from 'date-fns';

const formatDateInput = (value) => (value ? format(new Date(value), 'yyyy-MM-dd') : '');
const buildISO = (value, end = false) => (value ? `${value}T${end ? '23:59:59' : '00:00:00'}` : undefined);

function FiltroAuditoria({ onChange, initial = {}, loading = false }) {
  const [usuario, setUsuario] = useState(initial.usuario || '');
  const [entidad, setEntidad] = useState(initial.entidad || '');
  const [accion, setAccion] = useState(initial.accion || '');
  const [q, setQ] = useState(initial.q || '');
  const [inicio, setInicio] = useState(() => initial.inicio ? formatDateInput(initial.inicio) : '');
  const [fin, setFin] = useState(() => initial.fin ? formatDateInput(initial.fin) : '');
  const [pageSize, setPageSize] = useState(initial.pageSize || 20);
  const [selectedPreset, setSelectedPreset] = useState(null);

  useEffect(() => {
    setUsuario(initial.usuario || '');
    setEntidad(initial.entidad || '');
    setAccion(initial.accion || '');
    setQ(initial.q || '');
    setInicio(initial.inicio ? formatDateInput(initial.inicio) : '');
    setFin(initial.fin ? formatDateInput(initial.fin) : '');
    setPageSize(initial.pageSize || 20);
  }, [initial]);

  const presets = useMemo(() => ([
    {
      id: '24h',
      label: 'Últimas 24h',
      handler: () => {
        const today = new Date();
        return {
          inicio: format(subDays(today, 1), 'yyyy-MM-dd'),
          fin: format(today, 'yyyy-MM-dd')
        };
      }
    },
    {
      id: '7d',
      label: '7 días',
      handler: () => {
        const today = new Date();
        return {
          inicio: format(subWeeks(today, 1), 'yyyy-MM-dd'),
          fin: format(today, 'yyyy-MM-dd')
        };
      }
    },
    {
      id: '30d',
      label: '30 días',
      handler: () => {
        const today = new Date();
        return {
          inicio: format(subMonths(today, 1), 'yyyy-MM-dd'),
          fin: format(today, 'yyyy-MM-dd')
        };
      }
    }
  ]), []);

  const handleSubmit = (e) => {
    e && e.preventDefault();
    onChange({
      usuario: usuario || undefined,
      entidad: entidad || undefined,
      accion: accion || undefined,
      q: q || undefined,
      inicio: buildISO(inicio),
      fin: buildISO(fin, true),
      page: 1,
      pageSize: Number(pageSize) || 20
    });
  };

  const handleReset = () => {
    setUsuario('');
    setEntidad('');
    setAccion('');
    setQ('');
    setInicio('');
    setFin('');
    setSelectedPreset(null);
    setPageSize(20);
    onChange({ page: 1, pageSize: 20 });
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    const range = preset.handler();
    setInicio(range.inicio);
    setFin(range.fin);
    onChange({
      usuario: usuario || undefined,
      entidad: entidad || undefined,
      accion: accion || undefined,
      q: q || undefined,
      inicio: buildISO(range.inicio),
      fin: buildISO(range.fin, true),
      page: 1,
      pageSize: Number(pageSize) || 20
    });
  };

  return (
    <form onSubmit={handleSubmit} className="audit-filter space-y-4" aria-labelledby="audit-filter-title">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 id="audit-filter-title" className="text-lg font-semibold text-codelco-dark">Filtros avanzados</h2>
          <p className="text-xs text-gray-500">Combina filtros por usuario, entidad, rango de fechas y texto libre para refinar tu búsqueda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-small" onClick={handleReset} disabled={loading}>Limpiar</button>
          <button type="submit" className="btn-secondary" disabled={loading}>Aplicar filtros</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className={`btn-small ${selectedPreset === preset.id ? 'bg-codelco-primary text-white border-codelco-primary' : ''}`}
            disabled={loading}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="form-label" htmlFor="filtro-usuario">Usuario</label>
          <input id="filtro-usuario" value={usuario} onChange={e=>setUsuario(e.target.value)} className="input" placeholder="Ej: jcortes" disabled={loading} />
        </div>
        <div>
          <label className="form-label" htmlFor="filtro-entidad">Entidad</label>
          <input id="filtro-entidad" value={entidad} onChange={e=>setEntidad(e.target.value)} className="input" placeholder="metas | sensores | auditoria" disabled={loading} />
        </div>
        <div>
          <label className="form-label" htmlFor="filtro-accion">Acción</label>
          <select id="filtro-accion" value={accion} onChange={e=>setAccion(e.target.value)} className="input" disabled={loading}>
            <option value="">(todas)</option>
            <option value="crear">crear</option>
            <option value="modificar">modificar</option>
            <option value="eliminar">eliminar</option>
            <option value="ver">ver</option>
            <option value="exportar">exportar</option>
            <option value="validar">validar</option>
            <option value="rechazar">rechazar</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="filtro-texto">Buscar</label>
          <input id="filtro-texto" value={q} onChange={e=>setQ(e.target.value)} className="input" placeholder="motivo, entidad, id, detalle..." disabled={loading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="form-label" htmlFor="filtro-inicio">Desde</label>
          <input id="filtro-inicio" type="date" value={inicio} onChange={e => { setInicio(e.target.value); setSelectedPreset(null); }} className="input" disabled={loading} />
        </div>
        <div>
          <label className="form-label" htmlFor="filtro-fin">Hasta</label>
          <input id="filtro-fin" type="date" value={fin} onChange={e => { setFin(e.target.value); setSelectedPreset(null); }} className="input" disabled={loading} />
        </div>
        <div>
          <label className="form-label" htmlFor="filtro-pagesize">Resultados por página</label>
          <select id="filtro-pagesize" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="input" disabled={loading}>
            {[10, 20, 30, 50].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}

export default FiltroAuditoria;
