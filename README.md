# Axios Tracked

An enhancement to Axios which allows requests to have tracking, event listeners, and easy cancellation.

## Install

```
$ npm install axios-tracked
```

## Basic Usage

To use `axios-tracked`, simply import the package and begin by creating an API instnace using the `createInstance` function. This API instance works much the same way as the main Axios API instance, however it provides some additional functionality to make requests and cancellations easier, as well as the ability to handle side-effects based on request events.

```javascript
const axiosTracked = require('axios-tracked');

// create instance
const apiInstance = axiosTracked.createInstance({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 30000,
});

// Create a GET request handler for fetching a list of Todos
const getTodos = function () {
  apiInstance
    .tracked({
      action: 'GET_TODO_LIST',
      cancelPrevious: true,
    })
    .get('/todos')
    .then(function (res) {
      console.log(res.data);
    })
    .catch(function (err) {
      console.error(err);
    });
};

// Create a GET request handler for fetching a Todo by its Id
const getTodoById = function (id) {
  apiInstance
    .tracked({
      action: 'GET_TODO',
    })
    .get('/todos/' + id)
    .then(function (res) {
      console.log(res.data);
    })
    .catch(function (err) {
      console.error(err);
    });
};

// Create a POST request handler for a posting a new Todo
const createTodo = function (newTodo) {
  apiInstance
    .tracked({
      action: 'CREATE_TODO',
      throwError: true,
    })
    .post('/todos', newTodo)
    .then(function (res) {
      console.log(res.data);
    })
    .catch(function (err) {
      console.error(err);
    });
};
```

## Events

Events are a powerful way to trigger side-effects within an app based on the way a request was resolved without needing to monitor each and every request individually. This is done via the `addEventHandler` method on the API instance, which will always return an unsubscribe function (see below).

### Event Types

| Event Name  | Emitted When                                                       | Properties                 |
| ----------- | ------------------------------------------------------------------ | -------------------------- |
| `request`   | the request is triggered                                           | `action`, `type`           |
| `success`   | the response has returned successfully                             | `action`, `type`, `result` |
| `cancelled` | the request was cancelled prior to a response being returned       | `action`, `type`           |
| `error`     | the response has failed and threw and error                        | `action`, `type`, `error`  |
| `resolved`  | any one of `success`, `error`, or `cancelled` events are triggered | `action`, `type`           |

### Event Properties

| Property | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| `action` | the id / name of the tracked request                                                     |
| `error`  | an instance of AxiosError which may have some additional boolean flags: `is401`, `is502` |
| `result` | the Axios Response object returned as part of a successful response                      |
| `type`   | one of `request`, `success`, `error`, or `cancelled`.                                    |

#### _NOTE: `resolved` events will contain the `type` property of the triggering event type_

### Usage

```javascript
// Register event handlers
let isLoadingItem = false;
let isLoadingList = false;

// Handle incoming api event by action name
function handleOnRequest(req) {
  switch (req.action) {
    case 'GET_TODO':
      isLoadingItem = true;
      break;
    case 'GET_TODO_LIST':
      isLoadingList = true;
      break;
  }
}

// Add a predefined event listener for when a request is initiated
apiInstance.addEventHandler('request', handleOnRequest);

// Add an in-situe listener for when an api request is completed
apiInstance.addEventHandler('resolved', function (res) {
  switch (res.action) {
    case 'GET_TODO':
      // Only stop loading IF the request succeeded
      isLoadingItem = res.type === 'success';
      break;
    case 'GET_TODO_LIST':
      isLoadingList = false;
      break;
  }
});

// Add an event listener specifically for when an error is thrown
apiInstance.addEventHandler('error', function (res) {
  if (res.action == 'GET_TODO_LIST') {
    // specifically handle the action 'GET_TODOS_LIST'
    alert('Could not fetch all Todos');
  } else if (res.error && res.error.message) {
    // use the API error message in a callback
    alert(res.error.message);
  }
});

// Add a listener to handle newly created TODOs
const unsubscribe = apiInstance.addEventHandler('success', function (res) {
  if (res.action != 'CREATE_TODO') {
    return;
  }

  const newTodo = res.result.data;

  if (newTodo) {
    alert('Successfully created a new TODO with id', newTodo.id);
  }
});

// Adding an event listener returns an unsubscribe method that can be
// used for state clean-up
function onUmount() {
  unsubscribe();
}
```

## Typescript Support

Typescript is built into `axios-tracked` so there is no need to install additional `@type` packages. The example below demonstrates how some of the earlier code could be written with Typescript.

```typescript
import { createInstance, ErrorListener, TrackedEvent, TrackedInstance } from 'axios-tracked';

// create instance
const apiInstance: TrackedInstance = axiosTracked.createInstance({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 30000,
});

enum TodoActions {
  CREATE = 'CREATE_TODO',
  GET = 'GET_TODO',
  LIST = 'GET_TODO_LIST',
}

// Create a GET request handler for fetching a list of Todos
const getTodos = () => apiInstance.tracked({
    action: TodoActions.LIST,
    cancelPrevious: true
  })
  .get<TodoModel[]>('/todos')
  .then((res) =>console.log(res.data))
  .catch((err) => console.error(err));

// Create a GET request handler for fetching a Todo by its Id
const getTodoById = (id: string) => apiInstance.tracked({
    action: TodoActions.GET
  })
  .get<TodoModel>(`/todos/${id}`)
  .then((res) =>console.log(res.data))
  .catch((err) => console.error(err));


// Create a POST request handler for a posting a new Todo
const createTodo = (todo: Omit<TodoModel, 'id'>) => apiInstance.tracked({
    action: TodoActions.CREATE,
    throwError: true
  })
  .post<TodoModel>(`/todos`)
  .then((res) =>console.log(res.data))
  .catch((err) => console.error(err));

const handleError: ErrorListener<TodoActions> = ({ action, error }) => {
  if (action == TodoActions.LIST) {
    // specifically handle the action 'GET_TODOS_LIST'
    alert('Could not fetch all Todos')
  } else if (error?.message) {
    // use the API error message in a callback
    alert(error.message)
  }
};

// Use strong typing in defining an event handler
const unsubscribe = apiInstance.addEventHandler(
  TrackedEvent.ERROR,
  handleError
});
```

#### _More to come_
