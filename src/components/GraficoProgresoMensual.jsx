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

  const ancho = 820;
  const alto = 360; // espacio extra para leyendas y títulos
  const margin = { top: 24, right: 20, bottom: 70, left: 74 };

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
    const baseY = margin.top + h;

    const x = (i) => margin.left + (puntos.length <= 1 ? 0 : (i / (puntos.length - 1)) * w);
    const y = (valor) => margin.top + h - (valor / series.maxY) * h;

    const coordenadas = puntos.map((p, i) => {
      const fecha = new Date(`${p.etiqueta}-01T00:00:00`);
      const etiquetaMes = fecha.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
      return {
        etiqueta: p.etiqueta,
        etiquetaMes,
        x: x(i),
        yMeta: y(p.valorMeta),
        yReal: y(p.valorReal),
        valorMeta: p.valorMeta,
        valorReal: p.valorReal
      };
    });

    const pathMeta = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yMeta}`).join(' ');
    const pathReal = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yReal}`).join(' ');

    const areaReal = coordenadas.length
      ? `M ${coordenadas[0].x} ${baseY} ${coordenadas.map(c => `L ${c.x} ${c.yReal}`).join(' ')} L ${coordenadas[coordenadas.length - 1].x} ${baseY} Z`
      : '';

    return { x, y, pathMeta, pathReal, areaReal, coordenadas, w, h, baseY };
  }, [puntos, series.maxY, margin.left, margin.right, margin.top, margin.bottom, ancho, alto]);

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

        <defs>
          <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>

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

        {/* Area real */}
        {plot.areaReal && <path d={plot.areaReal} fill="url(#realGradient)" opacity="0.8" aria-hidden="true" />}

        {/* Paths */}
        <path d={plot.pathMeta} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 4" aria-hidden="true" />
        <path d={plot.pathReal} fill="none" stroke="#ea580c" strokeWidth={2.5} aria-hidden="true" />

        {/* Points */}
        {plot.coordenadas.map((c) => (
          <g key={c.etiqueta}>
            <circle cx={c.x} cy={c.yMeta} r={4} fill="#fff" stroke="#2563eb" strokeWidth={1.5}>
              <title>{`Meta ${c.valorMeta} (${c.etiqueta})`}</title>
            </circle>
            <circle cx={c.x} cy={c.yReal} r={4} fill="#ea580c" stroke="#fff" strokeWidth={1}>
              <title>{`Real ${c.valorReal} (${c.etiqueta})`}</title>
            </circle>
            <text x={c.x} y={alto - margin.bottom + 18} fontSize={10} textAnchor="middle" fill="#6b7280" fontWeight="500">
              {c.etiquetaMes.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text x={margin.left + plot.w / 2} y={alto - 16} fontSize={12} textAnchor="middle" fill="#4b5563" fontWeight="500">
          Mes del periodo seleccionado
        </text>
        <text
          transform={`translate(${24}, ${margin.top + plot.h / 2}) rotate(-90)`}
          fontSize={12}
          textAnchor="middle"
          fill="#4b5563"
          fontWeight="500"
        >
          Promedio de emisiones (tCO₂e)
        </text>

        {/* Legend */}
        <g transform={`translate(${margin.left}, ${alto - 40})`} aria-hidden="false">
          <g>
            <rect x={0} y={0} width={14} height={6} fill="#2563eb" />
            <text x={20} y={6} fontSize={12} fill="#374151">Meta</text>
          </g>
          <g transform="translate(90,0)">
            <rect x={0} y={0} width={14} height={6} fill="#ea580c" />
            <text x={20} y={6} fontSize={12} fill="#374151">Real</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
