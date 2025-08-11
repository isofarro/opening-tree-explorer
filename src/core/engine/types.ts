export interface AnalysisOptions {
  depth?: number;
  time?: number;
  numVariations?: number;
  nodes?: number;
  infinite?: boolean;
}

export interface AnalysisResult {
  depth: number;
  seldepth: number;
  time: number;
  nodes: number;
  nps: number;
  scoreType: 'cp' | 'mate';
  score: number;
  pv: string[];
  multipv?: number; // For multi-variation analysis
}

export interface UseEngineWorker {
  ready: boolean;
  output: string[];
  send: (cmd: string) => void;
}

export interface EngineMessage {
  type: 'ready' | 'output' | 'error';
  text?: string;
  message?: string;
}

export interface UseUciEngineResponse {
  analyse: (fen: string, options?: AnalysisOptions) => Promise<AnalysisResult[]>;
  stop: () => void;
  isReady: boolean;
}

export interface UciEngineWorker {
  onmessage: (event: MessageEvent) => void;
  onerror: (event: ErrorEvent) => void;
  postMessage: (message: string) => void;
  terminate: () => void;
}

// New enhanced interface for UCI protocol support
export interface EnhancedEngineWorker extends UseEngineWorker {
  uci: {
    sendCommand: (
      command: string,
      expectedResponse?: string | RegExp | ((message: string) => boolean),
      timeout?: number
    ) => Promise<string[]>;
    isReady: () => Promise<boolean>;
    setPosition: (fen: string) => Promise<void>;
    setOption: (name: string, value: string | number) => Promise<void>;
    startAnalysis: (options?: AnalysisOptions) => Promise<void>;
    stopAnalysis: () => Promise<void>;
  };
}
