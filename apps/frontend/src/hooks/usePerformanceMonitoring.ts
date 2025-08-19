import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface PerformanceMetrics {
  path: string
  loadTime: number
  renderTime: number
  memoryUsage?: number
  connectionType?: string
  timestamp: number
}

export const usePerformanceMonitoring = () => {
  const location = useLocation()

  // Track route-level performance
  useEffect(() => {
    const startTime = performance.now()

    // Track when the route finishes loading
    const trackRoutePerformance = () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime

      const metrics: PerformanceMetrics = {
        path: location.pathname,
        loadTime,
        renderTime: loadTime, // For now, same as load time
        timestamp: Date.now(),
      }

      // Add memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory
        metrics.memoryUsage = memory.usedJSHeapSize
      }

      // Add connection info if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        metrics.connectionType = connection.effectiveType
      }

      console.log('Route performance metrics:', metrics)

      // TODO: Send to monitoring service
      // sendPerformanceMetrics(metrics)
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(trackRoutePerformance)
    } else {
      setTimeout(trackRoutePerformance, 0)
    }
  }, [location.pathname])

  // Track Core Web Vitals
  useEffect(() => {
    const trackWebVitals = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            
            console.log('LCP:', lastEntry.startTime, 'ms')
            
            // TODO: Send to monitoring service
            // sendWebVital('LCP', lastEntry.startTime, location.pathname)
          })
          
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
              const fid = entry.processingStart - entry.startTime
              console.log('FID:', fid, 'ms')
              
              // TODO: Send to monitoring service
              // sendWebVital('FID', fid, location.pathname)
            })
          })
          
          fidObserver.observe({ entryTypes: ['first-input'] })

          // Cumulative Layout Shift (CLS)
          let clsValue = 0
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            })
            
            console.log('CLS:', clsValue)
            
            // TODO: Send to monitoring service
            // sendWebVital('CLS', clsValue, location.pathname)
          })
          
          clsObserver.observe({ entryTypes: ['layout-shift'] })

          return () => {
            lcpObserver.disconnect()
            fidObserver.disconnect()
            clsObserver.disconnect()
          }
        } catch (error) {
          console.warn('Performance monitoring not supported:', error)
        }
      }
    }

    return trackWebVitals()
  }, [location.pathname])

  // Manual performance tracking functions
  const trackUserTiming = useCallback((name: string, startTime?: number) => {
    const endTime = performance.now()
    const duration = startTime ? endTime - startTime : 0

    performance.mark(`${name}-end`)
    
    if (startTime) {
      performance.mark(`${name}-start`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }

    console.log(`User timing - ${name}:`, duration, 'ms')

    // TODO: Send to monitoring service
    // sendUserTiming(name, duration, location.pathname)

    return endTime
  }, [location.pathname])

  const trackResourceTiming = useCallback(() => {
    const resources = performance.getEntriesByType('resource')
    const slowResources = resources.filter((resource: any) => resource.duration > 1000)

    if (slowResources.length > 0) {
      console.log('Slow resources detected:', slowResources)
      
      // TODO: Send to monitoring service
      // sendSlowResources(slowResources, location.pathname)
    }
  }, [location.pathname])

  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        path: location.pathname,
        timestamp: Date.now(),
      }

      console.log('Memory usage:', memoryInfo)

      // TODO: Send to monitoring service
      // sendMemoryMetrics(memoryInfo)

      return memoryInfo
    }
    return null
  }, [location.pathname])

  return {
    trackUserTiming,
    trackResourceTiming,
    trackMemoryUsage,
  }
}

// Hook for tracking component-level performance
export const useComponentPerformance = (componentName: string) => {
  const startTime = performance.now()

  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime

    console.log(`Component ${componentName} render time:`, renderTime, 'ms')

    // TODO: Send to monitoring service
    // sendComponentMetrics(componentName, renderTime)
  })

  return {
    startTime,
    measureRender: () => performance.now() - startTime,
  }
}