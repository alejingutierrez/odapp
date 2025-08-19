import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders with name initials', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders with single name initial', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders with image src', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="John Doe" />);
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders fallback icon when no name or src', () => {
    render(<Avatar />);
    expect(document.querySelector('.anticon-user')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Avatar name="John" size="small" />);
    expect(document.querySelector('.ant-avatar-sm')).toBeInTheDocument();

    rerender(<Avatar name="John" size="large" />);
    expect(document.querySelector('.ant-avatar-lg')).toBeInTheDocument();

    rerender(<Avatar name="John" size={64} />);
    const avatar = document.querySelector('.ant-avatar');
    expect(avatar).toHaveStyle('width: 64px; height: 64px');
  });

  it('renders different shapes', () => {
    const { rerender } = render(<Avatar name="John" shape="circle" />);
    expect(document.querySelector('.ant-avatar-circle')).toBeInTheDocument();

    rerender(<Avatar name="John" shape="square" />);
    expect(document.querySelector('.ant-avatar-square')).toBeInTheDocument();
  });

  it('renders with status badge', () => {
    render(<Avatar name="John" status="online" />);
    expect(document.querySelector('.ant-badge')).toBeInTheDocument();
  });

  it('renders with count badge', () => {
    render(<Avatar name="John" showBadge badgeCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('handles long names correctly', () => {
    render(<Avatar name="John Michael Smith Johnson" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });
});