import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../Button/Button'

import { Spinner, LoadingButton, PageLoader, InlineLoader } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modern, accessible spinner component with multiple variants, sizes, and colors. Built with performance and accessibility in mind.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    color: {
      control: { type: 'select' },
      options: [
        'default',
        'primary',
        'secondary',
        'success',
        'warning',
        'error',
        'white',
      ],
      description: 'Color variant of the spinner',
    },
    variant: {
      control: { type: 'select' },
      options: ['spin', 'dots', 'pulse', 'bars', 'ring', 'bounce'],
      description: 'Animation variant of the spinner',
    },
    text: {
      control: 'text',
      description: 'Loading text to display',
    },
    centered: {
      control: 'boolean',
      description: 'Whether to center the spinner',
    },
    overlay: {
      control: 'boolean',
      description: 'Whether to show as overlay',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessibility label for screen readers',
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

// Basic Stories
export const Default: Story = {
  args: {},
}

export const WithText: Story = {
  args: {
    text: 'Loading...',
  },
}

export const Centered: Story = {
  args: {
    centered: true,
    text: 'Loading content...',
  },
}

// Size Stories
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size='xs' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>XS</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size='sm' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>SM</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size='md' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>MD</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>LG</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size='xl' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>XL</div>
      </div>
    </div>
  ),
}

// Color Stories
export const Colors: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spinner color='default' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Default</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner color='primary' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Primary</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner color='secondary' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Secondary</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner color='success' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Success</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner color='warning' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Warning</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner color='error' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Error</div>
      </div>
      <div
        style={{
          textAlign: 'center',
          backgroundColor: '#1f2937',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <Spinner color='white' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'white' }}>
          White
        </div>
      </div>
    </div>
  ),
}

// Variant Stories
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='spin' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Spin</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='dots' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Dots</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='pulse' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Pulse</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='bars' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Bars</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='ring' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Ring</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner variant='bounce' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Bounce</div>
      </div>
    </div>
  ),
}

// With Content
export const WithContent: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Spinner text='Loading user data...'>
        <div
          style={{
            padding: '24px',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
          }}
        >
          Content will appear here
        </div>
      </Spinner>
    </div>
  ),
}

// Overlay Examples
export const OverlayExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            padding: '24px',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            width: '200px',
            height: '150px',
          }}
        >
          <h4>Card Content</h4>
          <p>Some content that is being loaded...</p>
        </div>
        <Spinner overlay text='Loading...' />
      </div>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            padding: '24px',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            width: '200px',
            height: '150px',
          }}
        >
          <h4>Another Card</h4>
          <p>More content being processed...</p>
        </div>
        <Spinner overlay variant='dots' color='primary' />
      </div>
    </div>
  ),
}

// Loading Button Examples
export const LoadingButtons: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'flex-start',
      }}
    >
      <Button style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LoadingButton loading={false}>Submit Form</LoadingButton>
      </Button>

      <Button style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LoadingButton loading={true}>Submitting...</LoadingButton>
      </Button>

      <Button
        variant='primary'
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <LoadingButton loading={true} size='sm'>
          Processing Payment
        </LoadingButton>
      </Button>
    </div>
  ),
}

// Page Loader Examples
export const PageLoaders: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          height: '200px',
          position: 'relative',
        }}
      >
        <PageLoader text='Loading dashboard...' />
      </div>

      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          height: '150px',
          position: 'relative',
        }}
      >
        <PageLoader text='Fetching data...' variant='dots' size='md' />
      </div>
    </div>
  ),
}

// Different Contexts
export const DifferentContexts: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Inline spinner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Saving changes</span>
        <Spinner size='sm' />
      </div>

      {/* Button with spinner */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <Button>
          <Spinner size='sm' color='white' />
          <span style={{ marginLeft: '8px' }}>Loading...</span>
        </Button>
        <Button variant='primary'>
          <Spinner size='sm' color='white' />
          <span style={{ marginLeft: '8px' }}>Processing...</span>
        </Button>
      </div>

      {/* Card loading state */}
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <Spinner size='lg' text='Loading products...' />
      </div>

      {/* List item loading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Spinner size='sm' />
        <span>Refreshing notifications...</span>
      </div>
    </div>
  ),
}

// Performance States
export const PerformanceStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Spinner size='xs' />
        <span>Quick operation (XS spinner)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Spinner size='sm' />
        <span>Normal operation (SM spinner)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Spinner size='md' />
        <span>Medium operation (MD spinner)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Spinner size='lg' />
        <span>Heavy operation (LG spinner)</span>
      </div>
    </div>
  ),
}

// Inline Loader Examples
export const InlineLoaders: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Saving changes</span>
        <InlineLoader size='sm' />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Processing payment</span>
        <InlineLoader size='sm' variant='dots' color='success' />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Uploading file</span>
        <InlineLoader size='sm' variant='bars' color='primary' />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Syncing data</span>
        <InlineLoader size='sm' variant='pulse' color='warning' />
      </div>
    </div>
  ),
}

// Accessibility Examples
export const AccessibilityExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4>With Custom ARIA Label</h4>
        <Spinner
          size='md'
          text='Loading user profile...'
          aria-label='Loading user profile data from server'
        />
      </div>

      <div>
        <h4>Screen Reader Friendly</h4>
        <Spinner
          size='md'
          variant='dots'
          aria-label='Processing your request, please wait'
        />
      </div>

      <div>
        <h4>With Test ID</h4>
        <Spinner
          size='md'
          variant='ring'
          text='Loading...'
          testId='profile-loader'
        />
      </div>
    </div>
  ),
}

// Performance Variants
export const PerformanceOptimized: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4>GPU Accelerated Animations</h4>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Spinner variant='spin' size='lg' color='primary' />
          <Spinner variant='ring' size='lg' color='success' />
          <Spinner variant='bounce' size='lg' color='warning' />
        </div>
      </div>

      <div>
        <h4>Reduced Motion Support</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          Animations respect prefers-reduced-motion settings
        </p>
        <Spinner variant='pulse' size='lg' color='secondary' />
      </div>
    </div>
  ),
}

// Interactive Playground
export const Interactive: Story = {
  args: {
    size: 'md',
    color: 'primary',
    variant: 'spin',
    text: 'Loading...',
    centered: false,
    overlay: false,
    'aria-label': 'Loading content',
  },
}
