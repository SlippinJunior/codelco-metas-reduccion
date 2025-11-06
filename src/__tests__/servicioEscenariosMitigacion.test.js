import {
  listarEscenarios,
  calcularIndicadores,
  resetEscenarios,
  actualizarEscenario,
  agregarEscenario
} from '../services/servicioEscenariosMitigacion';

describe('servicioEscenariosMitigacion', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetEscenarios();
  });

  it('lista al menos tres escenarios con indicadores calculados', () => {
    const resultado = listarEscenarios();
    expect(resultado.success).toBe(true);
    expect(Array.isArray(resultado.data)).toBe(true);
    expect(resultado.data.length).toBeGreaterThanOrEqual(3);
    resultado.data.forEach(item => {
      expect(item.indicadores).toBeDefined();
      expect(item.indicadores.costoTotal).toBeGreaterThan(0);
      expect(item.indicadores.emisionesPosteriores).toBeGreaterThanOrEqual(0);
    });
  });

  it('calcula ROI y payback correctamente', () => {
    const base = {
      id: 'escenario-prueba',
      nombre: 'Escenario prueba',
      tecnologia: 'Demo',
      division: 'Demo',
      horizonte: 5,
      capex: 100,
      costoOperacionAnual: 5,
      ahorroOpexAnual: 20,
      baselineEmisiones: 1000,
      reduccionPorcentaje: 0.4,
      supuestos: {}
    };

    const indicadores = calcularIndicadores(base);
    expect(indicadores.costoTotal).toBeCloseTo(125, 5);
    expect(indicadores.beneficios).toBeCloseTo(100, 5);
    expect(indicadores.roi).toBeCloseTo(0, 5);
    expect(indicadores.payback).toBeCloseTo(5, 5);
    expect(indicadores.emisionesPosteriores).toBeCloseTo(600, 5);
    expect(indicadores.reduccionTon).toBeCloseTo(400, 5);
  });

  it('permite actualizar datos claves y mantiene los indicadores sincronizados', () => {
    const listado = listarEscenarios();
    const objetivo = listado.data[0];
    const nuevoCapex = objetivo.capex + 10;
    const resultado = actualizarEscenario(objetivo.id, { capex: nuevoCapex });
    expect(resultado.success).toBe(true);
    const indicadores = calcularIndicadores(resultado.data);
    expect(indicadores.costoTotal).toBeCloseTo(
      resultado.data.costoOperacionAnual * resultado.data.horizonte + nuevoCapex,
      5
    );
  });

  it('agrega nuevos escenarios manteniendo las reglas de negocio', () => {
    const resultado = agregarEscenario({
      nombre: 'Piloto captura CO2',
      reduccionPorcentaje: 0.2,
      baselineEmisiones: 15000
    });
    expect(resultado.success).toBe(true);
    const estado = listarEscenarios();
    expect(estado.data.find(item => item.id === resultado.data.id)).toBeDefined();
  });
});
