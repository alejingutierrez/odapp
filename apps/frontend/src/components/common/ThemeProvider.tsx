import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { selectTheme, selectPrimaryColor } from '../../store/slices/uiSlice'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const currentTheme = useSelector(selectTheme)
  const primaryColor = useSelector(selectPrimaryColor)

  // Apply theme to document body for global styles
  useEffect(() => {
    const body = document.body

    if (currentTheme === 'dark') {
      body.classList.add('dark-theme')
      body.classList.remove('light-theme')
    } else {
      body.classList.add('light-theme')
      body.classList.remove('dark-theme')
    }

    // Handle auto theme based on system preference
    if (currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          body.classList.add('dark-theme')
          body.classList.remove('light-theme')
        } else {
          body.classList.add('light-theme')
          body.classList.remove('dark-theme')
        }
      }

      // Set initial theme
      handleChange({ matches: mediaQuery.matches } as MediaQueryListEvent)

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [currentTheme])

  // Determine effective theme
  const getEffectiveTheme = () => {
    if (currentTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return currentTheme
  }

  const effectiveTheme = getEffectiveTheme()

  // Ant Design theme configuration
  const themeConfig = {
    algorithm:
      effectiveTheme === 'dark'
        ? antdTheme.darkAlgorithm
        : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: primaryColor,
      borderRadius: 6,
      wireframe: false,
      // Custom tokens for fashion industry
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      // Typography
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 16,
      // Layout
      sizeStep: 4,
      sizeUnit: 4,
      // Motion
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
    },
    components: {
      // Button customization
      Button: {
        borderRadius: 6,
        controlHeight: 32,
        paddingContentHorizontal: 16,
      },
      // Input customization
      Input: {
        borderRadius: 6,
        controlHeight: 32,
        paddingInline: 12,
      },
      // Card customization
      Card: {
        borderRadius: 8,
        paddingLG: 24,
      },
      // Table customization
      Table: {
        borderRadius: 6,
        cellPaddingBlock: 12,
        cellPaddingInline: 16,
      },
      // Menu customization
      Menu: {
        itemBorderRadius: 6,
        itemHeight: 40,
        itemMarginBlock: 2,
        itemMarginInline: 8,
        itemPaddingInline: 16,
      },
      // Layout customization
      Layout: {
        headerBg: effectiveTheme === 'dark' ? '#001529' : '#ffffff',
        siderBg: effectiveTheme === 'dark' ? '#001529' : '#ffffff',
        bodyBg: effectiveTheme === 'dark' ? '#000000' : '#f0f2f5',
      },
      // Notification customization
      Notification: {
        borderRadius: 8,
        paddingMD: 16,
      },
      // Modal customization
      Modal: {
        borderRadius: 8,
        paddingContentHorizontal: 24,
        paddingMD: 20,
      },
      // Drawer customization
      Drawer: {
        borderRadius: 0,
        paddingLG: 24,
      },
    },
  }

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
}
