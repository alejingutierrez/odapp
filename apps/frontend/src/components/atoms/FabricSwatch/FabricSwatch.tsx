import { EyeOutlined } from '@ant-design/icons'
import { Card, Tooltip, Tag } from 'antd'
import React from 'react'
import './FabricSwatch.css'

export interface FabricComposition {
  material: string
  percentage: number
}

export interface CareInstruction {
  type: 'wash' | 'dry' | 'iron' | 'bleach' | 'dryclean'
  instruction: string
  temperature?: number
  symbol?: string
}

export interface FabricSwatchProps {
  /** Fabric name */
  name: string
  /** Fabric texture image URL */
  textureUrl?: string
  /** Fabric color */
  color?: string
  /** Fabric pattern */
  pattern?: string
  /** Fabric composition */
  composition: FabricComposition[]
  /** Care instructions */
  careInstructions?: CareInstruction[]
  /** Fabric weight (GSM) */
  weight?: number
  /** Fabric width */
  width?: number
  /** Width unit */
  widthUnit?: string
  /** Whether fabric is sustainable */
  sustainable?: boolean
  /** Sustainability certifications */
  certifications?: string[]
  /** Fabric price per unit */
  pricePerUnit?: number
  /** Price unit */
  priceUnit?: string
  /** Currency */
  currency?: string
  /** Whether swatch is selected */
  selected?: boolean
  /** Whether swatch is disabled */
  disabled?: boolean
  /** Swatch size */
  size?: 'small' | 'medium' | 'large'
  /** Click handler */
  onClick?: () => void
  /** Preview handler */
  onPreview?: () => void
  /** Custom texture overlay */
  textureOverlay?: React.ReactNode
}

export const FabricSwatch: React.FC<FabricSwatchProps> = ({
  name,
  textureUrl,
  color = '#f5f5f5',
  pattern,
  composition = [],
  careInstructions = [],
  weight,
  width,
  widthUnit = 'cm',
  sustainable = false,
  certifications = [],
  pricePerUnit,
  priceUnit = 'm',
  currency = '$',
  selected = false,
  disabled = false,
  size = 'medium',
  onClick,
  onPreview,
  textureOverlay,
}) => {
  const swatchClasses = [
    'oda-fabric-swatch',
    `oda-fabric-swatch--${size}`,
    selected && 'oda-fabric-swatch--selected',
    disabled && 'oda-fabric-swatch--disabled',
    onClick && 'oda-fabric-swatch--clickable',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPreview) {
      onPreview()
    }
  }

  const renderComposition = () => {
    if (composition.length === 0) return null

    return (
      <div className='oda-fabric-swatch__composition'>
        {composition.map((comp, index) => (
          <span key={index} className='oda-fabric-swatch__composition-item'>
            {comp.percentage}% {comp.material}
          </span>
        ))}
      </div>
    )
  }

  const renderCareInstructions = () => {
    if (careInstructions.length === 0) return null

    return (
      <div className='oda-fabric-swatch__care'>
        <div className='oda-fabric-swatch__care-title'>Care Instructions:</div>
        <div className='oda-fabric-swatch__care-list'>
          {careInstructions.map((care, index) => (
            <div key={index} className='oda-fabric-swatch__care-item'>
              {care.symbol && (
                <span className='oda-fabric-swatch__care-symbol'>
                  {care.symbol}
                </span>
              )}
              <span className='oda-fabric-swatch__care-text'>
                {care.instruction}
                {care.temperature && ` (${care.temperature}°C)`}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSpecs = () => {
    const specs = []

    if (weight) {
      specs.push(`${weight} GSM`)
    }

    if (width) {
      specs.push(`${width}${widthUnit} wide`)
    }

    if (specs.length === 0) return null

    return <div className='oda-fabric-swatch__specs'>{specs.join(' • ')}</div>
  }

  const renderPrice = () => {
    if (!pricePerUnit) return null

    return (
      <div className='oda-fabric-swatch__price'>
        {currency}
        {pricePerUnit.toFixed(2)}/{priceUnit}
      </div>
    )
  }

  const renderCertifications = () => {
    if (certifications.length === 0) return null

    return (
      <div className='oda-fabric-swatch__certifications'>
        {certifications.map((cert, index) => (
          <Tag key={index} color='green'>
            {cert}
          </Tag>
        ))}
      </div>
    )
  }

  const tooltipContent = (
    <div className='oda-fabric-swatch__tooltip'>
      <div className='oda-fabric-swatch__tooltip-title'>{name}</div>
      {renderComposition()}
      {renderSpecs()}
      {renderCareInstructions()}
      {renderCertifications()}
    </div>
  )

  return (
    <Tooltip title={tooltipContent} placement='top'>
      <Card
        className={swatchClasses}
        onClick={handleClick}
        hoverable={!disabled && !!onClick}
        size='small'
        bodyStyle={{ padding: 0 }}
      >
        <div className='oda-fabric-swatch__preview'>
          <div
            className='oda-fabric-swatch__texture'
            style={{
              backgroundColor: color,
              backgroundImage: textureUrl ? `url(${textureUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {pattern && (
              <div className='oda-fabric-swatch__pattern'>{pattern}</div>
            )}
            {textureOverlay}

            {sustainable && (
              <div className='oda-fabric-swatch__sustainable-badge'>🌱</div>
            )}

            {onPreview && (
              <div className='oda-fabric-swatch__preview-button'>
                <EyeOutlined onClick={handlePreview} />
              </div>
            )}
          </div>

          <div className='oda-fabric-swatch__info'>
            <div className='oda-fabric-swatch__name'>{name}</div>
            {renderSpecs()}
            {renderPrice()}
          </div>
        </div>

        {selected && (
          <div className='oda-fabric-swatch__selected-indicator'>✓</div>
        )}
      </Card>
    </Tooltip>
  )
}

FabricSwatch.displayName = 'FabricSwatch'
