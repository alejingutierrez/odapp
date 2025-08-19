import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Route analytics hook for tracking page views and performance
export const useRouteAnalytics = () => {
  const location = useLocation()

  useEffect(() => {
    // Track page view
    const trackPageView = () => {
      const pageData = {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        timestamp: Date.now(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }

      // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
      console.log('Page view tracked:', pageData)

      // Example: Google Analytics 4
      // if (typeof gtag !== 'undefined') {
      //   gtag('config', 'GA_MEASUREMENT_ID', {
      //     page_path: location.pathname + location.search,
      //   })
      // }

      // Example: Mixpanel
      // if (typeof mixpanel !== 'undefined') {
      //   mixpanel.track('Page View', {
      //     page: location.pathname,
      //     search: location.search,
      //   })
      // }
    }

    // Track performance metrics
    const trackPerformance = () => {
      // Use Performance Observer API for route-level performance monitoring
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navigationEntry = entry as PerformanceNavigationTiming
              const metrics = {
                path: location.pathname,
                loadTime:
                  navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
                domContentLoaded:
                  navigationEntry.domContentLoadedEventEnd -
                  navigationEntry.domContentLoadedEventStart,
                firstPaint: 0,
                firstContentfulPaint: 0,
              }

              // Get paint metrics
              const paintEntries = performance.getEntriesByType('paint')
              paintEntries.forEach((paintEntry) => {
                if (paintEntry.name === 'first-paint') {
                  metrics.firstPaint = paintEntry.startTime
                } else if (paintEntry.name === 'first-contentful-paint') {
                  metrics.firstContentfulPaint = paintEntry.startTime
                }
              })

              console.log('Route performance metrics:', metrics)

              // TODO: Send to monitoring service
              // sendPerformanceMetrics(metrics)
            }
          })
        })

        observer.observe({ entryTypes: ['navigation', 'paint'] })

        return () => observer.disconnect()
      }
    }

    trackPageView()
    const cleanup = trackPerformance()

    return cleanup
  }, [location])

  return {
    trackEvent: (eventName: string, properties?: Record<string, unknown>) => {
      const eventData = {
        event: eventName,
        path: location.pathname,
        timestamp: Date.now(),
        ...properties,
      }

      console.log('Event tracked:', eventData)

      // TODO: Send to analytics service
      // trackAnalyticsEvent(eventData)
    },
  }
}

// Hook for tracking user interactions on specific routes
export const useRouteInteractions = () => {
  const location = useLocation()

  const trackInteraction = (
    action: string,
    element?: string,
    value?: string | number
  ) => {
    const interactionData = {
      action,
      element,
      value,
      path: location.pathname,
      timestamp: Date.now(),
    }

    console.log('Interaction tracked:', interactionData)

    // TODO: Send to analytics service
    // trackUserInteraction(interactionData)
  }

  return { trackInteraction }
}
