import React, { useState } from 'react'
import {
  Upload,
  Button,
  Progress,
  Typography,
  Space,
  Image,
  message,
} from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileOutlined,
} from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import './FileUpload.css'

export interface FileUploadProps {
  value?: UploadFile[]
  onChange?: (files: UploadFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  showPreview?: boolean
  showProgress?: boolean
  dragAndDrop?: boolean
  disabled?: boolean
  className?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  showPreview = true,
  showProgress = true,
  dragAndDrop = true,
  disabled = false,
  className = '',
}) => {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const getFileIcon = (file: UploadFile) => {
    const type = file.type || ''
    if (type.startsWith('image/')) return <FileImageOutlined />
    if (type.includes('pdf')) return <FilePdfOutlined />
    if (type.includes('doc') || type.includes('text'))
      return <FileTextOutlined />
    return <FileOutlined />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const beforeUpload = (file: File) => {
    // Check file size
    if (file.size / 1024 / 1024 > maxSize) {
      message.error(`File must be smaller than ${maxSize}MB`)
      return false
    }

    // Check file count
    if (value.length >= maxFiles) {
      message.error(`Maximum ${maxFiles} files allowed`)
      return false
    }

    return false // Prevent auto upload
  }

  const handleChange: UploadProps['onChange'] = (info) => {
    let fileList = [...info.fileList]

    // Limit the number of files
    fileList = fileList.slice(-maxFiles)

    // Update file status
    fileList = fileList.map((file) => {
      if (file.response) {
        file.url = file.response.url
      }
      return file
    })

    onChange?.(fileList)
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewVisible(true)
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1)
    )
  }

  const handleRemove = (file: UploadFile) => {
    const newFileList = value.filter((item) => item.uid !== file.uid)
    onChange?.(newFileList)
  }

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const renderFileItem = (file: UploadFile) => {
    const isImage = file.type?.startsWith('image/')

    return (
      <div key={file.uid} className='file-upload__item'>
        <div className='file-upload__item-preview'>
          {isImage && file.thumbUrl ? (
            <Image
              src={file.thumbUrl}
              alt={file.name}
              width={40}
              height={40}
              preview={false}
              className='file-upload__thumbnail'
            />
          ) : (
            <div className='file-upload__icon'>{getFileIcon(file)}</div>
          )}
        </div>

        <div className='file-upload__item-info'>
          <Typography.Text
            ellipsis={{ tooltip: file.name }}
            className='file-upload__filename'
          >
            {file.name}
          </Typography.Text>
          <Typography.Text type='secondary' className='file-upload__filesize'>
            {file.size ? formatFileSize(file.size) : 'Unknown size'}
          </Typography.Text>

          {showProgress && file.status === 'uploading' && (
            <Progress
              percent={file.percent}
              size='small'
              className='file-upload__progress'
            />
          )}
        </div>

        <div className='file-upload__item-actions'>
          <Space size='small'>
            {showPreview && isImage && (
              <Button
                type='text'
                size='small'
                icon={<EyeOutlined />}
                onClick={() => handlePreview(file)}
              />
            )}
            <Button
              type='text'
              size='small'
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(file)}
              danger
            />
          </Space>
        </div>
      </div>
    )
  }

  const uploadProps: UploadProps = {
    fileList: value,
    beforeUpload,
    onChange: handleChange,
    onPreview: handlePreview,
    onRemove: handleRemove,
    accept: acceptedTypes.join(','),
    multiple: maxFiles > 1,
    disabled,
    showUploadList: false,
  }

  const uploadButton = (
    <div className='file-upload__button'>
      <UploadOutlined className='file-upload__button-icon' />
      <div className='file-upload__button-text'>
        <Typography.Text>Click to upload</Typography.Text>
        {dragAndDrop && (
          <Typography.Text
            type='secondary'
            className='file-upload__button-hint'
          >
            or drag and drop
          </Typography.Text>
        )}
      </div>
      <Typography.Text type='secondary' className='file-upload__button-info'>
        Max {maxFiles} files, up to {maxSize}MB each
      </Typography.Text>
    </div>
  )

  return (
    <div className={`file-upload ${className}`}>
      {dragAndDrop ? (
        <Upload.Dragger {...uploadProps} className='file-upload__dragger'>
          {uploadButton}
        </Upload.Dragger>
      ) : (
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} disabled={disabled}>
            Upload Files
          </Button>
        </Upload>
      )}

      {value.length > 0 && (
        <div className='file-upload__list'>{value.map(renderFileItem)}</div>
      )}

      <Image
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          onVisibleChange: setPreviewVisible,
          title: previewTitle,
        }}
      />
    </div>
  )
}

export default FileUpload
