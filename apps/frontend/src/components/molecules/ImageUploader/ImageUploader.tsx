import React from 'react'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

export interface ImageUploaderProps {
  // TODO: Implement full ImageUploader molecule
  placeholder?: string
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ placeholder = 'Upload Image' }) => {
  return (
    <Upload>
      <Button icon={<UploadOutlined />}>{placeholder}</Button>
    </Upload>
  )
}

export default ImageUploader