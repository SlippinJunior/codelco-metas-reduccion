import * as servicioCadena from '../services/servicioCadena';

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

const STORAGE_KEY = 'cadena_registros_demo';

const datosBase = {
  registro_id: 'META-TEST-001',
  tipo_entidad: 'metas',
  contenido: '{"meta":"Demo"}',
  usuario: 'Auditor Prueba',
  motivo: 'Test unitario'
};

describe('servicioCadena (simulación blockchain)', () => {
  beforeAll(() => {
    // Stub crypto digest para entorno Jest si no existe
    if (!global.crypto) {
      global.crypto = {};
    }
    if (!global.crypto.subtle) {
      global.crypto.subtle = {};
    }
    if (typeof window !== 'undefined') {
      window.crypto = global.crypto;
    }
  });

  beforeEach(() => {
    global.crypto.subtle.digest = jest.fn(async (_algoritmo, data) => {
      const bytes = new Uint8Array(data);
      const checksum = bytes.reduce((acc, curr) => (acc + curr) % 256, 0);
      const buffer = new Uint8Array(32);
      buffer.fill(checksum);
      return buffer.buffer;
    });
    localStorage.removeItem(STORAGE_KEY);
    servicioCadena.limpiarCadenaDemo();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crearBloque enlaza huella_padre correctamente', async () => {
    const bloque1 = await servicioCadena.crearBloque(datosBase);
    const bloque2 = await servicioCadena.crearBloque({
      ...datosBase,
      registro_id: 'META-TEST-002'
    });

    expect(bloque1.huella_padre).toBeNull();
    expect(bloque2.huella_padre).toBe(bloque1.huella);
    expect(bloque2.index).toBe(1);
    expect(global.crypto.subtle.digest).toHaveBeenCalled();
  });

  test('obtenerBloquePorRegistro retorna el bloque esperado', async () => {
    await servicioCadena.crearBloque(datosBase);
    const encontrado = await servicioCadena.obtenerBloquePorRegistro('META-TEST-001');

    expect(encontrado).not.toBeNull();
    expect(encontrado.registro_id).toBe('META-TEST-001');
    expect(encontrado.usuario).toBe('Auditor Prueba');
  });

  test('verificarBloque detecta manipulación si el contenido cambia en almacenamiento demo', async () => {
    const bloque = await servicioCadena.crearBloque(datosBase);

    // Manipular contenido almacenado para simular alteración
    const almacenado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    almacenado[0].contenido = '{"meta":"Alterada"}';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(almacenado));

    const resultado = await servicioCadena.verificarBloque(bloque.index);
    expect(resultado.estado).toBe('manipulado');
    expect(resultado.diferencia).toBeTruthy();
  });
});
