import { ApiInstance } from '../api-instance';

export type TrackedInstance = ApiInstance['requestMethods'] & {
  setDefaultError: ApiInstance['setDefaultError'];
  setHeader: ApiInstance['setRequestHeader'];
  subscribe: ApiInstance['subscribe'];
};
