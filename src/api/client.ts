import type { MicroService } from './service-types';
import { MicroServiceConfig } from './services';

const get = async <T>(service: MicroService | string, path: string): Promise<T> => {
  try {
    const config = MicroServiceConfig[service];
    const host = config !== undefined ? config.host : service;
    const url = `${host}${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const ApiClient = {
  get,
};
