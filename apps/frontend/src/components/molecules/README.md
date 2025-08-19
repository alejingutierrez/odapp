# Molecules

Molecules are combinations of atoms that form more complex UI components. They represent the smallest functional units in our design system and serve as the building blocks for organisms and templates.

## Design Principles

### Atomic Composition

- Each molecule is composed of 2-5 atoms
- Atoms maintain their individual functionality within molecules
- Molecules define the relationship and interaction between atoms

### Single Responsibility

- Each molecule has one clear purpose
- Molecules are reusable across different contexts
- Complex functionality is broken down into smaller, focused molecules

### Consistent API

- Props follow consistent naming conventions
- Event handlers use standard patterns (`onAction`, `onChange`, etc.)
- Size variants use standard values (`small`, `middle`, `large`)

## Available Molecules

### Core Components

#### SearchBox

A search input with debounced search, filter button, and clear functionality.

```tsx
<SearchBox
  placeholder='Search products...'
  onSearch={(value) => console.log(value)}
  showFilterButton={true}
  filterCount={3}
/>
```

**Atoms Used:** Input, Button, Icon, Spinner

#### FormField

A form field wrapper with label, validation, error display, and help text.

```tsx
<FormField
  label='Product Name'
  required={true}
  error='This field is required'
  tooltip='Enter the product name'
>
  <Input placeholder='Enter name' />
</FormField>
```

**Atoms Used:** Label, Typography

#### QuantitySelector

A quantity input with increment/decrement controls and validation.

```tsx
<QuantitySelector
  value={1}
  onChange={(value) => console.log(value)}
  min={1}
  max={100}
  showControls={true}
/>
```

**Atoms Used:** InputNumber, Button, Typography

#### StatusIndicator

A status display with color coding, tooltips, and animation states.

```tsx
<StatusIndicator
  status='success'
  text='Active'
  animated={true}
  tooltip='Product is active'
/>
```

**Atoms Used:** Badge, Typography, Icon

#### ActionButtonGroup

A group of action buttons with overflow handling.

```tsx
<ActionButtonGroup
  actions={[
    { key: 'edit', label: 'Edit', onClick: () => {} },
    { key: 'delete', label: 'Delete', onClick: () => {}, danger: true },
  ]}
  maxVisible={3}
/>
```

**Atoms Used:** Button, Dropdown

### Product Components

#### ProductCard

A product card displaying product information, images, pricing, and actions.

```tsx
<ProductCard
  product={productData}
  onEdit={(product) => console.log('Edit', product)}
  onDelete={(id) => console.log('Delete', id)}
  showActions={true}
  compact={false}
/>
```

**Atoms Used:** Card, Image, Typography, Badge, Button, Avatar

#### PriceDisplay

A price display with currency formatting, discounts, and tax information.

```tsx
<PriceDisplay
  price={29.99}
  compareAtPrice={39.99}
  showDiscount={true}
  currency='USD'
  locale='en-US'
/>
```

**Atoms Used:** Typography, Icon

#### ProductVariantSelector

A variant selector for size, color, and material selection.

```tsx
<ProductVariantSelector
  variants={productVariants}
  selectedVariant={selectedVariant}
  onVariantChange={(variant) => console.log(variant)}
  layout='vertical'
/>
```

**Atoms Used:** ColorSwatch, SizeIndicator, MaterialTag, Select, Radio

### Data Display

#### DataTable

A data table with sorting, filtering, and pagination controls.

```tsx
<DataTable
  columns={tableColumns}
  data={tableData}
  searchable={true}
  filterable={true}
  exportable={true}
  onSearch={(term) => console.log(term)}
/>
```

**Atoms Used:** Table, Input, Button, Select, Tooltip

#### MetricCard

A metric card for KPI display with trends and comparisons.

```tsx
<MetricCard
  title='Total Revenue'
  value='$124,563'
  icon={<DollarOutlined />}
  trend={{ value: 12.5, period: 'last month', isPositive: true }}
  color='success'
/>
```

**Atoms Used:** Card, Typography, Icon, Progress

### Navigation

#### BreadcrumbNav

A breadcrumb navigation with dynamic path generation.

```tsx
<BreadcrumbNav
  items={[
    { key: 'home', title: 'Home', href: '/' },
    { key: 'products', title: 'Products', href: '/products' },
    { key: 'detail', title: 'Product Detail' },
  ]}
  showHome={true}
  maxItems={5}
/>
```

**Atoms Used:** Breadcrumb, Icon, Dropdown

### Notifications

#### ProductRating

A product rating component with stars, review count, and interactive rating.

```tsx
<ProductRating
  rating={4.2}
  reviewCount={127}
  interactive={true}
  onChange={(rating) => console.log(rating)}
/>
```

**Atoms Used:** Rate, Typography, Icon

#### ProductBadge

A product badge for sale, new, featured, and stock status indicators.

```tsx
<ProductBadge type='sale' discount={25} position='top-right' animated={true} />
```

**Atoms Used:** Tag, Icon, Tooltip

#### TimelineItem

A timeline item for activity feeds and order tracking.

```tsx
<TimelineItem
  item={{
    id: '1',
    type: 'order-shipped',
    title: 'Order Shipped',
    description: 'Your order is on its way',
    timestamp: new Date(),
    user: { name: 'System' },
  }}
/>
```

**Atoms Used:** Timeline, Typography, Avatar, Tag, Icon

#### TabNavigation

A tab navigation with active states and content switching.

```tsx
<TabNavigation
  items={[
    { key: '1', label: 'Products', content: <div>Products</div> },
    { key: '2', label: 'Orders', content: <div>Orders</div>, badge: 5 },
  ]}
  onChange={(key) => console.log(key)}
/>
```

**Atoms Used:** Tabs, Badge, Icon, Tooltip

#### FilterPanel

A filter panel with collapsible sections and clear all functionality.

```tsx
<FilterPanel
  sections={[
    {
      key: 'category',
      title: 'Category',
      content: <CategoryFilter />,
      badge: 2,
    },
  ]}
  onClearAll={() => console.log('Clear all')}
/>
```

**Atoms Used:** Collapse, Button, Typography, Badge, Icon

#### PaginationControls

Pagination controls with page numbers, size selection, and navigation.

```tsx
<PaginationControls
  current={1}
  total={100}
  pageSize={10}
  onChange={(page, size) => console.log(page, size)}
/>
```

**Atoms Used:** Pagination, Select, Typography

#### PasswordInput

A password input with strength indicator and visibility toggle.

```tsx
<PasswordInput
  value={password}
  onChange={setPassword}
  showStrengthIndicator={true}
  showRequirements={true}
/>
```

**Atoms Used:** Input, Progress, Typography, Icon, Tooltip

#### SizeSelector

A size selector with size charts, availability, and fit recommendations.

```tsx
<SizeSelector
  sizes={sizeOptions}
  selectedSize='M'
  onChange={(size) => console.log(size)}
  showSizeChart={true}
/>
```

**Atoms Used:** Radio, Button, Modal, Table, Typography, Tooltip

#### FileUpload

A file upload component with drag-and-drop, preview, and progress tracking.

```tsx
<FileUpload
  value={files}
  onChange={setFiles}
  maxFiles={5}
  dragAndDrop={true}
  showPreview={true}
/>
```

**Atoms Used:** Upload, Button, Progress, Typography, Image, Icon

#### MultiSelect

A multi-select component with search, tags, and bulk selection capabilities.

```tsx
<MultiSelect
  options={options}
  value={selectedValues}
  onChange={setSelectedValues}
  searchable={true}
  showSelectAll={true}
/>
```

**Atoms Used:** Select, Tag, Button, Input, Typography

#### NotificationCard

A notification card for alerts, messages, and system notifications.

```tsx
<NotificationCard
  type='success'
  title='Order Completed'
  message='Your order has been successfully processed.'
  timestamp={new Date()}
  actions={[{ label: 'View Order', onClick: () => {} }]}
/>
```

**Atoms Used:** Card, Typography, Icon, Button

## Usage Guidelines

### Composition Rules

1. **Atom Dependencies**: Always import required atoms from the atoms directory
2. **Props Interface**: Define clear TypeScript interfaces for all props
3. **Default Values**: Provide sensible defaults for optional props
4. **Event Handling**: Use consistent event handler naming and signatures

### Styling Guidelines

1. **CSS Modules**: Use CSS files for component-specific styles
2. **BEM Methodology**: Follow BEM naming convention for CSS classes
3. **Responsive Design**: Include responsive behavior for mobile devices
4. **Theme Integration**: Use Ant Design tokens and CSS variables

### Testing Requirements

1. **Unit Tests**: Test component behavior, props, and user interactions
2. **Accessibility**: Include accessibility tests with axe-core
3. **Visual Regression**: Use Storybook for visual testing
4. **Integration**: Test molecule usage within larger components

### Storybook Documentation

Each molecule should include:

1. **Default Story**: Basic usage example
2. **Variants**: Different configurations and states
3. **Interactive Controls**: Knobs for testing different props
4. **Documentation**: Clear description and usage guidelines

## File Structure

```
molecules/
├── ComponentName/
│   ├── ComponentName.tsx      # Main component
│   ├── ComponentName.css      # Styles
│   ├── ComponentName.stories.tsx  # Storybook stories
│   ├── ComponentName.test.tsx     # Unit tests
│   └── index.ts              # Exports
└── index.ts                  # Main exports
```

## Best Practices

### Performance

- Use React.memo for expensive components
- Implement proper dependency arrays for useEffect and useCallback
- Avoid unnecessary re-renders with proper prop design

### Accessibility

- Include proper ARIA labels and roles
- Support keyboard navigation
- Provide screen reader friendly content
- Test with accessibility tools

### Maintainability

- Keep components focused and single-purpose
- Use TypeScript for type safety
- Document complex logic with comments
- Follow consistent coding patterns

### Reusability

- Design for multiple use cases
- Avoid hardcoded values
- Provide flexible styling options
- Support different data formats
