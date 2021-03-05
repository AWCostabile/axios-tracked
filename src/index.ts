import { ApiInstance } from './api-instance';
import * as defaults from './defaults';
import { TrackedInstance } from './types/external';
import { TrackedConfig } from './types/shared';

const createInstance = (
  config: Partial<TrackedConfig> = {},
): TrackedInstance => {
  const apiInstance = new ApiInstance({ ...defaults, ...config });

  return {
    ...apiInstance.requestMethods,
    addEventListener: apiInstance.addEventListener,
    setDefaultError: apiInstance.setDefaultError,
    setHeader: apiInstance.setRequestHeader,
  };
};

export * from './types/base';
export * from './types/external';
export * from './types/listeners';
export * from './types/shared';
export { createInstance };
