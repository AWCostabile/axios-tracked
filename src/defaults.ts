import { CancelMessage, TrackedError } from './types';

const defaultCancelMessage: CancelMessage = ({ action, time }) =>
  `action ${action} cancelled after ${
    (new Date().valueOf() - time) / 1000
  } seconds`;

const defaultError = () => new Error('Unknown API error occured');

const errorTransformer = <ErrorType>(error: TrackedError<ErrorType>) => error;

export { defaultCancelMessage, defaultError, errorTransformer };
