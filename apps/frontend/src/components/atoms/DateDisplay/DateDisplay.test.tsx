import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateDisplay } from './DateDisplay';

describe('DateDisplay', () => {
  const testDate = new Date('2024-03-15T14:30:00');

  it('renders date with medium format by default', () => {
    render(<DateDisplay date={testDate} />);
    expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();
  });

  it('renders different date formats correctly', () => {
    const { rerender } = render(<DateDisplay date={testDate} format="short" />);
    expect(screen.getByText(/3\/15\/24/)).toBeInTheDocument();

    rerender(<DateDisplay date={testDate} format="time" />);
    expect(screen.getByText(/2:30 PM/)).toBeInTheDocument();
  });

  it('renders with icon when showIcon is true', () => {
    const { container } = render(<DateDisplay date={testDate} showIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders without icon by default', () => {
    const { container } = render(<DateDisplay date={testDate} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('handles relative dates correctly', () => {
    const today = new Date();
    render(<DateDisplay date={today} format="relative" />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('accepts string and number dates', () => {
    const { rerender } = render(<DateDisplay date="2024-03-15" />);
    expect(screen.getByText(/Mar 1[45], 2024/)).toBeInTheDocument();

    rerender(<DateDisplay date={testDate.getTime()} />);
    expect(screen.getByText(/Mar 1[45], 2024/)).toBeInTheDocument();
  });
});