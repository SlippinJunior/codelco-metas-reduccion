import React from 'react';
import Selector from './Selector';

const estados = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' }
];

const PanelFiltrosAnomalias = ({
  filtros,
  onCambiar,
  onLimpiar,
  opciones = {},
  resumen
}) => {
  const handleChange = (campo) => (event) => {
    const valor = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onCambiar?.({ ...filtros, [campo]: valor });
  };

  const sensores = [{ value: '', label: 'Todos los sensores' }, ...(opciones.sensores || [])];
  const divisiones = [{ value: '', label: 'Todas las divisiones' }, ...(opciones.divisiones || [])];
  const tipos = [{ value: '', label: 'Todos los tipos' }, ...(opciones.tipos || [])];

  return (
    <section className="card space-y-4" aria-labelledby="filtros-anomalias-titulo">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 id="filtros-anomalias-titulo" className="text-lg font-semibold text-codelco-dark">
            Filtros y resumen de anomalías
          </h2>
          <p className="text-sm text-codelco-secondary">
            Ajusta los filtros para priorizar las lecturas más críticas. La detección es demostrativa.
          </p>
        </div>
        <button
          type="button"
          onClick={onLimpiar}
          className="btn-secondary text-sm"
        >
          Limpiar filtros
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Selector
          label="Sensor"
          value={filtros.sensorId}
          onChange={handleChange('sensorId')}
          options={sensores}
          selectClassName="text-sm"
        />
        <Selector
          label="División"
          value={filtros.division}
          onChange={handleChange('division')}
          options={divisiones}
          selectClassName="text-sm"
        />
        <Selector
          label="Tipo de lectura"
          value={filtros.tipo}
          onChange={handleChange('tipo')}
          options={tipos}
          selectClassName="text-sm"
        />
        <Selector
          label="Estado de validación"
          value={filtros.estado}
          onChange={handleChange('estado')}
          options={estados}
          selectClassName="text-sm"
        />
        <div className="flex flex-col space-y-1">
          <label htmlFor="filtro-fecha-inicio" className="text-sm font-medium text-codelco-dark">
            Desde (fecha)
          </label>
          <input
            id="filtro-fecha-inicio"
            type="date"
            value={filtros.fechaInicio || ''}
            onChange={handleChange('fechaInicio')}
            className="form-input"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="filtro-fecha-fin" className="text-sm font-medium text-codelco-dark">
            Hasta (fecha)
          </label>
          <input
            id="filtro-fecha-fin"
            type="date"
            value={filtros.fechaFin || ''}
            onChange={handleChange('fechaFin')}
            className="form-input"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            className="mr-2 accent-codelco-accent"
            checked={!!filtros.soloAnomalias}
            onChange={handleChange('soloAnomalias')}
          />
          Mostrar solo lecturas marcadas como anómalas
        </label>
      </div>

      {resumen && (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <dt className="text-xs uppercase tracking-wide text-blue-800">Total lecturas</dt>
            <dd className="text-xl font-semibold text-blue-900">{resumen.total}</dd>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <dt className="text-xs uppercase tracking-wide text-yellow-800">Pendientes</dt>
            <dd className="text-xl font-semibold text-yellow-900">{resumen.pendientes}</dd>
          </div>
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
            <dt className="text-xs uppercase tracking-wide text-green-800">Aprobadas</dt>
            <dd className="text-xl font-semibold text-green-900">{resumen.aprobadas}</dd>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <dt className="text-xs uppercase tracking-wide text-red-800">Rechazadas</dt>
            <dd className="text-xl font-semibold text-red-900">{resumen.rechazadas}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

export default PanelFiltrosAnomalias;