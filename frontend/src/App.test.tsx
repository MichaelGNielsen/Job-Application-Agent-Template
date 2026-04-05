/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 */

import { render, screen, fireEvent } from '@testing-library/react';
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
vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
    if (url === '/api/version') return Promise.resolve({ json: () => Promise.resolve({ version: '5.6.0', instance: 'MGN' }) });
    if (url === '/api/brutto') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    if (url === '/api/config/instructions') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    if (url === '/api/config/layout') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    if (url === '/api/radar') return Promise.resolve({ json: () => Promise.resolve({ jobs: [], config: { radius: 30, baseCity: 'Aalborg' } }) });
    return Promise.resolve({ json: () => Promise.resolve({}) });
}));

test('renders headline', async () => {
  render(<App />);
  const headlines = screen.getAllByText(/Job Application Agent/i);
  expect(headlines.length).toBeGreaterThan(0);
});

test('renders action button', async () => {
  render(<App />);
  const button = screen.getByText(/Start Automatisering/i);
  expect(button).toBeDefined();
});

test('renders config tabs when opened', async () => {
  render(<App />);
  
  // Åbn kartoteket
  const configButton = screen.getByText(/System Kartotek/i);
  fireEvent.click(configButton);

  // Nu skal tabs være synlige
  expect(screen.getAllByText(/Master CV/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/AI Prompts/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Job-Radar/i)).toBeDefined();
  
  const designElements = screen.getAllByText(/Design/i);
  expect(designElements.length).toBeGreaterThan(0);
});
