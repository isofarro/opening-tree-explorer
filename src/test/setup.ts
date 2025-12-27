import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Worker for testing
const MockWorker = function (this: any, url: string | URL, _options?: WorkerOptions) {
  this.url = url;
  this.postMessage = vi.fn();
  this.terminate = vi.fn();
  this.onmessage = null;
  this.onerror = null;
  this.onmessageerror = null;
  this.addEventListener = vi.fn();
  this.removeEventListener = vi.fn();
  this.dispatchEvent = vi.fn();
} as any;

// Assign the mock to global Worker
global.Worker = MockWorker;

// Use Vitest's fake timers instead of manual setTimeout mocking
vi.useFakeTimers();
