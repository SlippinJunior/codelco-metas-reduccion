import { simular, registrarAlertas, listarHistorial, getConfig, saveVersion } from '../services/alertasService';
import lecturas from '../../data/lecturas-ejemplo.json';

beforeEach(() => {
  localStorage.clear();
});

test('simular returns at least one alert with demo data', () => {
  const cfg = getConfig(); // default config has reglas for consumo_diesel and energia_kwh
  const res = simular(cfg, lecturas, cfg.ventanaDias);
  expect(Array.isArray(res)).toBe(true);
  expect(res.length).toBeGreaterThanOrEqual(1);
});

test('registrarAlertas persists to historial', () => {
  const fake = [{ indicador: 'consumo_diesel', valor: 999, umbral: 100, ambito: 'División El Teniente', timestamp: new Date().toISOString() }];
  const out = registrarAlertas(fake);
  expect(out.success).toBe(true);
  const hist = listarHistorial();
  expect(hist.length).toBeGreaterThanOrEqual(1);
});

test('saveVersion stores version with hash', () => {
  const cfg = getConfig();
  const v = saveVersion(cfg, 'tester');
  expect(v.hash).toBeDefined();
});
