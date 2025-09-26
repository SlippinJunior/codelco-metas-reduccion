import '@testing-library/jest-dom';
import { createHash, webcrypto } from 'crypto';
import { TextEncoder } from 'util';

// Mock para localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock para fetch (si se necesita en el futuro)
global.fetch = jest.fn();

// Mock para window.URL.createObjectURL (para exportación de archivos)
window.URL.createObjectURL = jest.fn(() => 'mock-url');
window.URL.revokeObjectURL = jest.fn();

// Configuración para tests de componentes que usan date-fns
import { setDefaultOptions } from 'date-fns';
import { es } from 'date-fns/locale';

setDefaultOptions({ locale: es });

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

const ensureSubtle = target => {
  if (target?.subtle) {
    return target;
  }
  return {
    ...target,
    subtle: {
      async digest(algorithm, data) {
        return global.__digestSha256(algorithm, data);
      }
    }
  };
};

if (!global.__digestSha256) {
  global.__digestSha256 = async (algorithm, data) => {
    const algo = typeof algorithm === 'string' ? algorithm.toUpperCase() : `${algorithm?.name}`.toUpperCase();
    if (algo !== 'SHA-256') {
      throw new Error(`Algoritmo no soportado en polyfill: ${algorithm}`);
    }
    let buffer;
    if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(new Uint8Array(data));
    } else if (ArrayBuffer.isView(data)) {
      buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    } else {
      buffer = Buffer.from(data);
    }
    const hash = createHash('sha256');
    hash.update(buffer);
    return Uint8Array.from(hash.digest()).buffer;
  };
}

if (!global.crypto) {
  global.crypto = webcrypto ?? {};
}
global.crypto = ensureSubtle(global.crypto);

if (typeof window !== 'undefined') {
  if (!window.crypto) {
    window.crypto = global.crypto;
  }
  window.crypto = ensureSubtle(window.crypto);
}
