import { addons } from '@storybook/manager-api'
import { themes } from '@storybook/theming'

addons.setConfig({
  theme: {
    ...themes.light,
    brandTitle: 'ODA Design System',
    brandUrl: '/',
    brandImage: undefined,
    brandTarget: '_self',

    colorPrimary: '#1890ff',
    colorSecondary: '#52c41a',

    // UI
    appBg: '#ffffff',
    appContentBg: '#ffffff',
    appBorderColor: '#e8e8e8',
    appBorderRadius: 6,

    // Typography
    fontBase:
      '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontCode:
      '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',

    // Text colors
    textColor: '#262626',
    textInverseColor: '#ffffff',

    // Toolbar default and active colors
    barTextColor: '#595959',
    barSelectedColor: '#1890ff',
    barBg: '#ffffff',

    // Form colors
    inputBg: '#ffffff',
    inputBorder: '#d9d9d9',
    inputTextColor: '#262626',
    inputBorderRadius: 6,
  },

  panelPosition: 'bottom',

  sidebar: {
    showRoots: true,
    collapsedRoots: ['atoms', 'molecules', 'organisms'],
  },

  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
})
