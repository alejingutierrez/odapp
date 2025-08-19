import React, { useState } from 'react'
import { Tag, Modal, Typography, Space, Progress } from 'antd'
import {
  InfoCircleOutlined,
  LeafOutlined,
  RecyclingOutlined,
} from '@ant-design/icons'
import './MaterialTagMolecule.css'

export interface MaterialInfo {
  name: string
  composition: string
  texture: 'smooth' | 'rough' | 'soft' | 'coarse' | 'silky' | 'fuzzy'
  careInstructions: string[]
  sustainability: {
    score: number // 0-100
    recyclable: boolean
    organic: boolean
    certifications: string[]
  }
  properties: {
    breathable: boolean
    waterResistant: boolean
    stretchable: boolean
    wrinkleResistant: boolean
  }
}

export interface MaterialTagMoleculeProps {
  material: MaterialInfo
  showTexture?: boolean
  showSustainability?: boolean
  showCareInfo?: boolean
  interactive?: boolean
  size?: 'small' | 'default' | 'large'
  className?: string
}

export const MaterialTagMolecule: React.FC<MaterialTagMoleculeProps> = ({
  material,
  showTexture = true,
  showSustainability = true,
  showCareInfo = true,
  interactive = true,
  size = 'default',
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false)

  const getTexturePattern = () => {
    switch (material.texture) {
      case 'smooth':
        return 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%)'
      case 'rough':
        return 'radial-gradient(circle at 2px 2px, #e0e0e0 1px, transparent 0)'
      case 'soft':
        return 'linear-gradient(90deg, #f5f5f5 50%, #fafafa 50%)'
      case 'coarse':
        return 'repeating-linear-gradient(45deg, #e8e8e8, #e8e8e8 2px, #f0f0f0 2px, #f0f0f0 4px)'
      case 'silky':
        return 'linear-gradient(135deg, #f8f8f8, #e8e8e8, #f8f8f8)'
      case 'fuzzy':
        return 'radial-gradient(ellipse at center, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)'
      default:
        return '#f0f0f0'
    }
  }

  const getSustainabilityColor = () => {
    const score = material.sustainability.score
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    if (score >= 40) return '#fa8c16'
    return '#ff4d4f'
  }

  const getSustainabilityLevel = () => {
    const score = material.sustainability.score
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const renderTexturePreview = () => {
    if (!showTexture) return null

    return (
      <div
        className='material-tag__texture-preview'
        style={{
          background: getTexturePattern(),
          backgroundSize: '8px 8px',
        }}
        title={`${material.texture} texture`}
      />
    )
  }

  const renderSustainabilityIndicator = () => {
    if (!showSustainability) return null

    return (
      <div className='material-tag__sustainability'>
        <Space size='small'>
          {material.sustainability.organic && (
            <LeafOutlined
              style={{ color: '#52c41a' }}
              title='Organic material'
            />
          )}
          {material.sustainability.recyclable && (
            <RecyclingOutlined
              style={{ color: '#1890ff' }}
              title='Recyclable material'
            />
          )}
          <div
            className='material-tag__sustainability-score'
            style={{ backgroundColor: getSustainabilityColor() }}
            title={`Sustainability score: ${material.sustainability.score}/100`}
          >
            {material.sustainability.score}
          </div>
        </Space>
      </div>
    )
  }

  const renderDetailModal = () => (
    <Modal
      title={`${material.name} - Material Details`}
      open={showModal}
      onCancel={() => setShowModal(false)}
      footer={null}
      width={600}
    >
      <div className='material-tag__modal-content'>
        <div className='material-tag__section'>
          <Typography.Title level={5}>Composition</Typography.Title>
          <Typography.Text>{material.composition}</Typography.Text>
        </div>

        <div className='material-tag__section'>
          <Typography.Title level={5}>Properties</Typography.Title>
          <Space wrap>
            {material.properties.breathable && (
              <Tag color='blue'>Breathable</Tag>
            )}
            {material.properties.waterResistant && (
              <Tag color='cyan'>Water Resistant</Tag>
            )}
            {material.properties.stretchable && (
              <Tag color='purple'>Stretchable</Tag>
            )}
            {material.properties.wrinkleResistant && (
              <Tag color='green'>Wrinkle Resistant</Tag>
            )}
          </Space>
        </div>

        {showSustainability && (
          <div className='material-tag__section'>
            <Typography.Title level={5}>Sustainability</Typography.Title>
            <Space direction='vertical' style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>Score: </Typography.Text>
                <Progress
                  percent={material.sustainability.score}
                  strokeColor={getSustainabilityColor()}
                  format={() =>
                    `${material.sustainability.score}/100 (${getSustainabilityLevel()})`
                  }
                />
              </div>

              {material.sustainability.certifications.length > 0 && (
                <div>
                  <Typography.Text strong>Certifications: </Typography.Text>
                  <Space wrap>
                    {material.sustainability.certifications.map((cert) => (
                      <Tag key={cert} color='green'>
                        {cert}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </div>
        )}

        {showCareInfo && (
          <div className='material-tag__section'>
            <Typography.Title level={5}>Care Instructions</Typography.Title>
            <ul className='material-tag__care-list'>
              {material.careInstructions.map((instruction, index) => (
                <li key={index}>
                  <Typography.Text>{instruction}</Typography.Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )

  const tagContent = (
    <Space size='small' className='material-tag__content'>
      {renderTexturePreview()}
      <span className='material-tag__name'>{material.name}</span>
      {renderSustainabilityIndicator()}
      {interactive && showCareInfo && (
        <InfoCircleOutlined className='material-tag__info-icon' />
      )}
    </Space>
  )

  return (
    <>
      <Tag
        className={`material-tag material-tag--${size} ${className}`}
        onClick={interactive ? () => setShowModal(true) : undefined}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        {tagContent}
      </Tag>
      {renderDetailModal()}
    </>
  )
}

export default MaterialTagMolecule
