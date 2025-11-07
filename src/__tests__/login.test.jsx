import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import Login from '../pages/Login';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

test('Header shows login link when no user', () => {
  localStorage.removeItem('currentUser');
  render(<MemoryRouter><Header /></MemoryRouter>);
  expect(screen.getByText(/Iniciar/i)).toBeInTheDocument();
});

test('Login muestra usuarios predefinidos según historias de usuario', () => {
  render(<MemoryRouter><Login /></MemoryRouter>);

  // Verificar que el selector existe
  const selector = screen.getByRole('combobox');
  expect(selector).toBeInTheDocument();

  // Verificar que existen los usuarios clave mencionados en el README
  const selectorUtils = within(selector);
  expect(selectorUtils.getByRole('option', { name: /María Torres/i })).toBeInTheDocument();
  expect(selectorUtils.getByRole('option', { name: /Ana Silva/i })).toBeInTheDocument();
  expect(selectorUtils.getByRole('option', { name: /Pedro Gómez/i })).toBeInTheDocument();
  expect(selectorUtils.getByRole('option', { name: /Lucía Méndez/i })).toBeInTheDocument();

  const optionsText = selectorUtils
    .getAllByRole('option')
    .map(opt => opt.textContent || '')
    .join(' ');

  expect(optionsText).toMatch(/analista-sustentabilidad/i);
  expect(optionsText).toMatch(/auditor/i);
  expect(optionsText).toMatch(/operario/i);
  expect(optionsText).toMatch(/control-interno/i);
});

test('Login almacena usuario con nombre y rol en localStorage', () => {
  localStorage.clear();
  mockNavigate.mockClear();

  render(<MemoryRouter><Login /></MemoryRouter>);

  // Seleccionar un usuario específico
  const selector = screen.getByRole('combobox');
  fireEvent.change(selector, { target: { value: 'ana.silva' } });

  // Verificar que se muestra la descripción correcta
  expect(screen.getByText(/HU-R07/i)).toBeInTheDocument();

  // Submit
  const btnEntrar = screen.getByRole('button', { name: /Entrar/i });
  fireEvent.click(btnEntrar);

  // Verificar localStorage
  const storedUser = JSON.parse(localStorage.getItem('currentUser'));
  expect(storedUser).toMatchObject({
    usuario: 'ana.silva',
    nombre: 'Ana Silva',
    rol: 'auditor'
  });

  // Verificar que navegó al dashboard
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
});
