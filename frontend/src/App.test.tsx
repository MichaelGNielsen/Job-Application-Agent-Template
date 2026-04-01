/**
 * Job Application Agent MGN - Frontend Unit Tests
 * Validerer UI-rendering og tab-navigation (v4.8.0).
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
    if (url === '/api/version') return Promise.resolve({ json: () => Promise.resolve({ version: '4.8.0', instance: 'TEMPLATE', model: 'gemini-2.0-flash' }) });
    if (url === '/api/brutto') return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
    return Promise.resolve({ json: () => Promise.resolve({ content: '' }) });
});

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

test('renders config tabs with correct labels', async () => {
  render(<App />);
  // Check for the main tabs using the current v4.8.0 labels
  expect(screen.getByText(/Generer/i)).toBeDefined();
  expect(screen.getByText(/Master CV/i)).toBeDefined();
  expect(screen.getByText(/AI Instrukser/i)).toBeDefined();
  expect(screen.getByText(/Layout/i)).toBeDefined();
});
