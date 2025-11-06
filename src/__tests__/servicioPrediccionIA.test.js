import {
  obtenerModeloPrediccion,
  predecirDesvio,
  obtenerExplicacionVariables,
  obtenerDatosEntrenamiento
} from '../services/servicioPrediccionIA';

describe('servicioPrediccionIA', () => {
  it('entrena con 12 registros simulados', () => {
    const datos = obtenerDatosEntrenamiento();
    expect(Array.isArray(datos)).toBe(true);
    expect(datos).toHaveLength(12);
  });

  it('retorna métricas y valida umbral de MAPE', () => {
    const modelo = obtenerModeloPrediccion();
    expect(modelo.mae).toBeGreaterThanOrEqual(0);
    expect(modelo.mape).toBeGreaterThanOrEqual(0);
    expect(modelo.umbral.mapeMaximo).toBeGreaterThan(0);
    expect(typeof modelo.umbral.cumple).toBe('boolean');
  });

  it('permite realizar predicciones con diferentes escenarios', () => {
    const base = { intensidadEnergetica: 0.8, factorEmision: 0.35, progresoMeta: 50 };
    const resultado = predecirDesvio(base);
    expect(resultado.success).toBe(true);
    expect(typeof resultado.prediccion).toBe('number');

    const escenarioAlto = { intensidadEnergetica: 1.1, factorEmision: 0.5, progresoMeta: 30 };
    const resultadoAlto = predecirDesvio(escenarioAlto);
    expect(resultadoAlto.prediccion).not.toBeNaN();
  });

  it('explica las variables ordenadas por importancia', () => {
    const variables = obtenerExplicacionVariables();
    expect(Array.isArray(variables)).toBe(true);
    expect(variables.length).toBeGreaterThan(0);
    const importancias = variables.map(v => v.importancia);
    for (let i = 1; i < importancias.length; i += 1) {
      expect(importancias[i - 1]).toBeGreaterThanOrEqual(importancias[i]);
    }
  });
});
