import React, { useState } from 'react'
import { Card, Button, Tag, Tooltip, Progress, Image } from 'antd'
import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { designTokens } from '../../../config/theme'
import './FilePreview.css'

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified?: Date
  uploadedBy?: string
  uploadedAt?: Date
  dimensions?: { width: number; height: number }
  duration?: number // for video/audio files
  pages?: number // for documents
}

export interface FilePreviewProps {
  /** File metadata */
  file: FileMetadata
  /** File URL for preview/download */
  url?: string
  /** Thumbnail URL */
  thumbnailUrl?: string
  /** Whether to show thumbnail */
  showThumbnail?: boolean
  /** Whether to show metadata */
  showMetadata?: boolean
  /** Whether to show download button */
  showDownload?: boolean
  /** Whether to show preview button */
  showPreview?: boolean
  /** Whether to show delete button */
  showDelete?: boolean
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Layout variant */
  variant?: 'card' | 'list' | 'grid'
  /** Upload progress (0-100) */
  uploadProgress?: number
  /** Whether file is uploading */
  uploading?: boolean
  /** Error message */
  error?: string
  /** Download handler */
  onDownload?: () => void
  /** Preview handler */
  onPreview?: () => void
  /** Delete handler */
  onDelete?: () => void
  /** Click handler */
  onClick?: () => void
  /** Whether file is selected */
  selected?: boolean
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <FilePdfOutlined />,
  'image/jpeg': <FileImageOutlined />,
  'image/jpg': <FileImageOutlined />,
  'image/png': <FileImageOutlined />,
  'image/gif': <FileImageOutlined />,
  'image/svg+xml': <FileImageOutlined />,
  'text/plain': <FileTextOutlined />,
  'text/csv': <FileExcelOutlined />,
  'application/vnd.ms-excel': <FileExcelOutlined />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FileExcelOutlined />,
  'application/msword': <FileWordOutlined />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileWordOutlined />,
  'application/vnd.ms-powerpoint': <FilePptOutlined />,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': <FilePptOutlined />,
  'application/zip': <FileZipOutlined />,
  'application/x-zip-compressed': <FileZipOutlined />,
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  url,
  thumbnailUrl,
  showThumbnail = true,
  showMetadata = true,
  showDownload = true,
  showPreview = true,
  showDelete = false,
  size = 'medium',
  variant = 'card',
  uploadProgress,
  uploading = false,
  error,
  onDownload,
  onPreview,
  onDelete,
  onClick,
  selected = false,
}) => {
  const [imageError, setImageError] = useState(false)

  const previewClasses = [
    'oda-file-preview',
    `oda-file-preview--${variant}`,
    `oda-file-preview--${size}`,
    selected && 'oda-file-preview--selected',
    uploading && 'oda-file-preview--uploading',
    error && 'oda-file-preview--error',
    onClick && 'oda-file-preview--clickable',
  ]
    .filter(Boolean)
    .join(' ')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (): React.ReactNode => {
    return FILE_TYPE_ICONS[file.type] || <FileOutlined />
  }

  const isImage = (): boolean => {
    return file.type.startsWith('image/')
  }

  const renderThumbnail = () => {
    if (!showThumbnail) return null

    if (isImage() && (thumbnailUrl || url) && !imageError) {
      return (
        <div className="oda-file-preview__thumbnail">
          <Image
            src={thumbnailUrl || url}
            alt={file.name}
            preview={false}
            onError={() => setImageError(true)}
            className="oda-file-preview__image"
          />
        </div>
      )
    }

    return (
      <div className="oda-file-preview__icon-container">
        <span className="oda-file-preview__icon">
          {getFileIcon()}
        </span>
      </div>
    )
  }

  const renderMetadata = () => {
    if (!showMetadata) return null

    return (
      <div className="oda-file-preview__metadata">
        <div className="oda-file-preview__basic-info">
          <span className="oda-file-preview__size">{formatFileSize(file.size)}</span>
          {file.dimensions && (
            <span className="oda-file-preview__dimensions">
              {file.dimensions.width} × {file.dimensions.height}
            </span>
          )}
          {file.pages && (
            <span className="oda-file-preview__pages">
              {file.pages} pages
            </span>
          )}
        </div>
        
        {(file.uploadedBy || file.uploadedAt) && (
          <div className="oda-file-preview__upload-info">
            {file.uploadedBy && (
              <span className="oda-file-preview__uploaded-by">
                by {file.uploadedBy}
              </span>
            )}
            {file.uploadedAt && (
              <span className="oda-file-preview__uploaded-at">
                {file.uploadedAt.toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderActions = () => {
    const actions = []

    if (showPreview && onPreview) {
      actions.push(
        <Tooltip key="preview" title="Preview">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            size="small"
          />
        </Tooltip>
      )
    }

    if (showDownload && onDownload) {
      actions.push(
        <Tooltip key="download" title="Download">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
            size="small"
          />
        </Tooltip>
      )
    }

    if (showDelete && onDelete) {
      actions.push(
        <Tooltip key="delete" title="Delete">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            size="small"
          />
        </Tooltip>
      )
    }

    if (actions.length === 0) return null

    return (
      <div className="oda-file-preview__actions">
        {actions}
      </div>
    )
  }

  const renderProgress = () => {
    if (!uploading || uploadProgress === undefined) return null

    return (
      <div className="oda-file-preview__progress">
        <Progress
          percent={uploadProgress}
          size="small"
          showInfo={false}
          strokeColor="#0ea5e9"
        />
        <span className="oda-file-preview__progress-text">
          Uploading... {uploadProgress}%
        </span>
      </div>
    )
  }

  const renderError = () => {
    if (!error) return null

    return (
      <div className="oda-file-preview__error">
        <InfoCircleOutlined className="oda-file-preview__error-icon" />
        <span className="oda-file-preview__error-text">{error}</span>
      </div>
    )
  }

  const renderCardVariant = () => (
    <Card
      className={previewClasses}
      onClick={onClick}
      hoverable={!!onClick}
      size="small"
      bodyStyle={{ padding: size === 'small' ? '8px' : '12px' }}
    >
      <div className="oda-file-preview__content">
        {renderThumbnail()}
        <div className="oda-file-preview__info">
          <div className="oda-file-preview__header">
            <h4 className="oda-file-preview__name" title={file.name}>
              {file.name}
            </h4>
            {renderActions()}
          </div>
          {renderMetadata()}
          {renderProgress()}
          {renderError()}
        </div>
      </div>
    </Card>
  )

  const renderListVariant = () => (
    <div className={previewClasses} onClick={onClick}>
      <div className="oda-file-preview__list-content">
        <div className="oda-file-preview__list-icon">
          {getFileIcon()}
        </div>
        <div className="oda-file-preview__list-info">
          <span className="oda-file-preview__name" title={file.name}>
            {file.name}
          </span>
          <span className="oda-file-preview__size">
            {formatFileSize(file.size)}
          </span>
        </div>
        {renderActions()}
      </div>
      {renderProgress()}
      {renderError()}
    </div>
  )

  const renderGridVariant = () => (
    <div className={previewClasses} onClick={onClick}>
      <div className="oda-file-preview__grid-content">
        {renderThumbnail()}
        <div className="oda-file-preview__grid-info">
          <span className="oda-file-preview__name" title={file.name}>
            {file.name}
          </span>
          <span className="oda-file-preview__size">
            {formatFileSize(file.size)}
          </span>
        </div>
        {renderActions()}
      </div>
      {renderProgress()}
      {renderError()}
    </div>
  )

  switch (variant) {
    case 'list':
      return renderListVariant()
    case 'grid':
      return renderGridVariant()
    default:
      return renderCardVariant()
  }
}

FilePreview.displayName = 'FilePreview'