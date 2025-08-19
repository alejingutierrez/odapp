import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Atoms/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    allowClear: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Search term',
    placeholder: 'Search...',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div>
        <label>Small</label>
        <SearchInput size="small" placeholder="Small search" />
      </div>
      <div>
        <label>Middle (Default)</label>
        <SearchInput size="middle" placeholder="Middle search" />
      </div>
      <div>
        <label>Large</label>
        <SearchInput size="large" placeholder="Large search" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div>
        <label>Normal</label>
        <SearchInput placeholder="Normal state" />
      </div>
      <div>
        <label>With Clear Button</label>
        <SearchInput allowClear placeholder="Clearable search" />
      </div>
      <div>
        <label>Loading</label>
        <SearchInput loading placeholder="Loading search" />
      </div>
      <div>
        <label>Disabled</label>
        <SearchInput disabled placeholder="Disabled search" />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    placeholder: 'Type to search...',
    allowClear: true,
    size: 'middle',
  },
};
