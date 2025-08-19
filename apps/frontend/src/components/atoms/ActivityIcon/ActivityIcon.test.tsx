import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ActivityIcon } from './ActivityIcon';

describe('ActivityIcon', () => {
  it('renders with default props', () => {
    const { container } = render(<ActivityIcon type="call" />);
    expect(container.querySelector('.oda-activity-icon')).toBeInTheDocument();
    expect(container.querySelector('.anticon-phone')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<ActivityIcon type="email" size="large" />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--large');
  });

  it('applies custom numeric size', () => {
    const { container } = render(<ActivityIcon type="email" size={24} />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--custom');
    expect(container.firstChild).toHaveStyle('font-size: 24px');
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<ActivityIcon type="message" variant="success" />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--success');
  });

  it('shows background when showBackground is true', () => {
    const { container } = render(<ActivityIcon type="call" showBackground />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--with-background');
  });

  it('applies active state correctly', () => {
    const { container } = render(<ActivityIcon type="call" active />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--active');
  });

  it('applies disabled state correctly', () => {
    const { container } = render(<ActivityIcon type="call" disabled />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--disabled');
  });

  it('applies clickable class when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<ActivityIcon type="call" onClick={handleClick} />);
    expect(container.firstChild).toHaveClass('oda-activity-icon--clickable');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const { container } = render(<ActivityIcon type="call" onClick={handleClick} />);
    
    fireEvent.click(container.firstChild!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click when disabled', () => {
    const handleClick = vi.fn();
    const { container } = render(<ActivityIcon type="call" onClick={handleClick} disabled />);
    
    fireEvent.click(container.firstChild!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles keyboard events', () => {
    const handleClick = vi.fn();
    const { container } = render(<ActivityIcon type="call" onClick={handleClick} />);
    
    fireEvent.keyDown(container.firstChild!, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(container.firstChild!, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('applies custom color', () => {
    const { container } = render(<ActivityIcon type="call" color="#ff0000" />);
    expect(container.firstChild).toHaveStyle('color: #ff0000');
  });

  it('applies custom background color', () => {
    const { container } = render(<ActivityIcon type="call" showBackground backgroundColor="#ff0000" />);
    expect(container.firstChild).toHaveStyle('background-color: #ff0000');
  });

  it('renders custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">Custom</span>;
    render(<ActivityIcon type="call" customIcon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('shows tooltip when provided', () => {
    const { container } = render(<ActivityIcon type="call" tooltip="Phone call" />);
    expect(container.querySelector('[aria-describedby]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ActivityIcon type="call" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  describe('activity types', () => {
    const activityTypes = [
      'call', 'email', 'meeting', 'message', 'chat',
      'visit', 'purchase', 'order', 'return', 'refund',
      'note', 'task', 'appointment', 'reminder',
      'like', 'share', 'view', 'comment', 'review',
      'edit', 'delete', 'create', 'update',
      'download', 'upload', 'export', 'import',
      'login', 'logout', 'register', 'settings',
      'support', 'feedback', 'complaint', 'inquiry'
    ];

    activityTypes.forEach(type => {
      it(`renders ${type} activity type correctly`, () => {
        const { container } = render(<ActivityIcon type={type as any} />);
        expect(container.querySelector('.oda-activity-icon')).toBeInTheDocument();
      });
    });
  });

  describe('size variants', () => {
    it('applies small size correctly', () => {
      const { container } = render(<ActivityIcon type="call" size="small" />);
      expect(container.firstChild).toHaveStyle('font-size: 14px');
    });

    it('applies medium size correctly', () => {
      const { container } = render(<ActivityIcon type="call" size="medium" />);
      expect(container.firstChild).toHaveStyle('font-size: 16px');
    });

    it('applies large size correctly', () => {
      const { container } = render(<ActivityIcon type="call" size="large" />);
      expect(container.firstChild).toHaveStyle('font-size: 20px');
    });
  });

  describe('variant colors', () => {
    it('applies primary variant color', () => {
      const { container } = render(<ActivityIcon type="call" variant="primary" />);
      expect(container.firstChild).toHaveStyle('color: #1890ff');
    });

    it('applies success variant color', () => {
      const { container } = render(<ActivityIcon type="call" variant="success" />);
      expect(container.firstChild).toHaveStyle('color: #52c41a');
    });

    it('applies warning variant color', () => {
      const { container } = render(<ActivityIcon type="call" variant="warning" />);
      expect(container.firstChild).toHaveStyle('color: #faad14');
    });

    it('applies error variant color', () => {
      const { container } = render(<ActivityIcon type="call" variant="error" />);
      expect(container.firstChild).toHaveStyle('color: #ff4d4f');
    });
  });
});
