import { ApiInstance } from '../src/api-instance';
import * as defaults from '../src/defaults';
import { Listener, TrackedEvent } from '../src/types';

enum ActionType {
  GET = 'get',
  SET = 'set',
}

interface ExposedInstance extends Omit<ApiInstance, 'listeners'> {
  listeners: Record<TrackedEvent, Listener[]>;
}

describe('Instantiating new Tracked Instance', () => {
  const instance = new ApiInstance({ ...defaults, baseURL: '' });
  const exposedInstance = (instance as unknown) as ExposedInstance;

  const unsubscribe = exposedInstance.addEventListener<ActionType>(
    TrackedEvent.SUCCESS,
    ({ action, data }) => console.log(action, data),
  );

  exposedInstance.addEventListener<ActionType>(
    TrackedEvent.SUCCESS,
    ({ action, data }) => console.log(action, data),
  );

  test('Successfully add event handlers to API instance', () => {
    expect(exposedInstance.listeners.success.length).toBe(2);
  });

  test('Successfully unsubscribe event handlers', () => {
    unsubscribe();
    expect(exposedInstance.listeners.success.length).toBe(1);
  });
});
