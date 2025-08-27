import type { Preview } from '@storybook/react'
import 'antd/dist/reset.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    docs: {
      // Show the full source code in docs
      source: {
        state: 'open',
      },
    },
  },
}

export default preview
