import { renderHook, act } from '@testing-library/react';
import { useEngineWorker } from './useEngineWorker';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Worker - avoiding all parameter properties to fix erasableSyntaxOnly error
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  url: string;

  constructor(url: string) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
  }

  // Helper method to simulate messages from worker
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  // Helper method to simulate errors
  simulateError(error: any) {
    if (this.onerror) {
      this.onerror({ error } as ErrorEvent);
    }
  }
}

// Create a spy version of MockWorker
const MockWorkerSpy = vi.fn().mockImplementation((url: string) => new MockWorker(url));

vi.stubGlobal('Worker', MockWorkerSpy);

describe('useEngineWorker', () => {
  let mockWorker: MockWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MockWorkerSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultOptions = {
    workerPath: '/test/worker.js',
    initCommand: 'uci',
    readyResponsePattern: 'uciok',
    maxRestarts: 3,
    healthCheckInterval: 5000,
    healthCheckTimeout: 2000,
    maxOutputMessages: 100,
  };

  it('should initialize worker and set ready state when receiving ready response', async () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    expect(result.current.ready).toBe(false);
    expect(result.current.alive).toBe(true);

    // Get the created worker instance
    mockWorker = MockWorkerSpy.mock.results[0].value;

    // Simulate worker ready response
    act(() => {
      mockWorker.simulateMessage('uciok');
    });

    expect(result.current.ready).toBe(true);
  });

  it('should send commands to worker', () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    mockWorker = MockWorkerSpy.mock.results[0].value;

    act(() => {
      result.current.send('position startpos');
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
  });

  it('should collect output messages', () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    mockWorker = MockWorkerSpy.mock.results[0].value;

    act(() => {
      mockWorker.simulateMessage('info depth 1');
      mockWorker.simulateMessage('info depth 2');
    });

    expect(result.current.output).toEqual(['info depth 1', 'info depth 2']);
  });

  it('should limit output messages to maxOutputMessages', () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    mockWorker = MockWorkerSpy.mock.results[0].value;

    // Send more messages than the limit
    act(() => {
      for (let i = 0; i < 105; i++) {
        mockWorker.simulateMessage(`info depth ${i}`);
      }
    });

    expect(result.current.output.length).toBe(100);
    expect(result.current.output[0]).toBe('info depth 5'); // Should have dropped first 5
  });

  it('should restart worker on error', async () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    const firstWorker = MockWorkerSpy.mock.results[0].value;

    act(() => {
      firstWorker.simulateError(new Error('Worker crashed'));
    });

    // Wait for the restart delay (1 second)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should create a new worker
    expect(MockWorkerSpy).toHaveBeenCalledTimes(2);
    expect(firstWorker.terminate).toHaveBeenCalled();
  });

  it('should perform health checks', () => {
    const { result } = renderHook(() => useEngineWorker(defaultOptions));

    mockWorker = MockWorkerSpy.mock.results[0].value;

    // Set worker as ready first
    act(() => {
      mockWorker.simulateMessage('uciok');
    });

    // Clear previous calls to focus on health check
    mockWorker.postMessage.mockClear();

    // Fast-forward to trigger health check (5 minutes + health check interval)
    act(() => {
      vi.advanceTimersByTime(300000 + 5000); // 5 minutes + 5 seconds
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');
  });

  it('should terminate worker on unmount', () => {
    const { result, unmount } = renderHook(() => useEngineWorker(defaultOptions));

    mockWorker = MockWorkerSpy.mock.results[0].value;

    unmount();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
