import '@testing-library/jest-dom';

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
