export function media(values) {
  if (!values || values.length === 0) return null;
  const sum = values.reduce((s, v) => s + v, 0);
  return sum / values.length;
}

export function maximo(values) {
  if (!values || values.length === 0) return null;
  return Math.max(...values);
}

export function percentil(values, p) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  const frac = rank - lower;
  return sorted[lower] + frac * (sorted[upper] - sorted[lower]);
}

export default { media, maximo, percentil };
