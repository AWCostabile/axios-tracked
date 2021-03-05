import { ApiInstance } from '../api-instance';

export type TrackedInstance = ApiInstance['requestMethods'] & {
  addEventListener: ApiInstance['addEventListener'];
  setDefaultError: ApiInstance['setDefaultError'];
  setHeader: ApiInstance['setRequestHeader'];
};
