// Test configuration constants
export const TEST_CONFIG = {
  // Timeouts
  TIMEOUTS: {
    SHORT: 5000, // 5 seconds - for simple operations
    MEDIUM: 15000, // 15 seconds - for component rendering
    LONG: 30000, // 30 seconds - for complex operations
    VERY_LONG: 60000, // 1 minute - for integration tests
    DEBUG: 120000, // 2 minutes - for debugging
  },

  // Polling intervals
  POLLING: {
    FAST: 50, // 50ms - for quick checks
    NORMAL: 100, // 100ms - for normal operations
    SLOW: 500, // 500ms - for slow operations
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second between retries
  },

  // Test behavior
  BEHAVIOR: {
    BAIL_ON_FAILURE: true, // Stop on first failure
    CLEANUP_AFTER_EACH: true, // Clean up after each test
    ISOLATE_TESTS: true, // Run tests in isolation
  },
} as const

// Helper function to get timeout based on test type
export const getTimeout = (
  testType: 'unit' | 'integration' | 'e2e' | 'debug' = 'unit'
) => {
  switch (testType) {
    case 'unit':
      return TEST_CONFIG.TIMEOUTS.SHORT
    case 'integration':
      return TEST_CONFIG.TIMEOUTS.MEDIUM
    case 'e2e':
      return TEST_CONFIG.TIMEOUTS.LONG
    case 'debug':
      return TEST_CONFIG.TIMEOUTS.DEBUG
    default:
      return TEST_CONFIG.TIMEOUTS.MEDIUM
  }
}

// Helper function to create a timeout promise
export const createTimeoutPromise = (timeout: number, message?: string) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${timeout}ms`))
    }, timeout)
  })
}

// Helper function to retry operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = TEST_CONFIG.RETRY.MAX_ATTEMPTS,
  delay: number = TEST_CONFIG.RETRY.DELAY
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts) {
        throw lastError
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Helper function to wait for condition with timeout
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = TEST_CONFIG.TIMEOUTS.MEDIUM,
  pollingInterval: number = TEST_CONFIG.POLLING.NORMAL
): Promise<void> => {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkCondition = async () => {
      try {
        const result = await condition()
        if (result) {
          resolve()
          return
        }

        const elapsed = Date.now() - startTime
        if (elapsed >= timeout) {
          reject(new Error(`Condition not met after ${timeout}ms`))
          return
        }

        setTimeout(checkCondition, pollingInterval)
      } catch (error) {
        reject(error)
      }
    }

    checkCondition()
  })
}
