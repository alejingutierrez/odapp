import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Hook for managing document title and meta tags
export const useDocumentTitle = (title?: string) => {
  const location = useLocation()

  useEffect(() => {
    // Generate title based on route if not provided
    const generateTitle = () => {
      if (title) return title

      const pathSegments = location.pathname.split('/').filter(Boolean)

      if (pathSegments.length === 0) {
        return 'Dashboard'
      }

      // Convert path segments to readable titles
      const titleParts = pathSegments.map((segment) => {
        return segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })

      return titleParts.join(' - ')
    }

    const pageTitle = generateTitle()
    const fullTitle = `${pageTitle} | Oda`

    // Set document title
    document.title = fullTitle

    // Set meta description based on route
    const setMetaDescription = () => {
      let description =
        'Oda - Fashion ERP Platform for managing products, inventory, orders, and customers.'

      if (location.pathname.includes('/products')) {
        description =
          'Manage your fashion product catalog, collections, and variants with Oda.'
      } else if (location.pathname.includes('/inventory')) {
        description =
          'Track and manage inventory levels, stock adjustments, and transfers with Oda.'
      } else if (location.pathname.includes('/orders')) {
        description =
          'Process and manage customer orders, returns, and fulfillment with Oda.'
      } else if (location.pathname.includes('/customers')) {
        description =
          'Manage customer relationships, segments, and loyalty programs with Oda.'
      } else if (location.pathname.includes('/analytics')) {
        description =
          'Analyze sales, products, customers, and inventory performance with Oda.'
      } else if (location.pathname.includes('/shopify')) {
        description = 'Sync and manage your Shopify integration with Oda.'
      }

      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)
    }

    setMetaDescription()

    // Set canonical URL
    const setCanonicalUrl = () => {
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', window.location.href)
    }

    setCanonicalUrl()

    // Set Open Graph tags
    const setOpenGraphTags = () => {
      const ogTitle =
        document.querySelector('meta[property="og:title"]') ||
        document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      ogTitle.setAttribute('content', fullTitle)
      if (!document.head.contains(ogTitle)) {
        document.head.appendChild(ogTitle)
      }

      const ogUrl =
        document.querySelector('meta[property="og:url"]') ||
        document.createElement('meta')
      ogUrl.setAttribute('property', 'og:url')
      ogUrl.setAttribute('content', window.location.href)
      if (!document.head.contains(ogUrl)) {
        document.head.appendChild(ogUrl)
      }

      const ogType =
        document.querySelector('meta[property="og:type"]') ||
        document.createElement('meta')
      ogType.setAttribute('property', 'og:type')
      ogType.setAttribute('content', 'website')
      if (!document.head.contains(ogType)) {
        document.head.appendChild(ogType)
      }
    }

    setOpenGraphTags()
  }, [title, location.pathname])

  return {
    setTitle: (newTitle: string) => {
      document.title = `${newTitle} | Oda`
    },
    setMetaTag: (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    },
  }
}
