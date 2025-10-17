import demo from '../../data/sensores-activos-demo.json';

function randomBase() {
  return 2.0 + Math.random() * 1.5; // base tCO2e/hr
}

function generarSerieUltimaHora() {
  const now = Date.now();
  const points = [];
  const base = randomBase();
  for (let i = 59; i >= 0; i--) {
    const ts = now - i * 60 * 1000;
    // add noise
    let val = base + (Math.random() - 0.5) * 0.2;
    // occasional peaks: 12% chance
    if (Math.random() < 0.12) {
      val = val * (1 + 0.2 + Math.random() * 0.2); // +20-40%
    }
    points.push({ timestamp: ts, valor: Number(val.toFixed(3)) });
  }
  return points;
}

export function listarActivosFundicion() {
  // return demo actives
  return Promise.resolve(demo.activos || []);
}

export function getLecturasUltimaHora(activoId) {
  // generate synthetic series — could vary by id
  const serie = generarSerieUltimaHora();
  return Promise.resolve(serie);
}

export function getEventosUltimaHora(activoId) {
  const now = Date.now();
  const eventoCfg = (demo.eventosDemo || {})[activoId] || [];
  const eventos = eventoCfg.map(e => ({
    timestamp: now + (e.tsMin * 60 * 1000),
    tipo: e.tipo
  }));
  return Promise.resolve(eventos);
}

export function toSerieRecharts(lecturas) {
  return (lecturas || []).map(l => ({ x: new Date(l.timestamp), y: l.valor }));
}

export default { listarActivosFundicion, getLecturasUltimaHora, getEventosUltimaHora, toSerieRecharts };
