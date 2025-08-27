import path from 'path'

import type { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true, // Use SWC for faster builds
      },
    },
  },
  docs: {
    autodocs: 'tag',
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  webpackFinal: async (config) => {
    const webpack = require('webpack')

    // Add TypeScript resolution
    if (config.resolve) {
      config.resolve.extensions = [
        ...(config.resolve.extensions || []),
        '.ts',
        '.tsx',
      ]
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@/components': path.resolve(__dirname, '../src/components'),
        '@/pages': path.resolve(__dirname, '../src/pages'),
        '@/hooks': path.resolve(__dirname, '../src/hooks'),
        '@/services': path.resolve(__dirname, '../src/services'),
        '@/store': path.resolve(__dirname, '../src/store'),
        '@/utils': path.resolve(__dirname, '../src/utils'),
        '@/types': path.resolve(__dirname, '../src/types'),
        '@/assets': path.resolve(__dirname, '../src/assets'),
      }
    }

    // Disable HMR and WebSocket for Docker environment

    // Add ProvidePlugin to automatically provide React
    config.plugins?.push(
      new webpack.ProvidePlugin({
        React: 'react',
      })
    )

    return config
  },
}

export default config
