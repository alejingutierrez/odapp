import type { Meta, StoryObj } from '@storybook/react'
import { Title, Text, Paragraph, Link, Code } from './Typography'

const meta: Meta<typeof Title> = {
  title: 'Atoms/Typography',
  component: Title,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typography components for consistent text styling including titles, text, paragraphs, links, and code.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Title Stories
export const Titles: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Title level={1}>Heading Level 1</Title>
      <Title level={2}>Heading Level 2</Title>
      <Title level={3}>Heading Level 3</Title>
      <Title level={4}>Heading Level 4</Title>
      <Title level={5}>Heading Level 5</Title>
    </div>
  ),
}

export const TitleColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Title level={2}>
          Default Title
        </Title>
        <Title level={2}>
          Primary Title
        </Title>
      <Title level={2} color='secondary'>
        Secondary Title
      </Title>
      <Title level={2} color='success'>
        Success Title
      </Title>
      <Title level={2} color='warning'>
        Warning Title
      </Title>
      <Title level={2} color='error'>
        Error Title
      </Title>
    </div>
  ),
}

export const TitleWeights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Title level={2} weight='light'>
        Light Title
      </Title>
      <Title level={2} weight='normal'>
        Normal Title
      </Title>
      <Title level={2} weight='medium'>
        Medium Title
      </Title>
      <Title level={2} weight='semibold'>
        Semibold Title
      </Title>
      <Title level={2} weight='bold'>
        Bold Title
      </Title>
    </div>
  ),
}

export const TitleAlignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Title level={2} align='left'>
        Left Aligned Title
      </Title>
      <Title level={2} align='center'>
        Center Aligned Title
      </Title>
      <Title level={2} align='right'>
        Right Aligned Title
      </Title>
    </div>
  ),
}

// Text Stories
export const TextSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text size='xs'>Extra Small Text</Text>
      <Text size='sm'>Small Text</Text>
      <Text size='base'>Base Text (Default)</Text>
      <Text size='lg'>Large Text</Text>
      <Text size='xl'>Extra Large Text</Text>
    </div>
  ),
}

export const TextColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text color='default'>Default Text</Text>
      <Text color='secondary'>Secondary Text</Text>
      <Text color='primary'>Primary Text</Text>
      <Text color='success'>Success Text</Text>
      <Text color='warning'>Warning Text</Text>
      <Text color='error'>Error Text</Text>
      <div
        style={{
          backgroundColor: '#1f2937',
          padding: '8px',
          borderRadius: '4px',
        }}
      >
        <Text color='white'>White Text on Dark Background</Text>
      </div>
    </div>
  ),
}

export const TextWeights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text weight='light'>Light Text</Text>
      <Text weight='normal'>Normal Text</Text>
      <Text weight='medium'>Medium Text</Text>
      <Text weight='semibold'>Semibold Text</Text>
      <Text weight='bold'>Bold Text</Text>
    </div>
  ),
}

export const TextTransforms: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text transform='none'>Normal Text Transform</Text>
      <Text transform='uppercase'>Uppercase Text Transform</Text>
      <Text transform='lowercase'>Lowercase Text Transform</Text>
      <Text transform='capitalize'>Capitalize Text Transform</Text>
    </div>
  ),
}

// Paragraph Stories
export const Paragraphs: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '600px',
      }}
    >
      <Paragraph size='sm'>
        This is a small paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris.
      </Paragraph>

      <Paragraph size='base'>
        This is a base paragraph (default size). Lorem ipsum dolor sit amet,
        consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
        et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </Paragraph>

      <Paragraph size='lg'>
        This is a large paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
        in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur.
      </Paragraph>
    </div>
  ),
}

export const ParagraphSpacing: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <Title level={3}>Different Paragraph Spacing</Title>

      <Paragraph spacing='tight'>
        Tight spacing paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph spacing='normal'>
        Normal spacing paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph spacing='relaxed'>
        Relaxed spacing paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph spacing='loose'>
        Loose spacing paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>
    </div>
  ),
}

export const ParagraphAlignment: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <Paragraph align='left'>
        Left aligned paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph align='center'>
        Center aligned paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph align='right'>
        Right aligned paragraph. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Paragraph>

      <Paragraph align='justify'>
        Justified paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing
        elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor in
        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
        qui officia deserunt mollit anim id est laborum.
      </Paragraph>
    </div>
  ),
}

// Link Stories
export const Links: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Link href='#' size='sm'>
          Small Link
        </Link>
      </div>
      <div>
        <Link href='#' size='base'>
          Base Link (Default)
        </Link>
      </div>
      <div>
        <Link href='#' size='lg'>
          Large Link
        </Link>
      </div>
    </div>
  ),
}

export const LinkColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Link href='#' color='primary'>
        Primary Link
      </Link>
      <Link href='#' color='secondary'>
        Secondary Link
      </Link>
      <Link href='#' color='success'>
        Success Link
      </Link>
      <Link href='#' color='warning'>
        Warning Link
      </Link>
      <Link href='#' color='error'>
        Error Link
      </Link>
    </div>
  ),
}

export const LinkUnderlines: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Link href='#' underline='none'>
        No Underline
      </Link>
      <Link href='#' underline='hover'>
        Underline on Hover
      </Link>
      <Link href='#' underline='always'>
        Always Underlined
      </Link>
    </div>
  ),
}

export const ExternalLinks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Link href='https://example.com' external>
        External Link
      </Link>
      <Link href='https://github.com' external color='secondary'>
        GitHub
      </Link>
      <Link href='https://docs.example.com' external size='sm'>
        Documentation
      </Link>
    </div>
  ),
}

// Code Stories
export const CodeExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Text>Inline code example: </Text>
        <Code>const message = "Hello World"</Code>
      </div>

      <div>
        <Text>Different sizes:</Text>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <Code size='xs'>console.log("xs")</Code>
          <Code size='sm'>console.log("sm")</Code>
          <Code size='base'>console.log("base")</Code>
        </div>
      </div>

      <div>
        <Text>Block code example:</Text>
        <Code variant='block'>
          {`function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`}
        </Code>
      </div>
    </div>
  ),
}

// Complex Layout Example
export const ComplexLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '800px' }}>
      <Title level={1} color='primary'>
        Typography System
      </Title>

      <Paragraph size='lg' spacing='relaxed'>
        This is a comprehensive typography system that provides consistent text
        styling across your application. It includes various components for
        different text needs.
      </Paragraph>

      <Title level={2}>Getting Started</Title>

      <Paragraph>
        To use the typography components, simply import them from the typography
        module:
      </Paragraph>

      <Code variant='block'>
        {`import { Title, Text, Paragraph, Link, Code } from './Typography'`}
      </Code>

      <Title level={3}>Basic Usage</Title>

      <Paragraph>
        Here's how you can use different typography components in your
        application:
      </Paragraph>

      <ul style={{ marginLeft: '20px' }}>
        <li>
          <Text weight='semibold'>Titles</Text> - Use for headings and section
          titles
        </li>
        <li>
          <Text weight='semibold'>Text</Text> - Use for inline text with various
          styles
        </li>
        <li>
          <Text weight='semibold'>Paragraphs</Text> - Use for body text and
          content blocks
        </li>
        <li>
          <Text weight='semibold'>Links</Text> - Use for navigation and external
          references
        </li>
        <li>
          <Text weight='semibold'>Code</Text> - Use for code snippets and
          technical content
        </li>
      </ul>

      <Title level={3}>Best Practices</Title>

      <Paragraph>
        When using typography components, consider the following best practices:
      </Paragraph>

      <ol style={{ marginLeft: '20px' }}>
        <li>Maintain consistent hierarchy with heading levels</li>
        <li>Use appropriate colors for different content types</li>
        <li>Consider readability with proper spacing and alignment</li>
        <li>Use semantic HTML elements when possible</li>
      </ol>

      <Paragraph spacing='loose'>
        For more information, visit our{' '}
        <Link href='#' external>
          documentation
        </Link>{' '}
        or check out the{' '}
        <Link href='#' color='secondary'>
          style guide
        </Link>
        .
      </Paragraph>
    </div>
  ),
}

// Interactive Examples
export const Interactive: Story = {
  args: {
    level: 2,
    children: 'Interactive Title',
    color: 'default',
    weight: 'bold',
    align: 'left',
  },
}
