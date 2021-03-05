import { ApiInstance } from './api-instance';
import * as defaults from './defaults';
import { TrackedInstance } from './types/external';
import { TrackedConfig } from './types/shared';

export const createInstance = (
  config: Partial<TrackedConfig> = {},
): TrackedInstance => {
  const apiInstance = new ApiInstance({ ...defaults, ...config });

  return {
    ...apiInstance.requestMethods,
    setDefaultError: apiInstance.setDefaultError,
    setHeader: apiInstance.setRequestHeader,
    subscribe: apiInstance.subscribe,
  };
};
