import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout, Card, Grid, theme as antdTheme } from 'antd'
import { ThemeProvider } from '../common/ThemeProvider'

const { Content } = Layout
const { useBreakpoint } = Grid

export const AuthLayout: React.FC = () => {
  const screens = useBreakpoint()
  const { token } = antdTheme.useToken()

  const isMobile = !screens.md

  return (
    <ThemeProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '48px',
            background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}05 100%)`,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: token.colorPrimary,
                  marginBottom: '8px',
                }}
              >
                Oda
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: token.colorTextSecondary,
                }}
              >
                Fashion ERP Platform
              </div>
            </div>

            {/* Auth Form Card */}
            <Card
              style={{
                boxShadow: token.boxShadowTertiary,
                borderRadius: token.borderRadiusLG,
              }}
              bodyStyle={{
                padding: isMobile ? '24px' : '32px',
              }}
            >
              <Outlet />
            </Card>

            {/* Footer */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: token.colorTextTertiary,
              }}
            >
              © 2024 Oda. All rights reserved.
            </div>
          </div>
        </Content>
      </Layout>
    </ThemeProvider>
  )
}