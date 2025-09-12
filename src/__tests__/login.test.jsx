import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';

test('Header shows login link when no user', () => {
  localStorage.removeItem('currentUser');
  render(<MemoryRouter><Header /></MemoryRouter>);
  expect(screen.getByText(/Iniciar/i)).toBeInTheDocument();
});
