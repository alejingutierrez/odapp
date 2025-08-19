import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  const mockItems = [
    {
      key: '1',
      title: 'Panel 1',
      content: <div>Content 1</div>,
    },
    {
      key: '2',
      title: 'Panel 2',
      content: <div>Content 2</div>,
    },
  ];

  it('renders accordion with items', () => {
    const { container } = render(<Accordion items={mockItems} />);
    expect(container.querySelector('.oda-accordion')).toBeInTheDocument();
    expect(container.querySelectorAll('.oda-accordion__panel')).toHaveLength(2);
  });

  it('expands panel when clicked', () => {
    const { container } = render(<Accordion items={mockItems} />);
    
    const panel1 = container.querySelector('.ant-collapse-header');
    fireEvent.click(panel1!);
    
    expect(container.querySelector('.ant-collapse-content')).toBeInTheDocument();
  });

  it('handles default active key', () => {
    const { container } = render(<Accordion items={mockItems} defaultActiveKey={['1']} />);
    expect(container.querySelector('.ant-collapse-content')).toBeInTheDocument();
  });

  it('handles accordion mode correctly', () => {
    const { container } = render(<Accordion items={mockItems} accordion />);
    
    const panels = container.querySelectorAll('.ant-collapse-header');
    
    fireEvent.click(panels[0]);
    expect(container.querySelector('.ant-collapse-content')).toBeInTheDocument();
    
    fireEvent.click(panels[1]);
    expect(container.querySelector('.ant-collapse-content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Accordion items={mockItems} className="custom-accordion" />);
    expect(container.firstChild).toHaveClass('custom-accordion');
  });

  it('handles disabled items', () => {
    const disabledItems = [
      {
        key: '1',
        title: 'Panel 1',
        content: <div>Content 1</div>,
        disabled: true,
      },
    ];
    
    const { container } = render(<Accordion items={disabledItems} />);
    const panel = container.querySelector('.ant-collapse-header');
    
    fireEvent.click(panel!);
    expect(container.querySelector('.ant-collapse-content')).not.toBeInTheDocument();
  });
});
