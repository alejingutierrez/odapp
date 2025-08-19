import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressIndicator } from './ProgressIndicator'

describe('ProgressIndicator', () => {
  it('renders progress indicator with percentage', () => {
    render(<ProgressIndicator percent={75} />)
    
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows custom title when provided', () => {
    render(<ProgressIndicator percent={50} title="Uploading..." />)
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument()
  })

  it('applies different types', () => {
    const { rerender } = render(<ProgressIndicator percent={60} type="line" />)
    
    expect(document.querySelector('.ant-progress-line')).toBeInTheDocument()
    
    rerender(<ProgressIndicator percent={60} type="circle" />)
    expect(document.querySelector('.ant-progress-circle')).toBeInTheDocument()
  })

  it('applies different statuses', () => {
    const { rerender } = render(<ProgressIndicator percent={100} status="success" />)
    
    expect(document.querySelector('.ant-progress-status-success')).toBeInTheDocument()
    
    rerender(<ProgressIndicator percent={50} status="exception" />)
    expect(document.querySelector('.ant-progress-status-exception')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProgressIndicator 
        percent={40}
        className="custom-progress"
      />
    )
    
    expect(document.querySelector('.custom-progress')).toBeInTheDocument()
  })

  it('shows steps when steps are provided', () => {
    const steps = [
      { title: 'Step 1', status: 'finish' as const },
      { title: 'Step 2', status: 'process' as const },
      { title: 'Step 3', status: 'wait' as const }
    ]
    
    render(<ProgressIndicator percent={0} steps={steps} showSteps={true} />)
    
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()
    expect(screen.getByText('Step 3')).toBeInTheDocument()
  })
})
