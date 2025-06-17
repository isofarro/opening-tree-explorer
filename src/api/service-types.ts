import type { MicroServices } from './services';

export type MicroService = (typeof MicroServices)[keyof typeof MicroServices];

export type ServiceConfig = {
  host: string;
};
