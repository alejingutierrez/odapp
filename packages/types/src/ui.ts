// UI-specific types
export interface TableColumn<T = unknown> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: unknown, record: T, index: number) => unknown
  sorter?: boolean
  width?: number
  fixed?: 'left' | 'right'
}

export interface FormField {
  name: string
  label: string
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'textarea'
    | 'date'
    | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: ValidationRule[]
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern'
  value?: string | number
  message: string
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface ModalConfig {
  title: string
  content: unknown
  width?: number
  closable?: boolean
  maskClosable?: boolean
  onOk?: () => void
  onCancel?: () => void
}

// Theme types
export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  fontSize: {
    small: number
    medium: number
    large: number
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}
