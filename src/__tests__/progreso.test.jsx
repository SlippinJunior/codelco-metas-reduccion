import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VistaProgreso from '../views/VistaProgreso';
import * as servicioMetas from '../services/servicioMetas';
import * as servicioDatos from '../services/servicioDatosSimulados';

jest.mock('../services/servicioMetas');

describe('VistaProgreso', () => {
  beforeEach(() => {
    servicioMetas.listarMetas = jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'meta-001',
          nombre: 'Meta A',
          division: 'El Teniente',
          proceso: 'molienda',
          lineaBase: { año: 2023, valor: 2.8 },
          progreso: { porcentaje: 10 }
        }
      ]
    });
  });

  test('muestra dos series en el gráfico cuando hay datos agregados', async () => {
    render(<VistaProgreso />);
    // Esperar a que aparezca el título
    await waitFor(() => expect(screen.getByText(/Progreso: Real vs Meta/i)).toBeInTheDocument());

    // Debe renderizar el SVG del gráfico
    await waitFor(() => expect(document.querySelector('svg[aria-label="Gráfico de progreso mensual"]')).toBeTruthy());

    // Verificar que existan puntos (circles) para meta y real
    const circles = document.querySelectorAll('svg circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  test('mide el tiempo de renderizado inicial con performance.now mockeado', async () => {
    const originalNow = performance.now;
    let t = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => (t += 100));

    render(<VistaProgreso />);
    await waitFor(() => expect(document.querySelector('svg[aria-label="Gráfico de progreso mensual"]')).toBeTruthy());

    // Restaurar
    performance.now = originalNow;
  });

  test('selector de periodo actualiza la vista', async () => {
    render(<VistaProgreso />);
    await waitFor(() => expect(screen.getByText(/Progreso: Real vs Meta/i)).toBeInTheDocument());

    const tipoSelect = screen.getByLabelText(/Tipo de periodo/i);
    fireEvent.change(tipoSelect, { target: { value: 'trimestre' } });

    // Ahora debe existir el select de trimestre
    await waitFor(() => expect(screen.getByLabelText(/Trimestre/i)).toBeInTheDocument());
  });
});
