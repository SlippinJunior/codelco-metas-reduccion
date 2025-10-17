import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CrearMeta from './pages/CrearMeta';
import VistaProgreso from './views/VistaProgreso';
import VistaAuditoria from './views/VistaAuditoria';
import VistaSensores from './views/VistaSensores';
import VistaAnomalias from './views/VistaAnomalias';
import Alertas from './pages/Alertas';
import VistaCadenaRegistros from './views/VistaCadenaRegistros';
import VistaVerificacion from './views/VistaVerificacion';
import Login from './pages/Login';
import Header from './components/Header';
import ExportarReportes from './components/ExportarReportes';

/**
 * Componente principal de la aplicación
 * 
 * Configura el enrutamiento y la estructura base de la aplicación.
 * Incluye rutas para dashboard y creación de metas.
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        {/* Navegación global (opcional, para futuras extensiones) */}
        <div className="sr-only">
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
        </div>

        {/* Contenido principal */}
        <div id="main-content">
          <Routes>
            {/* Ruta por defecto redirige a dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard principal - CA-R01-3: vista corporativa y filtrada */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            {/* Vista de progreso: Real vs Meta */}
            <Route path="/progreso" element={<VistaProgreso />} />
            {/* Panel de Auditoría - acceso simulado por rol */}
            <Route path="/auditoria" element={<VistaAuditoria />} />

            {/* Módulo demostrativo de cadena de registros con blockchain */}
            <Route path="/cadena-registros" element={<VistaCadenaRegistros />} />

            {/* Verificación de integridad demostrativa */}
            <Route path="/verificacion" element={<VistaVerificacion />} />

            {/* Módulo demostrativo de sensores */}
            <Route path="/sensores" element={<VistaSensores />} />

            {/* Módulo demostrativo de anomalías */}
            <Route path="/anomalias" element={<VistaAnomalias />} />
            {/* Administración de alertas (visible por rol) */}
            <Route path="/alertas" element={<Alertas />} />

            {/* Exportar reportes comparativos */}
            <Route path="/exportar-reportes" element={<ExportarReportes />} />
            
            {/* Crear meta - CA-R01-1 y CA-R01-2: formulario con validaciones */}
            <Route path="/crear-meta" element={<CrearMeta />} />
            
            {/* Ruta fallback para URLs no encontradas */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-codelco-light flex items-center justify-center">
                  <div className="card max-w-md text-center">
                    <div className="text-codelco-secondary mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-codelco-dark mb-2">
                      Página No Encontrada
                    </h2>
                    <p className="text-codelco-secondary mb-4">
                      La página que buscas no existe o ha sido movida.
                    </p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="btn-primary"
                    >
                      Ir al Dashboard
                    </button>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>

        {/* Barra de accesibilidad flotante (opcional) */}
        <div className="fixed bottom-4 right-4 z-50">
          <details className="relative">
            <summary className="bg-codelco-accent text-white p-3 rounded-full cursor-pointer shadow-lg hover:bg-orange-700 transition-colors focus:ring-2 focus:ring-codelco-primary focus:ring-offset-2">
              <span className="sr-only">Opciones de accesibilidad</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </summary>
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48">
              <h3 className="font-semibold text-codelco-dark mb-2 text-sm">Accesibilidad</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => document.body.style.fontSize = '110%'}
                    className="text-left w-full text-codelco-secondary hover:text-codelco-dark transition-colors"
                  >
                    Aumentar texto
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.body.style.fontSize = '100%'}
                    className="text-left w-full text-codelco-secondary hover:text-codelco-dark transition-colors"
                  >
                    Texto normal
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const links = document.querySelectorAll('a, button');
                      links.forEach(link => link.style.textDecoration = 'underline');
                    }}
                    className="text-left w-full text-codelco-secondary hover:text-codelco-dark transition-colors"
                  >
                    Subrayar enlaces
                  </button>
                </li>
              </ul>
            </div>
          </details>
        </div>

        {/* Botón flotante para crear meta (acceso rápido) */}
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => window.location.href = '/crear-meta'}
            className="bg-codelco-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-200 focus:ring-2 focus:ring-codelco-accent focus:ring-offset-2 group"
            aria-label="Crear nueva meta de reducción"
            title="Crear Nueva Meta"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="absolute left-full ml-3 bg-codelco-dark text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Crear Meta
            </span>
          </button>
        </div>
      </div>
    </Router>
  );
}

export default App;
