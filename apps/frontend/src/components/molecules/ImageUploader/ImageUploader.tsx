import { UploadOutlined } from '@ant-design/icons'
import { Upload, Button } from 'antd'
import React from 'react'

export interface ImageUploaderProps {
  // TODO: Implement full ImageUploader molecule
  placeholder?: string
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  placeholder = 'Upload Image',
}) => {
  return (
    <Upload>
      <Button icon={<UploadOutlined />}>{placeholder}</Button>
    </Upload>
  )
}

export default ImageUploader
