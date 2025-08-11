import { renderHook, act } from '@testing-library/react';
import { useUciEngine } from './useUciEngine';
import { createMockUciProtocol } from '~/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { EnhancedUseEngineWorker } from './engines/useStockfish';

describe('useUciEngine', () => {
  let mockEngineWorker: EnhancedUseEngineWorker;
  let mockOnAnalysisUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAnalysisUpdate = vi.fn();

    // Create fresh mock for each test
    mockEngineWorker = {
      ready: true,
      output: [],
      send: vi.fn(),
      uci: createMockUciProtocol(),
    };
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    expect(result.current.isReady).toBe(true);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.currentResults).toEqual([]);
  });

  it('should start analysis successfully', async () => {
    const { result } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    await act(async () => {
      await result.current.startAnalysis(fen, { depth: 15, numVariations: 3 });
    });

    expect(mockEngineWorker.uci.isReady).toHaveBeenCalled();
    expect(mockEngineWorker.uci.setPosition).toHaveBeenCalledWith(fen);
    expect(mockEngineWorker.uci.setOption).toHaveBeenCalledWith('MultiPV', 3);
    expect(mockEngineWorker.uci.startAnalysis).toHaveBeenCalledWith({ depth: 15 });
    expect(result.current.isAnalyzing).toBe(true);
  });

  it('should stop analysis successfully', async () => {
    const { result } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    // Start analysis first
    await act(async () => {
      await result.current.startAnalysis(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    expect(result.current.isAnalyzing).toBe(true);

    // Stop analysis
    await act(async () => {
      await result.current.stopAnalysis();
    });

    expect(mockEngineWorker.uci.stopAnalysis).toHaveBeenCalled();
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should process UCI info messages and update results', async () => {
    const { result, rerender } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    // Start analysis to set running state
    await act(async () => {
      await result.current.startAnalysis(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    // Simulate UCI info message by updating the output and triggering rerender
    act(() => {
      mockEngineWorker.output = [
        'info depth 10 seldepth 12 time 1000 nodes 50000 nps 50000 score cp 25 pv e2e4 e7e5',
      ];
    });

    // Force rerender to trigger useEffect
    rerender();

    expect(result.current.currentResults).toHaveLength(1);
    expect(result.current.currentResults[0]).toMatchObject({
      depth: 10,
      seldepth: 12,
      time: 1000,
      nodes: 50000,
      nps: 50000,
      scoreType: 'cp',
      score: 25,
      pv: ['e2e4', 'e7e5'],
    });
  });

  it('should handle bestmove message and complete analysis', async () => {
    const { result, rerender } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    // Start analysis
    await act(async () => {
      await result.current.startAnalysis(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    expect(result.current.isAnalyzing).toBe(true);

    // Simulate bestmove message by creating a new array reference
    act(() => {
      mockEngineWorker.output = [...mockEngineWorker.output, 'bestmove e2e4 ponder e7e5'];
    });

    // Force rerender to trigger useEffect that processes the output
    rerender();

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should throw error when engine is not ready', async () => {
    mockEngineWorker.ready = false;

    const { result } = renderHook(() =>
      useUciEngine({
        engineWorker: mockEngineWorker,
        onAnalysisUpdate: mockOnAnalysisUpdate,
      })
    );

    await act(async () => {
      await expect(
        result.current.startAnalysis('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      ).rejects.toThrow('Engine is not ready');
    });
  });
});
