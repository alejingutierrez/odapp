import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from './MetricCard';
import { DollarOutlined } from '@ant-design/icons';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Revenue" value={12345} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  it('renders with prefix and suffix', () => {
    render(
      <MetricCard 
        title="Revenue" 
        value={12345} 
        prefix={<DollarOutlined />}
        suffix="USD"
      />
    );
    expect(document.querySelector('.anticon-dollar')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders trend indicators correctly', () => {
    const { rerender } = render(
      <MetricCard 
        title="Sales" 
        value={100} 
        trend="up" 
        trendValue="+15%" 
      />
    );
    expect(document.querySelector('.anticon-arrow-up')).toBeInTheDocument();
    expect(screen.getByText('+15% vs last period')).toBeInTheDocument();

    rerender(
      <MetricCard 
        title="Sales" 
        value={100} 
        trend="down" 
        trendValue="-5%" 
      />
    );
    expect(document.querySelector('.anticon-arrow-down')).toBeInTheDocument();
  });

  it('renders custom trend label', () => {
    render(
      <MetricCard 
        title="Users" 
        value={500} 
        trend="up" 
        trendValue="50" 
        trendLabel="new users today"
      />
    );
    expect(screen.getByText('50 new users today')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<MetricCard title="Clicks" value={123} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Clicks').closest('.ant-card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies precision to numeric values', () => {
    render(<MetricCard title="Rate" value={12.3456} precision={2} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('.34')).toBeInTheDocument();
  });

  it('renders in loading state', () => {
    render(<MetricCard title="Loading" value={0} loading />);
    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
  });

  it('renders without border when bordered is false', () => {
    render(<MetricCard title="No Border" value={123} bordered={false} />);
    const card = document.querySelector('.ant-card');
    expect(card).not.toHaveClass('ant-card-bordered');
  });
});