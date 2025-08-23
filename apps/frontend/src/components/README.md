# Oda Design System

A comprehensive atomic design system built specifically for fashion ERP applications, based on Ant Design with custom theming and fashion-specific components.

## Architecture

Our design system follows the **Atomic Design** methodology:

```
components/
├── atoms/          # Basic building blocks
├── molecules/      # Simple combinations of atoms
├── organisms/      # Complex UI sections
├── templates/      # Page-level layouts
└── pages/          # Complete pages with data
```

## Atoms

### Base Atoms

#### Button

Customizable button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/atoms/Button'
;<Button variant='primary' size='medium' icon={<PlusOutlined />}>
  Add Product
</Button>
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'text'
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean
- `loading`: boolean
- `icon`: ReactNode
- `iconPosition`: 'start' | 'end'

#### Input

Enhanced input component with validation and styling.

```tsx
import { Input } from '@/components/atoms/Input'
;<Input
  label='Product Name'
  placeholder='Enter product name'
  error='This field is required'
  required
/>
```

**Props:**

- `label`: string
- `error`: string
- `helperText`: string
- `required`: boolean
- `variant`: 'outlined' | 'filled' | 'borderless'

#### Typography

Comprehensive text components with consistent styling.

```tsx
import { Typography } from '@/components/atoms/Typography'

<Typography.Title level={1}>Main Heading</Typography.Title>
<Typography.Paragraph>Body text content</Typography.Paragraph>
<Typography.Text size="sm" color="secondary">Helper text</Typography.Text>
```

### Fashion-Specific Atoms

#### ColorSwatch

Color selection component for fashion products.

```tsx
import { ColorSwatch, ColorPalette } from '@/components/atoms/ColorSwatch'
;<ColorPalette
  colors={[
    { color: '#ff0000', name: 'Red' },
    { color: '#00ff00', name: 'Green' },
  ]}
  selectedColor='#ff0000'
  onColorSelect={(color) => console.log(color)}
/>
```

**Props:**

- `colors`: Array<{ color: string, name?: string }>
- `selectedColor`: string
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `onColorSelect`: (color: string) => void

#### SizeIndicator

Size selection for clothing items.

```tsx
import { SizeChart } from '@/components/atoms/SizeIndicator'
;<SizeChart
  sizes={[
    { size: 'S', label: 'Small', available: true },
    { size: 'M', label: 'Medium', available: true },
    { size: 'L', label: 'Large', available: false },
  ]}
  selectedSize='M'
  onSizeSelect={(size) => console.log(size)}
/>
```

#### MaterialTag

Material composition and certification display.

```tsx
import { MaterialComposition } from '@/components/atoms/MaterialTag'
;<MaterialComposition
  materials={[
    { material: 'Cotton', percentage: 95, certification: 'organic' },
    { material: 'Elastane', percentage: 5 },
  ]}
/>
```

## Theme Configuration

The design system uses a comprehensive theme configuration:

```tsx
import { ConfigProvider } from 'antd'
import { theme } from '@/config/theme'
;<ConfigProvider theme={theme}>
  <App />
</ConfigProvider>
```

### Design Tokens

#### Colors

- **Primary**: Sky blue palette (#0ea5e9)
- **Fashion Colors**: Rose, pink, purple, emerald, amber
- **Neutral**: Grayscale palette
- **Status**: Success, warning, error, info

#### Typography

- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Scale**: xs (12px) to 5xl (48px)
- **Weights**: Light (300) to extrabold (800)

#### Spacing

- **Scale**: 1 (4px) to 64 (256px)
- **CSS Variables**: `--oda-space-*`

#### Border Radius

- **Scale**: sm (4px) to full (9999px)
- **CSS Variables**: `--oda-radius-*`

## CSS Architecture

### CSS Custom Properties

All design tokens are available as CSS custom properties:

```css
:root {
  --oda-primary-500: #0ea5e9;
  --oda-space-4: 16px;
  --oda-radius-md: 8px;
  --oda-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
```

### Component Styling

Each component has its own CSS file with:

- BEM-like naming convention (`oda-component--modifier`)
- CSS custom properties for theming
- Responsive design utilities
- Accessibility considerations

## Testing

### Component Testing

```tsx
import { render, screen, fireEvent } from '@/test/test-utils'
import { Button } from '@/components/atoms/Button'

test('button handles click events', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click me</Button>)

  fireEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalled()
})
```

### Accessibility Testing

```tsx
import { checkAccessibility } from '@/test/test-utils'

test('component meets accessibility standards', async () => {
  const { container } = render(<Button>Accessible Button</Button>)
  await checkAccessibility(container)
})
```

## Storybook

View and interact with all components in Storybook:

```bash
pnpm run storybook
```

Stories are located alongside components:

- `Button.stories.tsx`
- `ColorSwatch.stories.tsx`
- `SizeIndicator.stories.tsx`

## Development Guidelines

### Creating New Components

1. **Follow Atomic Design**: Determine the correct level (atom, molecule, organism)
2. **Use TypeScript**: Define proper interfaces for props
3. **Include Tests**: Unit tests and accessibility tests
4. **Write Stories**: Storybook documentation
5. **Follow Naming**: Use `oda-` prefix for CSS classes

### Component Structure

```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.css      # Styles
├── ComponentName.test.tsx # Tests
├── ComponentName.stories.tsx # Storybook
└── index.ts              # Exports
```

### CSS Guidelines

- Use CSS custom properties for theming
- Follow BEM-like naming: `oda-component__element--modifier`
- Include responsive design considerations
- Add accessibility features (focus states, ARIA attributes)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Tree-shakable components
- CSS-in-JS with Ant Design tokens
- Optimized bundle sizes
- Lazy loading for complex components

## Contributing

1. Create components following atomic design principles
2. Include comprehensive tests
3. Add Storybook documentation
4. Follow accessibility guidelines
5. Update this README for new components
