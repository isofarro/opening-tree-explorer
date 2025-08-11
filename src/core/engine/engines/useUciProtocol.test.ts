import { renderHook, act } from '@testing-library/react';
import { useUciProtocol } from './useUciProtocol';
import { createMockEngineWorker } from '~/test/utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useUciProtocol', () => {
  let mockEngineWorker: ReturnType<typeof createMockEngineWorker>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockEngineWorker = createMockEngineWorker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should send commands and resolve on expected response', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    // Start a command that expects 'readyok'
    const commandPromise = result.current.sendCommand('isready', 'readyok', 1000);

    // Simulate engine output and trigger rerender
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'readyok'];
    });

    // Force rerender to trigger the useEffect
    rerender();

    await expect(commandPromise).resolves.toEqual(['readyok']);
    expect(mockEngineWorker.send).toHaveBeenCalledWith('isready');
  });

  it('should handle isReady command', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    const isReadyPromise = result.current.isReady();

    // Simulate readyok response and trigger rerender
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'readyok'];
    });

    // Force rerender to trigger the useEffect
    rerender();

    await expect(isReadyPromise).resolves.toBe(true);
  });

  it('should timeout commands that do not receive expected response', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    const commandPromise = result.current.sendCommand('isready', 'readyok', 100);

    // Fast-forward past timeout
    act(() => {
      vi.advanceTimersByTime(150);
    });

    await expect(commandPromise).rejects.toThrow('Command "isready" timed out');
  });

  it('should handle setPosition command', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    await result.current.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    expect(mockEngineWorker.send).toHaveBeenCalledWith(
      'position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
  });

  it('should handle setOption command', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    await result.current.setOption('MultiPV', 3);

    expect(mockEngineWorker.send).toHaveBeenCalledWith('setoption name MultiPV value 3');
  });

  it('should handle startAnalysis command with depth', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    await result.current.startAnalysis({ depth: 15 });

    expect(mockEngineWorker.send).toHaveBeenCalledWith('go depth 15');
  });

  it('should handle startAnalysis command with time', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    await result.current.startAnalysis({ time: 5000 });

    expect(mockEngineWorker.send).toHaveBeenCalledWith('go movetime 5000');
  });

  it('should handle startAnalysis command with infinite analysis', async () => {
    const { result } = renderHook(() => useUciProtocol(mockEngineWorker));

    await result.current.startAnalysis({ infinite: true });

    expect(mockEngineWorker.send).toHaveBeenCalledWith('go infinite');
  });

  it('should handle stopAnalysis command', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    const stopPromise = result.current.stopAnalysis();

    // Simulate stop response and trigger rerender
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'bestmove (none)'];
    });

    rerender();

    await expect(stopPromise).resolves.toBeUndefined();
  });

  it('should handle function-based expected responses', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    const commandPromise = result.current.sendCommand(
      'go depth 5',
      (msg) => msg.startsWith('bestmove'),
      1000
    );

    // Simulate bestmove response and trigger rerender
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'bestmove e2e4'];
    });

    rerender();

    await expect(commandPromise).resolves.toEqual(['bestmove e2e4']);
  });

  it('should clear pending commands on stop', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    // Start a command that will be cancelled - use an expected response so it becomes pending
    const commandPromise = result.current.sendCommand('position startpos', 'ok', 5000);

    // Start stop command - this will cancel the pending command
    const stopPromise = result.current.stopAnalysis();

    // The position command should be cancelled immediately when stopAnalysis is called
    await expect(commandPromise).rejects.toThrow('Cancelled due to stop command');

    // Simulate bestmove to complete stop
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'bestmove e2e4'];
    });

    rerender();

    await stopPromise;
  });

  it('should handle stop command with function-based expected responses', async () => {
    const { result, rerender } = renderHook(() => useUciProtocol(mockEngineWorker));

    const commandPromise = result.current.sendCommand(
      'stop',
      (message: string) => message.startsWith('bestmove') || message.includes('readyok'),
      1000
    );

    // Simulate bestmove response
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'bestmove e2e4 ponder e7e5'];
    });

    rerender();

    await expect(commandPromise).resolves.toEqual(['bestmove e2e4 ponder e7e5']);
  });
});
