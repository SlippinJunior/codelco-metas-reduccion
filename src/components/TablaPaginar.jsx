import React, { useMemo, useState } from 'react';

const TablaPaginar = ({
  columns = [],
  data = [],
  pageSizeOptions = [5, 10, 20],
  defaultPageSize = 5,
  emptyMessage = 'No hay registros para mostrar.',
  ariaLabel,
  className
}) => {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((data.length || 0) / pageSize));

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const handleChangePage = (nextPage) => {
    const bounded = Math.min(Math.max(1, nextPage), totalPages);
    setPage(bounded);
  };

  const handleChangePageSize = (event) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div className={['bg-white border border-gray-200 rounded-lg shadow-sm', className].filter(Boolean).join(' ')}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" aria-label={ariaLabel}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key || column.header}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  {columns.map(column => (
                    <td key={column.key || column.header} className="px-4 py-3 text-sm text-gray-700 align-top">
                      {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 gap-3 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={handleChangePageSize}
            className="form-input h-8 py-0 px-2"
            aria-label="Seleccionar cantidad de filas por página"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleChangePage(page - 1)}
              className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
              disabled={page <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => handleChangePage(page + 1)}
              className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaPaginar;
