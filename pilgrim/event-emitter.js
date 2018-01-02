let listeners = []

function on(eventName, handler) {
  if (listeners[eventName] === undefined) {
    listeners[eventName] = []
  }

  listeners[eventName].push(handler)
}

function emit(eventName, data) {
  if (listeners[eventName] === undefined) {
    listeners[eventName] = []
  }

  listeners[eventName].forEach(listener => listener(data))
}
