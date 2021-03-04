import axios, { AxiosInstance, AxiosResponse, Canceler } from 'axios';
import * as Types from './types';

export class ApiInstance {
  /* ================
    CLASS PROPERTIES
  ================ */

  // Primary Axios API instance
  private axiosInstance: AxiosInstance;

  // Pre-Initialized Properties
  private cancelTokens: Map<string, Types.CancelToken> = new Map();
  private defaultErrorHandler: Types.TrackedConfig['defaultError'];
  private defaultCancelMessage: Types.CancelMessage;
  private errorTransformer: Types.TrackedConfig['errorTransformer'];
  private headers: Record<string, string> = {};
  private listeners: Record<Types.TrackedEvent, Types.Listener[]> = {
    cancelled: [],
    error: [],
    request: [],
    resolved: [],
    success: [],
  };

  // Instantiate the `axiosInstance` and add interceptor for custom headers
  constructor({
    baseURL = '',
    defaultError,
    defaultCancelMessage,
    errorTransformer,
    prefix = '',
    ...rest
  }: Types.TrackedConfig) {
    (this.defaultCancelMessage = defaultCancelMessage),
      (this.defaultErrorHandler = defaultError);

    this.errorTransformer = errorTransformer;

    this.axiosInstance = axios.create({
      baseURL: `${baseURL}${prefix}` || undefined,
      ...rest,
    });

    this.axiosInstance.interceptors.request.use(({ headers, ...request }) => ({
      ...request,
      headers: {
        ...this.headers,
        ...headers,
      },
    }));

    this.addEventListener = this.addEventListener.bind(this);
  }

  /* ================
    PUBLIC METHODS
  ================ */

  // Handles the cancellation of all active requests by name
  private cancelRequest = (
    actionNames: string | string[] = [],
    message?: Types.CancelMessage,
  ) =>
    (Array.isArray(actionNames) ? actionNames : [actionNames]).forEach(
      (actionName) => {
        // Find token if it exists by matching the request name
        const token = this.cancelTokens.get(actionName);

        // If token exists, use it to cancel the current request
        if (token) {
          token.cancel(
            typeof message === 'function'
              ? message({ action: token.action, time: token.time })
              : message,
          );

          this.handleEvent(Types.TrackedEvent.CANCELLED, actionName);

          this.clearCancellationToken(actionName);
        }
      },
    );

  // REST methods used for making API requests throught the app
  public get requestMethods() {
    return {
      request: <Result>(config: Types.TrackedRequest) =>
        this.handleRequest<Result>(config),
      delete: <Result>(url: string, config?: Types.TrackedRequest) =>
        this.handleRequest<Result>({
          ...config,
          method: Types.Method.DELETE,
          url,
        }),
      get: <Result>(url: string, config?: Types.TrackedRequest) =>
        this.handleRequest<Result>({
          ...config,
          method: Types.Method.GET,
          url,
        }),
      patch: <Result>(url: string, data?: any, config?: Types.TrackedRequest) =>
        this.handleRequest<Result>({
          ...config,
          method: Types.Method.PATCH,
          data,
          url,
        }),
      post: <Result>(url: string, data?: any, config?: Types.TrackedRequest) =>
        this.handleRequest<Result>({
          ...config,
          method: Types.Method.POST,
          data,
          url,
        }),
      put: <Result>(url: string, data?: any, config?: Types.TrackedRequest) =>
        this.handleRequest<Result>({
          ...config,
          method: Types.Method.PUT,
          data,
          url,
        }),
      tracked: (tracking: Types.WithTracking) => ({
        delete: <Result>(url: string, config?: Types.TrackedRequest) =>
          this.trackedRequest(tracking, (name: string) =>
            this.handleRequest<Result>({
              name,
              ...config,
              method: Types.Method.DELETE,
              url,
            }),
          ),
        get: <Result>(url: string, config?: Types.TrackedRequest) =>
          this.trackedRequest(tracking, (name: string) =>
            this.handleRequest<Result>({
              name,
              ...config,
              method: Types.Method.GET,
              url,
            }),
          ),
        patch: <Result>(
          url: string,
          data?: any,
          config?: Types.TrackedRequest,
        ) =>
          this.trackedRequest(tracking, (name: string) =>
            this.handleRequest<Result>({
              name,
              ...config,
              method: Types.Method.PATCH,
              data,
              url,
            }),
          ),
        post: <Result>(
          url: string,
          data?: any,
          config?: Types.TrackedRequest,
        ) =>
          this.trackedRequest(tracking, (name: string) =>
            this.handleRequest<Result>({
              name,
              ...config,
              method: Types.Method.POST,
              data,
              url,
            }),
          ),
        put: <Result>(url: string, data?: any, config?: Types.TrackedRequest) =>
          this.trackedRequest(tracking, (name: string) =>
            this.handleRequest<Result>({
              name,
              ...config,
              method: Types.Method.PUT,
              data,
              url,
            }),
          ),
      }),
    };
  }

  public addEventListener<Action extends string = string>(
    eventName: Types.EventType | Types.TrackedEvent,
    listener: Types.GeneralListener<Action>,
  ): void;

  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent.CANCELLED | 'cancelled',
    listener: Types.CancelledListener<Action>,
  ): void;

  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent.ERROR | 'error',
    listener: Types.ErrorListener<Action>,
  ): void;

  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent.REQUEST | 'request',
    listener: Types.RequestListener<Action>,
  ): void;
  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent.RESOLVED | 'resolved',
    listener: Types.ResolvedListener<Action>,
  ): void;

  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent.SUCCESS | 'success',
    listener: Types.SuccessListener<Action>,
  ): void;

  public addEventListener<Action extends string = string>(
    eventName: Types.TrackedEvent | Types.EventType,
    listener:
      | Types.GeneralListener<Action>
      | Types.CancelledListener<Action>
      | Types.ErrorListener<Action>
      | Types.RequestListener<Action>
      | Types.ResolvedListener<Action>
      | Types.SuccessListener<Action>,
  ) {
    const event = String(eventName).toLowerCase() as Types.TrackedEvent;

    // Check that the event name is a valid type
    if (typeof event !== 'string') {
      throw 'Event name must be provided when adding an event listener.';
    }

    // Check that the event name exists and is valid
    if (!this.listeners[event]) {
      throw `Event "${event}" is not a valid event to subscribe to.`;
    }

    // Check that the event listener is a valid type
    if (typeof listener !== 'function') {
      throw `Event listener must be a function, instead received ${typeof listener}.`;
    }

    // Add listener to correct event type
    this.listeners[event].push(listener as Types.Listener);

    // Return the unsubscribe function to remove the listener when done
    return () => {
      const index = this.listeners[event].indexOf(listener as Types.Listener);

      this.listeners[event].splice(index, 1);
    };
  }

  // Sets header information for requests
  public setDefaultError = (
    defaultError: Types.TrackedConfig['defaultError'],
  ) => {
    this.defaultErrorHandler = defaultError;
  };

  // Sets header information for requests
  public setRequestHeader = (header: string, value: string | null = '') => {
    if (value === null) {
      delete this.headers[header];
    } else {
      this.headers = {
        ...this.headers,
        [header]: value,
      };
    }
  };

  /* ================
    PRIVATE METHODS
  ================ */

  // Returns a new defaulted instance of an Error
  private get defaultError() {
    return this.defaultErrorHandler();
  }

  // Removes a Cancel Token
  private cancelPreviousRequest = (actionName: string = '') => {
    if (actionName) {
      // Use public cancel method to cancel existing tokens when a new request
      // overrides the previous active request
      this.cancelRequest([actionName], this.defaultCancelMessage);
    }
  };

  // Removes a Cancel Token
  private clearCancellationToken = (requestName: string = '') => {
    if (requestName) {
      this.cancelTokens.delete(requestName);
    }
  };

  // Sets the Cancel Token
  private createCancellationToken = (
    actionName: string = '',
    cancel: Canceler,
  ) => {
    if (actionName) {
      this.cancelTokens.set(actionName, {
        action: actionName,
        cancel,
        time: new Date().valueOf(),
      });
    }
  };

  // Handles the emitting of an Event
  private handleEvent = <DataType>(
    eventName: Types.TrackedEvent,
    actionName: string,
    result?: DataType,
    error?: Types.TrackedError<DataType>,
  ) => {
    if (!this.listeners[eventName]) {
      throw `Failed to trigger event "${eventName}".\n  This is likely a bug and should be reported.`;
    }

    this.listeners[eventName].forEach((listener) => {
      listener({ action: actionName, result, error, type: eventName });
    });

    if (eventName !== Types.TrackedEvent.REQUEST) {
      this.listeners[Types.TrackedEvent.RESOLVED].forEach((listener) => {
        listener({ action: actionName, type: eventName });
      });
    }
  };

  // Handles the actual request via the axios `request` method
  private handleRequest = async <ResultType = any>({
    name,
    ...config
  }: Types.TrackedRequest) => {
    let result: AxiosResponse<ResultType> | undefined;

    try {
      // Create request and register a cancellation token
      result = await this.axiosInstance.request<ResultType>({
        cancelToken: new axios.CancelToken(
          this.createCancellationToken.bind(this, name),
        ),
        ...config,
      });
    } catch (err) {
      // Throw a transformed error mapping values where necessary
      throw this.transformError(err);
    } finally {
      // Clear out any cancellation tokens created for this request
      this.clearCancellationToken(name);
    }

    return result as AxiosResponse<ResultType>;
  };

  // Performs the request within a tracked method
  private trackedRequest = async <Result>(
    { action, cancelPrevious, throwError }: Types.WithTracking,
    handleRequest: (name: string) => Promise<AxiosResponse<Result>>,
  ) => {
    let result: AxiosResponse<Result> | undefined;

    try {
      // Clear out existing requests IF they exist
      if (cancelPrevious) {
        this.cancelPreviousRequest(action);
      }

      // Set the API action state to `loading` / `running`
      this.handleEvent(Types.TrackedEvent.REQUEST, action);

      // Attempt to fetch data from the server
      result = await handleRequest(action);

      // If successful handle then success work-flow
      this.handleEvent(Types.TrackedEvent.SUCCESS, action, result);
    } catch (error) {
      // If error is due to cancelled request then ignore and throw error
      if (axios.isCancel(error)) {
        throw error;
      }

      // If unsuccessful then handle error work-flow
      this.handleEvent(Types.TrackedEvent.ERROR, action, undefined, error);

      // If errors are explicitly to be thrown, do so. This assumes errors
      // will be handled outside the typical API transaction flow of the app
      if (throwError) {
        throw error;
      }
    }

    // Return the result to the API caller
    return result as AxiosResponse<Result>;
  };

  // Processes API Errors, and ensure the result is standardized
  private transformError<ErrorType = any>(
    error: Types.TrackedError<ErrorType> | Error = this.defaultError,
  ): Types.TrackedError<ErrorType> {
    const apiError = error as Types.TrackedError<ErrorType>;

    // If the error is not an axios related error, throw it as is
    if (
      !apiError ||
      !apiError.isAxiosError ||
      !apiError.response ||
      axios.isCancel(apiError)
    ) {
      return apiError;
    }

    switch (apiError.response?.status) {
      case 401:
        return { ...apiError, is401: true } as Types.TrackedError<ErrorType>;
      case 502:
        return { ...apiError, is502: true } as Types.TrackedError<ErrorType>;
      default:
        return this.errorTransformer<ErrorType>(apiError);
    }
  }
}
