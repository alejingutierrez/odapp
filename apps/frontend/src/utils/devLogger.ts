/* eslint-disable no-console */

// Development-only logger to avoid ESLint no-console warnings across the codebase.
// In production it is a no-op, in development it proxies to console.
export const devLogger = {
  log: (...args: unknown[]): void => {
    // Vite: import.meta.env.DEV; fallback to NODE_ENV for other toolchains
    const isDev =
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
      process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]): void => {
    const isDev =
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
      process.env.NODE_ENV === 'development'
    if (isDev) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]): void => {
    const isDev =
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
      process.env.NODE_ENV === 'development'
    if (isDev) {
      console.error(...args)
    }
  },
}

export default devLogger
