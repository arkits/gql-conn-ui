import React from 'react';
import { vi } from 'vitest';

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Sun: vi.fn(() => React.createElement('div', { 'data-testid': 'sun-icon' }, 'Sun Icon')),
    Moon: vi.fn(() => React.createElement('div', { 'data-testid': 'moon-icon' }, 'Moon Icon')),
    Menu: vi.fn(() => React.createElement('div', { 'data-testid': 'menu-icon' }, 'Menu Icon')),
    ChevronRight: vi.fn(() => React.createElement('div', { 'data-testid': 'chevron-right-icon' }, 'ChevronRight Icon')),
    Trash2: vi.fn(() => React.createElement('div', { 'data-testid': 'trash-icon' }, 'Trash2 Icon')),
    Plus: vi.fn(() => React.createElement('div', { 'data-testid': 'plus-icon' }, 'Plus Icon')),
    X: vi.fn(() => React.createElement('div', { 'data-testid': 'x-icon' }, 'X Icon')),
    Settings: vi.fn(() => React.createElement('div', { 'data-testid': 'settings-icon' }, 'Settings Icon')),
    Check: vi.fn(() => React.createElement('div', { 'data-testid': 'check-icon' }, 'Check Icon')),
    Clipboard: vi.fn(() => React.createElement('div', { 'data-testid': 'clipboard-icon' }, 'Clipboard Icon')),
    HelpCircle: vi.fn(() => React.createElement('div', { 'data-testid': 'help-circle-icon' }, 'HelpCircle Icon')),
  };
});
