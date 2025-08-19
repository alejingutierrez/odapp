import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  siteName?: string
}

export const useSEO = (config: SEOConfig = {}) => {
  const location = useLocation()

  useEffect(() => {
    const {
      title = 'Oda - Fashion ERP Platform',
      description = 'Comprehensive ERP solution for fashion businesses with inventory management, order processing, and Shopify integration.',
      keywords = ['fashion', 'ERP', 'inventory', 'orders', 'shopify', 'retail'],
      image = '/og-image.png',
      type = 'website',
      siteName = 'Oda'
    } = config

    // Set document title
    document.title = title

    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`
      let meta = document.querySelector(selector) as HTMLMetaElement
      
      if (!meta) {
        meta = document.createElement('meta')
        if (isProperty) {
          meta.setAttribute('property', property)
        } else {
          meta.setAttribute('name', property)
        }
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }

    // Set basic meta tags
    setMetaTag('description', description)
    setMetaTag('keywords', keywords.join(', '))
    setMetaTag('author', 'Oda Team')
    setMetaTag('robots', 'index, follow')
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0')

    // Set Open Graph tags
    const currentUrl = window.location.origin + location.pathname
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:image', window.location.origin + image, true)
    setMetaTag('og:url', currentUrl, true)
    setMetaTag('og:type', type, true)
    setMetaTag('og:site_name', siteName, true)
    setMetaTag('og:locale', 'en_US', true)

    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', window.location.origin + image)
    setMetaTag('twitter:site', '@oda_fashion')
    setMetaTag('twitter:creator', '@oda_fashion')

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', currentUrl)

    // Set alternate language links (for future i18n support)
    const languages = ['en', 'es', 'fr', 'de']
    languages.forEach(lang => {
      let alternate = document.querySelector(`link[hreflang="${lang}"]`) as HTMLLinkElement
      if (!alternate) {
        alternate = document.createElement('link')
        alternate.setAttribute('rel', 'alternate')
        alternate.setAttribute('hreflang', lang)
        document.head.appendChild(alternate)
      }
      alternate.setAttribute('href', `${window.location.origin}/${lang}${location.pathname}`)
    })

    // Set structured data (JSON-LD)
    const setStructuredData = () => {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: siteName,
        description: description,
        url: currentUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          category: 'SaaS'
        },
        author: {
          '@type': 'Organization',
          name: 'Oda Team'
        }
      }

      let script = document.querySelector('script[type="application/ld+json"]')
      if (!script) {
        script = document.createElement('script')
        script.setAttribute('type', 'application/ld+json')
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    }

    setStructuredData()

  }, [config, location.pathname])

  return {
    updateSEO: (newConfig: SEOConfig) => {
      // This would trigger a re-render with new config
      // Implementation depends on how you want to handle dynamic updates
    }
  }
}

// Hook for page-specific SEO
export const usePageSEO = () => {
  const location = useLocation()

  const getPageSEO = (): SEOConfig => {
    const path = location.pathname

    // Define SEO config for different pages
    const seoConfigs: Record<string, SEOConfig> = {
      '/': {
        title: 'Dashboard - Oda Fashion ERP',
        description: 'Manage your fashion business with Oda\'s comprehensive dashboard. View analytics, inventory, orders, and more.',
        keywords: ['dashboard', 'fashion', 'ERP', 'analytics', 'business management']
      },
      '/products': {
        title: 'Products - Oda Fashion ERP',
        description: 'Manage your fashion product catalog with collections, variants, and inventory tracking.',
        keywords: ['products', 'catalog', 'fashion', 'inventory', 'collections']
      },
      '/inventory': {
        title: 'Inventory Management - Oda Fashion ERP',
        description: 'Track stock levels, manage adjustments, and monitor inventory across multiple locations.',
        keywords: ['inventory', 'stock', 'warehouse', 'tracking', 'management']
      },
      '/orders': {
        title: 'Order Management - Oda Fashion ERP',
        description: 'Process orders, manage fulfillment, and track customer purchases efficiently.',
        keywords: ['orders', 'fulfillment', 'customers', 'sales', 'processing']
      },
      '/customers': {
        title: 'Customer Management - Oda Fashion ERP',
        description: 'Manage customer relationships, segments, and loyalty programs with advanced CRM features.',
        keywords: ['customers', 'CRM', 'loyalty', 'segments', 'relationships']
      },
      '/analytics': {
        title: 'Analytics & Reports - Oda Fashion ERP',
        description: 'Analyze sales performance, customer behavior, and business metrics with detailed reports.',
        keywords: ['analytics', 'reports', 'metrics', 'performance', 'insights']
      },
      '/shopify': {
        title: 'Shopify Integration - Oda Fashion ERP',
        description: 'Sync your Shopify store with Oda for seamless inventory and order management.',
        keywords: ['shopify', 'integration', 'sync', 'ecommerce', 'automation']
      }
    }

    // Return specific config or default
    return seoConfigs[path] || {
      title: 'Oda Fashion ERP',
      description: 'Professional ERP solution for fashion businesses.',
      keywords: ['fashion', 'ERP', 'business', 'management']
    }
  }

  return getPageSEO()
}