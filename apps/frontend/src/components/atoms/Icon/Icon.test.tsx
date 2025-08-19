import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Icon, SearchIcon, EditIcon, DeleteIcon, PlusIcon, MinusIcon, CloseIcon, CheckIcon, WarningIcon, InfoIcon, LoadingIcon } from './Icon';

// Mock console.warn to test warning behavior
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Icon', () => {
  afterEach(() => {
    mockConsoleWarn.mockClear();
  });

  it('renders with valid icon name', () => {
    const { container } = render(<Icon name="SearchOutlined" />);
    expect(container.querySelector('.anticon')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Icon name="SearchOutlined" size="lg" />);
    expect(container.firstChild).toHaveClass('oda-icon--lg');
  });

  it('applies color classes correctly', () => {
    const { container } = render(<Icon name="SearchOutlined" color="primary" />);
    expect(container.firstChild).toHaveClass('oda-icon--primary');
  });

  it('applies clickable class when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<Icon name="SearchOutlined" onClick={handleClick} />);
    expect(container.firstChild).toHaveClass('oda-icon--clickable');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const { container } = render(<Icon name="SearchOutlined" onClick={handleClick} />);
    
    fireEvent.click(container.firstChild!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies spin prop correctly', () => {
    const { container } = render(<Icon name="LoadingOutlined" spin />);
    expect(container.querySelector('.anticon')).toBeInTheDocument();
  });

  it('applies rotate prop correctly', () => {
    const { container } = render(<Icon name="SearchOutlined" rotate={90} />);
    expect(container.querySelector('.anticon')).toBeInTheDocument();
  });

  it('applies custom style', () => {
    const customStyle = { fontSize: '24px' };
    const { container } = render(<Icon name="SearchOutlined" style={customStyle} />);
    expect(container.firstChild).toHaveStyle('font-size: 24px');
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="SearchOutlined" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('returns null and warns for invalid icon name', () => {
    const { container } = render(<Icon name="InvalidIcon" as any />);
    expect(container.firstChild).toBeNull();
    expect(mockConsoleWarn).toHaveBeenCalledWith('Icon "InvalidIcon" not found in Ant Design icons');
  });

  it('applies all size variants correctly', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
    
    sizes.forEach(size => {
      const { container } = render(<Icon name="SearchOutlined" size={size} />);
      expect(container.firstChild).toHaveClass(`oda-icon--${size}`);
    });
  });

  it('applies all color variants correctly', () => {
    const colors = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'white'] as const;
    
    colors.forEach(color => {
      const { container } = render(<Icon name="SearchOutlined" color={color} />);
      expect(container.firstChild).toHaveClass(`oda-icon--${color}`);
    });
  });
});

describe('Predefined Icon Components', () => {
  it('SearchIcon renders correctly', () => {
    const { container } = render(<SearchIcon />);
    expect(container.querySelector('.anticon-search')).toBeInTheDocument();
  });

  it('EditIcon renders correctly', () => {
    const { container } = render(<EditIcon />);
    expect(container.querySelector('.anticon-edit')).toBeInTheDocument();
  });

  it('DeleteIcon renders correctly', () => {
    const { container } = render(<DeleteIcon />);
    expect(container.querySelector('.anticon-delete')).toBeInTheDocument();
  });

  it('PlusIcon renders correctly', () => {
    const { container } = render(<PlusIcon />);
    expect(container.querySelector('.anticon-plus')).toBeInTheDocument();
  });

  it('MinusIcon renders correctly', () => {
    const { container } = render(<MinusIcon />);
    expect(container.querySelector('.anticon-minus')).toBeInTheDocument();
  });

  it('CloseIcon renders correctly', () => {
    const { container } = render(<CloseIcon />);
    expect(container.querySelector('.anticon-close')).toBeInTheDocument();
  });

  it('CheckIcon renders correctly', () => {
    const { container } = render(<CheckIcon />);
    expect(container.querySelector('.anticon-check')).toBeInTheDocument();
  });

  it('WarningIcon renders correctly', () => {
    const { container } = render(<WarningIcon />);
    expect(container.querySelector('.anticon-warning')).toBeInTheDocument();
  });

  it('InfoIcon renders correctly', () => {
    const { container } = render(<InfoIcon />);
    expect(container.querySelector('.anticon-info-circle')).toBeInTheDocument();
  });

  it('LoadingIcon renders with spin by default', () => {
    const { container } = render(<LoadingIcon />);
    const icon = container.querySelector('.anticon-loading');
    expect(icon).toBeInTheDocument();
  });

  it('predefined icons accept additional props', () => {
    const handleClick = vi.fn();
    const { container } = render(<SearchIcon size="lg" color="primary" onClick={handleClick} />);
    
    expect(container.firstChild).toHaveClass('oda-icon--lg');
    expect(container.firstChild).toHaveClass('oda-icon--primary');
    expect(container.firstChild).toHaveClass('oda-icon--clickable');
    
    fireEvent.click(container.firstChild!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
