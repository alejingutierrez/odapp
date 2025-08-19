import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button, Typography, Collapse } from 'antd'
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons'

const { Paragraph, Text } = Typography
const { Panel } = Collapse

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // TODO: Send error to monitoring service (Sentry, etc.)
    // reportError(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div style={{ padding: '48px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <Result
            status="error"
            icon={<BugOutlined />}
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
            extra={[
              <Button key="retry" type="primary" onClick={this.handleRetry}>
                <ReloadOutlined />
                Try Again
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                <ReloadOutlined />
                Reload Page
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                <HomeOutlined />
                Go Home
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ textAlign: 'left', marginTop: '24px' }}>
                <Collapse ghost>
                  <Panel header="Error Details (Development Only)" key="1">
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Error Message:</Text>
                      <Paragraph
                        code
                        copyable
                        style={{
                          background: '#f5f5f5',
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '8px',
                        }}
                      >
                        {this.state.error.message}
                      </Paragraph>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Stack Trace:</Text>
                      <Paragraph
                        code
                        copyable
                        style={{
                          background: '#f5f5f5',
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '8px',
                          fontSize: '12px',
                          maxHeight: '200px',
                          overflow: 'auto',
                        }}
                      >
                        {this.state.error.stack}
                      </Paragraph>
                    </div>

                    {this.state.errorInfo && (
                      <div>
                        <Text strong>Component Stack:</Text>
                        <Paragraph
                          code
                          copyable
                          style={{
                            background: '#f5f5f5',
                            padding: '8px',
                            borderRadius: '4px',
                            marginTop: '8px',
                            fontSize: '12px',
                            maxHeight: '200px',
                            overflow: 'auto',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Paragraph>
                      </div>
                    )}
                  </Panel>
                </Collapse>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Log error
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // TODO: Send to monitoring service
    // reportError(error, errorInfo)
    
    // You could also dispatch to Redux store to show global error state
    // dispatch(addNotification({ type: 'error', message: error.message }))
  }
}