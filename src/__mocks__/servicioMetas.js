const DIVISIONES = [
  { id: 'el-teniente', nombre: 'El Teniente' },
  { id: 'radomiro-tomic', nombre: 'Radomiro Tomic' },
  { id: 'ministro-hales', nombre: 'Ministro Hales' }
];

const PROCESOS = [
  { id: 'molienda', nombre: 'Molienda' },
  { id: 'chancado', nombre: 'Chancado' },
  { id: 'fundicion', nombre: 'Fundición' }
];

const INDICADORES = [
  { id: 'tco2e-ton-cu', nombre: 'tCO₂e/ton Cu' },
  { id: 'kwh-ton-cu', nombre: 'kWh/ton Cu' }
];

const listarMetas = jest.fn();
const obtenerEstadisticas = jest.fn();
const filtrarMetas = jest.fn();
const exportarMetasCSV = jest.fn();
const crearMeta = jest.fn();

const validadores = {
  validarMeta: jest.fn().mockReturnValue({ esValido: true, errores: {} })
};

module.exports = {
  __esModule: true,
  DIVISIONES,
  PROCESOS,
  INDICADORES,
  listarMetas,
  obtenerEstadisticas,
  filtrarMetas,
  exportarMetasCSV,
  crearMeta,
  validadores,
  default: {
    DIVISIONES,
    PROCESOS,
    INDICADORES,
    listarMetas,
    obtenerEstadisticas,
    filtrarMetas,
    exportarMetasCSV,
    crearMeta,
    validadores
  }
};
