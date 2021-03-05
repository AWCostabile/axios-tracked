# Axios Tracked

An enhancement to run alongside Axios, adding named tracking, event subscriptions, and easy cancellation for API requests.

## Install

```
$ npm install axios axios-tracked
```

## Demo Project

Clone and run the "[`Axios-Tracked-Example`](https://github.com/AWCostabile/axios-tracked-example)" project to see examples of how to use the `axios-tracked` module and test out its capabilities. Whilst this project is React and Typescript, there is no necessity to sticking with those, as this package is designed to be low dependency.

# Usage

To use `axios-tracked`, simply import the package and begin by creating an API instnace using the `createInstance` function. This API instance works much the same way as the main Axios API instance, however it provides some additional functionality to make requests and cancellations easier, as well as the ability to handle side-effects based on request events.

## Basics

The recommended approach to using `axios-tracked` is to export and use a single api instance with which all endpoints can be defined.

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

Events add an additional method by which side-effects within an app can be triggered. This is based on the lifecycle of each request and how it is resolved end to end without needing to monitor each and every request individually. This is done via the `subscribe` method on the API instance, which will always return an `unsubscribe` function for clean-up (see below).

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

### Subscribing to Events

```javascript
// Declare loading states
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

// Subscribe to `request` events and handle with pre-defined function
apiInstance.subscribe('request', handleOnRequest);

// Subscribe to `resolved` events and handle with in-situ function
apiInstance.subscribe('resolved', function (res) {
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

// Subscribe to `error` events to handle thrown errors
apiInstance.subscribe('error', function (res) {
  if (res.action == 'GET_TODO_LIST') {
    // specifically handle the action 'GET_TODOS_LIST'
    alert('Could not fetch all Todos');
  } else if (res.error && res.error.message) {
    // use the API error message in a callback
    alert(res.error.message);
  }
});

// Subscribe to `success` events to handle newly created TODOs
const unsubscribe = apiInstance.subscribe('success', function (res) {
  if (res.action != 'CREATE_TODO') {
    return;
  }

  const newTodo = res.result.data;

  if (newTodo) {
    alert('Successfully created a new TODO with id', newTodo.id);
  }
});

// In the case of clean-up, calling `unsubscribe` will remove the listeners
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

// Define a typed handler to be registered with the `susbcribe` method
const handleError: ErrorListener<TodoActions> = ({ action, error }) => {
  if (action == TodoActions.LIST) {
    // specifically handle the action 'GET_TODOS_LIST'
    alert('Could not fetch all Todos')
  } else if (error?.message) {
    // use the API error message in a callback
    alert(error.message)
  }
};

// In the case of clean-up, calling `unsubscribe` will remove the listener
const unsubscribe = apiInstance.subscribe(
  TrackedEvent.ERROR,
  handleError
});
```

# Upcoming Features

In the near future, the plan is to add a complimentary package for React to make it easier to "hook" into API events to simplify the passing of API state to Component Props.

#### _More to come_
