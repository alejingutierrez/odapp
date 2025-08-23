import React, { useState } from 'react'
import { Radio, Button, Modal, Table, Typography, Space, Tooltip } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { InfoCircleOutlined, BulbOutlined } from '@ant-design/icons'
import './SizeSelector.css'

export interface SizeOption {
  value: string
  label: string
  available: boolean
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    length?: number
  }
  fitRecommendation?: 'tight' | 'perfect' | 'loose'
  returnRate?: number
}

export interface SizeSelectorProps {
  sizes: SizeOption[]
  selectedSize?: string
  onChange?: (size: string) => void
  showSizeChart?: boolean
  showFitRecommendations?: boolean
  showAvailability?: boolean
  layout?: 'horizontal' | 'grid'
  disabled?: boolean
  className?: string
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onChange,
  showSizeChart = true,
  showFitRecommendations = true,
  showAvailability = true,
  layout = 'horizontal',
  disabled = false,
  className = '',
}) => {
  const [showChart, setShowChart] = useState(false)

  const handleSizeChange = (e: RadioChangeEvent) => {
    onChange?.(e.target.value)
  }

  const getFitRecommendationColor = (fit?: string) => {
    switch (fit) {
      case 'tight':
        return '#ff4d4f'
      case 'perfect':
        return '#52c41a'
      case 'loose':
        return '#faad14'
      default:
        return '#d9d9d9'
    }
  }

  const getFitRecommendationText = (fit?: string) => {
    switch (fit) {
      case 'tight':
        return 'Runs small'
      case 'perfect':
        return 'True to size'
      case 'loose':
        return 'Runs large'
      default:
        return 'No data'
    }
  }

  const renderSizeChart = () => {
    const columns = [
      {
        title: 'Size',
        dataIndex: 'label',
        key: 'label',
      },
      {
        title: 'Chest (cm)',
        dataIndex: ['measurements', 'chest'],
        key: 'chest',
        render: (value: number) => (value ? `${value} cm` : '-'),
      },
      {
        title: 'Waist (cm)',
        dataIndex: ['measurements', 'waist'],
        key: 'waist',
        render: (value: number) => (value ? `${value} cm` : '-'),
      },
      {
        title: 'Hips (cm)',
        dataIndex: ['measurements', 'hips'],
        key: 'hips',
        render: (value: number) => (value ? `${value} cm` : '-'),
      },
      {
        title: 'Length (cm)',
        dataIndex: ['measurements', 'length'],
        key: 'length',
        render: (value: number) => (value ? `${value} cm` : '-'),
      },
    ]

    return (
      <Modal
        title='Size Chart'
        open={showChart}
        onCancel={() => setShowChart(false)}
        footer={null}
        width={600}
      >
        <Table
          dataSource={sizes}
          columns={columns}
          rowKey='value'
          pagination={false}
          size='small'
        />
      </Modal>
    )
  }

  const renderSizeOption = (size: SizeOption) => {
    const isSelected = selectedSize === size.value
    const isAvailable = size.available

    return (
      <div key={size.value} className='size-selector__option-wrapper'>
        <Radio.Button
          value={size.value}
          disabled={disabled || !isAvailable}
          className={`
            size-selector__option 
            ${isSelected ? 'size-selector__option--selected' : ''}
            ${!isAvailable ? 'size-selector__option--unavailable' : ''}
          `}
        >
          {size.label}
        </Radio.Button>

        {showFitRecommendations && size.fitRecommendation && (
          <div
            className='size-selector__fit-indicator'
            style={{
              backgroundColor: getFitRecommendationColor(
                size.fitRecommendation
              ),
            }}
            title={getFitRecommendationText(size.fitRecommendation)}
          />
        )}

        {!isAvailable && showAvailability && (
          <div className='size-selector__unavailable-overlay'>Out of Stock</div>
        )}
      </div>
    )
  }

  return (
    <div className={`size-selector size-selector--${layout} ${className}`}>
      <div className='size-selector__header'>
        <Typography.Text strong className='size-selector__label'>
          Size
        </Typography.Text>

        <Space size='small'>
          {showFitRecommendations && (
            <Tooltip title='Color indicators show fit recommendations'>
              <InfoCircleOutlined className='size-selector__info-icon' />
            </Tooltip>
          )}

          {showSizeChart && (
            <Button
              type='link'
              size='small'
              icon={<BulbOutlined />}
              onClick={() => setShowChart(true)}
              className='size-selector__chart-button'
            >
              Size Chart
            </Button>
          )}
        </Space>
      </div>

      <Radio.Group
        value={selectedSize}
        onChange={handleSizeChange}
        disabled={disabled}
        className='size-selector__group'
      >
        {sizes.map(renderSizeOption)}
      </Radio.Group>

      {showFitRecommendations && (
        <div className='size-selector__legend'>
          <Space size='small'>
            <Typography.Text
              type='secondary'
              className='size-selector__legend-title'
            >
              Fit guide:
            </Typography.Text>
            <div className='size-selector__legend-item'>
              <div
                className='size-selector__legend-dot'
                style={{ backgroundColor: getFitRecommendationColor('tight') }}
              />
              <Typography.Text type='secondary'>Runs small</Typography.Text>
            </div>
            <div className='size-selector__legend-item'>
              <div
                className='size-selector__legend-dot'
                style={{
                  backgroundColor: getFitRecommendationColor('perfect'),
                }}
              />
              <Typography.Text type='secondary'>True to size</Typography.Text>
            </div>
            <div className='size-selector__legend-item'>
              <div
                className='size-selector__legend-dot'
                style={{ backgroundColor: getFitRecommendationColor('loose') }}
              />
              <Typography.Text type='secondary'>Runs large</Typography.Text>
            </div>
          </Space>
        </div>
      )}

      {renderSizeChart()}
    </div>
  )
}

export default SizeSelector
