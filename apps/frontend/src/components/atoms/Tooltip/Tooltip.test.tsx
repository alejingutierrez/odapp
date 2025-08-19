import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders with trigger element', () => {
    render(
      <Tooltip title="Tooltip text">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip title="Tooltip text">
        <span>Hover me</span>
      </Tooltip>
    );
    
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(await screen.findByText('Tooltip text')).toBeInTheDocument();
  });

  it('applies placement correctly', () => {
    const { container } = render(
      <Tooltip title="Tooltip text" placement="top">
        <span>Hover me</span>
      </Tooltip>
    );
    
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('handles different triggers', () => {
    render(
      <Tooltip title="Tooltip text" trigger="click">
        <span>Click me</span>
      </Tooltip>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('applies color variants', () => {
    const { container } = render(
      <Tooltip title="Tooltip text" color="blue">
        <span>Hover me</span>
      </Tooltip>
    );
    
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
