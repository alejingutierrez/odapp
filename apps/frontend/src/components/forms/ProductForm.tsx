import {
  PlusOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  SaveOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  Form,
  Select,
  InputNumber,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Upload,
  Tag,
  Space,
  Divider,
  Alert,
  Spin,
} from 'antd'
import React, { useEffect, useState } from 'react'
import { Controller, useFieldArray } from 'react-hook-form'
import * as yup from 'yup'

import { Input, TextArea } from '../../components/atoms/Input'
import {
  useFormValidation,
  useDynamicFormArray,
  useFormPersistence,
} from '../../hooks/useFormValidation'
import { validationSchemas } from '../../utils/validation'

import devLogger from '../../utils/devLogger'

const { Option } = Select

// Product form validation schema
const productFormSchema = yup.object({
  name: validationSchemas.product.name,
  slug: validationSchemas.common.slug,
  description: validationSchemas.product.description,
  shortDescription: validationSchemas.product.shortDescription,
  status: validationSchemas.product.status,
  vendor: validationSchemas.product.vendor,
  productType: validationSchemas.product.productType,
  tags: validationSchemas.product.tags,
  variants: yup
    .array()
    .of(validationSchemas.product.variant)
    .min(1, 'At least one variant is required')
    .required('Variants are required'),
  seo: validationSchemas.product.seo.optional(),
})

type ProductFormData = yup.InferType<typeof productFormSchema>

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}) => {
  const [previewMode, setPreviewMode] = useState(false)

  // Form validation hook
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
    // validateField,
    validateForm,
    isFormValid,
    hasErrors,
    setFieldError,
  } = useFormValidation({
    schema: productFormSchema,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      status: 'draft',
      vendor: '',
      productType: '',
      tags: [],
      variants: [
        {
          sku: '',
          size: '',
          color: '',
          price: 0,
          compareAtPrice: undefined,
          cost: undefined,
          weight: undefined,
          inventoryQuantity: 0,
          requiresShipping: true,
          taxable: true,
        },
      ],
      seo: {
        title: '',
        description: '',
        keywords: [],
      },
      ...initialData,
    },
    realTimeValidation: true,
    debounceMs: 300,
    onValidationError: (errors) => {
      devLogger.warn('Form validation errors:', errors)
    },
    onValidationSuccess: () => {
      // console.log('Form validation successful')
    },
  })

  // Dynamic form array for variants
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  })

  const variantArrayHelper = useDynamicFormArray({
    name: 'variants',
    schema: validationSchemas.product.variant,
    maxItems: 50,
    minItems: 1,
  })

  // Form persistence
  const formPersistence = useFormPersistence({
    key: `product-form-${mode}`,
    exclude: ['variants'], // Don't persist variants due to complexity
  })

  // Watch form values for real-time updates
  const watchedName = watch('name')

  // Auto-generate slug from name
  useEffect(() => {
    if (watchedName && mode === 'create') {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [watchedName, setValue, mode])

  // Save form data periodically
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        formPersistence.saveFormData(getValues())
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isDirty, getValues, formPersistence])

  // Load saved form data on mount
  useEffect(() => {
    if (mode === 'create') {
      const savedData = formPersistence.loadFormData()
      if (savedData) {
        Object.entries(savedData).forEach(([key, value]) => {
          setValue(key as keyof ProductFormData, value)
        })
      }
    }
  }, [mode, setValue, formPersistence])

  // Handle form submission
  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      // Final validation
      const isValid = await validateForm()
      if (!isValid) {
        return
      }

      // Custom business validation
      const skus = data.variants.map((v) => v.sku)
      const duplicateSkus = skus.filter(
        (sku, index) => skus.indexOf(sku) !== index
      )
      if (duplicateSkus.length > 0) {
        setFieldError(
          'variants',
          `Duplicate SKUs found: ${duplicateSkus.join(', ')}`
        )
        return
      }

      await onSubmit(data)

      // Clear saved form data on successful submission
      if (mode === 'create') {
        formPersistence.clearFormData()
      }
    } catch (error) {
      devLogger.error('Form submission error:', error)
    }
  }

  // Handle variant operations
  const handleAddVariant = () => {
    if (variantArrayHelper.canAddItem(variantFields.length)) {
      const defaultVariant = {
        sku: '',
        size: '',
        color: '',
        price: 0,
        compareAtPrice: undefined,
        cost: undefined,
        weight: undefined,
        inventoryQuantity: 0,
        requiresShipping: true,
        taxable: true,
      }
      appendVariant(defaultVariant)
    }
  }

  const handleRemoveVariant = (index: number) => {
    if (variantArrayHelper.canRemoveItem(variantFields.length)) {
      removeVariant(index)
    }
  }

  // Handle image upload
  const handleImageUpload = (info: {
    file?: { status?: string; response?: unknown }
  }) => {
    if (info.file?.status === 'done') {
      // Handle file upload response
      // console.log('File uploaded:', info.file.response)
    }
  }

  // Render form field with error handling
  const renderFormField = (
    name: string,
    label: string,
    children: React.ReactNode,
    required = false
  ) => (
    <Form.Item
      label={label}
      required={required}
      validateStatus={errors[name as keyof typeof errors] ? 'error' : ''}
      help={errors[name as keyof typeof errors]?.message}
    >
      {children}
    </Form.Item>
  )

  if (previewMode) {
    return (
      <Card
        title='Product Preview'
        extra={
          <Button onClick={() => setPreviewMode(false)} icon={<EyeOutlined />}>
            Edit Mode
          </Button>
        }
      >
        <ProductPreview data={getValues()} />
      </Card>
    )
  }

  return (
    <Spin spinning={loading}>
      <Form layout='vertical' onFinish={handleSubmit(handleFormSubmit)}>
        {hasErrors && (
          <Alert
            message='Please fix the validation errors below'
            type='error'
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Card title='Basic Information' style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              {renderFormField(
                'name',
                'Product Name',
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Enter product name'
                    />
                  )}
                />,
                true
              )}
            </Col>
            <Col span={12}>
              {renderFormField(
                'slug',
                'URL Slug',
                <Controller
                  name='slug'
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='product-url-slug'
                      addonBefore='/'
                    />
                  )}
                />,
                true
              )}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              {renderFormField(
                'status',
                'Status',
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Select status'
                    >
                      <Option value='draft'>Draft</Option>
                      <Option value='active'>Active</Option>
                      <Option value='archived'>Archived</Option>
                    </Select>
                  )}
                />
              )}
            </Col>
            <Col span={8}>
              {renderFormField(
                'vendor',
                'Vendor',
                <Controller
                  name='vendor'
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Enter vendor name'
                    />
                  )}
                />
              )}
            </Col>
            <Col span={8}>
              {renderFormField(
                'productType',
                'Product Type',
                <Controller
                  name='productType'
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='e.g., Clothing, Electronics'
                    />
                  )}
                />
              )}
            </Col>
          </Row>

          {renderFormField(
            'description',
            'Description',
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <TextArea
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  rows={4}
                  placeholder='Enter product description'
                />
              )}
            />
          )}

          {renderFormField(
            'shortDescription',
            'Short Description',
            <Controller
              name='shortDescription'
              control={control}
              render={({ field }) => (
                <TextArea
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  rows={2}
                  placeholder='Brief product summary'
                  maxLength={500}
                  showCount
                />
              )}
            />
          )}

          {renderFormField(
            'tags',
            'Tags',
            <Controller
              name='tags'
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  mode='tags'
                  placeholder='Add tags'
                  tokenSeparators={[',']}
                  maxTagCount={20}
                />
              )}
            />
          )}
        </Card>

        <Card title='Product Variants' style={{ marginBottom: 24 }}>
          {variantFields.map((field, index) => (
            <Card
              key={field.id}
              type='inner'
              title={`Variant ${index + 1}`}
              extra={
                variantFields.length > 1 && (
                  <Button
                    type='text'
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveVariant(index)}
                  >
                    Remove
                  </Button>
                )
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.sku`,
                    'SKU',
                    <Controller
                      name={`variants.${index}.sku`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='PROD-001'
                        />
                      )}
                    />,
                    true
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.size`,
                    'Size',
                    <Controller
                      name={`variants.${index}.size`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='S, M, L, XL'
                        />
                      )}
                    />,
                    true
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.color`,
                    'Color',
                    <Controller
                      name={`variants.${index}.color`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='Red, Blue, Green'
                        />
                      )}
                    />,
                    true
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.colorHex`,
                    'Color Code',
                    <Controller
                      name={`variants.${index}.colorHex`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='#FF0000'
                          addonBefore={
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                backgroundColor: field.value || '#ccc',
                                border: '1px solid #d9d9d9',
                              }}
                            />
                          }
                        />
                      )}
                    />
                  )}
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.price`,
                    'Price',
                    <Controller
                      name={`variants.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          style={{ width: '100%' }}
                          placeholder='29.99'
                          min={0}
                          precision={2}
                          addonBefore='$'
                        />
                      )}
                    />,
                    true
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.compareAtPrice`,
                    'Compare Price',
                    <Controller
                      name={`variants.${index}.compareAtPrice`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          style={{ width: '100%' }}
                          placeholder='39.99'
                          min={0}
                          precision={2}
                          addonBefore='$'
                        />
                      )}
                    />
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.inventoryQuantity`,
                    'Inventory',
                    <Controller
                      name={`variants.${index}.inventoryQuantity`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          style={{ width: '100%' }}
                          placeholder='10'
                          min={0}
                        />
                      )}
                    />,
                    true
                  )}
                </Col>
                <Col span={6}>
                  {renderFormField(
                    `variants.${index}.weight`,
                    'Weight (kg)',
                    <Controller
                      name={`variants.${index}.weight`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          style={{ width: '100%' }}
                          placeholder='0.5'
                          min={0}
                          precision={2}
                        />
                      )}
                    />
                  )}
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label='Requires Shipping'>
                    <Controller
                      name={`variants.${index}.requiresShipping`}
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Taxable'>
                    <Controller
                      name={`variants.${index}.taxable`}
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}

          <Button
            type='dashed'
            onClick={handleAddVariant}
            disabled={!variantArrayHelper.canAddItem(variantFields.length)}
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
          >
            Add Variant
          </Button>
        </Card>

        <Card title='SEO Settings' style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              {renderFormField(
                'seo.title',
                'SEO Title',
                <Controller
                  name='seo.title'
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='SEO optimized title'
                      maxLength={60}
                      showCount
                    />
                  )}
                />
              )}
            </Col>
            <Col span={12}>
              {renderFormField(
                'seo.description',
                'SEO Description',
                <Controller
                  name='seo.description'
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='SEO meta description'
                      maxLength={160}
                      showCount
                      rows={3}
                    />
                  )}
                />
              )}
            </Col>
          </Row>

          {renderFormField(
            'seo.keywords',
            'SEO Keywords',
            <Controller
              name='seo.keywords'
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  mode='tags'
                  placeholder='Add SEO keywords'
                  maxTagCount={10}
                />
              )}
            />
          )}
        </Card>

        <Card title='Images' style={{ marginBottom: 24 }}>
          <Upload
            name='images'
            listType='picture-card'
            multiple
            maxCount={10}
            accept='image/*'
            onChange={handleImageUpload}
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Card>

        <Card>
          <Space>
            <Button
              type='primary'
              htmlType='submit'
              loading={isSubmitting}
              disabled={!isFormValid}
              icon={<SaveOutlined />}
            >
              {mode === 'create' ? 'Create Product' : 'Update Product'}
            </Button>

            <Button onClick={() => setPreviewMode(true)} icon={<EyeOutlined />}>
              Preview
            </Button>

            {onCancel && <Button onClick={onCancel}>Cancel</Button>}

            {isDirty && <Tag color='orange'>Unsaved changes</Tag>}
          </Space>
        </Card>
      </Form>
    </Spin>
  )
}

// Product preview component
const ProductPreview: React.FC<{ data: ProductFormData }> = ({ data }) => {
  return (
    <div>
      <h2>{data.name}</h2>
      <p>
        <strong>Status:</strong> {data.status}
      </p>
      <p>
        <strong>Slug:</strong> /{data.slug}
      </p>
      {data.description && <p>{data.description}</p>}

      <Divider />

      <h3>Variants ({data.variants.length})</h3>
      {data.variants.map((variant, index) => (
        <Card key={index} size='small' style={{ marginBottom: 8 }}>
          <p>
            <strong>SKU:</strong> {variant.sku}
          </p>
          <p>
            <strong>Size:</strong> {variant.size} | <strong>Color:</strong>{' '}
            {variant.color}
          </p>
          <p>
            <strong>Price:</strong> ${variant.price}
          </p>
          <p>
            <strong>Inventory:</strong> {variant.inventoryQuantity}
          </p>
        </Card>
      ))}
    </div>
  )
}

export default ProductForm
