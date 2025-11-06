/**
 * servicioComunidades.js
 * Fuente de datos sanitizada para el Portal Ciudadano.
 * No expone información operacional crítica: solo resúmenes de avance.
 */

const REGIONES = [
  { id: 'norte', nombre: 'Zona Norte (Antofagasta - Tarapacá)' },
  { id: 'centro', nombre: 'Zona Centro (Valparaíso - Metropolitana)' },
  { id: 'sur', nombre: 'Zona Sur (O’Higgins - Biobío)' }
];

const PERIODOS = [
  { id: '2024-t2', etiqueta: 'Abr-Jun 2024' },
  { id: '2024-t1', etiqueta: 'Ene-Mar 2024' },
  { id: '2023-t4', etiqueta: 'Oct-Dic 2023' }
];

const AVANCES = [
  {
    id: 'av-norte-2024-t2',
    region: 'norte',
    periodo: '2024-t2',
    titulo: 'Energía renovable para campamentos',
    resumen:
      'Se habilitaron 4 microredes solares que abastecen 230 familias, reduciendo cortes en sectores rurales.',
    indicadores: {
      hogaresBeneficiados: 230,
      reduccionEmisionesTon: 120,
      porcentajeAvance: 72
    },
    temas: ['energía limpia', 'infraestructura'],
    imagenAlt: 'Paneles solares instalados en viviendas de la zona norte.'
  },
  {
    id: 'av-norte-2024-t1',
    region: 'norte',
    periodo: '2024-t1',
    titulo: 'Programa de becas técnicas',
    resumen:
      '80 estudiantes de liceos técnicos iniciaron prácticas en iniciativas de eficiencia hídrica.',
    indicadores: {
      hogaresBeneficiados: 80,
      reduccionEmisionesTon: 35,
      porcentajeAvance: 55
    },
    temas: ['educación', 'empleo local'],
    imagenAlt: 'Estudiantes con cascos de seguridad en un laboratorio.'
  },
  {
    id: 'av-centro-2024-t2',
    region: 'centro',
    periodo: '2024-t2',
    titulo: 'Plan de monitoreo de calidad del aire',
    resumen:
      'Se instalaron 6 estaciones comunitarias con reporte abierto y capacitaciones para juntas vecinales.',
    indicadores: {
      hogaresBeneficiados: 540,
      reduccionEmisionesTon: 0,
      porcentajeAvance: 64
    },
    temas: ['salud', 'transparencia'],
    imagenAlt: 'Vecinos observando una estación de monitoreo ambiental.'
  },
  {
    id: 'av-centro-2023-t4',
    region: 'centro',
    periodo: '2023-t4',
    titulo: 'Recuperación de espacios públicos',
    resumen:
      'Se inauguraron 3 plazas con sombreaderos y riego eficiente en comunas vecinas a operaciones.',
    indicadores: {
      hogaresBeneficiados: 390,
      reduccionEmisionesTon: 18,
      porcentajeAvance: 100
    },
    temas: ['espacio público', 'agua'],
    imagenAlt: 'Familias utilizando juegos infantiles bajo estructuras sombreadas.'
  },
  {
    id: 'av-sur-2024-t1',
    region: 'sur',
    periodo: '2024-t1',
    titulo: 'Reforestación participativa',
    resumen:
      'Comunidades escolares plantaron 4.500 árboles nativos en quebradas priorizadas por los municipios.',
    indicadores: {
      hogaresBeneficiados: 260,
      reduccionEmisionesTon: 95,
      porcentajeAvance: 48
    },
    temas: ['biodiversidad', 'educación'],
    imagenAlt: 'Niños y niñas plantando árboles nativos con apoyo de monitores.'
  }
];

function filtrarAvances(region = 'todos', periodo = 'todos') {
  return AVANCES.filter(item => {
    const regionOk = region === 'todos' || item.region === region;
    const periodoOk = periodo === 'todos' || item.periodo === periodo;
    return regionOk && periodoOk;
  });
}

export function listarRegiones() {
  return [{ id: 'todos', nombre: 'Todas las regiones' }, ...REGIONES];
}

export function listarPeriodos() {
  return [{ id: 'todos', etiqueta: 'Todos los periodos' }, ...PERIODOS];
}

export function listarAvances(region = 'todos', periodo = 'todos') {
  return {
    success: true,
    filtros: { region, periodo },
    data: filtrarAvances(region, periodo)
  };
}

export function obtenerResumenGeneral(region = 'todos', periodo = 'todos') {
  const seleccion = filtrarAvances(region, periodo);
  const totalComunidades = seleccion.reduce((acc, item) => acc + item.indicadores.hogaresBeneficiados, 0);
  const emisionesEvitadas = seleccion.reduce((acc, item) => acc + item.indicadores.reduccionEmisionesTon, 0);
  const avancePromedio =
    seleccion.length === 0
      ? 0
      : Math.round(
          seleccion.reduce((acc, item) => acc + item.indicadores.porcentajeAvance, 0) / seleccion.length
        );

  return {
    success: true,
    data: {
      totalIniciativas: seleccion.length,
      totalComunidades,
      emisionesEvitadas,
      avancePromedio
    }
  };
}

export function obtenerTemasDisponibles() {
  const temas = new Set();
  AVANCES.forEach(item => {
    (item.temas || []).forEach(tema => temas.add(tema));
  });
  return Array.from(temas);
}

export default {
  listarRegiones,
  listarPeriodos,
  listarAvances,
  obtenerResumenGeneral,
  obtenerTemasDisponibles
};
