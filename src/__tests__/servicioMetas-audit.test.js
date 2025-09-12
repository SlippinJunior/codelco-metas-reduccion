import * as metas from '../services/servicioMetas';
import servicioAuditoria from '../services/servicioAuditoria';

jest.mock('../services/servicioAuditoria');

describe('servicioMetas audit hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    // seed metas
    localStorage.setItem('codelco_metas_reduccion', JSON.stringify([
      { id: 'm1', nombre: 'M1', lineaBase: { año: 2023, valor: 2.5 }, progreso: { porcentaje: 0, valorActual: 2.5 }, fechaCreacion: new Date().toISOString(), estado: 'activa' }
    ]));
    servicioAuditoria.agregarEvento = jest.fn().mockResolvedValue({ success: true });
    // simulate logged user
    localStorage.setItem('currentUser', JSON.stringify({ usuario: 'tester', rol: 'control-interno' }));
  });

  test('crearMeta registra evento de auditoría', async () => {
    const result = await metas.crearMeta({ nombre: 'Nueva', division: 'El Teniente', proceso: 'molienda', indicador: 'tCO₂e/ton Cu', lineaBase: { año: 2024, valor: 3 }, fechaObjetivo: '2030-01-01' });
    expect(result.success).toBe(true);
    // wait a tick for async audit registration
    await new Promise(r => setTimeout(r, 10));
    expect(servicioAuditoria.agregarEvento).toHaveBeenCalled();
  });

  test('actualizarMeta registra evento de auditoría', async () => {
    const res = await metas.actualizarMeta('m1', { nombre: 'M1 mod' });
    expect(res.success).toBe(true);
    await new Promise(r => setTimeout(r, 10));
    expect(servicioAuditoria.agregarEvento).toHaveBeenCalledWith(expect.objectContaining({ accion: 'modificar', entidad: 'metas', entidad_id: 'm1' }));
  });

  test('eliminarMeta registra evento de auditoría', async () => {
    const res = await metas.eliminarMeta('m1');
    expect(res.success).toBe(true);
    await new Promise(r => setTimeout(r, 10));
    expect(servicioAuditoria.agregarEvento).toHaveBeenCalledWith(expect.objectContaining({ accion: 'eliminar', entidad: 'metas', entidad_id: 'm1' }));
  });
});
