import type { AnalysisResult } from './types';

/**
 * Parse UCI info messages into structured analysis results
 * @param message - The UCI info message string
 * @returns Parsed analysis result or null if incomplete
 */
export function parseUciInfo(message: string): AnalysisResult | null {
  const parts = message.split(' ');
  const result: Partial<AnalysisResult & { multipv?: number }> = {};

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    switch (part) {
      case 'depth':
        result.depth = parseInt(parts[i + 1]);
        break;
      case 'seldepth':
        result.seldepth = parseInt(parts[i + 1]);
        break;
      case 'time':
        result.time = parseInt(parts[i + 1]);
        break;
      case 'nodes':
        result.nodes = parseInt(parts[i + 1]);
        break;
      case 'nps':
        result.nps = parseInt(parts[i + 1]);
        break;
      case 'multipv':
        result.multipv = parseInt(parts[i + 1]);
        break;
      case 'score':
        const scoreType = parts[i + 1];
        const scoreValue = parseInt(parts[i + 2]);
        if (scoreType === 'cp') {
          result.scoreType = 'cp';
          result.score = scoreValue;
        } else if (scoreType === 'mate') {
          result.scoreType = 'mate';
          result.score = scoreValue;
        }
        break;
      case 'pv':
        result.pv = parts.slice(i + 1);
        break;
    }
  }

  // Only return if we have essential data
  if (result.depth !== undefined && result.score !== undefined && result.scoreType && result.pv) {
    return result as AnalysisResult;
  }

  return null;
}
