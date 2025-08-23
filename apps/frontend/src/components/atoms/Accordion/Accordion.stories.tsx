import type { Meta, StoryObj } from '@storybook/react'
import { Accordion } from './Accordion'

const meta: Meta<typeof Accordion> = {
  title: 'Atoms/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    accordion: {
      control: 'boolean',
      description: 'Only one panel can be expanded at a time',
    },
    bordered: {
      control: 'boolean',
      description: 'Whether to show border',
    },
    ghost: {
      control: 'boolean',
      description: 'Make accordion transparent',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Size of the accordion',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleItems = [
  {
    key: '1',
    title: 'Panel 1',
    content: (
      <div>
        <p>
          This is the content of panel 1. It can contain any React elements.
        </p>
        <p>
          Multiple paragraphs, lists, buttons, or other components can be placed
          here.
        </p>
      </div>
    ),
  },
  {
    key: '2',
    title: 'Panel 2',
    content: (
      <div>
        <p>This is the content of panel 2.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
      </div>
    ),
  },
  {
    key: '3',
    title: 'Panel 3',
    content: <p>This is the content of panel 3. Short and simple.</p>,
  },
]

export const Default: Story = {
  args: {
    items: sampleItems,
  },
}

export const AccordionMode: Story = {
  args: {
    items: sampleItems,
    accordion: true,
  },
}

export const WithDefaultOpen: Story = {
  args: {
    items: sampleItems,
    defaultActiveKey: ['1', '2'],
  },
}

export const Bordered: Story = {
  args: {
    items: sampleItems,
    bordered: true,
  },
}

export const Ghost: Story = {
  args: {
    items: sampleItems,
    ghost: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '500px',
      }}
    >
      <div>
        <h4>Small</h4>
        <Accordion items={sampleItems} size='small' />
      </div>
      <div>
        <h4>Middle (Default)</h4>
        <Accordion items={sampleItems} size='middle' />
      </div>
      <div>
        <h4>Large</h4>
        <Accordion items={sampleItems} size='large' />
      </div>
    </div>
  ),
}

export const WithDisabledPanel: Story = {
  args: {
    items: [
      ...sampleItems,
      {
        key: '4',
        title: 'Disabled Panel',
        content: <p>This panel is disabled and cannot be opened.</p>,
        disabled: true,
      },
    ],
  },
}

export const ComplexContent: Story = {
  args: {
    items: [
      {
        key: '1',
        title: 'User Information',
        content: (
          <div style={{ padding: '16px' }}>
            <h4>Personal Details</h4>
            <p>
              <strong>Name:</strong> John Doe
            </p>
            <p>
              <strong>Email:</strong> john.doe@example.com
            </p>
            <p>
              <strong>Phone:</strong> +1 (555) 123-4567
            </p>
          </div>
        ),
      },
      {
        key: '2',
        title: 'Settings & Preferences',
        content: (
          <div style={{ padding: '16px' }}>
            <h4>Account Settings</h4>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <label>
                <input type='checkbox' defaultChecked /> Email notifications
              </label>
              <label>
                <input type='checkbox' /> SMS notifications
              </label>
              <label>
                <input type='checkbox' defaultChecked /> Marketing emails
              </label>
            </div>
          </div>
        ),
      },
      {
        key: '3',
        title: 'Billing Information',
        content: (
          <div style={{ padding: '16px' }}>
            <h4>Payment Methods</h4>
            <p>Credit Card ending in ****1234</p>
            <p>Next billing date: March 15, 2024</p>
            <button style={{ marginTop: '8px', padding: '8px 16px' }}>
              Update Payment Method
            </button>
          </div>
        ),
      },
    ],
  },
}
