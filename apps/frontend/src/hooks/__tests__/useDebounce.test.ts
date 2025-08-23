import { expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Change the value
    rerender({ value: 'updated', delay: 500 })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time by 499ms
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Value should still be the old one
    expect(result.current).toBe('initial')

    // Fast-forward time by 1ms more (total 500ms)
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Now value should be updated
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change value multiple times rapidly
    rerender({ value: 'change1', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'change2', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'final', delay: 500 })

    // After 400ms total, value should still be initial
    expect(result.current).toBe('initial')

    // After 500ms more, value should be the final one
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('final')
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )

    rerender({ value: 'updated', delay: 1000 })

    // After 500ms, should still be initial
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')

    // After 1000ms total, should be updated
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })

  it('should work with different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    )

    numberRerender({ value: 42, delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(numberResult.current).toBe(42)

    // Test with objects
    const initialObj = { id: 1, name: 'initial' }
    const updatedObj = { id: 2, name: 'updated' }

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 300 } }
    )

    objectRerender({ value: updatedObj, delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(objectResult.current).toBe(updatedObj)
  })

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = renderHook(() => useDebounce('test', 500))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })
})
