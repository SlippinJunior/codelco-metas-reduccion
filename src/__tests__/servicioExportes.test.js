import { arrayToCsv } from '../utils/csv';
import { firmarSimulado } from '../services/servicioExportes';

describe('servicioExportes utilidades', () => {
  it('genera encabezados esperados para CSV de metas', () => {
    const headers = [
      { key: 'division', label: 'division' },
      { key: 'meta_id', label: 'meta_id' },
      { key: 'nombre_meta', label: 'nombre_meta' }
    ];
    const rows = [
      {
        division: 'El Teniente',
        meta_id: 'meta-001',
        nombre_meta: 'Reducción de emisiones en molienda'
      }
    ];
    const csv = arrayToCsv(headers, rows, { includeBom: false });
    const [encabezados] = csv.split('\n');
    expect(encabezados).toBe('division,meta_id,nombre_meta');
  });

  it('firmarSimulado retorna hash base64 y firmante', async () => {
    const firma = await firmarSimulado('contenido de prueba', 'Equipo Demo');
    expect(firma.firmante).toBe('Equipo Demo');
    expect(typeof firma.hashBase64).toBe('string');
    expect(firma.hashBase64.length).toBeGreaterThan(10);
    expect(firma.nota).toMatch(/simulada/i);
  });
});
