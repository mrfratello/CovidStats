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