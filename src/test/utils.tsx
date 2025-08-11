import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Custom render function for testing React components
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock engine worker for testing
export const createMockEngineWorker = () => {
  const mockWorker = {
    worker: null as Worker | null, // Add missing worker property
    ready: true,
    alive: true,
    output: [] as string[],
    send: vi.fn(),
    restart: vi.fn(),
    terminate: vi.fn(),
  };
  return mockWorker;
};

// Mock UCI protocol for testing
export const createMockUciProtocol = () => {
  return {
    sendCommand: vi.fn().mockResolvedValue([]),
    isReady: vi.fn().mockResolvedValue(true),
    setPosition: vi.fn().mockResolvedValue(undefined),
    setOption: vi.fn().mockResolvedValue(undefined),
    startAnalysis: vi.fn().mockResolvedValue(undefined),
    stopAnalysis: vi.fn().mockResolvedValue(undefined),
    output: [],
    ready: true,
  };
};
