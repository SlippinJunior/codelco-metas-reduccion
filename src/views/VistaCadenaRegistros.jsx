import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormularioRegistrarHash from '../components/FormularioRegistrarHash';
import ListaBloques from '../components/ListaBloques';
import DetalleBloque from '../components/DetalleBloque';
import BusquedaHuella from '../components/BusquedaHuella';
import {
  crearBloque,
  listarBloques,
  obtenerBloquePorRegistro,
  exportarCadenaCSV,
  exportarCadenaPDF,
  descargarBloqueJSON,
  generarPruebaFirmaSimulada,
  inicializarCadenaDemo
} from '../services/servicioCadena';

function VistaCadenaRegistros() {
  const [bloques, setBloques] = useState([]);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [resumen, setResumen] = useState(null);

  const cargarBloques = async () => {
    setCargando(true);
    setError('');
    try {
      const resultado = await listarBloques();
      setBloques(resultado);
    } catch (err) {
  console.error('Error al listar cadena:', err);
      setError('No fue posible cargar la cadena simulada.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    inicializarCadenaDemo().then(cargarBloques);
  }, []);

  useEffect(() => {
    if (!bloques.length) {
      setResumen(null);
      return;
    }
    const ultimo = bloques[bloques.length - 1];
    const huellaGlobal = bloques.map(b => b.huella).join('');
    setResumen({
      total: bloques.length,
      ultimo,
      huellaGlobal
    });
  }, [bloques]);

  const manejarCreacion = async (datos) => {
    setCreando(true);
    try {
      const bloque = await crearBloque(datos);
      setBloques(prev => [...prev, bloque]);
      await descargarBloqueJSON(bloque);
      return {
        success: true,
        message: 'Bloque creado y descargado como JSON. Huella mostrada en el panel de confirmación.'
      };
    } catch (err) {
      console.error('Error al crear bloque demo:', err);
  return { success: false, message: 'No fue posible generar el bloque.' };
    } finally {
      setCreando(false);
    }
  };

  const manejarBusqueda = async (registroId) => {
    const bloque = await obtenerBloquePorRegistro(registroId);
    return bloque || null;
  };

  const manejarExportacion = async () => {
    setExportando(true);
    try {
      await exportarCadenaCSV();
      await exportarCadenaPDF(bloques);
      await generarPruebaFirmaSimulada(bloques);
    } catch (err) {
  console.error('Error en exportación de cadena:', err);
    } finally {
      setExportando(false);
    }
  };

  const vistaResumen = useMemo(() => {
    if (!resumen) return null;
    return (
      <section className="card border border-codelco-primary/40 bg-gradient-to-r from-white via-white to-blue-50/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-codelco-primary/10 text-codelco-primary px-3 py-1 rounded-full text-xs font-semibold">
              Módulo informativo · No vinculante
            </div>
            <h1 className="text-3xl font-semibold text-codelco-dark">Cadena de registros validados</h1>
            <p className="text-sm text-codelco-secondary max-w-2xl">
              Esta vista simula cómo cada registro validado genera un bloque con huellas criptográficas enlazadas. El objetivo es mostrar trazabilidad y protección de integridad para auditorías.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm">
              <p className="text-xs text-codelco-secondary uppercase">Bloques en cadena</p>
              <p className="text-2xl font-semibold text-codelco-dark">{resumen.total}</p>
              <p className="text-xs text-codelco-secondary mt-1">Incluye bloque génesis inicial</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm">
              <p className="text-xs text-codelco-secondary uppercase">Último registro</p>
              <p className="text-sm font-semibold text-codelco-dark">{resumen.ultimo?.registro_id}</p>
              <p className="text-xs text-codelco-secondary mt-1">Huella global truncada</p>
              <p className="text-xs font-mono text-codelco-secondary break-all mt-1">
                {resumen.huellaGlobal.slice(0, 24)}…{resumen.huellaGlobal.slice(-24)}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }, [resumen]);

  return (
    <div className="min-h-screen bg-codelco-light/40 pb-16">
      <div className="container mx-auto px-4 py-10 space-y-8">
        {vistaResumen}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {cargando ? (
              <div className="card text-center py-16">
                <div className="animate-spin h-12 w-12 border-4 border-codelco-primary/30 border-t-codelco-primary rounded-full mx-auto"></div>
                <p className="mt-4 text-sm text-codelco-secondary">Cargando cadena simulada...</p>
              </div>
            ) : error ? (
              <div className="card border border-red-200 bg-red-50 text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={cargarBloques}
                  className="btn-secondary mt-4"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <ListaBloques bloques={bloques} onVerDetalle={setBloqueSeleccionado} />
            )}
          </div>

          <div className="space-y-6">
            <FormularioRegistrarHash onSubmit={manejarCreacion} isSubmitting={creando} />
            <BusquedaHuella onBuscar={manejarBusqueda} onVerDetalle={setBloqueSeleccionado} />

            <div className="card">
              <h2 className="text-lg font-semibold text-codelco-dark">Exportaciones</h2>
              <p className="text-sm text-codelco-secondary mt-2">
                Genera evidencias en CSV, PDF y un archivo con la huella global concatenada simulando una firma.
              </p>
              <button
                type="button"
                onClick={manejarExportacion}
                className="btn-accent mt-4"
                disabled={exportando || !bloques.length}
              >
                {exportando ? 'Generando evidencias...' : 'Exportar cadena y evidencia'}
              </button>
              <p className="text-xs text-codelco-secondary mt-3">
                Los archivos se generan en la carpeta de descargas del navegador con prefijos del prototipo.
              </p>
            </div>

            <div className="card border border-codelco-primary/30 bg-blue-50/60">
              <h2 className="text-lg font-semibold text-codelco-dark">Verificar integridad</h2>
              <p className="text-sm text-codelco-secondary mt-2">
                Dirígete a la vista <strong>Verificación</strong> para recalcular huellas, comparar contenidos y generar informes de evidencia.
              </p>
              <Link
                to="/verificacion"
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                Ir a la verificación
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {bloqueSeleccionado && (
        <DetalleBloque bloque={bloqueSeleccionado} onClose={() => setBloqueSeleccionado(null)} />
      )}
    </div>
  );
}

export default VistaCadenaRegistros;
