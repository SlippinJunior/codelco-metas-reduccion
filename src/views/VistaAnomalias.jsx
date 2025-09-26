import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PanelFiltrosAnomalias from '../components/PanelFiltrosAnomalias';
import ListaLecturas from '../components/ListaLecturas';
import ModalValidacion from '../components/ModalValidacion';
import ReglasAnomaliasEditor from '../components/ReglasAnomaliasEditor';
import servicioAnomalias, {
  obtenerResumen as obtenerResumenServicio,
  obtenerReglas as obtenerReglasServicio
} from '../services/servicioAnomalias';

const estadoInicialFiltros = {
  sensorId: '',
  division: '',
  tipo: '',
  estado: 'pendiente',
  fechaInicio: '',
  fechaFin: '',
  soloAnomalias: true
};

const VistaAnomalias = () => {
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [orden, setOrden] = useState({ columna: 'timestamp', direccion: 'desc' });
  const [lecturas, setLecturas] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [lecturaActiva, setLecturaActiva] = useState(null);
  const [historialLectura, setHistorialLectura] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [mensajeErrorModal, setMensajeErrorModal] = useState(null);
  const [comentarioLote, setComentarioLote] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [resumen, setResumen] = useState(() => obtenerResumenServicio());
  const [reglas, setReglas] = useState(() => obtenerReglasServicio());

  const cargarLecturas = useCallback((opciones = {}) => {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const resultado = servicioAnomalias.listarLecturas(
        filtros,
        {
          pagina: opciones.pagina ?? paginacion.pagina,
          orden: opciones.orden ?? orden,
          tamanioPagina: opciones.tamanioPagina
        }
      );

      if (resultado.success) {
        setLecturas(resultado.data);
        setPaginacion({
          pagina: resultado.pagina,
          totalPaginas: resultado.totalPaginas,
          total: resultado.total
        });
        if (resultado.orden) {
          setOrden(resultado.orden);
        }
        setResumen(obtenerResumenServicio());
        setReglas(obtenerReglasServicio());
      } else {
        setErrorGeneral(resultado.message || 'No fue posible obtener las lecturas.');
      }
    } catch (error) {
      setErrorGeneral(error.message || 'Ocurrió un error inesperado al listar lecturas.');
    } finally {
      setCargando(false);
    }
  }, [filtros, orden, paginacion.pagina]);

  useEffect(() => {
    cargarLecturas({ pagina: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  useEffect(() => {
    setSeleccionadas(prev => prev.filter(id => lecturas.some(lectura => lectura.id === id)));
  }, [lecturas]);

  useEffect(() => {
    const subscripcion = servicioAnomalias.suscribirseActualizaciones(() => {
      cargarLecturas();
    });
    return () => subscripcion.unsubscribe();
  }, [cargarLecturas]);

  const opcionesFiltros = useMemo(() => {
    const sensoresUnicos = new Map();
    const divisiones = new Set();
    const tipos = new Set();

    lecturas.forEach(lectura => {
      sensoresUnicos.set(lectura.sensorId, { value: lectura.sensorId, label: lectura.sensorId });
      if (lectura.division) divisiones.add(lectura.division);
      if (lectura.tipo) tipos.add(lectura.tipo);
    });

    return {
      sensores: Array.from(sensoresUnicos.values()),
      divisiones: Array.from(divisiones).map(valor => ({ value: valor, label: valor })),
      tipos: Array.from(tipos).map(valor => ({ value: valor, label: valor }))
    };
  }, [lecturas]);

  const manejarCambioFiltros = (nuevosFiltros) => {
    setSeleccionadas([]);
    setFiltros(nuevosFiltros);
  };

  const manejarLimpiarFiltros = () => {
    setFiltros(estadoInicialFiltros);
  };

  const manejarOrden = (nuevoOrden) => {
    setOrden(nuevoOrden);
    cargarLecturas({ orden: nuevoOrden });
  };

  const manejarCambioPagina = (pagina) => {
    setPaginacion(prev => ({ ...prev, pagina }));
    cargarLecturas({ pagina });
  };

  const manejarSeleccion = (id, seleccionado) => {
    setSeleccionadas(prev => seleccionado ? [...prev, id] : prev.filter(item => item !== id));
  };

  const manejarSeleccionTodos = (seleccionarTodos) => {
    if (seleccionarTodos) {
      setSeleccionadas(lecturas.map(lectura => lectura.id));
    } else {
      setSeleccionadas([]);
    }
  };

  const abrirModal = (lectura) => {
    setLecturaActiva(lectura);
    setModalAbierto(true);
    setMensajeErrorModal(null);
    try {
      const historial = servicioAnomalias.obtenerHistorialCercano(lectura.id, 10);
      setHistorialLectura(historial);
    } catch (error) {
      setHistorialLectura([]);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setLecturaActiva(null);
    setHistorialLectura([]);
    setMensajeErrorModal(null);
  };

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 4000);
  };

  const manejarAprobacion = async (comentario) => {
    if (!lecturaActiva) return;
    setProcesandoAccion(true);
    try {
      const resultado = await servicioAnomalias.aprobarLectura(lecturaActiva.id, 'tecnico_demo', comentario);
      if (resultado.success) {
        mostrarMensaje('Lectura aprobada y re-incorporada a los cálculos.');
        cargarLecturas();
        cerrarModal();
        setSeleccionadas(prev => prev.filter(id => id !== lecturaActiva.id));
      } else {
        setMensajeErrorModal(resultado.message || 'No se pudo aprobar la lectura.');
      }
    } catch (error) {
      setMensajeErrorModal(error.message || 'Ocurrió un error al aprobar.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const manejarRechazo = async (comentario) => {
    if (!lecturaActiva) return;
    setProcesandoAccion(true);
    try {
      const resultado = await servicioAnomalias.rechazarLectura(lecturaActiva.id, 'tecnico_demo', comentario);
      if (resultado.success) {
        mostrarMensaje('Lectura rechazada. Se excluye de los cálculos demostrativos.');
        cargarLecturas();
        cerrarModal();
        setSeleccionadas(prev => prev.filter(id => id !== lecturaActiva.id));
      } else {
        setMensajeErrorModal(resultado.message || 'No se pudo rechazar la lectura.');
      }
    } catch (error) {
      setMensajeErrorModal(error.message || 'Ocurrió un error al rechazar.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const manejarValidacionLote = async (estado) => {
    if (seleccionadas.length === 0) return;
    if (estado === 'rechazada' && (!comentarioLote || !comentarioLote.trim())) {
      mostrarMensaje('Agrega un comentario para rechazar en lote.', 'error');
      return;
    }

    setProcesandoAccion(true);
    try {
      const resultado = await servicioAnomalias.validarLecturasEnLote(
        seleccionadas,
        estado,
        'tecnico_demo',
        comentarioLote
      );
      if (resultado.success) {
        mostrarMensaje(`Se actualizaron ${resultado.totalActualizadas} lecturas.`);
        setSeleccionadas([]);
        setComentarioLote('');
        cargarLecturas();
      } else {
        mostrarMensaje(resultado.message || 'No se pudo completar la validación en lote.', 'error');
      }
    } catch (error) {
      mostrarMensaje(error.message || 'Error inesperado en la validación en lote.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const manejarDescarga = () => {
    try {
      servicioAnomalias.exportarLecturasCSV(filtros);
      mostrarMensaje('Descargando CSV con lecturas filtradas.');
    } catch (error) {
      mostrarMensaje(error.message || 'No se pudo exportar el CSV.', 'error');
    }
  };

  const manejarGuardarReglas = (nuevasReglas) => {
    servicioAnomalias.actualizarReglasParciales(nuevasReglas);
    setReglas(obtenerReglasServicio());
    cargarLecturas();
    mostrarMensaje('Reglas actualizadas para la sesión demo.');
  };

  const manejarResetReglas = () => {
    servicioAnomalias.resetReglas();
    setReglas(obtenerReglasServicio());
    cargarLecturas();
    mostrarMensaje('Reglas restauradas a los valores de fábrica.');
  };

  return (
    <main className="min-h-screen bg-codelco-light py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-codelco-dark">Detección de datos anómalos (demo)</h1>
          <p className="mt-2 text-sm text-codelco-secondary max-w-3xl">
            Este módulo evidencia cómo un equipo técnico podría detectar, validar y documentar lecturas sospechosas en terreno. Los datos y reglas se ejecutan en el navegador con fines ilustrativos.
          </p>
        </header>

        {mensaje && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              mensaje.tipo === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}
            role="status"
          >
            {mensaje.texto}
          </div>
        )}

        {errorGeneral && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {errorGeneral}
          </div>
        )}

        <PanelFiltrosAnomalias
          filtros={filtros}
          onCambiar={manejarCambioFiltros}
          onLimpiar={manejarLimpiarFiltros}
          opciones={opcionesFiltros}
          resumen={resumen}
        />

        <div className="card space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-codelco-dark">Acciones con lecturas seleccionadas</h2>
              <p className="text-xs text-codelco-secondary">Puedes aprobar o rechazar múltiples lecturas. Este flujo registra eventos de auditoría simulados.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => manejarValidacionLote('aprobada')}
                className="px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                disabled={seleccionadas.length === 0 || procesandoAccion}
              >
                Aprobar lote ({seleccionadas.length})
              </button>
              <button
                type="button"
                onClick={() => manejarValidacionLote('rechazada')}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                disabled={seleccionadas.length === 0 || procesandoAccion}
              >
                Rechazar lote
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              rows={2}
              value={comentarioLote}
              onChange={(event) => setComentarioLote(event.target.value)}
              className="form-input flex-1"
              placeholder="Comentario para validación en lote (obligatorio al rechazar)"
            />
            <button
              type="button"
              onClick={manejarDescarga}
              className="px-3 py-2 rounded-md border border-codelco-accent text-codelco-accent text-sm font-medium hover:bg-codelco-accent/10 transition"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        <ListaLecturas
          lecturas={lecturas}
          seleccionadas={seleccionadas}
          onToggleSeleccion={manejarSeleccion}
          onToggleSeleccionTodos={manejarSeleccionTodos}
          onVerDetalle={abrirModal}
          onOrdenar={manejarOrden}
          orden={orden}
          pagina={paginacion.pagina}
          totalPaginas={paginacion.totalPaginas}
          total={paginacion.total}
          onCambiarPagina={manejarCambioPagina}
          cargando={cargando}
        />

        <ReglasAnomaliasEditor
          reglas={reglas}
          onGuardar={manejarGuardarReglas}
          onReset={manejarResetReglas}
        />
      </div>

      <ModalValidacion
        abierto={modalAbierto}
        lectura={lecturaActiva}
        historial={historialLectura}
        onCerrar={cerrarModal}
        onAprobar={manejarAprobacion}
        onRechazar={manejarRechazo}
        procesando={procesandoAccion}
        error={mensajeErrorModal}
      />
    </main>
  );
};

export default VistaAnomalias;