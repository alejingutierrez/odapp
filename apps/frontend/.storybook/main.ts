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
  webpackFinal: async (config) => {
    const webpack = require('webpack')

    // Disable HMR and WebSocket for Docker environment
    config.devServer = {
      ...config.devServer,
      host: '0.0.0.0',
      port: 6006,
      allowedHosts: 'all',
      hot: false,
      liveReload: false,
      client: false,
    }

    // Remove all HMR-related plugins and entries
    config.plugins = config.plugins?.filter(
      (plugin) =>
        !['HotModuleReplacementPlugin', 'webpack-hot-middleware'].includes(
          plugin.constructor.name
        )
    )

    // Add ProvidePlugin to automatically provide React
    config.plugins?.push(
      new webpack.ProvidePlugin({
        React: 'react',
      })
    )

    // Remove webpack-hot-middleware from entries
    if (config.entry && Array.isArray(config.entry)) {
      config.entry = config.entry.filter(
        (entry) => !entry.includes('webpack-hot-middleware')
      )
    }

    // Remove HMR from module rules
    if (config.module?.rules) {
      config.module.rules = config.module.rules.map((rule) => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use = rule.use.filter(
            (use) => !use.loader?.includes('webpack-hot-middleware')
          )
        }
        return rule
      })
    }

    return config
  },
}

export default config
