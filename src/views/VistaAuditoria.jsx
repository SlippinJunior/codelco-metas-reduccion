import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import servicioAuditoria from '../services/servicioAuditoria';
import FiltroAuditoria from '../components/FiltroAuditoria';
import TablaEventos from '../components/TablaEventos';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function VistaAuditoria() {
  const nav = useNavigate();
  const [filtros, setFiltros] = useState(() => {
    try {
      const stored = localStorage.getItem('auditoria:lastFilters');
      if (!stored) return { page: 1, pageSize: 20 };
      const parsed = JSON.parse(stored);
      return { page: 1, pageSize: parsed.pageSize || 20, ...parsed };
    } catch (error) {
      return { page: 1, pageSize: 20 };
    }
  });
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

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
    setError(null);
    servicioAuditoria.listarEventos(filtros).then(r => {
      if (!active) return;
      setResult({ data: r.data, total: r.total });
      setLoading(false);
      setLastUpdated(new Date());
      try {
        const { page, ...rest } = filtros;
        localStorage.setItem('auditoria:lastFilters', JSON.stringify(rest));
      } catch (error) {
        // ignorar problemas de almacenamiento
      }
    }).catch(() => {
      if (!active) return;
      setLoading(false);
      setError('No pudimos cargar los eventos. Intenta nuevamente.');
    });
    return () => { active = false; };
  }, [filtros]);

  const onExport = async () => {
    await servicioAuditoria.exportarEventosCSV(filtros);
  };

  const handleFilters = (next) => {
    setFiltros(prev => {
      const computedPageSize = Number(next?.pageSize ?? prev.pageSize ?? 20);
      return {
        ...prev,
        ...next,
        pageSize: Number.isFinite(computedPageSize) ? computedPageSize : prev.pageSize,
        page: next?.page ?? 1
      };
    });
  };

  const handlePageChange = (direction) => {
    setFiltros(prev => {
      const totalPages = Math.max(1, Math.ceil(result.total / (prev.pageSize || 20)));
      let target = prev.page || 1;

      if (typeof direction === 'number') {
        target = direction;
      } else {
        switch (direction) {
          case 'first':
            target = 1;
            break;
          case 'prev':
            target = Math.max(1, target - 1);
            break;
          case 'next':
            target = Math.min(totalPages, target + 1);
            break;
          case 'last':
            target = totalPages;
            break;
          default:
            break;
        }
      }

      target = Math.max(1, Math.min(totalPages, target));
      if (target === prev.page) return prev;
      return { ...prev, page: target };
    });
  };

  const insights = useMemo(() => {
    if (!result.data.length) {
      return {
        accionesDestacadas: '- -',
        usuariosUnicos: 0,
        ultimoEvento: null,
        entidadPopular: '- -'
      };
    }

    const acciones = result.data.reduce((acc, ev) => {
      acc[ev.accion] = (acc[ev.accion] || 0) + 1;
      return acc;
    }, {});
    const entidades = result.data.reduce((acc, ev) => {
      acc[ev.entidad] = (acc[ev.entidad] || 0) + 1;
      return acc;
    }, {});
    const accionesDestacadas = Object.entries(acciones)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} (${v})`)
      .slice(0, 2)
      .join(', ');
    const entidadPopular = Object.entries(entidades)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 1)[0];

    return {
      accionesDestacadas: accionesDestacadas || 'Sin datos',
      usuariosUnicos: new Set(result.data.map(ev => ev.usuario)).size,
      ultimoEvento: result.data[0]?.fecha_hora || null,
      entidadPopular: entidadPopular || 'Sin datos'
    };
  }, [result.data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-codelco-light via-white to-white py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="card bg-gradient-to-r from-codelco-primary/10 via-white to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-codelco-primary">Panel de Auditoría</h1>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">
                Monitorea las acciones críticas registradas en el sistema. Utiliza los filtros avanzados para identificar rápidamente actividades relevantes y profundiza en el detalle de cada evento.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-codelco-primary/30 px-5 py-4 shadow-sm text-sm text-gray-600">
              <div className="font-semibold text-codelco-primary">Resumen actual</div>
              <div className="mt-2 space-y-1">
                <div>Total filtrado: <span className="font-medium text-codelco-dark">{result.total}</span></div>
                {lastUpdated && (
                  <div>Actualizado hace {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}</div>
                )}
                {insights.ultimoEvento && (
                  <div>Último evento registrado: <span className="font-medium">{new Date(insights.ultimoEvento).toLocaleString()}</span></div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card border-l-4 border-codelco-primary">
            <h2 className="text-sm font-semibold text-gray-500">Acciones destacadas</h2>
            <p className="mt-2 text-lg font-medium text-codelco-dark">{insights.accionesDestacadas}</p>
            <p className="text-xs text-gray-500 mt-1">Top 2 acciones dentro de los resultados actuales.</p>
          </article>
          <article className="card border-l-4 border-codelco-secondary">
            <h2 className="text-sm font-semibold text-gray-500">Usuarios involucrados</h2>
            <p className="mt-2 text-lg font-medium text-codelco-dark">{insights.usuariosUnicos}</p>
            <p className="text-xs text-gray-500 mt-1">Usuarios únicos en los registros visibles.</p>
          </article>
          <article className="card border-l-4 border-codelco-accent">
            <h2 className="text-sm font-semibold text-gray-500">Entidad con más actividad</h2>
            <p className="mt-2 text-lg font-medium text-codelco-dark">{insights.entidadPopular}</p>
            <p className="text-xs text-gray-500 mt-1">Entidad que concentra más eventos en la vista actual.</p>
          </article>
        </section>

        <section className="space-y-4">
          <FiltroAuditoria onChange={handleFilters} initial={filtros} loading={loading} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-500">
              Mostrando {result.total > 0 ? `${(filtros.page - 1) * filtros.pageSize + 1} - ${Math.min(filtros.page * filtros.pageSize, result.total)}` : '0'} de {result.total} eventos.
            </div>
            <div className="flex items-center gap-3">
              {error && <span className="text-sm text-red-600">{error}</span>}
              <button onClick={onExport} className="btn-primary flex items-center gap-2">
                <span role="img" aria-hidden="true">⬇️</span>
                Exportar CSV
              </button>
            </div>
          </div>

          <TablaEventos
            eventos={result.data}
            loading={loading}
            page={filtros.page}
            pageSize={filtros.pageSize}
            total={result.total}
            onPageChange={handlePageChange}
          />
        </section>
      </div>
    </div>
  );
}

export default VistaAuditoria;
