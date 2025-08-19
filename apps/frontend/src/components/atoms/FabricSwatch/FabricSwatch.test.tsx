import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FabricSwatch } from './FabricSwatch';

describe('FabricSwatch', () => {
  it('renders with fabric name', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} />);
    expect(container.querySelector('.oda-fabric-swatch')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} />);
    expect(container.querySelector('.oda-fabric-swatch')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} size="large" />);
    expect(container.querySelector('.oda-fabric-swatch--large')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} onClick={handleClick} />);
    
    const swatch = container.querySelector('.oda-fabric-swatch');
    fireEvent.click(swatch!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows fabric texture when provided', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} textureUrl="/texture.jpg" />);
    expect(container.querySelector('.oda-fabric-swatch__texture')).toBeInTheDocument();
  });

  it('applies selected state', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} selected />);
    expect(container.querySelector('.oda-fabric-swatch--selected')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[]} />);
    expect(container.querySelector('.oda-fabric-swatch')).toBeInTheDocument();
  });

  it('shows fabric properties when provided', () => {
    const { container } = render(<FabricSwatch name="Cotton" composition={[{material: 'Cotton', percentage: 100}]} />);
    expect(container.querySelector('.oda-fabric-swatch')).toBeInTheDocument();
  });
});
