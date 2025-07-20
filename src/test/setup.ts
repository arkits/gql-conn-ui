import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock Monaco Editor since it's not available in test environment
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor Mock')),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sun: vi.fn(() => React.createElement('div', { 'data-testid': 'sun-icon' }, 'Sun Icon')),
  Moon: vi.fn(() => React.createElement('div', { 'data-testid': 'moon-icon' }, 'Moon Icon')),
  Menu: vi.fn(() => React.createElement('div', { 'data-testid': 'menu-icon' }, 'Menu Icon')),
  ChevronRight: vi.fn(() => React.createElement('div', { 'data-testid': 'chevron-right-icon' }, 'ChevronRight Icon')),
  Trash2: vi.fn(() => React.createElement('div', { 'data-testid': 'trash-icon' }, 'Trash2 Icon')),
  Plus: vi.fn(() => React.createElement('div', { 'data-testid': 'plus-icon' }, 'Plus Icon')),
  X: vi.fn(() => React.createElement('div', { 'data-testid': 'x-icon' }, 'X Icon')),
  Settings: vi.fn(() => React.createElement('div', { 'data-testid': 'settings-icon' }, 'Settings Icon')),
  Check: vi.fn(() => React.createElement('div', { 'data-testid': 'check-icon' }, 'Check Icon')),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));