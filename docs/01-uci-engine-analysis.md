# UCI engine analysis

Analysing positions with an UCI engine is done using the useUciEngine hook.

The hook takes an engine worker as an argument. The worker should be a traditional worker that imports the Stockfish WASM module. The worker should also have the following interface:

- onmessage: (event: MessageEvent) => void
- postMessage: (message: string) => void
- terminate: () => void

The interface the useUciEngine hook returns has the following:

- analyse(fen: string, options: AnalysisOptions): Promise<AnalysisResult[]>
- stop(): void
- isReady: boolean

## AnalysisOptions

The AnalysisOptions interface has the following properties:

- depth: number (optional)
- time: number (optional)
- numVariations: number (optional, defaults to 1)

Specifying no options lets the engine run in infinite analysis mode. This is useful for getting the best move for a position.

## AnalysisResult

The AnalysisResult interface has the following properties:

- depth: number
- seldepth: number
- time: number
- nodes: number
- nps: number
- scoreType: "cp" | "mate"
- score: number
- pv: string[]

