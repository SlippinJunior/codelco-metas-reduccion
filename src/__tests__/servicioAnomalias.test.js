import servicioAnomalias, {
  detectarAnomalias,
  obtenerLecturasValidas
} from '../services/servicioAnomalias';
import servicioSensores from '../services/servicioSensores';

describe('servicioAnomalias (detección y validación demo)', () => {
  let store;

  beforeEach(() => {
    store = {};

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) =>
      Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    );

    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete store[key];
    });

    jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      store = {};
    });

    servicioAnomalias.resetReglas();
    servicioAnomalias.listarLecturas();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('marca lecturas fuera de rango como anomalías', () => {
    const lecturas = [
      {
        id: 'l1',
        sensorId: 's1',
        division: 'Demo',
        timestamp: '2025-01-01T10:00:00Z',
        valor: 50,
        unidad: 'u',
        tipo: 'demo_tipo'
      },
      {
        id: 'l2',
        sensorId: 's1',
        division: 'Demo',
        timestamp: '2025-01-01T10:05:00Z',
        valor: 5,
        unidad: 'u',
        tipo: 'demo_tipo'
      }
    ];

    const reglas = {
      demo_tipo: {
        rango: { min: 10, max: 60 }
      }
    };

    const resultado = detectarAnomalias(lecturas, reglas);
    expect(resultado[0].anomalia).toBe(false);
    expect(resultado[1].anomalia).toBe(true);
    expect(resultado[1].motivos[0].regla).toBe('rango');
  });

  test('detecta saltos bruscos respecto a la lectura previa', () => {
    const lecturas = [
      {
        id: 'l1',
        sensorId: 's1',
        division: 'Demo',
        timestamp: '2025-01-01T10:00:00Z',
        valor: 20,
        unidad: 'u',
        tipo: 'demo_tipo'
      },
      {
        id: 'l2',
        sensorId: 's1',
        division: 'Demo',
        timestamp: '2025-01-01T10:05:00Z',
        valor: 45,
        unidad: 'u',
        tipo: 'demo_tipo'
      }
    ];

    const reglas = {
      demo_tipo: {
        salto: { deltaMax: 10 }
      }
    };

    const resultado = detectarAnomalias(lecturas, reglas);
    expect(resultado[1].anomalia).toBe(true);
    expect(resultado[1].motivos.some(m => m.regla === 'salto')).toBe(true);
  });

  test('aprobar y rechazar lecturas actualiza participaEnCalculos', async () => {
    const lectura = {
      id: 'lectura-test',
      sensorId: 'sensor-demo',
      division: 'Demo',
      timestamp: new Date().toISOString(),
      valor: 100,
      unidad: 'L',
      tipo: 'consumo_diesel',
      anomalia: true,
      motivos: [{ regla: 'rango', detalle: 'demo' }]
    };

    servicioAnomalias.registrarLectura(lectura, { recalcular: false });

    const aprobada = await servicioAnomalias.aprobarLectura('lectura-test', 'tester', 'ok');
    expect(aprobada.success).toBe(true);
    expect(aprobada.data.participaEnCalculos).toBe(true);
    expect(aprobada.data.valida.estado).toBe('aprobada');

    const rechazada = await servicioAnomalias.rechazarLectura('lectura-test', 'tester', 'descarte demo');
    expect(rechazada.success).toBe(true);
    expect(rechazada.data.participaEnCalculos).toBe(false);
    expect(rechazada.data.valida.estado).toBe('rechazada');

    const lecturasValidas = obtenerLecturasValidas();
    expect(lecturasValidas.some(l => l.id === 'lectura-test')).toBe(false);
  });

  test('simular recepción de sensor agrega lectura pendiente al módulo de anomalías', () => {
    const resultadoSimulacion = servicioSensores.simularRecepcion('sensor-001');
    expect(resultadoSimulacion.success).toBe(true);

    const listado = servicioAnomalias.listarLecturas(
      { sensorId: 'sensor-001' },
      { pagina: 1, orden: { columna: 'timestamp', direccion: 'desc' }, tamanioPagina: 200 }
    );

    const existeLecturaSimulada = listado.data.some(
      lectura => lectura.sensorId === 'sensor-001' && lectura.origen === 'simulada'
    );

    expect(existeLecturaSimulada).toBe(true);
  });
});