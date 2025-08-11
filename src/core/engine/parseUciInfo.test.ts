import { describe, it, expect } from 'vitest';
import { parseUciInfo } from './uci';

describe('parseUciInfo', () => {
  it('should parse complete UCI info message', () => {
    const message =
      'info depth 10 seldepth 12 time 1000 nodes 50000 nps 50000 score cp 25 pv e2e4 e7e5 Nf3';
    const result = parseUciInfo(message);

    expect(result).toEqual({
      depth: 10,
      seldepth: 12,
      time: 1000,
      nodes: 50000,
      nps: 50000,
      scoreType: 'cp',
      score: 25,
      pv: ['e2e4', 'e7e5', 'Nf3'],
    });
  });

  it('should parse UCI info message with mate score', () => {
    const message = 'info depth 5 time 500 nodes 10000 score mate 3 pv Qh5 g6 Qxf7';
    const result = parseUciInfo(message);

    expect(result).toEqual({
      depth: 5,
      time: 500,
      nodes: 10000,
      scoreType: 'mate',
      score: 3,
      pv: ['Qh5', 'g6', 'Qxf7'],
    });
  });

  it('should parse UCI info message with multipv', () => {
    const message = 'info depth 8 multipv 2 time 800 nodes 40000 score cp -15 pv d2d4 d7d5';
    const result = parseUciInfo(message);

    expect(result).toEqual({
      depth: 8,
      multipv: 2,
      time: 800,
      nodes: 40000,
      scoreType: 'cp',
      score: -15,
      pv: ['d2d4', 'd7d5'],
    });
  });

  it('should return null for incomplete UCI info message', () => {
    const message = 'info depth 5 time 500';
    const result = parseUciInfo(message);

    expect(result).toBeNull();
  });

  it('should return null for message without required fields', () => {
    const message = 'info time 500 nodes 10000';
    const result = parseUciInfo(message);

    expect(result).toBeNull();
  });
});
