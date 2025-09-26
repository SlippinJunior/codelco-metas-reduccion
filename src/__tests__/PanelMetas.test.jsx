import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PanelMetas from '../components/PanelMetas';
import * as servicioMetas from '../services/servicioMetas';

// Mock del servicio de metas
jest.mock('../services/servicioMetas');

// Mock de recharts para evitar problemas en tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}));

describe('PanelMetas', () => {
  const renderPanel = (props = {}) =>
    render(
      <MemoryRouter>
        <PanelMetas {...props} />
      </MemoryRouter>
    );

  const metasDePrueba = [
    {
      id: 'meta-001',
      nombre: 'Meta Test 1',
      division: 'El Teniente',
      proceso: 'molienda',
      indicador: 'tCO₂e/ton Cu',
      lineaBase: { año: 2023, valor: 2.8 },
      fechaObjetivo: '2030-12-31',
      progreso: { porcentaje: 15, valorActual: 2.65 },
      fechaCreacion: '2024-01-15T10:30:00.000Z',
      estado: 'activa'
    },
    {
      id: 'meta-002',
      nombre: 'Meta Test 2',
      division: 'Radomiro Tomic',
      proceso: 'chancado',
      indicador: 'tCO₂e/ton Cu',
      lineaBase: { año: 2023, valor: 1.95 },
      fechaObjetivo: '2029-06-30',
      progreso: { porcentaje: 8, valorActual: 1.87 },
      fechaCreacion: '2024-02-01T14:20:00.000Z',
      estado: 'activa'
    }
  ];

  const estadisticasDePrueba = {
    totalMetas: 2,
    metasActivas: 2,
    progresoPromedio: 12,
    metasPorDivision: {
      'El Teniente': 1,
      'Radomiro Tomic': 1
    },
    metasPorProceso: {
      'molienda': 1,
      'chancado': 1
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mocks por defecto
    servicioMetas.listarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: metasDePrueba
    });
    
    servicioMetas.obtenerEstadisticas = jest.fn().mockResolvedValue({
      success: true,
      data: estadisticasDePrueba
    });

    servicioMetas.filtrarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: metasDePrueba
    });

    servicioMetas.exportarMetasCSV = jest.fn().mockResolvedValue({
      success: true,
      message: 'Archivo CSV generado con 2 metas'
    });

    // Mock de DIVISIONES
    servicioMetas.DIVISIONES = [
      { id: 'el-teniente', nombre: 'El Teniente' },
      { id: 'radomiro-tomic', nombre: 'Radomiro Tomic' }
    ];
  });

  test('CA-R01-3: debe mostrar metas en vista corporativa (todas las divisiones)', async () => {
    renderPanel();

    // Esperar a que carguen las metas
    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Verificar que se muestran las metas de ambas divisiones
    expect(screen.getByText('Meta Test 1')).toBeInTheDocument();
    expect(screen.getByText('Meta Test 2')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /El Teniente \(1 meta\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /Radomiro Tomic \(1 meta\)/i })
    ).toBeInTheDocument();
  });

  test('CA-R01-3: debe filtrar metas por división', async () => {
    const user = userEvent.setup();
    
    // Mock para filtro por división
    servicioMetas.filtrarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: [metasDePrueba[0]] // Solo la primera meta
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Filtrar por El Teniente
    const divisionSelect = screen.getByLabelText(/filtrar por división/i);
    await user.selectOptions(divisionSelect, 'el-teniente');

    // Verificar que se llamó filtrarMetas con el parámetro correcto
    await waitFor(() => {
      expect(servicioMetas.filtrarMetas).toHaveBeenCalledWith('el-teniente', null);
    });
  });

  test('debe mostrar estadísticas correctamente', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    const totalMetasLabel = screen.getByText('Total Metas');
    const totalMetasContainer = totalMetasLabel.parentElement;
    expect(totalMetasContainer).not.toBeNull();
    expect(within(totalMetasContainer).getByText('2')).toBeInTheDocument();

    const progresoLabel = screen.getByText('Progreso Prom.');
    const progresoContainer = progresoLabel.parentElement;
    expect(progresoContainer).not.toBeNull();
    expect(within(progresoContainer).getByText(/12\s*%/)).toBeInTheDocument();

    expect(screen.getByText('Activas')).toBeInTheDocument();
  });

  test('debe manejar exportación de CSV', async () => {
    const user = userEvent.setup();
    
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Hacer clic en exportar
    const exportButton = screen.getByRole('button', { name: /exportar .*csv/i });
    await user.click(exportButton);

    // Verificar que se llamó la función de exportación
    await waitFor(() => {
      expect(servicioMetas.exportarMetasCSV).toHaveBeenCalled();
    });

    // Verificar mensaje de éxito
    expect(screen.getByText('Archivo CSV generado con 2 metas')).toBeInTheDocument();
  });

  test('debe mostrar mensaje cuando no hay metas', async () => {
    // Mock sin metas
    servicioMetas.listarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: []
    });

    servicioMetas.obtenerEstadisticas = jest.fn().mockResolvedValue({
      success: true,
      data: {
        totalMetas: 0,
        metasActivas: 0,
        progresoPromedio: 0,
        metasPorDivision: {},
        metasPorProceso: {}
      }
    });

    servicioMetas.filtrarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: []
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('No hay metas que mostrar')).toBeInTheDocument();
    });

    const mensajeSinMetas = await screen.findByTestId('mensaje-sin-metas');
    expect(mensajeSinMetas).toHaveTextContent('Cree la primera meta para comenzar');
  });

  test('debe mostrar indicador de carga', () => {
    // Mock que no se resuelve inmediatamente para mantener estado de carga
    servicioMetas.listarMetas = jest.fn().mockImplementation(() => new Promise(() => {}));
    servicioMetas.obtenerEstadisticas = jest.fn().mockImplementation(() => new Promise(() => {}));

    renderPanel();

    expect(screen.getByText('Cargando metas...')).toBeInTheDocument();
  });

  test('debe manejar errores al cargar datos', async () => {
    servicioMetas.listarMetas = jest.fn().mockResolvedValue({
      success: false,
      message: 'Error al obtener las metas'
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
      expect(screen.getByText('Error al obtener las metas')).toBeInTheDocument();
    });

    // Verificar botón de reintentar
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  test('debe limpiar filtros correctamente', async () => {
    const user = userEvent.setup();
    
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Aplicar filtro
    const divisionSelect = screen.getByLabelText(/filtrar por división/i);
    await user.selectOptions(divisionSelect, 'el-teniente');

    // Limpiar filtros
    const limpiarButton = screen.getByRole('button', { name: /limpiar filtros/i });
    await user.click(limpiarButton);

    // Verificar que los selects vuelven a valor vacío
    expect(divisionSelect.value).toBe('');
  });

  test('debe actualizar contador externo cuando se proporciona', async () => {
    const mockActualizarContador = jest.fn();
    
    renderPanel({ actualizarContador: mockActualizarContador });

    await waitFor(() => {
      expect(mockActualizarContador).toHaveBeenCalledWith(2);
    });
  });

  test('debe agrupar metas por división correctamente', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Verificar que aparecen los nombres de división como encabezados de grupo
  expect(screen.getByRole('heading', { level: 3, name: /El Teniente \(1 meta\)/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: /Radomiro Tomic \(1 meta\)/i })).toBeInTheDocument();

    // Verificar contadores de metas por división
  expect(screen.getAllByText(/\(1 meta\)/i)).toHaveLength(2);
  });

  test('debe filtrar por año objetivo', async () => {
    const user = userEvent.setup();
    
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Panel de Metas de Reducción')).toBeInTheDocument();
    });

    // Verificar que existe el filtro de año
    const añoSelect = screen.getByLabelText(/filtrar por año objetivo/i);
    expect(añoSelect).toBeInTheDocument();

    // Aplicar filtro por año
    await user.selectOptions(añoSelect, '2030');

    await waitFor(() => {
      expect(servicioMetas.filtrarMetas).toHaveBeenCalledWith(null, 2030);
    });
  });
});
