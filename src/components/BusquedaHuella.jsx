import React, { useState } from 'react';

function BusquedaHuella({ onBuscar, onVerDetalle }) {
  const [registroId, setRegistroId] = useState('');
  const [estado, setEstado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const id = registroId.trim();
    if (!id) {
      setEstado({ tipo: 'error', mensaje: 'Ingresa un identificador para consultar la cadena.' });
      return;
    }
    setBuscando(true);
    setEstado(null);

    try {
      const resultado = await onBuscar?.(id);
      if (!resultado) {
        setEstado({ tipo: 'info', mensaje: `No se encontró ningún bloque para el registro ${id}.` });
      } else {
        setEstado({ tipo: 'success', mensaje: 'Bloque encontrado.', bloque: resultado });
      }
    } catch (error) {
  console.error('Error buscando huella en el prototipo:', error);
      setEstado({ tipo: 'error', mensaje: 'No fue posible consultar la cadena en este momento.' });
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-codelco-dark">Consulta por identificador</h2>
        <p className="text-sm text-codelco-secondary">
          Busca un bloque existente utilizando el identificador original del registro confirmado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <label htmlFor="busqueda-registro" className="text-sm font-medium text-codelco-dark">
          Identificador de registro
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="busqueda-registro"
            type="text"
            className="form-input flex-1"
            placeholder="Ej: META-ABC-001"
            value={registroId}
            onChange={(e) => setRegistroId(e.target.value)}
          />
          <button type="submit" className="btn-secondary" disabled={buscando}>
            {buscando ? 'Buscando...' : 'Consultar cadena'}
          </button>
        </div>
      </form>

      <div className="mt-5">
        <p className="text-xs text-codelco-secondary">
          Esta interfaz simula un endpoint interno (GET /cadena/registro/:id) para evidenciar trazabilidad.
        </p>
      </div>

      {estado && (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            estado.tipo === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : estado.tipo === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
          role="status"
          aria-live="polite"
        >
          <p>{estado.mensaje}</p>

          {estado.tipo === 'success' && estado.bloque && (
            <div className="mt-4 bg-white rounded-lg border border-green-200 px-4 py-3 text-sm">
              <p className="font-semibold text-codelco-dark">
                Bloque #{estado.bloque.index} · Registro {estado.bloque.registro_id}
              </p>
              <p className="mt-2 font-mono text-xs break-all">
                Huella: {estado.bloque.huella}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="text-xs text-codelco-secondary">
                  Usuario: <strong>{estado.bloque.usuario}</strong>
                </span>
                <span className="text-xs text-codelco-secondary">
                  Fecha: {new Date(estado.bloque.fecha_hora).toLocaleString('es-CL')}
                </span>
                <button
                  type="button"
                  onClick={() => onVerDetalle?.(estado.bloque)}
                  className="btn-accent text-xs"
                >
                  Abrir detalle
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BusquedaHuella;
