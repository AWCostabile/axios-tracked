import { AxiosRequestConfig } from 'axios';
import { Method, TrackedError } from './base';
import { CancelToken } from './internal';

export interface TrackedConfig extends AxiosRequestConfig {
  baseURL?: string;
  prefix?: string;
  defaultCancelMessage: CancelMessage;
  defaultError: () => Error;
  errorTransformer: <ErrorType>(
    error: TrackedError<ErrorType>,
  ) => TrackedError<ErrorType>;
}

export interface TrackedRequest<Action extends string = string>
  extends AxiosRequestConfig {
  method?: Method;
  name?: Action;
}

export interface WithTracking<Action extends string = string> {
  action: Action;
  cancelPrevious?: boolean;
  throwError?: boolean;
}

export type CancelMessage =
  | ((token: Omit<CancelToken, 'cancel'>) => string)
  | string;
