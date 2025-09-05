import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TarjetaMeta from './TarjetaMeta';
import { listarMetas, filtrarMetas, exportarMetasCSV, obtenerEstadisticas, DIVISIONES } from '../services/servicioMetas';

/**
 * Componente PanelMetas
 * 
 * Panel principal que muestra todas las metas agrupadas por división,
 * estadísticas, filtros y opciones de exportación.
 * 
 * Props:
 * - actualizarContador: función para actualizar contador externo (opcional)
 */
const PanelMetas = ({ actualizarContador }) => {
  // Estado principal
  const [metas, setMetas] = useState([]);
  const [metasFiltradas, setMetasFiltradas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    division: '',
    año: ''
  });

  // Estado de vista
  const [vistaActual, setVistaActual] = useState('todas'); // 'todas', 'division'
  const [mensaje, setMensaje] = useState({ tipo: '', contenido: '' });

  // Colores para gráficos
  const COLORES_GRAFICOS = ['#1e3a8a', '#374151', '#ea580c', '#059669', '#7c3aed', '#dc2626'];

  /**
   * Carga las metas y estadísticas
   */
  const cargarDatos = async () => {
    setCargando(true);
    setError('');

    try {
      const [resultadoMetas, resultadoEstadisticas] = await Promise.all([
        listarMetas(),
        obtenerEstadisticas()
      ]);

      if (resultadoMetas.success) {
        setMetas(resultadoMetas.data);
        setMetasFiltradas(resultadoMetas.data);
        
        // Actualizar contador externo si existe
        if (actualizarContador) {
          actualizarContador(resultadoMetas.data.length);
        }
      } else {
        setError(resultadoMetas.message || 'Error al cargar las metas');
      }

      if (resultadoEstadisticas.success) {
        setEstadisticas(resultadoEstadisticas.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error inesperado al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Aplica filtros a las metas
   */
  const aplicarFiltros = async () => {
    try {
      const division = filtros.division || null;
      const año = filtros.año ? parseInt(filtros.año) : null;
      
      const resultado = await filtrarMetas(division, año);
      
      if (resultado.success) {
        setMetasFiltradas(resultado.data);
        setVistaActual(division ? 'division' : 'todas');
        
        // Mostrar mensaje informativo
        if (division || año) {
          setMensaje({
            tipo: 'info',
            contenido: `Mostrando ${resultado.data.length} meta(s) ${division ? `de ${division}` : ''} ${año ? `para ${año}` : ''}`
          });
        } else {
          setMensaje({ tipo: '', contenido: '' });
        }
      }
    } catch (error) {
      console.error('Error al filtrar:', error);
      setError('Error al aplicar filtros');
    }
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    setFiltros({ division: '', año: '' });
    setMetasFiltradas(metas);
    setVistaActual('todas');
    setMensaje({ tipo: '', contenido: '' });
  };

  /**
   * Maneja la exportación de CSV
   */
  const manejarExportacion = async () => {
    try {
      const resultado = await exportarMetasCSV(metasFiltradas);
      
      if (resultado.success) {
        setMensaje({
          tipo: 'success',
          contenido: resultado.message
        });
      } else {
        setMensaje({
          tipo: 'error',
          contenido: 'Error al exportar el archivo CSV'
        });
      }
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        setMensaje({ tipo: '', contenido: '' });
      }, 5000);
    } catch (error) {
      console.error('Error en exportación:', error);
      setMensaje({
        tipo: 'error',
        contenido: 'Error inesperado al exportar'
      });
    }
  };

  /**
   * Agrupa metas por división para la vista
   */
  const agruparPorDivision = (metasParaAgrupar) => {
    return metasParaAgrupar.reduce((grupos, meta) => {
      const division = meta.division;
      if (!grupos[division]) {
        grupos[division] = [];
      }
      grupos[division].push(meta);
      return grupos;
    }, {});
  };

  /**
   * Prepara datos para el gráfico de barras
   */
  const prepararDatosGraficoBarras = () => {
    if (!estadisticas) return [];
    
    return Object.entries(estadisticas.metasPorDivision).map(([division, cantidad]) => ({
      division: division.length > 15 ? division.substring(0, 15) + '...' : division,
      divisionCompleta: division,
      cantidad
    }));
  };

  /**
   * Prepara datos para el gráfico circular
   */
  const prepararDatosGraficoCircular = () => {
    if (!estadisticas) return [];
    
    return Object.entries(estadisticas.metasPorProceso).map(([proceso, cantidad]) => ({
      name: proceso.charAt(0).toUpperCase() + proceso.slice(1),
      value: cantidad,
      porcentaje: ((cantidad / estadisticas.totalMetas) * 100).toFixed(1)
    }));
  };

  // Efectos
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, metas]);

  // Obtener años únicos para el filtro
  const añosDisponibles = [...new Set(metas.map(meta => 
    new Date(meta.fechaObjetivo).getFullYear()
  ))].sort((a, b) => a - b);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-codelco-primary mx-auto mb-4"></div>
          <p className="text-codelco-secondary">Cargando metas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-codelco-dark mb-2">Error al cargar datos</h3>
        <p className="text-codelco-secondary mb-4">{error}</p>
        <button onClick={cargarDatos} className="btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  const metasAgrupadas = agruparPorDivision(metasFiltradas);
  const datosGraficoBarras = prepararDatosGraficoBarras();
  const datosGraficoCircular = prepararDatosGraficoCircular();

  return (
    <div className="space-y-8">
      {/* Encabezado con estadísticas */}
      <div className="card">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-codelco-dark mb-2">
              Panel de Metas de Reducción
            </h2>
            <p className="text-codelco-secondary">
              Gestión y seguimiento de metas de reducción de emisiones por división
            </p>
          </div>
          
          {estadisticas && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 lg:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-codelco-primary">{estadisticas.totalMetas}</div>
                <div className="text-xs text-codelco-secondary">Total Metas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estadisticas.metasActivas}</div>
                <div className="text-xs text-codelco-secondary">Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-codelco-accent">{estadisticas.progresoPromedio}%</div>
                <div className="text-xs text-codelco-secondary">Progreso Prom.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-codelco-secondary">{Object.keys(estadisticas.metasPorDivision).length}</div>
                <div className="text-xs text-codelco-secondary">Divisiones</div>
              </div>
            </div>
          )}
        </div>

        {/* Gráficos de estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Gráfico de barras - Metas por División */}
            <div>
              <h3 className="text-lg font-medium text-codelco-dark mb-4">Metas por División</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={datosGraficoBarras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="division" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Metas']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.divisionCompleta || label;
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico circular - Metas por Proceso */}
            <div>
              <h3 className="text-lg font-medium text-codelco-dark mb-4">Distribución por Proceso</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={datosGraficoCircular}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, porcentaje }) => `${name} (${porcentaje}%)`}
                  >
                    {datosGraficoCircular.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Metas']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Filtros y controles */}
      <div className="card">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="filtro-division" className="block text-sm font-medium text-codelco-dark mb-1">
                Filtrar por División
              </label>
              <select
                id="filtro-division"
                value={filtros.division}
                onChange={(e) => setFiltros(prev => ({ ...prev, division: e.target.value }))}
                className="form-input"
              >
                <option value="">Todas las divisiones</option>
                {DIVISIONES.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filtro-año" className="block text-sm font-medium text-codelco-dark mb-1">
                Filtrar por Año Objetivo
              </label>
              <select
                id="filtro-año"
                value={filtros.año}
                onChange={(e) => setFiltros(prev => ({ ...prev, año: e.target.value }))}
                className="form-input"
              >
                <option value="">Todos los años</option>
                {añosDisponibles.map(año => (
                  <option key={año} value={año}>
                    {año}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="btn-secondary text-sm"
                disabled={!filtros.division && !filtros.año}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Controles de exportación */}
          <div className="flex gap-2">
            <button
              onClick={manejarExportacion}
              className="btn-accent"
              disabled={metasFiltradas.length === 0}
              aria-label={`Exportar ${metasFiltradas.length} metas a CSV`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV ({metasFiltradas.length})
              </span>
            </button>
          </div>
        </div>

        {/* Mensaje de estado */}
        {mensaje.contenido && (
          <div 
            className={`mt-4 p-3 rounded-lg border text-sm ${
              mensaje.tipo === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : mensaje.tipo === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
            role="status"
            aria-live="polite"
          >
            {mensaje.contenido}
          </div>
        )}
      </div>

      {/* Lista de metas */}
      {metasFiltradas.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-codelco-secondary mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-codelco-dark mb-2">
            No hay metas que mostrar
          </h3>
          <p className="text-codelco-secondary">
            {filtros.division || filtros.año 
              ? 'No se encontraron metas con los filtros aplicados. Intente modificar los criterios de búsqueda.'
              : 'Aún no se han creado metas de reducción. Cree la primera meta para comenzar.'
            }
          </p>
          {(filtros.division || filtros.año) && (
            <button onClick={limpiarFiltros} className="btn-primary mt-4">
              Ver Todas las Metas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metas agrupadas por división */}
          {Object.entries(metasAgrupadas).map(([division, metasDivision]) => (
            <div key={division} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-codelco-dark flex items-center">
                  <span className="w-2 h-6 bg-codelco-accent rounded mr-3"></span>
                  {division}
                  <span className="ml-2 text-sm font-normal text-codelco-secondary">
                    ({metasDivision.length} meta{metasDivision.length !== 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {metasDivision.map(meta => (
                  <TarjetaMeta
                    key={meta.id}
                    meta={meta}
                    // onEditar y onEliminar se pueden agregar aquí para futuras funcionalidades
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanelMetas;
