import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { vi } from 'vitest'
import React from 'react'

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.clearAllMocks()
})

// Mock específico para el componente Image de Ant Design
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Image: vi.fn(
      ({ src, alt, preview: _preview, onError, className, ...props }) => {
        // Simular un error de imagen si no hay src
        if (!src) {
          if (onError) {
            setTimeout(() => onError(new Error('Image failed to load')), 0)
          }
          return React.createElement(
            'div',
            {
              className: `${className || ''} ant-image-error`,
              'data-testid': 'antd-image-error',
            },
            'Image failed to load'
          )
        }

        return React.createElement('img', {
          src,
          alt,
          className: `${className || ''} antd-image`,
          'data-testid': 'antd-image',
          onError: onError
            ? () => onError(new Error('Image failed to load'))
            : undefined,
          ...props,
        })
      }
    ),
    Card: vi.fn(
      ({
        children,
        className,
        bodyStyle: _bodyStyle,
        loading,
        hoverable: _hoverable,
        ...props
      }) => {
        return React.createElement(
          'div',
          {
            className: `ant-card ${className || ''} ${loading ? 'ant-card-loading' : ''}`,
            'data-testid': 'antd-card',
            ...props,
          },
          children
        )
      }
    ),
    Button: vi.fn(
      ({
        children,
        className,
        type: _type,
        size,
        icon,
        onClick,
        loading,
        danger,
        block,
        htmlType,
        ...props
      }) => {
        const buttonClasses = ['ant-btn']
        if (className) buttonClasses.push(className)
        if (loading) buttonClasses.push('ant-btn-loading')
        if (danger) buttonClasses.push('ant-btn-dangerous')
        if (block) buttonClasses.push('ant-btn-block')

        // Add size classes
        if (size === 'small') buttonClasses.push('ant-btn-sm')
        if (size === 'large') buttonClasses.push('ant-btn-lg')

        return React.createElement(
          'button',
          {
            className: buttonClasses.join(' '),
            type: htmlType || 'button',
            onClick,
            disabled: loading,
            ...props, // Esto incluirá data-testid y otras props
          },
          icon,
          children
        )
      }
    ),
  }
})

// Mock básico para Ant Design icons
vi.mock('@ant-design/icons', () => {
  const createIconMock = (name: string) => {
    return vi.fn((props: any) => {
      const iconName = name
        .toLowerCase()
        .replace('outlined', '')
        .replace('filled', '')
      return React.createElement(
        'span',
        {
          'data-testid': `${name.toLowerCase()}-icon`,
          'aria-label': name,
          className: `anticon anticon-${iconName}`,
          ...props,
        },
        '🔸'
      )
    })
  }

  return {
    // Solo los iconos más básicos
    PlusOutlined: createIconMock('PlusOutlined'),
    EditOutlined: createIconMock('EditOutlined'),
    DeleteOutlined: createIconMock('DeleteOutlined'),
    SearchOutlined: createIconMock('SearchOutlined'),
    UserOutlined: createIconMock('UserOutlined'),
    SettingOutlined: createIconMock('SettingOutlined'),
    HomeOutlined: createIconMock('HomeOutlined'),
    ShoppingOutlined: createIconMock('ShoppingOutlined'),
    EyeOutlined: createIconMock('EyeOutlined'),
    EyeInvisibleOutlined: createIconMock('EyeInvisibleOutlined'),
    EyeTwoTone: createIconMock('EyeTwoTone'),
    InfoCircleOutlined: createIconMock('InfoCircleOutlined'),
    ExclamationCircleOutlined: createIconMock('ExclamationCircleOutlined'),
    UploadOutlined: createIconMock('UploadOutlined'),
    DownloadOutlined: createIconMock('DownloadOutlined'),
    BulbOutlined: createIconMock('BulbOutlined'),
    LeafOutlined: createIconMock('LeafOutlined'),
    ReloadOutlined: createIconMock('ReloadOutlined'),
    FilterOutlined: createIconMock('FilterOutlined'),
    CloseOutlined: createIconMock('CloseOutlined'),
    CheckOutlined: createIconMock('CheckOutlined'),
    StarOutlined: createIconMock('StarOutlined'),
    HeartOutlined: createIconMock('HeartOutlined'),
    FireOutlined: createIconMock('FireOutlined'),
    ThunderboltOutlined: createIconMock('ThunderboltOutlined'),
    EnvironmentOutlined: createIconMock('EnvironmentOutlined'),
    RiseOutlined: createIconMock('RiseOutlined'),
    CalendarOutlined: createIconMock('CalendarOutlined'),
    FileOutlined: createIconMock('FileOutlined'),
    FilePdfOutlined: createIconMock('FilePdfOutlined'),
    FileImageOutlined: createIconMock('FileImageOutlined'),
    FileTextOutlined: createIconMock('FileTextOutlined'),
    FileExcelOutlined: createIconMock('FileExcelOutlined'),
    FileWordOutlined: createIconMock('FileWordOutlined'),
    FilePptOutlined: createIconMock('FilePptOutlined'),
    FileZipOutlined: createIconMock('FileZipOutlined'),
    // Iconos adicionales que faltan
    MoreOutlined: createIconMock('MoreOutlined'),
    DollarOutlined: createIconMock('DollarOutlined'),
    EuroOutlined: createIconMock('EuroOutlined'),
    PhoneOutlined: createIconMock('PhoneOutlined'),
    MailOutlined: createIconMock('MailOutlined'),
    VideoCameraOutlined: createIconMock('VideoCameraOutlined'),
    DashboardOutlined: createIconMock('DashboardOutlined'),
    LoadingOutlined: createIconMock('LoadingOutlined'),
    MinusOutlined: createIconMock('MinusOutlined'),
    WarningOutlined: createIconMock('WarningOutlined'),
    CheckCircleOutlined: createIconMock('CheckCircleOutlined'),
    ClockCircleOutlined: createIconMock('ClockCircleOutlined'),
    StarFilled: createIconMock('StarFilled'),
    HeartFilled: createIconMock('HeartFilled'),
    TagOutlined: createIconMock('TagOutlined'),
    DownOutlined: createIconMock('DownOutlined'),
    UpOutlined: createIconMock('UpOutlined'),
    LeftOutlined: createIconMock('LeftOutlined'),
    RightOutlined: createIconMock('RightOutlined'),
    MenuOutlined: createIconMock('MenuOutlined'),
    BarsOutlined: createIconMock('BarsOutlined'),
    BellOutlined: createIconMock('BellOutlined'),
    FolderOutlined: createIconMock('FolderOutlined'),
    ImageOutlined: createIconMock('ImageOutlined'),
    AudioOutlined: createIconMock('AudioOutlined'),
    ClearOutlined: createIconMock('ClearOutlined'),
    ArrowUpOutlined: createIconMock('ArrowUpOutlined'),
    ArrowDownOutlined: createIconMock('ArrowDownOutlined'),
    // Últimos iconos faltantes
    MessageOutlined: createIconMock('MessageOutlined'),
    InboxOutlined: createIconMock('InboxOutlined'),
    InvalidIcon: createIconMock('InvalidIcon'),
    // Iconos adicionales identificados en los errores
    ShoppingCartOutlined: createIconMock('ShoppingCartOutlined'),
    ExclamationOutlined: createIconMock('ExclamationOutlined'),
    // Iconos del componente ActivityIcon
    ShareAltOutlined: createIconMock('ShareAltOutlined'),
    LoginOutlined: createIconMock('LoginOutlined'),
    LogoutOutlined: createIconMock('LogoutOutlined'),
    QuestionCircleOutlined: createIconMock('QuestionCircleOutlined'),
    // Iconos adicionales identificados en los últimos errores
    BarChartOutlined: createIconMock('BarChartOutlined'),
    CloseCircleOutlined: createIconMock('CloseCircleOutlined'),
    SyncOutlined: createIconMock('SyncOutlined'),
    TruckOutlined: createIconMock('TruckOutlined'),
    // Últimos iconos faltantes
    ShopOutlined: createIconMock('ShopOutlined'),
    MinusCircleOutlined: createIconMock('MinusCircleOutlined'),
    // Iconos adicionales identificados en los errores de tests
    CalculatorOutlined: createIconMock('CalculatorOutlined'),
    // Iconos del componente Accordion
    CaretRightOutlined: createIconMock('CaretRightOutlined'),
  }
})

// Mock básico para APIs del navegador
global.getComputedStyle = vi.fn().mockImplementation((element) => {
  // Si el elemento tiene estilos inline, usarlos
  if (element && element.style) {
    return {
      getPropertyValue: (prop: string) => element.style[prop as any] || '',
      overflowX: element.style.overflowX || 'visible',
      overflowY: element.style.overflowY || 'visible',
      pointerEvents: element.style.pointerEvents || 'auto',
      visibility: element.style.visibility || 'visible',
      width: element.style.width || '100px',
      height: element.style.height || '100px',
      position: element.style.position || 'static',
      display: element.style.display || 'block',
      fontSize: element.style.fontSize || '16px',
      color: element.style.color || 'black',
      backgroundColor: element.style.backgroundColor || 'transparent',
      borderRadius: element.style.borderRadius || '0px',
      border: element.style.border || 'none',
      margin: element.style.margin || '0px',
      padding: element.style.padding || '0px',
    }
  }

  // Valores por defecto
  return {
    getPropertyValue: vi.fn().mockReturnValue(''),
    overflowX: 'visible',
    overflowY: 'visible',
    pointerEvents: 'auto',
    visibility: 'visible',
    width: '100px',
    height: '100px',
    position: 'static',
    display: 'block',
    fontSize: '16px',
    color: 'black',
    backgroundColor: 'transparent',
    borderRadius: '0px',
    border: 'none',
    margin: '0px',
    padding: '0px',
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock File API
global.File = vi.fn().mockImplementation((content, name, options) => ({
  name: name || 'test-file.txt',
  size: content ? content.length : 0,
  type: options?.type || 'text/plain',
  lastModified: Date.now(),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  slice: vi.fn().mockReturnValue(new (global as any).Blob()),
  stream: vi.fn().mockReturnValue(new (global as any).ReadableStream()),
  text: vi.fn().mockResolvedValue(''),
})) as unknown as typeof File

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')

// Mock document methods
if (!document.documentElement) {
  Object.defineProperty(document, 'documentElement', {
    value: {
      clientWidth: 1200,
      clientHeight: 800,
      scrollTop: 0,
      scrollLeft: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })
}

// Suppress React warnings in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress findDOMNode warnings
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
      return
    }
    // Suppress act() warnings from Ant Design internals
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) {
      return
    }
    // Suppress other React warnings that are not critical
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('findDOMNode') ||
        args[0].includes('act(...)'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    // Suppress findDOMNode warnings
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
      return
    }
    // Suppress act() warnings from Ant Design internals
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) {
      return
    }
    // Suppress other React warnings that are not critical
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('findDOMNode') ||
        args[0].includes('act(...)'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
