import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders with default props', () => {
    const { container } = render(<StatusBadge status="success" />);
    expect(container.querySelector('.ant-badge')).toBeInTheDocument();
  });

  it('renders with custom label in filled variant', () => {
    render(<StatusBadge status="pending" label="In Progress" variant="filled" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<StatusBadge status="success" label="Success" variant="minimal" showIcon={false} />);
    const badge = screen.getByText('Success');
    expect(badge.parentElement?.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders with icon by default', () => {
    const { container } = render(<StatusBadge status="error" label="Error" variant="outlined" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { container, rerender } = render(<StatusBadge status="success" />);
    expect(container.querySelector('.ant-badge-status-success')).toBeInTheDocument();

    rerender(<StatusBadge status="error" />);
    expect(container.querySelector('.ant-badge-status-error')).toBeInTheDocument();
  });
});