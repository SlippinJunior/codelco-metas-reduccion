import { listarEventos, agregarEvento, exportarEventosCSV } from '../services/servicioAuditoria';

describe('servicioAuditoria', () => {
  beforeEach(() => {
    // reset localStorage
    localStorage.clear();
  });

  test('listarEventos devuelve datos y total', async () => {
    // Inicializar con 2 eventos
    localStorage.setItem('codelco_auditoria_events', JSON.stringify([
      { id: 'a1', fecha_hora: '2025-01-01T00:00:00Z', usuario: 'u1', rol: 'r1', accion: 'ver', entidad: 'metas' },
      { id: 'a2', fecha_hora: '2025-02-01T00:00:00Z', usuario: 'u2', rol: 'r2', accion: 'crear', entidad: 'reportes' }
    ]));

    const res = await listarEventos({});
    expect(res.success).toBe(true);
    expect(res.total).toBe(2);
    expect(res.data.length).toBe(2);
  });

  test('agregarEvento añade y retorna nuevo evento', async () => {
    localStorage.setItem('codelco_auditoria_events', JSON.stringify([]));
    const ev = { usuario: 'tester', rol: 'test', accion: 'crear', entidad: 'metas', fecha_hora: new Date().toISOString() };
    const r = await agregarEvento(ev);
    expect(r.success).toBe(true);
    expect(r.data).toHaveProperty('id');
    const stored = JSON.parse(localStorage.getItem('codelco_auditoria_events'));
    expect(stored.length).toBe(1);
  });

  test('exportarEventosCSV genera y dispara descarga', async () => {
    // Prepare events
    localStorage.setItem('codelco_auditoria_events', JSON.stringify([
      { id: 'e1', fecha_hora: '2025-01-01T00:00:00Z', usuario: 'u1', rol: 'r1', accion: 'ver', entidad: 'metas', entidad_id: 'm1', motivo: 'm', detalle_anterior: null, detalle_nuevo: null, ip_origen: '127.0.0.1' }
    ]));

    // Mock createObjectURL and anchor click
    const createObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    const appendChild = document.body.appendChild;
    const removeChild = document.body.removeChild;
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    const res = await exportarEventosCSV({});

    expect(res.success).toBe(true);

    // restore
    URL.createObjectURL = createObjectURL;
    document.body.appendChild = appendChild;
    document.body.removeChild = removeChild;
  });
});
