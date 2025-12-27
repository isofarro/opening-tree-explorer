# UCI Engine Analysis

Analyzing positions with a UCI engine is done using the `useUciEngine` hook in combination with the `useStockfish` hook.

## Usage

The `useUciEngine` hook takes a `UseEngineWorker` object as an argument, which is typically provided by the `useStockfish` hook:

```typescript
import { useStockfish, useUciEngine } from '~/core/engine';

const stockfishEngine = useStockfish();
const uciEngine = useUciEngine({
  engineWorker: stockfishEngine,
  onAnalysisUpdate: (result) => {
    // Handle real-time analysis updates
    console.log('Analysis update:', result);
  },
});
```

## UseEngineWorker Interface

The `UseEngineWorker` interface (returned by `useStockfish`) has the following properties:

- `ready: boolean` - Whether the engine is ready to receive commands
- `output: string[]` - Array of UCI output messages from the engine
- `send: (cmd: string) => void` - Function to send UCI commands to the engine

## UseUciEngine Interface

The `useUciEngine` hook returns an interface with the following properties:

- `startAnalysis: (fen: string, options?: AnalysisOptions) => void` - Start analyzing a position
- `stopAnalysis: () => void` - Stop the current analysis
- `isReady: boolean` - Whether the engine is ready
- `isAnalyzing: boolean` - Whether analysis is currently running
- `currentResults: AnalysisResult[]` - Current analysis results
- `onAnalysisUpdate?: (result: AnalysisResult) => void` - Optional callback for real-time updates

## AnalysisOptions

The `AnalysisOptions` interface has the following properties:

- `depth?: number` - Maximum search depth (optional)
- `time?: number` - Maximum search time in milliseconds (optional)
- `numVariations?: number` - Number of variations to analyze (optional, defaults to 1)

Specifying no options lets the engine run in infinite analysis mode. This is useful for getting the best move for a position.

## AnalysisResult

The `AnalysisResult` interface has the following properties:

- `depth: number` - Search depth reached
- `seldepth: number` - Selective search depth
- `time: number` - Time spent in milliseconds
- `nodes: number` - Number of nodes searched
- `nps: number` - Nodes per second
- `scoreType: "cp" | "mate"` - Score type (centipawns or mate)
- `score: number` - Evaluation score
- `pv: string[]` - Principal variation (best line of play)
- `multipv?: number` - Multi-variation index (for multi-PV analysis)

## Implementation Details

The current implementation uses Stockfish.js directly as a Web Worker. The `useStockfish` hook:

1. Creates a worker using `/stockfish/stockfish.js`
2. Handles UCI communication and output parsing
3. Manages the worker lifecycle
4. Provides a clean interface for the `useUciEngine` hook

The `useUciEngine` hook provides a higher-level interface for chess analysis, including:

- Real-time streaming of analysis results
- Promise-based analysis with proper cleanup
- Multi-variation support
- Automatic UCI protocol handling
