import React, { useEffect, useRef, useMemo } from 'react';

/**
 * GraficoProgresoMensual
 * - datos: { agregadoPorMes: [{etiqueta, valorMeta, valorReal}], meses: [...] }
 * - inicioCarga: timestamp (ms) cuando inició la generación de datos
 * - onRendered: callback(totalMs)
 * Implementado con SVG simple para evitar dependencias pesadas.
 */
export default function GraficoProgresoMensual({ datos, inicioCarga, onRendered }) {
  const svgRef = useRef(null);

  const ancho = 800;
  const alto = 340; // espacio extra para leyenda
  const margin = { top: 20, right: 16, bottom: 40, left: 56 };

  const puntos = datos?.agregadoPorMes || [];

  const series = useMemo(() => {
    const valoresMeta = puntos.map(p => p.valorMeta);
    const valoresReal = puntos.map(p => p.valorReal);
    const maxY = Math.max(1, ...valoresMeta, ...valoresReal) * 1.1;
    return { valoresMeta, valoresReal, maxY };
  }, [puntos]);

  // Mapear índice a coordenadas
  const plot = useMemo(() => {
    const w = ancho - margin.left - margin.right;
    const h = alto - margin.top - margin.bottom;
    const n = Math.max(1, puntos.length - 1);

    function x(i) { return margin.left + (i / Math.max(1, Math.max(1, puntos.length - 1))) * w; }
    function y(v) { return margin.top + h - (v / series.maxY) * h; }

    const pathMeta = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valorMeta)}`).join(' ');
    const pathReal = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valorReal)}`).join(' ');

    return { x, y, pathMeta, pathReal, w, h };
  }, [puntos, series, margin.left, margin.right, margin.top, margin.bottom]);

  useEffect(() => {
    // Medir tiempo hasta que SVG está montado y pintado
    requestAnimationFrame(() => {
      const end = performance.now();
      const total = Math.round(end - (inicioCarga || end));
      if (onRendered) onRendered(total);
    });
  }, [datos, inicioCarga, onRendered]);

  return (
    <div className="overflow-x-auto">
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Gráfico de progreso mensual">
        {/* Background */}
        <rect x="0" y="0" width={ancho} height={alto} fill="#fff" rx="6" />

        {/* Y axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const v = (series.maxY / 4) * i;
          const yy = margin.top + (alto - margin.top - margin.bottom) - (i / 4) * (alto - margin.top - margin.bottom);
          return (
            <g key={i}>
              <line x1={margin.left} x2={ancho - margin.right} y1={yy} y2={yy} stroke="#e6e6e6" strokeWidth={1} />
              <text x={margin.left - 8} y={yy + 4} fontSize={10} textAnchor="end" fill="#374151">{v.toFixed(2)}</text>
            </g>
          );
        })}

  {/* Paths */}
  <path d={plot.pathMeta} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="4 2" aria-hidden="true" />
  <path d={plot.pathReal} fill="none" stroke="#ea580c" strokeWidth={2} aria-hidden="true" />

        {/* Points */}
        {puntos.map((p, i) => (
          <g key={p.etiqueta}>
            <circle cx={plot.x(i)} cy={plot.y(p.valorMeta)} r={3} fill="#2563eb" />
            <circle cx={plot.x(i)} cy={plot.y(p.valorReal)} r={3} fill="#ea580c" />
            <text x={plot.x(i)} y={alto - margin.bottom + 14} fontSize={10} textAnchor="middle" fill="#6b7280">{p.etiqueta.split('-')[1]}</text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${margin.left}, ${alto - 26})`} aria-hidden="false">
          <g>
            <rect x={0} y={0} width={12} height={6} fill="#2563eb" />
            <text x={18} y={6} fontSize={12} fill="#374151">Meta</text>
          </g>
          <g transform="translate(90,0)">
            <rect x={0} y={0} width={12} height={6} fill="#ea580c" />
            <text x={18} y={6} fontSize={12} fill="#374151">Real</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
