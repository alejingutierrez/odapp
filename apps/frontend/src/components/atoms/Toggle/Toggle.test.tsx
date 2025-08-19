import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders with default props', () => {
    const { container } = render(<Toggle />);
    expect(container.querySelector('.ant-switch')).toBeInTheDocument();
  });

  it('handles toggle changes', () => {
    const handleChange = vi.fn();
    render(<Toggle onChange={handleChange} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('applies checked state', () => {
    render(<Toggle checked />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
  });

  it('applies disabled state', () => {
    render(<Toggle disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('shows loading state', () => {
    const { container } = render(<Toggle loading />);
    expect(container.querySelector('.ant-switch-loading')).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { container } = render(<Toggle size="small" />);
    expect(container.querySelector('.ant-switch-small')).toBeInTheDocument();
  });

  it('shows checked and unchecked children', () => {
    render(<Toggle checkedChildren="ON" unCheckedChildren="OFF" />);
    expect(screen.getByText('OFF')).toBeInTheDocument();
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(screen.getByText('ON')).toBeInTheDocument();
  });
});
