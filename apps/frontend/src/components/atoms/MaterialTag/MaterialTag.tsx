import React from 'react'
import { Tag as AntTag, Tooltip } from 'antd'
import { InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import './MaterialTag.css'

export interface MaterialTagProps {
  material: string
  percentage?: number
  certification?: 'organic' | 'recycled' | 'sustainable' | 'fair-trade' | 'gots' | 'oeko-tex'
  variant?: 'default' | 'detailed' | 'compact' | 'minimal'
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'small' | 'medium' | 'large'
  showIcon?: boolean
  showPercentage?: boolean
  removable?: boolean
  className?: string
  onClick?: (material: string) => void
  onRemove?: (material: string) => void
}

export const MaterialTag: React.FC<MaterialTagProps> = ({
  material,
  percentage,
  certification,
  variant = 'default',
  color = 'default',
  size = 'medium',
  showIcon = true,
  showPercentage = true,
  removable = false,
  className = '',
  onClick,
  onRemove,
}) => {
  const tagClasses = [
    'oda-material-tag',
    `oda-material-tag--${variant}`,
    `oda-material-tag--${color}`,
    `oda-material-tag--${size}`,
    certification && `oda-material-tag--${certification}`,
    onClick && 'oda-material-tag--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getCertificationIcon = () => {
    if (!certification || !showIcon) return null
    
    switch (certification) {
      case 'organic':
      case 'gots':
      case 'fair-trade':
        return <CheckCircleOutlined className="oda-material-tag__cert-icon oda-material-tag__cert-icon--success" />
      case 'recycled':
      case 'sustainable':
        return <InfoCircleOutlined className="oda-material-tag__cert-icon oda-material-tag__cert-icon--info" />
      case 'oeko-tex':
        return <ExclamationCircleOutlined className="oda-material-tag__cert-icon oda-material-tag__cert-icon--warning" />
      default:
        return null
    }
  }

  const getCertificationLabel = () => {
    if (!certification) return ''
    
    const labels: Record<string, string> = {
      'organic': 'Organic',
      'recycled': 'Recycled',
      'sustainable': 'Sustainable',
      'fair-trade': 'Fair Trade',
      'gots': 'GOTS',
      'oeko-tex': 'OEKO-TEX',
    }
    
    return labels[certification] || certification
  }

  const formatMaterial = () => {
    const materialName = material.charAt(0).toUpperCase() + material.slice(1).toLowerCase()
    
    if (variant === 'minimal') {
      return materialName
    }
    
    if (showPercentage && percentage !== undefined) {
      return `${materialName} ${percentage}%`
    }
    
    return materialName
  }

  const getTooltipContent = () => {
    if (variant === 'detailed') return null
    
    let content = material
    if (percentage !== undefined) {
      content += ` (${percentage}%)`
    }
    if (certification) {
      content += ` - ${getCertificationLabel()}`
    }
    return content
  }

  const handleClick = () => {
    if (onClick) {
      onClick(material)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(material)
    }
  }

  const tagContent = (
    <div className="oda-material-tag__content">
      {getCertificationIcon()}
      <span className="oda-material-tag__text">
        {formatMaterial()}
      </span>
      {variant === 'detailed' && certification && (
        <span className="oda-material-tag__certification">
          {getCertificationLabel()}
        </span>
      )}
    </div>
  )

  const tag = (
    <AntTag
      className={tagClasses}
      closable={removable}
      onClose={removable ? handleRemove : undefined}
      onClick={onClick ? handleClick : undefined}
    >
      {tagContent}
    </AntTag>
  )

  const tooltipContent = getTooltipContent()
  if (tooltipContent && variant !== 'detailed') {
    return (
      <Tooltip title={tooltipContent} placement="top">
        {tag}
      </Tooltip>
    )
  }

  return tag
}

// Material Composition Component for multiple materials
export interface MaterialCompositionProps {
  materials: Array<{
    material: string
    percentage?: number
    certification?: MaterialTagProps['certification']
  }>
  variant?: MaterialTagProps['variant']
  size?: MaterialTagProps['size']
  showPercentages?: boolean
  showCertifications?: boolean
  removable?: boolean
  className?: string
  onMaterialClick?: (material: string) => void
  onMaterialRemove?: (material: string) => void
}

export const MaterialComposition: React.FC<MaterialCompositionProps> = ({
  materials,
  variant = 'default',
  size = 'medium',
  showPercentages = true,
  showCertifications = true,
  removable = false,
  className = '',
  onMaterialClick,
  onMaterialRemove,
}) => {
  const compositionClasses = [
    'oda-material-composition',
    `oda-material-composition--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Sort materials by percentage (highest first)
  const sortedMaterials = [...materials].sort((a, b) => {
    if (a.percentage === undefined && b.percentage === undefined) return 0
    if (a.percentage === undefined) return 1
    if (b.percentage === undefined) return -1
    return b.percentage - a.percentage
  })

  const totalPercentage = materials.reduce((sum, mat) => sum + (mat.percentage || 0), 0)

  return (
    <div className={compositionClasses}>
      <div className="oda-material-composition__tags">
        {sortedMaterials.map(({ material, percentage, certification }) => (
          <MaterialTag
            key={material}
            material={material}
            percentage={showPercentages ? percentage : undefined}
            certification={showCertifications ? certification : undefined}
            variant={variant}
            size={size}
            removable={removable}
            onClick={onMaterialClick}
            onRemove={onMaterialRemove}
          />
        ))}
      </div>
      {showPercentages && totalPercentage > 0 && totalPercentage !== 100 && (
        <div className="oda-material-composition__total">
          Total: {totalPercentage}%
        </div>
      )}
    </div>
  )
}

// Care Instructions Component
export interface CareInstructionsProps {
  instructions: Array<{
    type: 'wash' | 'dry' | 'iron' | 'bleach' | 'dry-clean'
    temperature?: number
    method?: string
    warning?: boolean
  }>
  variant?: 'icons' | 'text' | 'detailed'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const CareInstructions: React.FC<CareInstructionsProps> = ({
  instructions,
  variant = 'text',
  size = 'medium',
  className = '',
}) => {
  const careClasses = [
    'oda-care-instructions',
    `oda-care-instructions--${variant}`,
    `oda-care-instructions--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getCareText = (instruction: CareInstructionsProps['instructions'][0]) => {
    const { type, temperature, method, warning } = instruction
    
    let text = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
    
    if (temperature) {
      text += ` at ${temperature}°C`
    }
    
    if (method) {
      text += ` (${method})`
    }
    
    if (warning) {
      text = `⚠️ ${text}`
    }
    
    return text
  }

  return (
    <div className={careClasses}>
      {instructions.map((instruction, index) => (
        <MaterialTag
          key={`${instruction.type}-${index}`}
          material={getCareText(instruction)}
          variant="compact"
          color={instruction.warning ? 'warning' : 'info'}
          size={size}
          showIcon={false}
          showPercentage={false}
        />
      ))}
    </div>
  )
}

MaterialTag.displayName = 'MaterialTag'
MaterialComposition.displayName = 'MaterialComposition'
CareInstructions.displayName = 'CareInstructions'