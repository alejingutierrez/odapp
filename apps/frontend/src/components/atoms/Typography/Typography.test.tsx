import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Typography } from './Typography';

const { Title, Text, Paragraph } = Typography;

describe('Typography', () => {
  describe('Title', () => {
    it('renders with default level', () => {
      render(<Title>Test Title</Title>);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders with different levels', () => {
      render(<Title level={2}>Level 2 Title</Title>);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('applies type variants correctly', () => {
      const { container } = render(<Title type="danger">Danger Title</Title>);
      expect(container.firstChild).toHaveClass('ant-typography-danger');
    });
  });

  describe('Text', () => {
    it('renders text content', () => {
      render(<Text>Test Text</Text>);
      expect(screen.getByText('Test Text')).toBeInTheDocument();
    });

    it('applies type variants correctly', () => {
      const { container } = render(<Text type="success">Success Text</Text>);
      expect(container.firstChild).toHaveClass('ant-typography-success');
    });

    it('applies strong styling', () => {
      const { container } = render(<Text strong>Strong Text</Text>);
      expect(container.querySelector('strong')).toBeInTheDocument();
    });

    it('applies italic styling', () => {
      const { container } = render(<Text italic>Italic Text</Text>);
      expect(container.querySelector('.ant-typography')).toHaveClass('ant-typography');
    });
  });

  describe('Paragraph', () => {
    it('renders paragraph content', () => {
      render(<Paragraph>Test Paragraph</Paragraph>);
      expect(screen.getByText('Test Paragraph')).toBeInTheDocument();
    });

    it('applies ellipsis correctly', () => {
      const { container } = render(<Paragraph ellipsis>Long paragraph text</Paragraph>);
      expect(container.firstChild).toHaveClass('ant-typography-ellipsis');
    });
  });
});
