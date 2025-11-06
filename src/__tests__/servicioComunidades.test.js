import {
  listarRegiones,
  listarPeriodos,
  listarAvances,
  obtenerResumenGeneral,
  obtenerTemasDisponibles
} from '../services/servicioComunidades';

describe('servicioComunidades', () => {
  it('entrega regiones y periodos con opción "todos"', () => {
    const regiones = listarRegiones();
    const periodos = listarPeriodos();

    expect(regiones[0].id).toBe('todos');
    expect(periodos[0].id).toBe('todos');
    expect(regiones.length).toBeGreaterThan(1);
    expect(periodos.length).toBeGreaterThan(1);
  });

  it('filtra avances por región y periodo sin exponer datos críticos', () => {
    const resultado = listarAvances('norte', '2024-t2');
    expect(resultado.success).toBe(true);
    expect(resultado.data.length).toBeGreaterThanOrEqual(1);
    resultado.data.forEach(item => {
      expect(item.region).toBe('norte');
      expect(item).not.toHaveProperty('credenciales');
    });
  });

  it('calcula resumen general consistente con los datos filtrados', () => {
    const { data: avances } = listarAvances('centro', '2023-t4');
    const resumen = obtenerResumenGeneral('centro', '2023-t4');

    const totalHogares = avances.reduce((acc, item) => acc + item.indicadores.hogaresBeneficiados, 0);

    expect(resumen.success).toBe(true);
    expect(resumen.data.totalIniciativas).toBe(avances.length);
    expect(resumen.data.totalComunidades).toBe(totalHogares);
  });

  it('lista temas únicos disponibles', () => {
    const temas = obtenerTemasDisponibles();
    const setTemas = new Set(temas);
    expect(temas.length).toBe(setTemas.size);
    expect(temas).toContain('energía limpia');
  });
});
