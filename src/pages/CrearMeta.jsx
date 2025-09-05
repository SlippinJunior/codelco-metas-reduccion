import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioMeta from '../components/FormularioMeta';

/**
 * Página CrearMeta
 * 
 * Página dedicada para crear nuevas metas de reducción.
 * Incluye navegación de regreso y manejo de éxito.
 */
const CrearMeta = () => {
  const navigate = useNavigate();
  const [metaCreada, setMetaCreada] = useState(null);

  /**
   * Maneja cuando se crea una meta exitosamente
   */
  const manejarMetaCreada = (nuevaMeta) => {
    setMetaCreada(nuevaMeta);
    
    // Redirigir al dashboard después de 3 segundos
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  /**
   * Maneja la cancelación del formulario
   */
  const manejarCancelar = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-codelco-light">
      {/* Header */}
      <header className="bg-codelco-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-blue-100 hover:text-white transition-colors mb-2"
                aria-label="Volver al dashboard"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </button>
              <h1 className="text-3xl font-bold">
                Crear Nueva Meta
              </h1>
              <p className="text-blue-100 mt-1">
                Define una nueva meta de reducción de emisiones
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Codelco</div>
              <div className="text-xs text-blue-300">Sistema de Gestión Ambiental</div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {metaCreada ? (
          // Mensaje de éxito
          <div className="max-w-2xl mx-auto">
            <div className="card text-center">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-codelco-dark mb-4">
                ¡Meta Creada Exitosamente!
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">
                  {metaCreada.nombre}
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>División:</strong> {metaCreada.division}</p>
                  <p><strong>Proceso:</strong> {metaCreada.proceso}</p>
                  <p><strong>Indicador:</strong> {metaCreada.indicador}</p>
                  <p><strong>Fecha Objetivo:</strong> {new Date(metaCreada.fechaObjetivo).toLocaleDateString('es-CL')}</p>
                </div>
              </div>
              <p className="text-codelco-secondary mb-6">
                La meta ha sido registrada y aparecerá en el panel principal. 
                Será redirigido automáticamente en unos segundos.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                >
                  Ir al Dashboard
                </button>
                <button
                  onClick={() => setMetaCreada(null)}
                  className="btn-secondary"
                >
                  Crear Otra Meta
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Formulario de creación
          <div>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-codelco-secondary">
                <li>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="hover:text-codelco-accent transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li className="text-codelco-dark font-medium">
                  Crear Meta
                </li>
              </ol>
            </nav>

            {/* Información de ayuda */}
            <div className="card mb-8 bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Información Importante
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Todos los campos marcados con (*) son obligatorios</li>
                    <li>• La fecha objetivo debe ser futura</li>
                    <li>• El valor de línea base será usado como referencia para calcular el progreso</li>
                    <li>• Una vez creada, la meta aparecerá inmediatamente en el panel principal</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <FormularioMeta
              onMetaCreada={manejarMetaCreada}
              onCancelar={manejarCancelar}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CrearMeta;
