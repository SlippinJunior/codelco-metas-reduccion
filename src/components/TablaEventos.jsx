import React, { useMemo, useState } from 'react';
import ModalDetalleEvento from './ModalDetalleEvento';

const actionStyles = {
  crear: 'bg-emerald-100 text-emerald-700',
  modificar: 'bg-blue-100 text-blue-700',
  eliminar: 'bg-rose-100 text-rose-700',
  ver: 'bg-gray-100 text-gray-700',
  exportar: 'bg-amber-100 text-amber-700',
  validar: 'bg-teal-100 text-teal-700',
  rechazar: 'bg-red-100 text-red-700'
};

function TablaEventos({ eventos = [], loading = false, page = 1, pageSize = 20, total = 0, onPageChange }) {
  const [selected, setSelected] = useState(null);
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
  const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const pageNumbers = useMemo(() => {
    const visible = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      visible.push(i);
    }
    return visible;
  }, [currentPage, totalPages]);

  const handleChange = (value) => {
    if (!onPageChange) return;
    onPageChange(value);
  };

  const renderRows = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, idx) => (
        <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
          <td className="p-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
          </td>
          <td className="p-3">
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </td>
          <td className="p-3">
            <div className="h-5 bg-gray-200 rounded w-20" />
          </td>
          <td className="p-3">
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </td>
          <td className="p-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
          </td>
          <td className="p-3">
            <div className="h-4 bg-gray-200 rounded w-12" />
          </td>
        </tr>
      ));
    }

    if (!eventos.length) {
      return (
        <tr>
          <td colSpan={6} className="p-6 text-center text-sm text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <span role="img" aria-hidden="true" className="text-2xl">🔍</span>
              <span>No se encontraron eventos con los filtros aplicados.</span>
            </div>
          </td>
        </tr>
      );
    }

    return eventos.map(ev => (
      <tr key={ev.id} className="border-t hover:bg-gray-50 transition-colors">
        <td className="p-3 align-top text-sm text-gray-700 whitespace-nowrap">{new Date(ev.fecha_hora).toLocaleString()}</td>
        <td className="p-3 align-top">
          <div className="font-medium text-codelco-dark">{ev.usuario}</div>
          <div className="text-xs text-gray-400">{ev.rol || 'N/A'}</div>
        </td>
        <td className="p-3 align-top">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${actionStyles[ev.accion] || 'bg-gray-100 text-gray-700'}`}>
            {ev.accion}
          </span>
        </td>
        <td className="p-3 align-top">
          <div className="font-medium text-gray-700">{ev.entidad}</div>
          <div className="text-xs text-gray-400">{ev.entidad_id || '—'}</div>
        </td>
        <td className="p-3 align-top text-sm text-gray-600">
          <p className="leading-snug">{ev.motivo || 'Sin motivo registrado'}</p>
          {ev.ip_origen && <p className="text-xs text-gray-400 mt-1">IP: {ev.ip_origen}</p>}
        </td>
        <td className="p-3 align-top">
          <button onClick={() => setSelected(ev)} className="btn-small text-codelco-accent border-codelco-accent/20 hover:bg-codelco-accent/10">
            Ver detalle
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="rounded-2xl shadow-md bg-white border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Motivo</th>
              <th className="text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-xs text-gray-500">
          {total > 0 ? `Mostrando ${startIndex} - ${endIndex} de ${total}` : 'Sin resultados'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => handleChange('first')} className="btn-small" disabled={currentPage === 1}>Primera</button>
          <button onClick={() => handleChange('prev')} className="btn-small" disabled={currentPage === 1}>Anterior</button>
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => handleChange(number)}
              className={`btn-small min-w-[2.5rem] ${number === currentPage ? 'bg-codelco-primary text-white border-codelco-primary' : ''}`}
              aria-current={number === currentPage ? 'page' : undefined}
            >
              {number}
            </button>
          ))}
          <button onClick={() => handleChange('next')} className="btn-small" disabled={currentPage === totalPages}>Siguiente</button>
          <button onClick={() => handleChange('last')} className="btn-small" disabled={currentPage === totalPages}>Última</button>
        </div>
      </div>

      {selected && <ModalDetalleEvento evento={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default TablaEventos;
