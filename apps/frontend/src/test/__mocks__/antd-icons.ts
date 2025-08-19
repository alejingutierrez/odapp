import React from 'react'

const createIcon =
  (name: string) => (props: React.HTMLAttributes<HTMLSpanElement>) =>
    React.createElement('span', { 'data-testid': `${name}-icon`, ...props })

export const PhoneOutlined = createIcon('phone')
export const MailOutlined = createIcon('mail')
export const VideoCameraOutlined = createIcon('video-camera')
export const MessageOutlined = createIcon('message')
export const UserOutlined = createIcon('user')
export const ShoppingCartOutlined = createIcon('shopping-cart')
export const FileTextOutlined = createIcon('file-text')
export const CalendarOutlined = createIcon('calendar')
export const BellOutlined = createIcon('bell')
export const HeartOutlined = createIcon('heart')
export const ShareAltOutlined = createIcon('share-alt')
export const EyeOutlined = createIcon('eye')
export const EditOutlined = createIcon('edit')
export const DeleteOutlined = createIcon('delete')
export const DownloadOutlined = createIcon('download')
export const UploadOutlined = createIcon('upload')
export const LoginOutlined = createIcon('login')
export const LogoutOutlined = createIcon('logout')
export const SettingOutlined = createIcon('setting')
export const QuestionCircleOutlined = createIcon('question-circle')
