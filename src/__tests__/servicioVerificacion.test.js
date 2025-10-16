import * as servicioCadena from '../services/servicioCadena';
import {
  configurarDelaySimulado,
  detectarDivergencias,
  verificarRegistroPorId
} from '../services/servicioVerificacion';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
jest.mock('jspdf', () => ({
  jsPDF: function () {
    return {
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
      addPage: jest.fn(),
      output: jest.fn().mockReturnValue(new Blob())
    };
  }
}));

describe('servicioVerificacion', () => {
  const STORAGE_KEY = 'cadena_registros_demo';

  beforeAll(() => {
    if (!global.crypto) {
      global.crypto = {};
    }
    if (!global.crypto.subtle) {
      global.crypto.subtle = {};
    }
    if (typeof window !== 'undefined') {
      window.crypto = global.crypto;
    }
    if (!global.performance) {
      global.performance = {};
    }
    if (typeof global.performance.now !== 'function') {
      global.performance.now = () => Date.now();
    }
  });

  beforeEach(() => {
    global.crypto.subtle.digest = jest.fn(async (_algoritmo, data) => {
      const bytes = new Uint8Array(data);
      const checksum = bytes.reduce((acc, curr) => (acc + curr) % 256, 0);
      const buffer = new Uint8Array(32).fill(checksum);
      return buffer.buffer;
    });
    localStorage.removeItem(STORAGE_KEY);
    servicioCadena.limpiarCadenaDemo();
    configurarDelaySimulado(0);
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const crearBloqueDemo = async () => {
    return servicioCadena.crearBloque({
      registro_id: 'META-VER-001',
      tipo_entidad: 'metas',
      contenido: {
        meta: 'Reducción demostrativa',
        division: 'Ventanas',
        avance: 42
      },
      usuario: 'Auditor Demo',
      motivo: 'Prueba de verificación'
    });
  };

  test('verificarRegistroPorId retorna valido true cuando el contenido coincide', async () => {
    const bloque = await crearBloqueDemo();

    const resultado = await verificarRegistroPorId(bloque.registro_id);

    expect(resultado.valido).toBe(true);
    expect(resultado.huella_recalculada).toBe(resultado.huella_almacenada);
    expect(resultado.divergencias).toHaveLength(0);
    expect(performance.now).toHaveBeenCalled();
  });

  test('verificarRegistroPorId detecta divergencias cuando el contenido cambia', async () => {
    const bloque = await crearBloqueDemo();

    const resultado = await verificarRegistroPorId(bloque.registro_id, {
      contenidoActual: {
        meta: 'Reducción demostrativa',
        division: 'Ventanas',
        avance: 55
      }
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.divergencias).toHaveLength(1);
    expect(resultado.divergencias[0]).toMatchObject({ campo: 'avance' });
  });

  test('detectarDivergencias compara hasta dos niveles y detecta cambios', () => {
    const base = {
      meta: 'Demo',
      lineaBase: { valor: 10, unidad: 'tCO2' }
    };
    const manipulado = {
      meta: 'Demo',
      lineaBase: { valor: 12, unidad: 'tCO2' }
    };

    const diferencias = detectarDivergencias(base, manipulado);

    expect(diferencias).toHaveLength(1);
    expect(diferencias[0]).toMatchObject({ campo: 'lineaBase.valor' });
  });

  test('verificarRegistroPorId registra tiempos superiores a 1s cuando performance.now indica demora', async () => {
    const bloque = await crearBloqueDemo();
    let llamada = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => {
      llamada += 1;
      return llamada === 1 ? 1000 : 2205;
    });

    const resultado = await verificarRegistroPorId(bloque.registro_id);

    expect(resultado.tiempo_ms).toBeCloseTo(1205, 1);
    expect(resultado.tiempo_ms).toBeGreaterThan(1000);
  });
});
