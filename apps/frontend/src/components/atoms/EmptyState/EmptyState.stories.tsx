import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { PlusOutlined, SearchOutlined, ShoppingCartOutlined, FileTextOutlined } from '@ant-design/icons';

const meta: Meta<typeof EmptyState> = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default'],
    },
    actionType: {
      control: 'select',
      options: ['primary', 'default', 'dashed'],
    },
    showImage: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No data available',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'No products found',
    description: 'Try adjusting your search criteria or browse our categories',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No items in cart',
    description: 'Start shopping to add items to your cart',
    actionText: 'Start Shopping',
    actionIcon: <ShoppingCartOutlined />,
    onAction: () => alert('Navigate to products'),
  },
};

export const SmallSize: Story = {
  args: {
    title: 'No results',
    description: 'No matching records found',
    size: 'small',
    actionText: 'Clear Filters',
    onAction: () => alert('Clear filters'),
  },
};

export const WithCustomIcon: Story = {
  args: {
    title: 'No documents',
    description: 'Upload your first document to get started',
    icon: <FileTextOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
    actionText: 'Upload Document',
    actionIcon: <PlusOutlined />,
    onAction: () => alert('Open upload dialog'),
  },
};

export const WithoutImage: Story = {
  args: {
    title: 'Search required',
    description: 'Enter keywords to search for items',
    showImage: false,
    actionText: 'Advanced Search',
    actionIcon: <SearchOutlined />,
    onAction: () => alert('Open advanced search'),
  },
};

export const DifferentScenarios: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, width: 800 }}>
      <div style={{ border: '1px solid #f0f0f0', padding: 24, borderRadius: 8 }}>
        <h4>Empty Product List</h4>
        <EmptyState
          title="No products available"
          description="Add your first product to get started"
          actionText="Add Product"
          actionIcon={<PlusOutlined />}
          onAction={() => alert('Add product')}
        />
      </div>
      
      <div style={{ border: '1px solid #f0f0f0', padding: 24, borderRadius: 8 }}>
        <h4>Search Results</h4>
        <EmptyState
          title="No results found"
          description="Try different keywords or check your spelling"
          actionText="Clear Search"
          actionType="default"
          onAction={() => alert('Clear search')}
          size="small"
        />
      </div>
      
      <div style={{ border: '1px solid #f0f0f0', padding: 24, borderRadius: 8 }}>
        <h4>Empty Cart</h4>
        <EmptyState
          title="Your cart is empty"
          description="Discover our amazing products and add them to your cart"
          actionText="Browse Products"
          actionIcon={<ShoppingCartOutlined />}
          onAction={() => alert('Browse products')}
        />
      </div>
      
      <div style={{ border: '1px solid #f0f0f0', padding: 24, borderRadius: 8 }}>
        <h4>No Notifications</h4>
        <EmptyState
          title="All caught up!"
          description="You have no new notifications"
          showImage={false}
          size="small"
        />
      </div>
    </div>
  ),
};