import { AxiosError } from 'axios';

export enum Method {
  DELETE = 'delete',
  GET = 'get',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
}

export enum TrackedEvent {
  CANCELLED = 'cancelled',
  ERROR = 'error',
  REQUEST = 'request',
  RESOLVED = 'resolved',
  SUCCESS = 'success',
}

export interface TrackedError<ErrorType> extends AxiosError<ErrorType> {
  is401?: boolean;
  is502?: boolean;
}
