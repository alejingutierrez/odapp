/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/react'
import { Space } from 'antd'

import { RatingInput } from './RatingInput'

const meta: Meta<typeof RatingInput> = {
  title: 'Atoms/RatingInput',
  component: RatingInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile rating input component with star, numeric, and emoji rating systems for customer feedback and product reviews.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['star', 'numeric', 'emoji', 'heart', 'thumbs'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    max: {
      control: { type: 'number', min: 1, max: 10 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 4,
    max: 5,
  },
}

export const RatingTypes: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <div>
        <h4>Star Rating</h4>
        <RatingInput type='star' value={4} max={5} />
      </div>
      <div>
        <h4>Heart Rating</h4>
        <RatingInput type='heart' value={3} max={5} />
      </div>
      <div>
        <h4>Numeric Rating</h4>
        <RatingInput type='numeric' value={7.5} max={10} step={0.5} />
      </div>
      <div>
        <h4>Emoji Rating</h4>
        <RatingInput type='emoji' value={4} max={5} />
      </div>
      <div>
        <h4>Thumbs Rating</h4>
        <RatingInput type='thumbs' value={1} />
      </div>
    </Space>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <div>
        <h4>Small</h4>
        <Space wrap>
          <RatingInput type='star' value={4} size='small' />
          <RatingInput type='emoji' value={4} size='small' />
          <RatingInput type='thumbs' value={1} size='small' />
        </Space>
      </div>
      <div>
        <h4>Medium</h4>
        <Space wrap>
          <RatingInput type='star' value={4} size='medium' />
          <RatingInput type='emoji' value={4} size='medium' />
          <RatingInput type='thumbs' value={1} size='medium' />
        </Space>
      </div>
      <div>
        <h4>Large</h4>
        <Space wrap>
          <RatingInput type='star' value={4} size='large' />
          <RatingInput type='emoji' value={4} size='large' />
          <RatingInput type='thumbs' value={1} size='large' />
        </Space>
      </div>
    </Space>
  ),
}

export const WithValues: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <RatingInput type='star' value={4.5} showValue allowHalf />
      <RatingInput type='heart' value={3} showValue />
      <RatingInput type='numeric' value={8.7} showValue max={10} />
      <RatingInput type='emoji' value={5} showValue />
      <RatingInput type='thumbs' value={1} showValue />
    </Space>
  ),
}

export const WithTooltips: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <RatingInput
        type='star'
        value={4}
        showTooltips
        tooltips={['Terrible', 'Bad', 'Okay', 'Good', 'Excellent']}
      />
      <RatingInput
        type='heart'
        value={3}
        showTooltips
        tooltips={['Hate it', 'Dislike', 'Neutral', 'Like', 'Love it']}
      />
    </Space>
  ),
}

export const CustomEmojis: Story = {
  args: {
    type: 'emoji',
    value: 3,
    emojiRatings: [
      { value: 1, emoji: '🤮', label: 'Disgusting', color: '#ff4d4f' },
      { value: 2, emoji: '😤', label: 'Angry', color: '#ff7a45' },
      { value: 3, emoji: '😑', label: 'Meh', color: '#faad14' },
      { value: 4, emoji: '🙂', label: 'Happy', color: '#73d13d' },
      { value: 5, emoji: '🤩', label: 'Amazing', color: '#52c41a' },
    ],
    showValue: true,
  },
}

export const States: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <div>
        <h4>Normal</h4>
        <RatingInput type='star' value={4} />
      </div>
      <div>
        <h4>Disabled</h4>
        <RatingInput type='star' value={4} disabled />
      </div>
      <div>
        <h4>Read Only</h4>
        <RatingInput type='star' value={4} readOnly />
      </div>
      <div>
        <h4>With Half Stars</h4>
        <RatingInput type='star' value={3.5} allowHalf />
      </div>
    </Space>
  ),
}

export const ProductReviews: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', padding: '16px' }}>
      <h3>Product Reviews</h3>
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Overall Quality</span>
          <RatingInput type='star' value={4.5} allowHalf readOnly showValue />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Value for Money</span>
          <RatingInput type='star' value={4} readOnly showValue />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Customer Service</span>
          <RatingInput type='star' value={5} readOnly showValue />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Would Recommend</span>
          <RatingInput type='thumbs' value={1} readOnly showValue />
        </div>
      </Space>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <Space direction='vertical' size='large'>
      <div>
        <h4>Rate this product:</h4>
        <RatingInput
          type='star'
          onChange={(value) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Star rating:', value)
            }
          }}
          showTooltips
        />
      </div>
      <div>
        <h4>How do you feel about this?</h4>
        <RatingInput
          type='emoji'
          onChange={(value) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Emoji rating:', value)
            }
          }}
          showValue
        />
      </div>
      <div>
        <h4>Numeric score (1-10):</h4>
        <RatingInput
          type='numeric'
          max={10}
          step={0.1}
          onChange={(value) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Numeric rating:', value)
            }
          }}
        />
      </div>
    </Space>
  ),
}
