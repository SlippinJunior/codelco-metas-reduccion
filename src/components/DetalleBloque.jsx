import React, { useEffect, useMemo, useState } from 'react';
import { recalcularHuellaBloque } from '../services/servicioCadena';

function intentarPrettyJSON(texto = '') {
  if (!texto) return '';
  try {
    const parsed = typeof texto === 'string' ? JSON.parse(texto) : texto;
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    return texto;
  }
}

function DetalleBloque({ bloque, onClose }) {
  const [contenidoEditable, setContenidoEditable] = useState('');
  const [resultado, setResultado] = useState(null);
  const [verHuellaCompleta, setVerHuellaCompleta] = useState(false);
  const [verHuellaPadreCompleta, setVerHuellaPadreCompleta] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const contenidoInicial = useMemo(() => intentarPrettyJSON(bloque?.contenido), [bloque]);

  useEffect(() => {
    setContenidoEditable(contenidoInicial);
    setResultado(null);
    setVerHuellaCompleta(false);
    setVerHuellaPadreCompleta(false);
  }, [bloque, contenidoInicial]);

  if (!bloque) return null;

  const handleCerrar = () => {
    setResultado(null);
    onClose?.();
  };

  const handleVerificar = async () => {
    setVerificando(true);
    setResultado(null);
    try {
      const huellaCalculada = await recalcularHuellaBloque(bloque, contenidoEditable);
      if (huellaCalculada === bloque.huella) {
        setResultado({ estado: 'valido', calculada: huellaCalculada });
      } else {
        setResultado({ estado: 'manipulado', calculada: huellaCalculada });
      }
    } catch (error) {
      console.error('Error en verificación demo:', error);
      setResultado({ estado: 'error', mensaje: 'No fue posible recalcular la huella.' });
    } finally {
      setVerificando(false);
    }
  };

  const restaurarContenido = () => {
    setContenidoEditable(contenidoInicial);
    setResultado(null);
  };

  const huellaAlmacenada = bloque.huella || '';
  const huellaPadre = bloque.huella_padre || '';

  const huellaVisible = !huellaAlmacenada
    ? '—'
    : verHuellaCompleta
      ? huellaAlmacenada
      : `${huellaAlmacenada.slice(0, 24)}…${huellaAlmacenada.slice(-12)}`;

  const huellaPadreVisible = !huellaPadre
    ? 'Bloque génesis'
    : verHuellaPadreCompleta
      ? huellaPadre
      : `${huellaPadre.slice(0, 24)}…${huellaPadre.slice(-12)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 py-10 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl">
        <header className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-codelco-secondary">Detalle del bloque #{bloque.index}</p>
            <h2 className="text-2xl font-semibold text-codelco-dark">Registro {bloque.registro_id}</h2>
            <p className="text-sm text-codelco-secondary mt-1">
              Confirmado por <span className="font-semibold text-codelco-dark">{bloque.usuario}</span> · {new Date(bloque.fecha_hora).toLocaleString('es-CL')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCerrar}
            className="text-codelco-dark/60 hover:text-codelco-dark focus:outline-none focus:ring-2 focus:ring-codelco-primary rounded-full"
            aria-label="Cerrar detalle del bloque"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <main className="px-6 py-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs uppercase text-codelco-secondary font-semibold">Huella almacenada</h3>
              <div className="mt-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 break-all">
                {huellaVisible}
              </div>
              <button
                type="button"
                onClick={() => setVerHuellaCompleta(prev => !prev)}
                className="text-xs text-codelco-primary hover:underline mt-1"
              >
                {verHuellaCompleta ? 'Ocultar huella completa' : 'Ver huella completa'}
              </button>
            </div>
            <div>
              <h3 className="text-xs uppercase text-codelco-secondary font-semibold">Huella padre</h3>
              <div className={`mt-2 font-mono text-sm border rounded-lg px-4 py-3 break-all ${
                bloque.huella_padre ? 'bg-slate-50 border-slate-200 text-codelco-dark' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {huellaPadreVisible}
              </div>
              {bloque.huella_padre && (
                <button
                  type="button"
                  onClick={() => setVerHuellaPadreCompleta(prev => !prev)}
                  className="text-xs text-codelco-primary hover:underline mt-1"
                >
                  {verHuellaPadreCompleta ? 'Ocultar huella padre completa' : 'Ver huella padre completa'}
                </button>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-codelco-dark">Contenido autenticado</h3>
              <span className="text-xs text-codelco-secondary">Puedes modificar temporalmente el contenido para simular una alteración.</span>
            </div>
            <textarea
              value={contenidoEditable}
              onChange={(e) => setContenidoEditable(e.target.value)}
              className="form-textarea mt-3 min-h-[220px] font-mono text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleVerificar}
                className="btn-primary"
                disabled={verificando}
              >
                {verificando ? 'Verificando...' : 'Verificar integridad'}
              </button>
              <button
                type="button"
                onClick={restaurarContenido}
                className="btn-secondary"
              >
                Restaurar contenido original
              </button>
            </div>

            {resultado && resultado.estado !== 'error' && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg border text-sm flex items-start gap-3 ${
                  resultado.estado === 'valido'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
                role="status"
                aria-live="polite"
              >
                <svg
                  className={`w-5 h-5 mt-0.5 ${resultado.estado === 'valido' ? 'text-green-600' : 'text-red-600'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {resultado.estado === 'valido' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="9" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </>
                  )}
                </svg>
                <div>
                  <p className="font-semibold">
                    {resultado.estado === 'valido'
                      ? 'Integridad verificada. La huella coincide con el bloque almacenado.'
                      : 'Integridad comprometida. La huella recalculada no coincide con la almacenada.'}
                  </p>
                  <p className="font-mono text-xs mt-2">Huella recalculada: {resultado.calculada}</p>
                </div>
              </div>
            )}

            {resultado && resultado.estado === 'error' && (
              <div className="mt-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm" role="alert">
                {resultado.mensaje}
              </div>
            )}
          </section>
        </main>

        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 items-center justify-between rounded-b-2xl">
          <p className="text-xs text-codelco-secondary">
            Este módulo es demostrativo. No ejecuta transacciones reales en blockchain.
          </p>
          <button
            type="button"
            onClick={handleCerrar}
            className="btn-secondary"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DetalleBloque;
