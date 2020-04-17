export const webpackReducer = {
  r: () => null,
  d: (reciever, name, method) => {
    reciever[name] = method
  }
}

export const compose = (...functions) => (
  (arg) => (
    functions.reduce(
      (composed, f) => f(composed),
      arg,
    )
  )
)

export const debounce = (f, ms) => {
  let timeout = false
  return function() {
    if (timeout !== false) {
      clearInterval(timeout)
    }
    timeout = setTimeout(() => {
      f.apply(this, arguments)
      timeout = false
    }, ms)
  }
}