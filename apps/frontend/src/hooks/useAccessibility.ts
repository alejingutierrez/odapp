import React from 'react'
import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

export const useAccessibility = () => {
  const location = useLocation()

  // Announce route changes to screen readers
  useEffect(() => {
    const announceRouteChange = () => {
      // Create or update the live region for route announcements
      let liveRegion = document.getElementById('route-announcer')

      if (!liveRegion) {
        liveRegion = document.createElement('div')
        liveRegion.id = 'route-announcer'
        liveRegion.setAttribute('aria-live', 'polite')
        liveRegion.setAttribute('aria-atomic', 'true')
        liveRegion.style.position = 'absolute'
        liveRegion.style.left = '-10000px'
        liveRegion.style.width = '1px'
        liveRegion.style.height = '1px'
        liveRegion.style.overflow = 'hidden'
        document.body.appendChild(liveRegion)
      }

      // Generate announcement text based on route
      const getRouteAnnouncement = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean)

        if (pathSegments.length === 0) {
          return 'Navigated to Dashboard page'
        }

        const pageName = pathSegments[pathSegments.length - 1]
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        return `Navigated to ${pageName} page`
      }

      // Announce the route change
      setTimeout(() => {
        liveRegion!.textContent = getRouteAnnouncement()
      }, 100)
    }

    announceRouteChange()
  }, [location.pathname])

  // Focus management for route changes
  useEffect(() => {
    const manageFocus = () => {
      // Find the main content area or first heading
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('h1') ||
        document.querySelector('[tabindex="-1"]')

      if (mainContent) {
        // Make it focusable if it isn't already
        if (!mainContent.hasAttribute('tabindex')) {
          mainContent.setAttribute('tabindex', '-1')
        }

        // Focus the element
        const mainContentElement = mainContent as HTMLElement
        mainContentElement.focus()
      }
    }

    // Delay focus management to allow content to render
    setTimeout(manageFocus, 100)
  }, [location.pathname])

  // Keyboard navigation helpers
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    // Skip to main content (Alt + M)
    if (event.altKey && event.key === 'm') {
      event.preventDefault()
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]')
      if (mainContent) {
        const mainContentElement = mainContent as HTMLElement
        mainContentElement.focus()
      }
    }

    // Skip to navigation (Alt + N)
    if (event.altKey && event.key === 'n') {
      event.preventDefault()
      const navigation =
        document.querySelector('nav') ||
        document.querySelector('[role="navigation"]')
      if (navigation) {
        const firstLink = navigation.querySelector('a, button')
        if (firstLink) {
          const firstLinkElement = firstLink as HTMLElement
          firstLinkElement.focus()
        }
      }
    }

    // Escape key to close modals/dropdowns
    if (event.key === 'Escape') {
      // This would be handled by individual components
      // but we can dispatch a global escape event
      document.dispatchEvent(new CustomEvent('global-escape'))
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardNavigation)
    return () =>
      document.removeEventListener('keydown', handleKeyboardNavigation)
  }, [handleKeyboardNavigation])

  // High contrast mode detection
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const isHighContrastMode =
        window.matchMedia('(prefers-contrast: high)').matches ||
        window.matchMedia('(-ms-high-contrast: active)').matches

      setIsHighContrast(isHighContrastMode)

      if (isHighContrastMode) {
        document.body.classList.add('high-contrast')
      } else {
        document.body.classList.remove('high-contrast')
      }
    }

    checkHighContrast()

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    contrastQuery.addEventListener('change', checkHighContrast)

    return () => contrastQuery.removeEventListener('change', checkHighContrast)
  }, [])

  // Reduced motion detection
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  useEffect(() => {
    const checkReducedMotion = () => {
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      setPrefersReducedMotion(prefersReduced)

      if (prefersReduced) {
        document.body.classList.add('reduced-motion')
      } else {
        document.body.classList.remove('reduced-motion')
      }
    }

    checkReducedMotion()

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', checkReducedMotion)

    return () => motionQuery.removeEventListener('change', checkReducedMotion)
  }, [])

  return {
    isHighContrast,
    prefersReducedMotion,
    announceToScreenReader: (message: string) => {
      const liveRegion = document.getElementById('route-announcer')
      if (liveRegion) {
        liveRegion.textContent = message
      }
    },
  }
}

// Hook for managing focus traps in modals
export const useFocusTrap = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus()
    }

    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive])
}
