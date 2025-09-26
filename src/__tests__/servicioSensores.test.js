import {
  crearSensor,
  listarSensores,
  simularRecepcion,
  iniciarSimulacionAutomatica,
  detenerSimulacionAutomatica,
  obtenerSensor,
  detenerTodasLasSimulaciones
} from '../services/servicioSensores';

const STORAGE_KEY = 'codelco_sensores_demo';

const sensorBasico = {
  nombre: 'Sensor Test Uno',
  tipo: 'electricidad',
  division: 'División Demo',
  protocolo: 'HTTP',
  credenciales: {
    endpoint: 'https://demo.codelco.cl/api/test',
    secreto: 'token-123'
  },
  frecuenciaSegundos: 5,
  descripcion: 'Sensor de prueba automatizada'
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  detenerTodasLasSimulaciones();
  jest.clearAllTimers();
  jest.useRealTimers();
  localStorage.removeItem(STORAGE_KEY);
});

describe('servicioSensores', () => {
  test('crearSensor valida campos y persiste en almacenamiento demo', async () => {
    const resultadoInvalido = await crearSensor({});
    expect(resultadoInvalido.success).toBe(false);
    expect(resultadoInvalido.errors).toBeDefined();
    expect(resultadoInvalido.errors.nombre).toBeTruthy();

    const resultadoValido = await crearSensor(sensorBasico);
    expect(resultadoValido.success).toBe(true);
    expect(resultadoValido.data).toMatchObject({ nombre: sensorBasico.nombre });

    const listado = await listarSensores();
    expect(listado.success).toBe(true);
    const encontrado = listado.data.find(s => s.id === resultadoValido.data.id);
    expect(encontrado).toBeDefined();
    expect(encontrado?.ultimaTransmision).toBeNull();
  });

  test('simularRecepcion agrega historial y actualiza última transmisión', async () => {
    const { data: nuevoSensor } = await crearSensor(sensorBasico);
    const resultado = await simularRecepcion(nuevoSensor.id);

    expect(resultado.success).toBe(true);
    const detalle = await obtenerSensor(nuevoSensor.id);
    expect(detalle.success).toBe(true);
    expect(detalle.data.historialTransmisiones.length).toBeGreaterThanOrEqual(1);
    expect(detalle.data.ultimaTransmision).toEqual(detalle.data.historialTransmisiones[0].timestamp);
    expect(detalle.data.acuses.length).toBeGreaterThanOrEqual(1);
  });

  test('iniciarSimulacionAutomatica programa intervalos y detener los cancela', async () => {
    jest.useFakeTimers();
    const { data: nuevoSensor } = await crearSensor({
      ...sensorBasico,
      nombre: 'Sensor Frecuencia 1s',
      frecuenciaSegundos: 1
    });

    const inicio = iniciarSimulacionAutomatica(nuevoSensor.id);
    expect(inicio.success).toBe(true);

    jest.advanceTimersByTime(1100);
    const detalleTrasTick = await obtenerSensor(nuevoSensor.id);
    const historialInicial = detalleTrasTick.data.historialTransmisiones.length;
    expect(historialInicial).toBeGreaterThanOrEqual(1);

    detenerSimulacionAutomatica(nuevoSensor.id);
    jest.advanceTimersByTime(5000);

    const detalleFinal = await obtenerSensor(nuevoSensor.id);
    expect(detalleFinal.data.historialTransmisiones.length).toBe(historialInicial);
  });
});
