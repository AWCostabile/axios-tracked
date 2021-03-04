import { Canceler } from 'axios';
import { TrackedError } from './base';

export interface CancelToken<Action extends string = string> {
  action: Action;
  cancel: Canceler;
  time: number;
}

export type EventType =
  | 'cancelled'
  | 'error'
  | 'request'
  | 'resolved'
  | 'success';

export type Listener<Action extends string = string> = <DataType>(event: {
  action: Action;
  error?: TrackedError<DataType>;
  result?: DataType;
  type?: EventType;
}) => void;
