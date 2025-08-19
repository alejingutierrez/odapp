import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders with default props', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('.ant-divider')).toBeInTheDocument();
  });

  it('renders with text', () => {
    render(<Divider>Section Title</Divider>);
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('applies orientation correctly', () => {
    const { container } = render(<Divider orientation="left">Left Text</Divider>);
    expect(container.querySelector('.ant-divider')).toBeInTheDocument();
  });

  it('renders vertical divider', () => {
    const { container } = render(<Divider type="vertical" />);
    expect(container.querySelector('.ant-divider-vertical')).toBeInTheDocument();
  });

  it('applies dashed style', () => {
    const { container } = render(<Divider dashed />);
    expect(container.querySelector('.ant-divider-dashed')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Divider className="custom-divider" />);
    expect(container.firstChild).toHaveClass('custom-divider');
  });

  it('applies custom style', () => {
    const { container } = render(<Divider style={{ margin: '20px 0' }} />);
    expect(container.firstChild).toHaveStyle('margin: 20px 0');
  });
});
