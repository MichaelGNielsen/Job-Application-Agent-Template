/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 * 
 * BEMÆRK: Denne kode anvender AI til generering og behandling.
 * Brugeren skal selv verificere, at resultatet er som forventet.
 * Softwaren leveres "som den er", uden nogen form for garanti.
 * Brug af softwaren sker på eget ansvar.
 */

import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test, vi } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Mock fetch for initial data loading
global.fetch = vi.fn().mockImplementation((url) => {
    if (url === '/api/version') return Promise.resolve({ json: () => Promise.resolve({ version: '3.7.0', instance: 'MGN' }) });
    if (url === '/api/brutto') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    if (url === '/api/config/instructions') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    if (url === '/api/config/layout') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    return Promise.resolve({ json: () => Promise.resolve({}) });
});

test('renders headline', async () => {
  render(<App />);
  // Bruger getAllByText da navnet nu findes både i header og footer
  const headlines = screen.getAllByText(/Job Application Agent/i);
  expect(headlines.length).toBeGreaterThan(0);
});

test('renders action button', async () => {
  render(<App />);
  const button = screen.getByText(/Start Automatisering/i);
  expect(button).toBeDefined();
});

test('renders config tabs', async () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Master CV/i })).toBeDefined();
  // Navnet er ændret til 🧠 AI Prompts
  expect(screen.getByText(/AI Prompts/i)).toBeDefined();
  // Bruger getAllByText da "Design" også findes i footeren eller i andre tags
  const designElements = screen.getAllByText(/Design/i);
  expect(designElements.length).toBeGreaterThan(0);
});
