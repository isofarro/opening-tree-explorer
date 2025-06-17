import type { MicroService, ServiceConfig } from './service-types';

export const MicroServices = {
  OPENING_TREES: 'openingTrees',
};

export const MicroServiceConfig: Record<MicroService, ServiceConfig> = {
  [MicroServices.OPENING_TREES]: {
    host: 'http://localhost:2882',
  },
};
