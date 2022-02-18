/* eslint-disable no-param-reassign */
export const webpackReducer = {
  r: () => null,
  d: (reciever, name, method) => {
    reciever[name] = method
  },
}

export const compose = (...functions) => (arg) =>
  functions.reduce((composed, f) => f(composed), arg)

export const debounce = (f, ms) => {
  let timeout = false
  return function (...args) {
    if (timeout !== false) {
      clearInterval(timeout)
    }
    timeout = setTimeout(() => {
      f.apply(this, args)
      timeout = false
    }, ms)
  }
}

export const sleep = (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), timeout)
  })
