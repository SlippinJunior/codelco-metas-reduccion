import React, { useState } from 'react';
import PanelMetas from '../components/PanelMetas';

/**
 * Página Dashboard
 * 
 * Página principal del sistema que muestra el panel de metas
 * con estadísticas y vista general corporativa.
 */
const Dashboard = () => {
  const [totalMetas, setTotalMetas] = useState(0);

  return (
    <div className="min-h-screen bg-codelco-light">
      {/* Header */}
      <header className="bg-codelco-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Sistema de Metas de Reducción
              </h1>
              <p className="text-blue-100">
                Corporación Nacional del Cobre - Codelco
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="bg-blue-800 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{totalMetas}</div>
                <div className="text-sm text-blue-200">Metas Activas</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        <PanelMetas actualizarContador={setTotalMetas} />
      </main>

      {/* Footer */}
      <footer className="bg-codelco-secondary text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Codelco</h3>
              <p className="text-gray-300 text-sm">
                Corporación Nacional del Cobre de Chile
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Comprometidos con la sustentabilidad y la reducción de emisiones
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Portal Corporativo
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Reporte de Sustentabilidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Gestión Ambiental
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Sistema</h3>
              <p className="text-gray-300 text-sm">
                Prototipo v1.0 - Gestión de Metas de Reducción
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Desarrollado para demostrar capacidades de seguimiento de emisiones
              </p>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Codelco. Todos los derechos reservados. 
              Sistema de gestión ambiental - Prototipo de desarrollo.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
