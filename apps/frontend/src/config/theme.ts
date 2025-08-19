import type { ThemeConfig } from 'antd'

// Fashion Brand Color Palette
export const brandColors = {
  // Primary Fashion Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Fashion-specific colors
  fashion: {
    rose: '#f43f5e',
    pink: '#ec4899',
    purple: '#a855f7',
    indigo: '#6366f1',
    emerald: '#10b981',
    amber: '#f59e0b',
    orange: '#f97316',
  },
  // Neutral colors for fashion UI
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Status colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
}

// Typography Scale
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace'
    ].join(', '),
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}

// Spacing Scale
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
}

// Border Radius Scale
export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
}

// Shadow Scale
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}

// Ant Design Theme Configuration
export const theme: ThemeConfig = {
  token: {
    // Brand Colors
    colorPrimary: brandColors.primary[500],
    colorSuccess: brandColors.status.success,
    colorWarning: brandColors.status.warning,
    colorError: brandColors.status.error,
    colorInfo: brandColors.status.info,
    
    // Background Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: brandColors.neutral[50],
    colorBgSpotlight: brandColors.neutral[100],
    
    // Text Colors
    colorText: brandColors.neutral[900],
    colorTextSecondary: brandColors.neutral[600],
    colorTextTertiary: brandColors.neutral[500],
    colorTextQuaternary: brandColors.neutral[400],
    
    // Border Colors
    colorBorder: brandColors.neutral[200],
    colorBorderSecondary: brandColors.neutral[100],
    
    // Typography
    fontSize: 16,
    fontSizeHeading1: 48,
    fontSizeHeading2: 36,
    fontSizeHeading3: 30,
    fontSizeHeading4: 24,
    fontSizeHeading5: 20,
    fontSizeLG: 18,
    fontSizeSM: 14,
    fontSizeXL: 20,
    fontFamily: typography.fontFamily.sans,
    fontWeightStrong: typography.fontWeight.semibold,
    
    // Layout
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Control Heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,
    
    // Line Heights
    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.3,
    lineHeightHeading4: 1.35,
    lineHeightHeading5: 1.4,
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    
    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  components: {
    // Layout Components
    Layout: {
      headerBg: brandColors.neutral[900],
      headerColor: brandColors.neutral[50],
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: brandColors.neutral[50],
      bodyBg: brandColors.neutral[25] || '#fcfcfc',
      footerBg: brandColors.neutral[50],
      footerPadding: '24px 50px',
      triggerBg: brandColors.neutral[100],
      triggerColor: brandColors.neutral[700],
    },
    
    // Navigation
    Menu: {
      itemBg: 'transparent',
      itemColor: brandColors.neutral[700],
      itemHoverBg: brandColors.primary[50],
      itemHoverColor: brandColors.primary[600],
      itemSelectedBg: brandColors.primary[100],
      itemSelectedColor: brandColors.primary[700],
      subMenuItemBg: 'transparent',
      darkItemBg: brandColors.neutral[800],
      darkSubMenuItemBg: brandColors.neutral[900],
      darkItemColor: brandColors.neutral[300],
      darkItemHoverBg: brandColors.neutral[700],
      darkItemSelectedBg: brandColors.primary[600],
    },
    
    // Form Controls
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: typography.fontWeight.medium,
      primaryShadow: `0 2px 0 ${brandColors.primary[200]}`,
    },
    
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingInline: 12,
      paddingBlock: 8,
    },
    
    Select: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    
    DatePicker: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    
    // Data Display
    Card: {
      borderRadius: 12,
      borderRadiusLG: 16,
      paddingLG: 24,
      headerBg: 'transparent',
      headerHeight: 56,
      boxShadow: shadows.sm,
      boxShadowHover: shadows.md,
    },
    
    Table: {
      borderRadius: 8,
      headerBg: brandColors.neutral[50],
      headerColor: brandColors.neutral[700],
      headerSortActiveBg: brandColors.neutral[100],
      headerSortHoverBg: brandColors.neutral[75] || '#f8f8f8',
      bodySortBg: brandColors.neutral[25] || '#fcfcfc',
      rowHoverBg: brandColors.neutral[50],
      rowSelectedBg: brandColors.primary[50],
      rowSelectedHoverBg: brandColors.primary[75] || '#e0f2fe',
    },
    
    Tag: {
      borderRadius: 6,
      borderRadiusSM: 4,
      fontSizeSM: 12,
      lineHeightSM: 1.4,
    },
    
    Badge: {
      borderRadius: 10,
      fontSizeSM: 12,
      fontWeight: typography.fontWeight.medium,
    },
    
    Avatar: {
      borderRadius: 8,
      containerSize: 40,
      containerSizeLG: 48,
      containerSizeSM: 32,
    },
    
    // Feedback
    Alert: {
      borderRadius: 8,
      paddingContentHorizontalLG: 16,
      paddingContentVerticalLG: 12,
    },
    
    Message: {
      borderRadius: 8,
      contentPadding: '12px 16px',
    },
    
    Notification: {
      borderRadius: 12,
      paddingContentHorizontal: 20,
      paddingContentVertical: 16,
    },
    
    Modal: {
      borderRadius: 16,
      headerBg: 'transparent',
      contentBg: brandColors.neutral[50],
      footerBg: 'transparent',
    },
    
    Drawer: {
      borderRadius: 0,
      paddingLG: 24,
    },
    
    // Navigation
    Pagination: {
      borderRadius: 6,
      itemSize: 32,
      itemSizeSM: 24,
    },
    
    Breadcrumb: {
      fontSize: 14,
      itemColor: brandColors.neutral[600],
      lastItemColor: brandColors.neutral[900],
      linkColor: brandColors.primary[600],
      linkHoverColor: brandColors.primary[700],
      separatorColor: brandColors.neutral[400],
    },
    
    // Data Entry
    Form: {
      labelColor: brandColors.neutral[700],
      labelFontSize: 14,
      labelHeight: 32,
      labelRequiredMarkColor: brandColors.status.error,
      itemMarginBottom: 24,
      verticalLabelPadding: '0 0 8px',
    },
    
    // Utility
    Divider: {
      colorSplit: brandColors.neutral[200],
      orientationMargin: 0.05,
    },
    
    Spin: {
      colorPrimary: brandColors.primary[500],
    },
    
    Progress: {
      borderRadius: 100,
      lineCap: 'round',
    },
  },
}

// Export design tokens for use in components
export const designTokens = {
  colors: brandColors,
  typography,
  spacing,
  borderRadius,
  shadows,
}
