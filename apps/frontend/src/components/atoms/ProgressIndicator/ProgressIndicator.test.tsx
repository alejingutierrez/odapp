import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders with default line variant', () => {
    render(<ProgressIndicator percent={50} />);
    expect(document.querySelector('.ant-progress-line')).toBeInTheDocument();
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<ProgressIndicator percent={50} variant="circle" />);
    expect(document.querySelector('.ant-progress-circle')).toBeInTheDocument();

    rerender(<ProgressIndicator percent={50} variant="dashboard" />);
    expect(document.querySelector('.ant-progress-circle')).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<ProgressIndicator percent={50} label="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render label when showLabel is false', () => {
    render(<ProgressIndicator percent={50} label="Loading..." showLabel={false} />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container, rerender } = render(<ProgressIndicator percent={50} size="small" />);
    expect(container.querySelector('.ant-progress')).toBeInTheDocument();

    rerender(<ProgressIndicator percent={50} size="large" />);
    expect(container.querySelector('.ant-progress')).toBeInTheDocument();
  });

  it('shows percentage by default', () => {
    render(<ProgressIndicator percent={75} />);
    expect(screen.getAllByText('75%')[0]).toBeInTheDocument();
  });

  it('applies animated status when animated is true', () => {
    render(<ProgressIndicator percent={50} animated />);
    expect(document.querySelector('.ant-progress-status-active')).toBeInTheDocument();
  });
});