import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Badge, StatusBadge, CountBadge } from './Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Badge count={5} variant="success" />);
    expect(container.firstChild).toHaveClass('oda-badge--success');
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Badge count={5} size="large" />);
    expect(container.firstChild).toHaveClass('oda-badge--large');
  });

  it('renders children correctly', () => {
    render(
      <Badge count={5}>
        <span>Test Content</span>
      </Badge>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles dot variant', () => {
    const { container } = render(<Badge dot />);
    expect(container.querySelector('.ant-badge')).toBeInTheDocument();
  });

  it('respects showZero prop', () => {
    render(<Badge count={0} showZero />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('respects overflowCount prop', () => {
    render(<Badge count={150} overflowCount={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders with status and text', () => {
    render(<StatusBadge status="active" text="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders without text', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.querySelector('.oda-status-badge')).toBeInTheDocument();
  });

  it('applies correct status classes', () => {
    const { container } = render(<StatusBadge status="success" text="Success" />);
    expect(container.firstChild).toHaveClass('oda-status-badge--success');
  });

  it('applies correct size classes', () => {
    const { container } = render(<StatusBadge status="active" size="large" />);
    expect(container.firstChild).toHaveClass('oda-status-badge--large');
  });

  it('maps status to correct variant', () => {
    const { container: activeContainer } = render(<StatusBadge status="active" />);
    const { container: pendingContainer } = render(<StatusBadge status="pending" />);
    const { container: errorContainer } = render(<StatusBadge status="error" />);

    expect(activeContainer.querySelector('.oda-badge--success')).toBeInTheDocument();
    expect(pendingContainer.querySelector('.oda-badge--warning')).toBeInTheDocument();
    expect(errorContainer.querySelector('.oda-badge--error')).toBeInTheDocument();
  });
});

describe('CountBadge', () => {
  it('renders count correctly', () => {
    const { container } = render(<CountBadge count={42} />);
    expect(container.querySelector('[title="42"]')).toBeInTheDocument();
  });

  it('applies max count overflow', () => {
    render(<CountBadge count={150} max={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('handles showZero prop', () => {
    render(<CountBadge count={0} showZero />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('hides zero count by default', () => {
    const { container } = render(<CountBadge count={0} />);
    expect(container.querySelector('.ant-badge-count')).not.toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<CountBadge count={5} variant="warning" />);
    expect(container.firstChild).toHaveClass('oda-count-badge--warning');
  });

  it('applies size classes correctly', () => {
    const { container } = render(<CountBadge count={5} size="small" />);
    expect(container.firstChild).toHaveClass('oda-count-badge--small');
  });
});
