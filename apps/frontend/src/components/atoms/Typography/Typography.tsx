import React from 'react'
import { Typography as AntTypography, TypographyProps as AntTypographyProps } from 'antd'
import './Typography.css'

const { Title: AntTitle, Text: AntText, Paragraph: AntParagraph } = AntTypography

// Title Component
export interface TitleProps extends AntTypographyProps {
  level?: 1 | 2 | 3 | 4 | 5
  children: React.ReactNode
  color?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'primary'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
  className?: string
}

export const Title: React.FC<TitleProps> = ({
  level = 1,
  color = 'default',
  weight = 'bold',
  align = 'left',
  className = '',
  children,
  ...props
}) => {
  const titleClasses = [
    'oda-title',
    `oda-title--level-${level}`,
    `oda-title--${color}`,
    `oda-title--${weight}`,
    `oda-title--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AntTitle
      level={level}
      className={titleClasses}
      {...props}
    >
      {children}
    </AntTitle>
  )
}

// Text Component
export interface TextProps extends AntTypographyProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  color?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'primary' | 'white'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  className?: string
}

export const Text: React.FC<TextProps> = ({
  size = 'base',
  color = 'default',
  weight = 'normal',
  align = 'left',
  transform = 'none',
  className = '',
  children,
  ...props
}) => {
  const textClasses = [
    'oda-text',
    `oda-text--${size}`,
    `oda-text--${color}`,
    `oda-text--${weight}`,
    `oda-text--${align}`,
    `oda-text--${transform}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AntText className={textClasses} {...props}>
      {children}
    </AntText>
  )
}

// Paragraph Component
export interface ParagraphProps extends AntTypographyProps {
  children: React.ReactNode
  size?: 'sm' | 'base' | 'lg'
  color?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'primary'
  weight?: 'light' | 'normal' | 'medium' | 'semibold'
  align?: 'left' | 'center' | 'right' | 'justify'
  spacing?: 'tight' | 'normal' | 'relaxed' | 'loose'
  className?: string
}

export const Paragraph: React.FC<ParagraphProps> = ({
  size = 'base',
  color = 'default',
  weight = 'normal',
  align = 'left',
  spacing = 'normal',
  className = '',
  children,
  ...props
}) => {
  const paragraphClasses = [
    'oda-paragraph',
    `oda-paragraph--${size}`,
    `oda-paragraph--${color}`,
    `oda-paragraph--${weight}`,
    `oda-paragraph--${align}`,
    `oda-paragraph--${spacing}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AntParagraph className={paragraphClasses} {...props}>
      {children}
    </AntParagraph>
  )
}

// Link Component
export interface LinkProps extends AntTypographyProps {
  children: React.ReactNode
  href?: string
  size?: 'xs' | 'sm' | 'base' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  underline?: 'none' | 'hover' | 'always'
  external?: boolean
  className?: string
  onClick?: () => void
}

export const Link: React.FC<LinkProps> = ({
  size = 'base',
  color = 'primary',
  weight = 'medium',
  underline = 'hover',
  external = false,
  className = '',
  children,
  href,
  onClick,
  ...props
}) => {
  const linkClasses = [
    'oda-link',
    `oda-link--${size}`,
    `oda-link--${color}`,
    `oda-link--${weight}`,
    `oda-link--underline-${underline}`,
    external && 'oda-link--external',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const linkProps = {
    href,
    onClick,
    ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
    ...props,
  }

  return (
    <AntText className={linkClasses} {...linkProps}>
      {children}
      {external && <span className="oda-link__external-icon">↗</span>}
    </AntText>
  )
}

// Code Component
export interface CodeProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base'
  variant?: 'inline' | 'block'
  language?: string
  className?: string
}

export const Code: React.FC<CodeProps> = ({
  size = 'base',
  variant = 'inline',
  className = '',
  children,
  ...props
}) => {
  const codeClasses = [
    'oda-code',
    `oda-code--${size}`,
    `oda-code--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (variant === 'block') {
    return (
      <pre className={codeClasses} {...props}>
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <code className={codeClasses} {...props}>
      {children}
    </code>
  )
}

// Export compound component
export const Typography = {
  Title,
  Text,
  Paragraph,
  Link,
  Code,
}

Title.displayName = 'Title'
Text.displayName = 'Text'
Paragraph.displayName = 'Paragraph'
Link.displayName = 'Link'
Code.displayName = 'Code'