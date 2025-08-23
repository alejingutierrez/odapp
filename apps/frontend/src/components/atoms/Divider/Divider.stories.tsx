import {
  SettingOutlined,
  UserOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { Divider, SectionDivider, Spacer } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Divider component for creating visual separation between content sections with various styles and orientations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['solid', 'dashed', 'dotted', 'gradient'],
      description: 'Visual style of the divider',
    },
    thickness: {
      control: { type: 'select' },
      options: ['thin', 'medium', 'thick'],
      description: 'Thickness of the divider line',
    },
    spacing: {
      control: { type: 'select' },
      options: ['tight', 'normal', 'loose'],
      description: 'Spacing around the divider',
    },
    color: {
      control: { type: 'select' },
      options: ['default', 'light', 'primary', 'secondary'],
      description: 'Color variant of the divider',
    },
    type: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the divider',
    },
  },
}

export default meta
type Story = StoryObj<typeof Divider>

// Basic Stories
export const Default: Story = {
  render: () => (
    <div>
      <p>Content above the divider</p>
      <Divider />
      <p>Content below the divider</p>
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <div>
      <p>Content above the divider</p>
      <Divider>Section Title</Divider>
      <p>Content below the divider</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', height: '100px' }}>
      <span>Left content</span>
      <Divider type='vertical' />
      <span>Middle content</span>
      <Divider type='vertical' />
      <span>Right content</span>
    </div>
  ),
}

// Variant Stories
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p>Solid Divider</p>
        <Divider variant='solid' />
        <p>Content after solid</p>
      </div>
      <div>
        <p>Dashed Divider</p>
        <Divider variant='dashed' />
        <p>Content after dashed</p>
      </div>
      <div>
        <p>Dotted Divider</p>
        <Divider variant='dotted' />
        <p>Content after dotted</p>
      </div>
      <div>
        <p>Gradient Divider</p>
        <Divider variant='gradient' />
        <p>Content after gradient</p>
      </div>
    </div>
  ),
}

// Thickness Stories
export const Thickness: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p>Thin Divider</p>
        <Divider thickness='thin' />
        <p>Content after thin</p>
      </div>
      <div>
        <p>Medium Divider</p>
        <Divider thickness='medium' />
        <p>Content after medium</p>
      </div>
      <div>
        <p>Thick Divider</p>
        <Divider thickness='thick' />
        <p>Content after thick</p>
      </div>
    </div>
  ),
}

// Spacing Stories
export const Spacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p>Tight Spacing</p>
        <Divider spacing='tight' />
        <p>Content after tight</p>
      </div>
      <div>
        <p>Normal Spacing</p>
        <Divider spacing='normal' />
        <p>Content after normal</p>
      </div>
      <div>
        <p>Loose Spacing</p>
        <Divider spacing='loose' />
        <p>Content after loose</p>
      </div>
    </div>
  ),
}

// Color Stories
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p>Default Color</p>
        <Divider color='default' />
        <p>Content after default</p>
      </div>
      <div>
        <p>Light Color</p>
        <Divider color='light' />
        <p>Content after light</p>
      </div>
      <div>
        <p>Primary Color</p>
        <Divider color='primary' />
        <p>Content after primary</p>
      </div>
      <div>
        <p>Secondary Color</p>
        <Divider color='secondary' />
        <p>Content after secondary</p>
      </div>
    </div>
  ),
}

// Text Positioning
export const TextPositioning: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p>Left aligned text</p>
        <Divider orientation='left'>Left</Divider>
        <p>Content after left</p>
      </div>
      <div>
        <p>Center aligned text</p>
        <Divider>Center</Divider>
        <p>Content after center</p>
      </div>
      <div>
        <p>Right aligned text</p>
        <Divider orientation='right'>Right</Divider>
        <p>Content after right</p>
      </div>
    </div>
  ),
}

// Section Divider Stories
export const SectionDividers: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <SectionDivider title='User Settings' />

      <SectionDivider
        title='Account Information'
        subtitle='Manage your personal details and preferences'
        icon={<UserOutlined />}
      />

      <SectionDivider
        title='System Configuration'
        icon={<SettingOutlined />}
        variant='centered'
      />

      <SectionDivider
        title='Shopping Cart'
        subtitle='Review your selected items'
        icon={<ShoppingOutlined />}
        size='large'
      />
    </div>
  ),
}

// Spacer Stories
export const Spacers: Story = {
  render: () => (
    <div>
      <p>Content before spacer</p>
      <Spacer size='xs' />
      <p>After XS spacer</p>
      <Spacer size='sm' />
      <p>After SM spacer</p>
      <Spacer size='md' />
      <p>After MD spacer</p>
      <Spacer size='lg' />
      <p>After LG spacer</p>
      <Spacer size='xl' />
      <p>After XL spacer</p>
      <Spacer size='2xl' />
      <p>After 2XL spacer</p>
    </div>
  ),
}

export const HorizontalSpacers: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>Left</span>
      <Spacer direction='horizontal' size='xs' />
      <span>XS</span>
      <Spacer direction='horizontal' size='sm' />
      <span>SM</span>
      <Spacer direction='horizontal' size='md' />
      <span>MD</span>
      <Spacer direction='horizontal' size='lg' />
      <span>LG</span>
      <Spacer direction='horizontal' size='xl' />
      <span>Right</span>
    </div>
  ),
}

// Complex Layout Example
export const ComplexLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <h2>Product Details</h2>
      <Divider variant='gradient' />

      <p>Basic product information and specifications.</p>

      <SectionDivider
        title='Reviews & Ratings'
        subtitle='What customers are saying'
        variant='left'
      />

      <p>Customer reviews content would go here.</p>

      <Spacer size='lg' />

      <SectionDivider
        title='Related Products'
        icon={<ShoppingOutlined />}
        variant='centered'
      />

      <p>Related products would be displayed here.</p>

      <Divider variant='dashed' spacing='loose'>
        End of Product Details
      </Divider>
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    variant: 'solid',
    thickness: 'thin',
    spacing: 'normal',
    color: 'default',
    children: 'Interactive Divider',
  },
}
