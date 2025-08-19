import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders with default props', () => {
    render(<SearchInput />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows search icon', () => {
    const { container } = render(<SearchInput />);
    expect(container.querySelector('.anticon-search')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<SearchInput onChange={handleChange} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'search term' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles search on enter', () => {
    const handleSearch = vi.fn();
    render(<SearchInput onSearch={handleSearch} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'search term' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledWith('search term');
  });

  it('shows clear button when allowClear is true', () => {
    const { container } = render(<SearchInput value="test" />);
    expect(container.querySelector('.ant-input-clear-icon')).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { container } = render(<SearchInput size="large" />);
    expect(container.querySelector('.ant-input-lg')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    render(<SearchInput disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows loading state', () => {
    const { container } = render(<SearchInput loading />);
    expect(container.querySelector('.ant-spin-dot')).toBeInTheDocument();
  });
});
