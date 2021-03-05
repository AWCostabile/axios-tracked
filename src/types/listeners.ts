import { AxiosResponse } from 'axios';
import { TrackedError, TrackedEvent } from './base';
import { EventType } from './internal';

interface BaseEvent<
  Event extends TrackedEvent | EventType,
  Action extends string = string
> {
  action: Action;
  type: Event;
}

interface ErrorEvent<Action extends string = string, ErrorType = any> {
  action: Action;
  error: TrackedError<ErrorType>;
  type: 'error' | TrackedEvent.ERROR;
}

interface ResolvedEvent<Action extends string = string> {
  action: Action;
  type: TrackedEvent;
}

interface SuccessEvent<Action extends string = string, Result = any> {
  action: Action;
  result: AxiosResponse<Result>;
  type: 'success' | TrackedEvent.SUCCESS;
}

interface GeneralEvent<
  Action extends string = string,
  ResultType = any,
  ErrorType = any
> extends Omit<BaseEvent<never, never>, 'action' | 'type'>,
    Omit<Partial<ErrorEvent<never, ErrorType>>, 'action' | 'type'>,
    Omit<Partial<SuccessEvent<never, ResultType>>, 'action' | 'type'> {
  action: Action;
  type: TrackedEvent | EventType;
}

export type CancelledListener<Action extends string = string> = (
  event: BaseEvent<'cancelled' | TrackedEvent.CANCELLED, Action>,
) => void;

export type ErrorListener<Action extends string = string> = <ErrorType>(
  event: ErrorEvent<Action, ErrorType>,
) => void;

export type GeneralListener<
  Action extends string = string,
  ResultType = any,
  ErrorType = any
> = <Result extends ResultType = any, Error extends ErrorType = any>(
  event: GeneralEvent<Action, ResultType, ErrorType>,
) => void;

export type RequestListener<Action extends string = string> = (
  event: BaseEvent<'request' | TrackedEvent.REQUEST, Action>,
) => void;

export type ResolvedListener<Action extends string = string> = (
  event: ResolvedEvent<Action>,
) => void;

export type SuccessListener<Action extends string = string> = <Result>(
  event: SuccessEvent<Action, Result>,
) => void;
