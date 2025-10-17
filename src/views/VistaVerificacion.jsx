import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BuscadorRegistroVerificacion from '../components/BuscadorRegistroVerificacion';
import ResultadoVerificacion from '../components/ResultadoVerificacion';
import DetalleDivergencia from '../components/DetalleDivergencia';
import HistorialVerificacion from '../components/HistorialVerificacion';
import {
  configurarDelaySimulado,
  obtenerCasosDemostrativos,
  obtenerRegistrosDisponibles,
  verificarRegistroPorId,
  simularManipulacion,
  generarInformeVerificacion
} from '../services/servicioVerificacion';
import { inicializarCadenaDemo } from '../services/servicioCadena';

function VistaVerificacion() {
  const [registros, setRegistros] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarDivergencias, setMostrarDivergencias] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [modalHuella, setModalHuella] = useState(null);
  const [retardoSimulado, setRetardoSimulado] = useState(false);
  const [advertirLentitud, setAdvertirLentitud] = useState(false);
  const [jsonManual, setJsonManual] = useState('');
  const [errorManual, setErrorManual] = useState('');
  const [contenidoManual, setContenidoManual] = useState(null);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [mensajeManipulacion, setMensajeManipulacion] = useState('');

  const casos = useMemo(() => obtenerCasosDemostrativos(), []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        await inicializarCadenaDemo();
        const disponibles = await obtenerRegistrosDisponibles();
        if (activo) {
          setRegistros(disponibles);
          setRegistroSeleccionado((prev) => prev || (disponibles[0]?.registro_id ?? null));
        }
      } catch (err) {
        if (activo) {
          setError('No fue posible cargar los registros de la cadena.');
        }
      }
    };
    cargar();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    configurarDelaySimulado(retardoSimulado ? 1200 : 0);
  }, [retardoSimulado]);

  const manejarVerificacion = async (registroId, opciones = {}) => {
    if (!registroId) {
      setError('Selecciona un registro para verificar.');
      return;
    }
    setVerificando(true);
    setError('');
    setMostrarDivergencias(false);
    setAdvertirLentitud(false);
    setMensajeManipulacion(opciones?.motivo || '');

    try {
      const payload = { ...opciones };
      if (payload.contenidoActual == null && opciones.usarManual && contenidoManual) {
        payload.contenidoActual = contenidoManual;
      }
      const resultadoVerificacion = await verificarRegistroPorId(registroId, payload);
      setResultado(resultadoVerificacion);
      setRegistroSeleccionado(registroId);
      setAdvertirLentitud(resultadoVerificacion.tiempo_ms > 1000);
      setHistorial((prev) => {
        const next = [
          ...prev,
          {
            registroId,
            valido: resultadoVerificacion.valido,
            tiempo_ms: resultadoVerificacion.tiempo_ms,
            divergencias: resultadoVerificacion.divergencias,
            contenidoActual: resultadoVerificacion.detalle_contenido?.actual,
            timestamp: Date.now(),
            resumen: resultadoVerificacion.valido
              ? 'Verificación exitosa sin cambios.'
              : `${resultadoVerificacion.divergencias.length} divergencia(s) detectadas.`
          }
        ];
        return next.slice(-8);
      });
    } catch (err) {
  console.error('Verificación fallida:', err);
      setError(err.message || 'No fue posible completar la verificación.');
    } finally {
      setVerificando(false);
    }
  };

  const manejarSimulacion = async () => {
    if (!registroSeleccionado) {
      setError('Selecciona un registro antes de simular manipulación.');
      return;
    }
    try {
      const simulacion = await simularManipulacion(registroSeleccionado);
      if (!simulacion) {
        setMensajeManipulacion('Este registro no tiene ejemplo de manipulación configurado.');
        await manejarVerificacion(registroSeleccionado);
        return;
      }
      setMensajeManipulacion(simulacion.descripcion);
      await manejarVerificacion(registroSeleccionado, {
        contenidoActual: simulacion.contenido,
        motivo: simulacion.descripcion
      });
      setMostrarDivergencias(true);
    } catch (err) {
      setError('No fue posible simular la manipulación para este registro.');
    }
  };

  const manejarCargaArchivo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setContenidoManual(parsed);
        setJsonManual(JSON.stringify(parsed, null, 2));
        setErrorManual('');
      } catch (err) {
        setErrorManual('El archivo no contiene JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const aplicarJSONManual = () => {
    if (!jsonManual.trim()) {
      setContenidoManual(null);
      setErrorManual('');
      return;
    }
    try {
      const parsed = JSON.parse(jsonManual);
      setContenidoManual(parsed);
      setErrorManual('');
    } catch (err) {
      setErrorManual('El JSON proporcionado no es válido.');
    }
  };

  const manejarDescarga = async (formato) => {
    if (!resultado) {
      setError('Debes ejecutar una verificación antes de descargar el informe.');
      return;
    }
    try {
      await generarInformeVerificacion(resultado, formato);
    } catch (err) {
      setError('No fue posible generar el informe.');
    }
  };

  const manejarReintentoHistorial = async (item) => {
    await manejarVerificacion(item.registroId, {
      contenidoActual: item.contenidoActual,
      motivo: item.divergencias?.length ? 'Reverificación manual' : undefined
    });
    setMostrarDivergencias(!item.valido);
  };

  const resumenSeleccionado = useMemo(() => {
    if (!registroSeleccionado) return null;
    const registro = registros.find((item) => item.registro_id === registroSeleccionado);
    const caso = casos.find((item) => item.registro_id === registroSeleccionado);
    if (!registro && !caso) return null;
    return {
      descripcion: caso?.descripcion || registro?.descripcion,
      usuario: registro?.usuario,
      tipo: registro?.tipo_entidad,
      fecha: registro?.fecha_hora,
  manipulacion: casos.find((item) => item.registro_id === registroSeleccionado)?.manipulacion_demo?.descripcion || 'Sin manipulación sugerida.'
    };
  }, [casos, registroSeleccionado, registros]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-codelco-light via-white to-white py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <section className="card border border-codelco-primary/30 bg-gradient-to-r from-white via-white to-blue-50/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold bg-codelco-primary/10 text-codelco-primary px-3 py-1 rounded-full">
                Prototipo académico · Integridad de registros
              </span>
              <h1 className="text-3xl font-semibold text-codelco-dark">Verificación criptográfica de registros</h1>
              <p className="text-sm text-codelco-secondary max-w-2xl">
                Recalcula la huella SHA-256 de los bloques de la cadena y compara los resultados para mostrar si el registro se mantiene íntegro. Puedes simular manipulaciones y medir el tiempo empleado en la verificación.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-codelco-secondary">
                <Link to="/cadena-registros" className="text-codelco-primary hover:underline">
                  ← Volver a la cadena de registros
                </Link>
                <span className="hidden sm:inline" aria-hidden="true">·</span>
                <Link to="/auditoria" className="text-codelco-primary hover:underline">
                  Ir al panel de auditoría
                </Link>
              </div>
            </div>
            {resumenSeleccionado && (
              <div className="bg-white border border-codelco-primary/20 rounded-xl p-5 shadow-sm text-sm space-y-2">
                <h2 className="text-sm font-semibold text-codelco-dark">Registro enfocado</h2>
                <p className="text-sm text-codelco-secondary">{resumenSeleccionado.descripcion}</p>
                <div className="text-xs text-codelco-secondary space-y-1">
                  <div>Tipo: <span className="font-medium text-codelco-dark">{resumenSeleccionado.tipo}</span></div>
                  <div>Usuario: <span className="font-medium text-codelco-dark">{resumenSeleccionado.usuario}</span></div>
                  <div>Fecha: {resumenSeleccionado.fecha ? new Date(resumenSeleccionado.fecha).toLocaleString('es-CL') : 'No disponible'}</div>
                  <div className="text-xs text-codelco-secondary/80">Manipulación sugerida: {resumenSeleccionado.manipulacion}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <BuscadorRegistroVerificacion
              registros={registros}
              casos={casos}
              onVerificar={(registroId) => manejarVerificacion(registroId)}
              onSeleccionar={setRegistroSeleccionado}
              cargando={verificando && !resultado}
            />

            <div className="card space-y-4 border border-codelco-primary/40" aria-label="Herramientas de verificación">
              <header>
                <h2 className="text-lg font-semibold text-codelco-dark flex items-center gap-2">
                  <span role="img" aria-hidden="true">🛠️</span>
                  Herramientas para la verificación
                </h2>
                <p className="text-sm text-codelco-secondary">
                  Carga un JSON externo o simula una manipulación para observar cómo cambia el resultado de la verificación.
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <label htmlFor="json-manual" className="text-sm font-medium text-codelco-dark">
                    Pegar JSON para verificación externa
                  </label>
                  <textarea
                    id="json-manual"
                    className="form-textarea h-36"
                    placeholder={'{\n  "campo": "valor"\n}'}
                    value={jsonManual}
                    onChange={(event) => setJsonManual(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn-secondary" onClick={aplicarJSONManual}>
                      Usar JSON pegado
                    </button>
                    <label className="btn-accent cursor-pointer">
                      Cargar archivo JSON
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={manejarCargaArchivo}
                      />
                    </label>
                    {contenidoManual && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        JSON válido listo para usar
                      </span>
                    )}
                  </div>
                  {errorManual && <p className="text-xs text-red-600">{errorManual}</p>}
                </div>

                <div className="space-y-3">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-codelco-dark">Opciones de simulación</legend>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-codelco-dark">Simular manipulación</p>
                        <p className="text-xs text-codelco-secondary">
                          Genera cambios controlados en el registro seleccionado para mostrar divergencias.
                        </p>
                      </div>
                      <button type="button" className="btn-accent" onClick={manejarSimulacion}>
                        Simular manipulación
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-codelco-dark">Forzar retardo simulado</p>
                        <p className="text-xs text-codelco-secondary">
                          Añade ~1.2 s de demora para mostrar la advertencia de tiempo excedido.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-codelco-dark">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={retardoSimulado}
                          onChange={(event) => setRetardoSimulado(event.target.checked)}
                        />
                        Activar
                      </label>
                    </div>
                  </fieldset>

                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={() => manejarVerificacion(registroSeleccionado, { usarManual: true })}
                    disabled={!registroSeleccionado}
                  >
                    Verificar registro con JSON manual
                  </button>
                  {mensajeManipulacion && (
                    <p className="text-xs text-codelco-secondary/80">
                      {mensajeManipulacion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ResultadoVerificacion
              resultado={resultado}
              enProgreso={verificando}
              onVerHuellaCompleta={(origen, valor) => setModalHuella({ origen, valor })}
              onVerDivergencias={() => setMostrarDivergencias(true)}
              onDescargarInforme={manejarDescarga}
              advertirLentitud={advertirLentitud}
            />

            <HistorialVerificacion registros={historial} onReintentar={manejarReintentoHistorial} />
          </div>
        </section>

        {mostrarDivergencias && resultado?.divergencias?.length > 0 && (
          <DetalleDivergencia
            divergencias={resultado.divergencias}
            descripcionManipulacion={resultado.metadata?.manipulacion_descripcion || mensajeManipulacion}
            onClose={() => setMostrarDivergencias(false)}
          />
        )}

        {!mostrarDivergencias && resultado && !resultado.divergencias?.length && (
          <section className="card border border-green-200 bg-green-50/60 text-sm text-green-900">
            <h3 className="text-lg font-semibold text-green-800">No se detectaron divergencias</h3>
            <p className="mt-2">
              El contenido actual coincide con el almacenado. La huella criptográfica permanece intacta.
            </p>
          </section>
        )}
      </div>

      {modalHuella && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 border border-codelco-primary/20">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-codelco-dark">Huella {modalHuella.origen}</h3>
                <p className="text-sm text-codelco-secondary">
                  Copia la huella completa para incluirla en un informe externo o compararla con otros sistemas.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-codelco-primary hover:text-codelco-dark"
                onClick={() => setModalHuella(null)}
                aria-label="Cerrar modal de huella"
              >
                Cerrar ✕
              </button>
            </header>
            <textarea
              className="form-textarea w-full h-40 font-mono text-sm"
              readOnly
              value={modalHuella.valor}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigator.clipboard?.writeText(modalHuella.valor)}
              >
                Copiar al portapapeles
              </button>
              <button type="button" className="btn-primary" onClick={() => setModalHuella(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VistaVerificacion;
