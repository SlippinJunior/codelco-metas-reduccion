import React from 'react';
import { formatearFecha } from '../utils/helpers';

const LAT_BOUNDS = { min: -56, max: -17 };
const LNG_BOUNDS = { min: -76, max: -66 };

const ESTADO_COLORES = {
  alta: '#0ea5e9',
  operativo: '#16a34a',
  mantenimiento: '#f59e0b',
  baja: '#dc2626'
};

const normalizar = (valor, min, max) => {
  if (!Number.isFinite(valor)) return 0.5;
  return Math.min(1, Math.max(0, (valor - min) / (max - min)));
};

const MapaSensor = ({ sensor }) => {
  if (!sensor?.coordenadas) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        Coordenadas no disponibles para este sensor.
      </div>
    );
  }

  const lat = Number(sensor.coordenadas.lat);
  const lng = Number(sensor.coordenadas.lng);

  const x = normalizar(lng, LNG_BOUNDS.min, LNG_BOUNDS.max);
  const y = 1 - normalizar(lat, LAT_BOUNDS.min, LAT_BOUNDS.max);
  const estadoColor = ESTADO_COLORES[sensor.estado] || '#334155';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-codelco-dark">Ubicación aproximada</h3>
        <p className="text-xs text-slate-500">
          Georreferenciación referencial sobre mapa regional.
        </p>
      </div>

      <div className="relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <svg viewBox="0 0 300 360" className="w-full h-64">
          <defs>
            <linearGradient id="cordillera" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#bfdbfe" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="300" height="360" fill="url(#cordillera)" />
          <path
            d="M90 20 L120 80 L110 150 L130 210 L120 280 L140 340"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="6"
            strokeLinecap="round"
            strokeOpacity="0.2"
          />
          <path
            d="M150 10 L180 70 L175 140 L195 210 L185 300 L200 350"
            fill="none"
            stroke="#0f172a"
            strokeWidth="6"
            strokeLinecap="round"
            strokeOpacity="0.15"
          />
          <circle
            cx={40 + x * 220}
            cy={40 + y * 280}
            r="10"
            fill={estadoColor}
            stroke="#ffffff"
            strokeWidth="3"
          />
          <text
            x={40 + x * 220}
            y={30 + y * 280}
            textAnchor="middle"
            fontSize="10"
            fill="#0f172a"
          >
            {sensor.nombre.slice(0, 20)}
          </text>
        </svg>
      </div>

      <div className="px-4 py-3 text-sm text-slate-600 space-y-1 border-t border-slate-200">
        <p>
          <span className="font-semibold text-slate-700">Lat/Lon:</span>{' '}
          {Number.isFinite(lat) ? lat.toFixed(5) : 'N/D'} ,{' '}
          {Number.isFinite(lng) ? lng.toFixed(5) : 'N/D'}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Último heartbeat:</span>{' '}
          {sensor.ultimaTransmision ? formatearFecha(sensor.ultimaTransmision, true) : 'Sin registros'}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Estado:</span>{' '}
          <span style={{ color: estadoColor }}>
            {sensor.estado}
          </span>
        </p>
      </div>
    </div>
  );
};

export default MapaSensor;
