import type { MicroService, ServiceConfig } from './service-types';

export const MicroServices = {
  OPENING_TREES: 'openingTrees',
  ANALYSIS: 'analysis',
};

export const MicroServiceConfig: Record<MicroService, ServiceConfig> = {
  [MicroServices.OPENING_TREES]: {
    // host: 'http://localhost:2882',
    host: 'https://trees.api.chessiq.net',
  },
  [MicroServices.ANALYSIS]: {
    host: 'https://analysis.api.chessiq.net',
  },
};
