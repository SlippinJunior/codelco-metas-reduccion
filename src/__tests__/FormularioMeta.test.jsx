import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormularioMeta from '../components/FormularioMeta';
import * as servicioMetas from '../services/servicioMetas';

// Mock del servicio de metas
jest.mock('../services/servicioMetas');

describe('FormularioMeta', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
    
    // Mock por defecto para validadores
    servicioMetas.validadores = {
      validarMeta: jest.fn().mockReturnValue({ esValido: true, errores: {} })
    };
  });

  test('CA-R01-2: debe mostrar errores cuando se intenta enviar con campos vacíos', async () => {
    const user = userEvent.setup();
    
    // Mock para validación que falla
    servicioMetas.validadores.validarMeta.mockReturnValue({
      esValido: false,
      errores: {
        nombre: 'El nombre debe tener al menos 3 caracteres',
        division: 'Debe seleccionar una división',
        proceso: 'Debe seleccionar un proceso'
      }
    });

    render(<FormularioMeta />);

    // Intentar enviar formulario vacío
    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    // Verificar que aparezcan los mensajes de error
    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 3 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Debe seleccionar una división')).toBeInTheDocument();
      expect(screen.getByText('Debe seleccionar un proceso')).toBeInTheDocument();
    });

    // Verificar que el mensaje general de error aparezca
    expect(screen.getByText('Por favor corrija los errores antes de continuar')).toBeInTheDocument();
  });

  test('CA-R01-1: debe tener todos los campos requeridos del esquema de meta', () => {
    render(<FormularioMeta />);

    // Verificar que existen todos los campos obligatorios según CA-R01-1
    expect(screen.getByLabelText(/nombre de la meta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/división/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/proceso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/indicador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/año línea base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor línea base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha objetivo/i)).toBeInTheDocument();
    
    // Campo opcional
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
  });

  test('debe tener valores por defecto apropiados', () => {
    render(<FormularioMeta />);

    // Verificar valor por defecto del indicador
    const indicadorSelect = screen.getByLabelText(/indicador/i);
    expect(indicadorSelect.value).toBe('tCO₂e/ton Cu');

    // Verificar año por defecto (año anterior)
    const añoInput = screen.getByLabelText(/año línea base/i);
    const añoEsperado = new Date().getFullYear() - 1;
    expect(añoInput.value).toBe(añoEsperado.toString());
  });

  test('debe llamar onMetaCreada cuando se crea una meta exitosamente', async () => {
    const user = userEvent.setup();
    const mockOnMetaCreada = jest.fn();
    
    // Mock para creación exitosa
    servicioMetas.crearMeta = jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'test-meta-id',
        nombre: 'Meta de prueba',
        division: 'El Teniente'
      },
      message: 'Meta creada exitosamente'
    });

    render(<FormularioMeta onMetaCreada={mockOnMetaCreada} />);

    // Llenar formulario
    await user.type(screen.getByLabelText(/nombre de la meta/i), 'Meta de prueba');
    await user.selectOptions(screen.getByLabelText(/división/i), 'El Teniente');
    await user.selectOptions(screen.getByLabelText(/proceso/i), 'molienda');
    await user.type(screen.getByLabelText(/valor línea base/i), '2.5');
    await user.type(screen.getByLabelText(/fecha objetivo/i), '2030-12-31');

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    // Verificar que se llamó la función callback
    await waitFor(() => {
      expect(mockOnMetaCreada).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-meta-id',
          nombre: 'Meta de prueba',
          division: 'El Teniente'
        })
      );
    });
  });

  test('debe ser accesible con navegación por teclado', async () => {
    const user = userEvent.setup();
    render(<FormularioMeta />);

    const nombreInput = screen.getByLabelText(/nombre de la meta/i);
    
    // Enfocar primer campo
    nombreInput.focus();
    expect(nombreInput).toHaveFocus();

    // Navegar con Tab
    await user.tab();
    expect(screen.getByLabelText(/división/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/proceso/i)).toHaveFocus();
  });

  test('debe mostrar indicaciones de campos obligatorios', () => {
    render(<FormularioMeta />);

    // Verificar que los campos obligatorios tienen asterisco
    const camposObligatorios = screen.getAllByText(/\*/);
    expect(camposObligatorios.length).toBeGreaterThan(0);

    // Verificar atributos aria-required
    expect(screen.getByLabelText(/nombre de la meta/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/división/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/proceso/i)).toHaveAttribute('aria-required', 'true');
  });

  test('debe validar fecha objetivo futura', async () => {
    const user = userEvent.setup();
    
    // Mock para validación de fecha
    servicioMetas.validadores.validarMeta.mockReturnValue({
      esValido: false,
      errores: {
        fechaObjetivo: 'La fecha objetivo debe ser futura'
      }
    });

    render(<FormularioMeta />);

    // Intentar poner fecha pasada
    const fechaInput = screen.getByLabelText(/fecha objetivo/i);
    await user.type(fechaInput, '2020-01-01');

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('La fecha objetivo debe ser futura')).toBeInTheDocument();
    });
  });

  test('debe mostrar estado de carga durante envío', async () => {
    const user = userEvent.setup();
    
    // Mock con delay para simular carga
    servicioMetas.crearMeta = jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ success: true, data: {}, message: 'OK' }), 100)
      )
    );

    render(<FormularioMeta />);

    // Llenar campos mínimos
    await user.type(screen.getByLabelText(/nombre de la meta/i), 'Test');
    await user.selectOptions(screen.getByLabelText(/división/i), 'El Teniente');
    await user.selectOptions(screen.getByLabelText(/proceso/i), 'molienda');
    await user.type(screen.getByLabelText(/valor línea base/i), '2.5');
    await user.type(screen.getByLabelText(/fecha objetivo/i), '2030-12-31');

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    // Verificar estado de carga
    expect(screen.getByText(/creando meta/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Esperar a que termine
    await waitFor(() => {
      expect(screen.queryByText(/creando meta/i)).not.toBeInTheDocument();
    });
  });
});
