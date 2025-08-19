import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.oda-spinner')).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector('.oda-spinner--lg')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<Spinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Spinner>
        <div>Content to wrap</div>
      </Spinner>
    );
    expect(screen.getByText('Content to wrap')).toBeInTheDocument();
  });

  it('applies variant correctly', () => {
    const { container } = render(<Spinner variant="dots" />);
    expect(container.querySelector('.oda-spinner--dots')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    expect(container.querySelector('.custom-spinner')).toBeInTheDocument();
  });
});
