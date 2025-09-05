import React, { useState } from 'react';
import { DIVISIONES, PROCESOS, INDICADORES, crearMeta, validadores } from '../services/servicioMetas';

/**
 * Componente FormularioMeta
 * 
 * Formulario accesible para crear nuevas metas de reducción de emisiones.
 * Incluye validaciones front-end y manejo de errores.
 * 
 * Props:
 * - onMetaCreada: función callback llamada cuando se crea una meta exitosamente
 * - onCancelar: función callback para cancelar el formulario
 */
const FormularioMeta = ({ onMetaCreada, onCancelar }) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    division: '',
    proceso: '',
    indicador: 'tCO₂e/ton Cu', // Valor por defecto
    lineaBase: {
      año: new Date().getFullYear() - 1, // Año anterior por defecto
      valor: ''
    },
    fechaObjetivo: '',
    descripcion: ''
  });

  // Estado de errores y UI
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', contenido: '' });

  /**
   * Maneja cambios en los campos del formulario
   */
  const manejarCambio = (campo, valor) => {
    if (campo.includes('.')) {
      // Manejar campos anidados como lineaBase.año
      const [padre, hijo] = campo.split('.');
      setFormData(prev => ({
        ...prev,
        [padre]: {
          ...prev[padre],
          [hijo]: valor
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [campo]: valor
      }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  /**
   * Valida el formulario en tiempo real
   */
  const validarFormulario = () => {
    const resultado = validadores.validarMeta(formData);
    setErrores(resultado.errores);
    return resultado.esValido;
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      setMensaje({
        tipo: 'error',
        contenido: 'Por favor corrija los errores antes de continuar'
      });
      return;
    }

    setEnviando(true);
    setMensaje({ tipo: '', contenido: '' });

    try {
      const resultado = await crearMeta(formData);
      
      if (resultado.success) {
        setMensaje({
          tipo: 'success',
          contenido: 'Meta creada exitosamente'
        });
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          division: '',
          proceso: '',
          indicador: 'tCO₂e/ton Cu',
          lineaBase: {
            año: new Date().getFullYear() - 1,
            valor: ''
          },
          fechaObjetivo: '',
          descripcion: ''
        });
        
        // Notificar al componente padre
        if (onMetaCreada) {
          onMetaCreada(resultado.data);
        }
      } else {
        setMensaje({
          tipo: 'error',
          contenido: resultado.message || 'Error al crear la meta'
        });
      }
    } catch (error) {
      console.error('Error en envío:', error);
      setMensaje({
        tipo: 'error',
        contenido: 'Error inesperado al crear la meta'
      });
    } finally {
      setEnviando(false);
    }
  };

  /**
   * Resetea el formulario
   */
  const resetearFormulario = () => {
    setFormData({
      nombre: '',
      division: '',
      proceso: '',
      indicador: 'tCO₂e/ton Cu',
      lineaBase: {
        año: new Date().getFullYear() - 1,
        valor: ''
      },
      fechaObjetivo: '',
      descripcion: ''
    });
    setErrores({});
    setMensaje({ tipo: '', contenido: '' });
  };

  return (
    <div className="card max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-codelco-dark mb-2">
          Crear Nueva Meta de Reducción
        </h2>
        <p className="text-codelco-secondary text-sm">
          Complete los campos obligatorios para definir una nueva meta de reducción de emisiones.
          Todos los campos marcados con (*) son requeridos.
        </p>
      </div>

      {/* Mensaje de estado */}
      {mensaje.contenido && (
        <div 
          className={`mb-4 p-4 rounded-lg border ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          {mensaje.contenido}
        </div>
      )}

      <form onSubmit={manejarEnvio} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre de la meta */}
          <div className="md:col-span-2">
            <label htmlFor="nombre" className="form-label">
              Nombre de la Meta *
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => manejarCambio('nombre', e.target.value)}
              className={`form-input w-full ${errores.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Reducción de emisiones en molienda"
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
              aria-required="true"
            />
            {errores.nombre && (
              <div id="error-nombre" className="error-message" role="alert">
                {errores.nombre}
              </div>
            )}
          </div>

          {/* División */}
          <div>
            <label htmlFor="division" className="form-label">
              División *
            </label>
            <select
              id="division"
              value={formData.division}
              onChange={(e) => manejarCambio('division', e.target.value)}
              className={`form-input w-full ${errores.division ? 'border-red-500' : ''}`}
              aria-describedby={errores.division ? 'error-division' : undefined}
              aria-required="true"
            >
              <option value="">Seleccione una división</option>
              {DIVISIONES.map(division => (
                <option key={division.id} value={division.nombre}>
                  {division.nombre}
                </option>
              ))}
            </select>
            {errores.division && (
              <div id="error-division" className="error-message" role="alert">
                {errores.division}
              </div>
            )}
          </div>

          {/* Proceso */}
          <div>
            <label htmlFor="proceso" className="form-label">
              Proceso *
            </label>
            <select
              id="proceso"
              value={formData.proceso}
              onChange={(e) => manejarCambio('proceso', e.target.value)}
              className={`form-input w-full ${errores.proceso ? 'border-red-500' : ''}`}
              aria-describedby={errores.proceso ? 'error-proceso' : undefined}
              aria-required="true"
            >
              <option value="">Seleccione un proceso</option>
              {PROCESOS.map(proceso => (
                <option key={proceso.id} value={proceso.nombre.toLowerCase()}>
                  {proceso.nombre}
                </option>
              ))}
            </select>
            {errores.proceso && (
              <div id="error-proceso" className="error-message" role="alert">
                {errores.proceso}
              </div>
            )}
          </div>

          {/* Indicador */}
          <div>
            <label htmlFor="indicador" className="form-label">
              Indicador *
            </label>
            <select
              id="indicador"
              value={formData.indicador}
              onChange={(e) => manejarCambio('indicador', e.target.value)}
              className={`form-input w-full ${errores.indicador ? 'border-red-500' : ''}`}
              aria-describedby="help-indicador"
              aria-required="true"
            >
              {INDICADORES.map(indicador => (
                <option key={indicador.id} value={indicador.nombre}>
                  {indicador.nombre}
                </option>
              ))}
            </select>
            <div id="help-indicador" className="text-xs text-codelco-secondary mt-1">
              Unidad de medida para la meta de reducción
            </div>
            {errores.indicador && (
              <div className="error-message" role="alert">
                {errores.indicador}
              </div>
            )}
          </div>

          {/* Línea Base - Año */}
          <div>
            <label htmlFor="lineaBaseAño" className="form-label">
              Año Línea Base *
            </label>
            <input
              type="number"
              id="lineaBaseAño"
              value={formData.lineaBase.año}
              onChange={(e) => manejarCambio('lineaBase.año', parseInt(e.target.value))}
              className={`form-input w-full ${errores.lineaBaseAño ? 'border-red-500' : ''}`}
              min="2015"
              max={new Date().getFullYear()}
              aria-describedby={errores.lineaBaseAño ? 'error-linea-base-año' : 'help-linea-base-año'}
              aria-required="true"
            />
            <div id="help-linea-base-año" className="text-xs text-codelco-secondary mt-1">
              Año de referencia para la medición base
            </div>
            {errores.lineaBaseAño && (
              <div id="error-linea-base-año" className="error-message" role="alert">
                {errores.lineaBaseAño}
              </div>
            )}
          </div>

          {/* Línea Base - Valor */}
          <div>
            <label htmlFor="lineaBaseValor" className="form-label">
              Valor Línea Base *
            </label>
            <input
              type="number"
              id="lineaBaseValor"
              value={formData.lineaBase.valor}
              onChange={(e) => manejarCambio('lineaBase.valor', parseFloat(e.target.value))}
              className={`form-input w-full ${errores.lineaBaseValor ? 'border-red-500' : ''}`}
              step="0.01"
              min="0"
              placeholder="Ej: 2.8"
              aria-describedby={errores.lineaBaseValor ? 'error-linea-base-valor' : 'help-linea-base-valor'}
              aria-required="true"
            />
            <div id="help-linea-base-valor" className="text-xs text-codelco-secondary mt-1">
              Valor numérico de la línea base ({formData.indicador})
            </div>
            {errores.lineaBaseValor && (
              <div id="error-linea-base-valor" className="error-message" role="alert">
                {errores.lineaBaseValor}
              </div>
            )}
          </div>

          {/* Fecha Objetivo */}
          <div>
            <label htmlFor="fechaObjetivo" className="form-label">
              Fecha Objetivo *
            </label>
            <input
              type="date"
              id="fechaObjetivo"
              value={formData.fechaObjetivo}
              onChange={(e) => manejarCambio('fechaObjetivo', e.target.value)}
              className={`form-input w-full ${errores.fechaObjetivo ? 'border-red-500' : ''}`}
              min={new Date().toISOString().split('T')[0]}
              aria-describedby={errores.fechaObjetivo ? 'error-fecha-objetivo' : 'help-fecha-objetivo'}
              aria-required="true"
            />
            <div id="help-fecha-objetivo" className="text-xs text-codelco-secondary mt-1">
              Fecha límite para alcanzar la meta
            </div>
            {errores.fechaObjetivo && (
              <div id="error-fecha-objetivo" className="error-message" role="alert">
                {errores.fechaObjetivo}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label htmlFor="descripcion" className="form-label">
              Descripción (Opcional)
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => manejarCambio('descripcion', e.target.value)}
              className="form-input w-full"
              rows="3"
              placeholder="Descripción detallada de la meta, metodología a aplicar, etc."
              aria-describedby="help-descripcion"
            />
            <div id="help-descripcion" className="text-xs text-codelco-secondary mt-1">
              Información adicional sobre la meta (opcional)
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancelar || resetearFormulario}
            className="btn-secondary order-2 sm:order-1"
            disabled={enviando}
          >
            {onCancelar ? 'Cancelar' : 'Limpiar'}
          </button>
          <button
            type="submit"
            className="btn-primary order-1 sm:order-2"
            disabled={enviando}
            aria-describedby={enviando ? 'estado-envio' : undefined}
          >
            {enviando ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Creando Meta...
              </>
            ) : (
              'Crear Meta'
            )}
          </button>
          {enviando && (
            <div id="estado-envio" className="sr-only" aria-live="polite">
              Enviando formulario, por favor espere
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormularioMeta;
