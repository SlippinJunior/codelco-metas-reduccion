/**
 * servicioPrediccionIA.js
 * Prediccion simple de desvios usando un modelo lineal entrenado sobre datos simulados.
 * Cumple con HU-R12 para fines demonstrativos.
 */

const FEATURE_INFO = [
  {
    key: 'intensidadEnergetica',
    label: 'Intensidad energetica (MWh/ton Cu)',
    descripcion: 'Mayor intensidad implica mas consumo energetico por tonelada producida.'
  },
  {
    key: 'factorEmision',
    label: 'Factor de emission (tCO2e/MWh)',
    descripcion: 'Representa cuantas emisiones se generan por cada MWh consumido.'
  },
  {
    key: 'progresoMeta',
    label: 'Avance de la meta (%)',
    descripcion: 'Progreso acumulado vs. meta anual de reduccion.'
  }
];

const DATOS_SIMULADOS = [
  { mes: '2023-01', intensidadEnergetica: 0.92, factorEmision: 0.41, progresoMeta: 24, desvio: 4.1 },
  { mes: '2023-02', intensidadEnergetica: 0.88, factorEmision: 0.40, progresoMeta: 27, desvio: 3.4 },
  { mes: '2023-03', intensidadEnergetica: 0.85, factorEmision: 0.39, progresoMeta: 30, desvio: 2.8 },
  { mes: '2023-04', intensidadEnergetica: 0.83, factorEmision: 0.38, progresoMeta: 34, desvio: 2.1 },
  { mes: '2023-05', intensidadEnergetica: 0.82, factorEmision: 0.36, progresoMeta: 38, desvio: 1.5 },
  { mes: '2023-06', intensidadEnergetica: 0.80, factorEmision: 0.35, progresoMeta: 41, desvio: 1.1 },
  { mes: '2023-07', intensidadEnergetica: 0.81, factorEmision: 0.36, progresoMeta: 45, desvio: 1.4 },
  { mes: '2023-08', intensidadEnergetica: 0.79, factorEmision: 0.35, progresoMeta: 49, desvio: 0.9 },
  { mes: '2023-09', intensidadEnergetica: 0.78, factorEmision: 0.34, progresoMeta: 53, desvio: 0.6 },
  { mes: '2023-10', intensidadEnergetica: 0.77, factorEmision: 0.34, progresoMeta: 57, desvio: 0.2 },
  { mes: '2023-11', intensidadEnergetica: 0.76, factorEmision: 0.33, progresoMeta: 61, desvio: -0.3 },
  { mes: '2023-12', intensidadEnergetica: 0.75, factorEmision: 0.32, progresoMeta: 65, desvio: -0.7 }
];

const THRESHOLD_MAPE = 12; // porcentaje maximo permitido en la demo

let modeloCache = null;

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function multiplyMatrices(a, b) {
  const result = Array.from({ length: a.length }, () => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b[0].length; j += 1) {
      let sum = 0;
      for (let k = 0; k < b.length; k += 1) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map(row => row.reduce((acc, value, idx) => acc + value * vector[idx], 0));
}

function invertMatrix(matrix) {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let i = 0; i < n; i += 1) {
    let maxRow = i;
    for (let k = i + 1; k < n; k += 1) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    if (Math.abs(augmented[maxRow][i]) < 1e-9) {
      throw new Error('Matrix inversion failed: matrix is singular');
    }
    if (maxRow !== i) {
      const temp = augmented[i];
      augmented[i] = augmented[maxRow];
      augmented[maxRow] = temp;
    }

    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j += 1) {
      augmented[i][j] /= pivot;
    }

    for (let k = 0; k < n; k += 1) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j += 1) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

function entrenarModelo() {
  if (modeloCache) {
    return modeloCache;
  }

  const X = DATOS_SIMULADOS.map(dato => [
    1,
    dato.intensidadEnergetica,
    dato.factorEmision,
    dato.progresoMeta
  ]);
  const y = DATOS_SIMULADOS.map(dato => dato.desvio);

  const Xt = transpose(X);
  const XtX = multiplyMatrices(Xt, X);
  const XtXInv = invertMatrix(XtX);
  const XtY = multiplyMatrixVector(Xt, y);
  const pesos = multiplyMatrixVector(XtXInv, XtY);

  const predicciones = X.map(row => row.reduce((acc, value, idx) => acc + value * pesos[idx], 0));
  const erroresAbsolutos = predicciones.map((pred, idx) => Math.abs(pred - y[idx]));

  const mae = erroresAbsolutos.reduce((acc, val) => acc + val, 0) / erroresAbsolutos.length;
  const mape = predicciones.reduce((acc, pred, idx) => {
    const real = y[idx];
    const denom = Math.max(Math.abs(real), 0.5);
    return acc + Math.abs((real - pred) / denom);
  }, 0) / predicciones.length * 100;

  const pesosVariables = pesos.slice(1);
  const totalImportancia = pesosVariables.reduce((acc, peso) => acc + Math.abs(peso), 0);
  const explicacion = FEATURE_INFO.map((feature, idx) => ({
    key: feature.key,
    label: feature.label,
    descripcion: feature.descripcion,
    peso: pesosVariables[idx],
    importancia: totalImportancia === 0 ? 0 : Math.abs(pesosVariables[idx]) / totalImportancia
  })).sort((a, b) => b.importancia - a.importancia);

  modeloCache = {
    pesos,
    mae,
    mape,
    umbral: {
      mapeMaximo: THRESHOLD_MAPE,
      cumple: mape <= THRESHOLD_MAPE
    },
    datos: DATOS_SIMULADOS,
    explicacion,
    features: FEATURE_INFO
  };

  return modeloCache;
}

export function obtenerModeloPrediccion() {
  return entrenarModelo();
}

export function predecirDesvio(entrada) {
  const modelo = entrenarModelo();
  const vector = [
    1,
    Number(entrada.intensidadEnergetica) || 0,
    Number(entrada.factorEmision) || 0,
    Number(entrada.progresoMeta) || 0
  ];
  const prediccion = modelo.pesos.reduce((acc, peso, idx) => acc + peso * vector[idx], 0);
  return {
    success: true,
    prediccion,
    mensaje:
      prediccion > 1.5
        ? 'Riesgo alto: se proyecta un desvio significativo.'
        : prediccion > 0.5
          ? 'Alerta: monitorear ajustes operacionales.'
          : 'Escenario controlado segun los supuestos ingresados.'
  };
}

export function obtenerExplicacionVariables() {
  const modelo = entrenarModelo();
  return modelo.explicacion;
}

export function obtenerDatosEntrenamiento() {
  const modelo = entrenarModelo();
  return modelo.datos;
}

export default {
  obtenerModeloPrediccion,
  predecirDesvio,
  obtenerExplicacionVariables,
  obtenerDatosEntrenamiento
};
