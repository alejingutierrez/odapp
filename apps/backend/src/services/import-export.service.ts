import { PrismaClient } from '@prisma/client'
// import { parse as csvParse } from 'csv-parse'
// import { stringify as csvStringify } from 'csv-stringify'

// Temporary placeholder functions until CSV modules are properly installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csvParse = (_options: any) => {
  throw new Error('CSV parsing not implemented - csv-parse module not available')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csvStringify = (_data: any, _options: any, callback: (_err: Error | null, _output: string) => void) => {
  callback(new Error('CSV stringify not implemented - csv-stringify module not available'), '')
}
// import { Readable } from 'stream' // TODO: Implement if needed
import { logger } from '../lib/logger.js'
import { ServiceUnavailableError, BusinessLogicError } from '../lib/errors.js'
import { ProductService } from './product.service.js'
import { CreateProduct } from '@oda/shared'

export interface ImportResult {
  success: boolean
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: {
    row: number
    error: string
    data?: Record<string, unknown>
  }[]
  createdProducts: string[]
  updatedProducts: string[]
}

export interface ExportResult {
  success: boolean
  filename: string
  recordCount: number
  fileSize: number
  downloadUrl: string
}

export interface ImportOptions {
  updateExisting?: boolean
  skipInvalid?: boolean
  batchSize?: number
  validateOnly?: boolean
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  fields?: string[]
  includeVariants?: boolean
  includeImages?: boolean
  includeInventory?: boolean
}

export class ImportExportService {
  constructor(
    private _prisma: PrismaClient,
    private _productService: ProductService
  ) {}

  // ============================================================================
  // PRODUCT IMPORT
  // ============================================================================

  async importProductsFromCSV(
    csvContent: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    logger.info('Starting CSV product import', { options })

    const result: ImportResult = {
      success: false,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      createdProducts: [],
      updatedProducts: [],
    }

    try {
      // Parse CSV
      const records = await this.parseCSV(csvContent)
      result.totalRows = records.length

      logger.info('CSV parsed successfully', { totalRows: result.totalRows })

      // Process records in batches
      const batchSize = options.batchSize || 50
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        await this.processBatch(batch, i, options, result)
      }

      result.success =
        result.failedRows === 0 ||
        (result.successfulRows > 0 && (options.skipInvalid || false))

      logger.info('CSV import completed', {
        totalRows: result.totalRows,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
        success: result.success,
      })

      return result
    } catch (error: unknown) {
      logger.error('CSV import failed', { error })
      result.errors.push({
        row: 0,
        error: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      })
      return result
    }
  }

  async importProductsFromJSON(
    jsonContent: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    logger.info('Starting JSON product import', { options })

    const result: ImportResult = {
      success: false,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      createdProducts: [],
      updatedProducts: [],
    }

    try {
      const data = JSON.parse(jsonContent)
      const products = Array.isArray(data) ? data : data.products || []

      result.totalRows = products.length

      logger.info('JSON parsed successfully', { totalRows: result.totalRows })

      // Process products in batches
      const batchSize = options.batchSize || 50
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        await this.processJSONBatch(batch, i, options, result)
      }

      result.success =
        result.failedRows === 0 ||
        (result.successfulRows > 0 && (options.skipInvalid || false))

      logger.info('JSON import completed', {
        totalRows: result.totalRows,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
        success: result.success,
      })

      return result
    } catch (error: unknown) {
      logger.error('JSON import failed', { error })
      result.errors.push({
        row: 0,
        error: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      })
      return result
    }
  }

  // ============================================================================
  // PRODUCT EXPORT
  // ============================================================================

  async exportProducts(
    filters: Record<string, unknown> = {},
    options: ExportOptions
  ): Promise<ExportResult> {
    logger.info('Starting product export', { filters, options })

    try {
      // Get products based on filters
      const products = await this.getProductsForExport(filters, options)

      logger.info('Products retrieved for export', { count: products.length })

      let content: string
      let filename: string

      switch (options.format) {
        case 'csv':
          content = await this.generateCSV(products, options)
          filename = `products_export_${Date.now()}.csv`
          break
        case 'json':
          content = JSON.stringify(products, null, 2)
          filename = `products_export_${Date.now()}.json`
          break
        case 'xlsx':
          // TODO: Implement XLSX export
          throw new ServiceUnavailableError('XLSX export not yet implemented')
        default:
          throw new BusinessLogicError('Unsupported export format')
      }

      // Save file (in a real implementation, you'd save to cloud storage)
      const fileSize = Buffer.byteLength(content, 'utf8')
      const downloadUrl = `/api/exports/${filename}` // Mock URL

      const result: ExportResult = {
        success: true,
        filename,
        recordCount: products.length,
        fileSize,
        downloadUrl,
      }

      logger.info('Product export completed', result)

      return result
    } catch (error) {
      logger.error('Product export failed', { error, filters, options })
      throw error
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async parseCSV(
    csvContent: string
  ): Promise<Record<string, unknown>[]> {
    return new Promise((_resolve, _reject) => {
      const records: Record<string, unknown>[] = []
      const _parser = csvParse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
      void _parser

      // Note: This is a placeholder implementation since csv-parse is not available
      // In a real implementation, this would parse the CSV content
      const lines = csvContent.split('\n')
      const headers = lines[0]?.split(',') || []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          const values = line.split(',')
          const record: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            record[header.trim()] = values[index]?.trim() || ''
          })
          records.push(record)
        }
      }
      
      _resolve(records)
    })
  }

  private async processBatch(
    batch: Record<string, unknown>[],
    startIndex: number,
    options: ImportOptions,
    result: ImportResult
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const rowIndex = startIndex + i + 1 // +1 for header row
      const record = batch[i]

      try {
        const productData = this.mapCSVRecordToProduct(record)

        if (options.validateOnly) {
          // Just validate, don't create
          await this.validateProductData(productData)
          result.successfulRows++
        } else {
          // Check if product exists (by SKU or name)
          const existingProduct = await this.findExistingProduct(productData)

          if (existingProduct && options.updateExisting) {
            // Update existing product
            await this._productService.updateProduct(
              existingProduct.id,
              productData
            )
            result.updatedProducts.push(existingProduct.id)
            result.successfulRows++
          } else if (!existingProduct) {
            // Create new product
            const newProduct =
              await this._productService.createProduct(productData)
            result.createdProducts.push(newProduct.id)
            result.successfulRows++
          } else {
            // Product exists but update not allowed
            if (!options.skipInvalid) {
              throw new Error('Product already exists and update not allowed')
            }
            result.failedRows++
            result.errors.push({
              row: rowIndex,
              error: 'Product already exists',
              data: record,
            })
          }
        }
      } catch (error: unknown) {
        result.failedRows++
        result.errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : String(error),
          data: record,
        })

        if (!options.skipInvalid) {
          throw error
        }
      }
    }
  }

  private async processJSONBatch(
    batch: Record<string, unknown>[],
    startIndex: number,
    options: ImportOptions,
    result: ImportResult
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const rowIndex = startIndex + i + 1
      const productData = batch[i]

      try {
        if (options.validateOnly) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await this.validateProductData(productData as any)
          result.successfulRows++
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingProduct = await this.findExistingProduct(productData as any)

          if (existingProduct && options.updateExisting) {
            await this._productService.updateProduct(
              existingProduct.id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              productData as any
            )
            result.updatedProducts.push(existingProduct.id)
            result.successfulRows++
          } else if (!existingProduct) {
            const newProduct =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await this._productService.createProduct(productData as any)
            result.createdProducts.push(newProduct.id)
            result.successfulRows++
          } else {
            if (!options.skipInvalid) {
              throw new Error('Product already exists and update not allowed')
            }
            result.failedRows++
            result.errors.push({
              row: rowIndex,
              error: 'Product already exists',
              data: productData,
            })
          }
        }
      } catch (error: unknown) {
        result.failedRows++
        result.errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : String(error),
          data: productData,
        })

        if (!options.skipInvalid) {
          throw error
        }
      }
    }
  }

  private mapCSVRecordToProduct(
    record: Record<string, unknown>
  ): CreateProduct {
    // Map CSV columns to product structure
    const variants = []

    // Handle single variant from main row
    if (record.sku || record.size || record.color) {
      variants.push({
        sku:
          (record.sku as string) ||
          `${(record.name as string)?.replace(/\s+/g, '-').toLowerCase()}-001`,
        size: (record.size as string) || 'One Size',
        color: (record.color as string) || 'Default',
        price: parseFloat(record.price as string) || 0,
        compareAtPrice: record.compare_at_price
          ? parseFloat(record.compare_at_price as string)
          : undefined,
        cost: record.cost ? parseFloat(record.cost as string) : undefined,
        weight: record.weight ? parseFloat(record.weight as string) : undefined,
        barcode: record.barcode as string | undefined,
        inventoryQuantity: parseInt(record.inventory_quantity as string) || 0,
        inventoryPolicy: 'deny' as 'deny' | 'continue',
        requiresShipping: record.requires_shipping !== 'false',
        taxable: record.taxable !== 'false',
      })
    }

    // Handle multiple variants (if CSV has variant columns)
    for (let i = 1; i <= 10; i++) {
      const variantSku = record[`variant_${i}_sku`]
      if (variantSku) {
        variants.push({
          sku: variantSku as string,
          size: (record[`variant_${i}_size`] || 'One Size') as string,
          color: (record[`variant_${i}_color`] || 'Default') as string,
          price: parseFloat(record[`variant_${i}_price`] as string) || 0,
          compareAtPrice: record[`variant_${i}_compare_at_price`]
            ? parseFloat(record[`variant_${i}_compare_at_price`] as string)
            : undefined,
          cost: record[`variant_${i}_cost`]
            ? parseFloat(record[`variant_${i}_cost`] as string)
            : undefined,
          weight: record[`variant_${i}_weight`]
            ? parseFloat(record[`variant_${i}_weight`] as string)
            : undefined,
          barcode: record[`variant_${i}_barcode`] as string,
          inventoryQuantity:
            parseInt(record[`variant_${i}_inventory_quantity`] as string) || 0,
          inventoryPolicy: 'deny' as 'deny' | 'continue',
          requiresShipping:
            record[`variant_${i}_requires_shipping`] !== 'false',
          taxable: record[`variant_${i}_taxable`] !== 'false',
        })
      }
    }

    // Handle images
    const images = []
    if (record.image_url) {
      images.push({
        url: record.image_url as string,
        altText: record.image_alt_text as string | undefined,
        position: 0,
      })
    }

    // Handle additional images
    for (let i = 1; i <= 10; i++) {
      const imageUrl = record[`image_${i}_url`]
      if (imageUrl) {
        images.push({
          url: imageUrl as string,
          altText: record[`image_${i}_alt_text`] as string | undefined,
          position: i,
        })
      }
    }

    return {
      name: (record.name || record.title) as string,
      slug: (record.slug || record.handle) as string,
      description: record.description as string | undefined,
      shortDescription: record.short_description as string | undefined,
      status: (record.status || 'draft') as 'draft' | 'active' | 'archived',
      vendor: (record.vendor || record.brand) as string | undefined,
      productType: (record.product_type || record.type) as string | undefined,
      tags: record.tags
        ? (record.tags as string).split(',').map((tag: string) => tag.trim())
        : [],
      variants,
      images,
      seo: {
        title: record.seo_title as string | undefined,
        description: record.seo_description as string | undefined,
        keywords: record.seo_keywords
          ? (record.seo_keywords as string).split(',').map((kw: string) => kw.trim())
          : [],
      },
      collectionIds: [],
      metafields: record.metafields ? JSON.parse(record.metafields as string) : undefined,
    }
  }

  private async validateProductData(productData: CreateProduct): Promise<void> {
    // Basic validation
    if (!productData.name?.trim()) {
      throw new Error('Product name is required')
    }

    if (!productData.variants?.length) {
      throw new Error('At least one variant is required')
    }

    // Validate variants
    for (const variant of productData.variants) {
      if (!variant.sku?.trim()) {
        throw new Error('Variant SKU is required')
      }
      if (variant.price < 0) {
        throw new Error('Variant price must be non-negative')
      }
    }

    // Check for duplicate SKUs within variants
    const skus = productData.variants.map((v) => v.sku)
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicates.length > 0) {
      throw new Error(`Duplicate SKUs found: ${duplicates.join(', ')}`)
    }
  }

  private async findExistingProduct(
    productData: CreateProduct
  ): Promise<{ id: string } | null> {
    // Try to find by SKU first
    if (productData.variants?.[0]?.sku) {
      const existingVariant = await this._prisma.productVariant.findFirst({
        where: {
          sku: productData.variants[0].sku,
          isActive: true,
        },
        select: { productId: true },
      })

      if (existingVariant) {
        return { id: existingVariant.productId }
      }
    }

    // Try to find by name
    if (productData.name) {
      const existingProduct = await this._prisma.product.findFirst({
        where: {
          name: productData.name,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (existingProduct) {
        return existingProduct
      }
    }

    return null
  }

  private async getProductsForExport(
    filters: Record<string, unknown>,
    options: ExportOptions
  ): Promise<Record<string, unknown>[]> {
    const products = await this._prisma.product.findMany({
      where: {
        deletedAt: null,
        ...filters,
      },
      include: {
        variants: options.includeVariants
          ? {
              where: { isActive: true },
              include: {
                inventory: options.includeInventory,
              },
            }
          : false,
        images: options.includeImages
          ? {
              orderBy: { sortOrder: 'asc' },
            }
          : false,
        category: true,
        collections: {
          include: { collection: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return products.map((product: any) =>
      this.formatProductForExport(product, options)
    )
  }

  private formatProductForExport(
    product: Record<string, unknown>,
    options: ExportOptions
  ): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      status: product.status,
      brand: product.brand,
      productType: product.material,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: (product.category as any)?.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collections: (product.collections as any[])
        ?.map(
          (c: Record<string, unknown>) =>
            (c as { collection: { name: string } }).collection.name
        )
        .join(', '),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    if (options.includeVariants && product.variants) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatted.variants = (product.variants as any[]).map(
        (variant: Record<string, unknown>) => ({
          id: variant.id,
          sku: variant.sku,
          size: variant.option1Value,
          color: variant.option2Value,
          price: Number(variant.price),
          compareAtPrice: variant.compareAtPrice
            ? Number(variant.compareAtPrice)
            : null,
          weight: variant.weight ? Number(variant.weight) : null,
          barcode: variant.barcode,
          inventory: options.includeInventory ? variant.inventory : undefined,
        })
      )
    }

    if (options.includeImages && product.images) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatted.images = (product.images as any[]).map(
        (image: Record<string, unknown>) => ({
          url: image.url,
          altText: image.altText,
          position: image.sortOrder,
        })
      )
    }

    // Filter fields if specified
    if (options.fields?.length) {
      const filtered: Record<string, unknown> = {}
      options.fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(formatted, field)) {
          filtered[field] = formatted[field]
        }
      })
      return filtered
    }

    return formatted
  }

  private async generateCSV(
    products: Record<string, unknown>[],
    options: ExportOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const columns = this.getCSVColumns(options)
      const records = products.map((product) =>
        this.flattenProductForCSV(product, options)
      )

      csvStringify(
        records,
        {
          header: true,
          columns,
        },
        (err: Error | null, output: string) => {
          if (err) {
            reject(err)
          } else {
            resolve(output)
          }
        }
      )
    })
  }

  private getCSVColumns(options: ExportOptions): string[] {
    const baseColumns = [
      'id',
      'name',
      'slug',
      'description',
      'shortDescription',
      'status',
      'brand',
      'productType',
      'price',
      'compareAtPrice',
      'category',
      'collections',
      'createdAt',
      'updatedAt',
    ]

    if (options.includeVariants) {
      baseColumns.push(
        'variant_count',
        'primary_sku',
        'primary_size',
        'primary_color'
      )
    }

    if (options.includeImages) {
      baseColumns.push('image_count', 'primary_image_url')
    }

    if (options.includeInventory) {
      baseColumns.push('total_inventory', 'available_inventory')
    }

    return options.fields?.length ? options.fields : baseColumns
  }

  private flattenProductForCSV(
    product: Record<string, unknown>,
    options: ExportOptions
  ): Record<string, unknown> {
    const flattened: Record<string, unknown> = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      status: product.status,
      brand: product.brand,
      productType: product.productType,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category,
      collections: product.collections,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    if (options.includeVariants && product.variants) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattened.variant_count = (product.variants as any[]).length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((product.variants as any[])[0]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flattened.primary_sku = (product.variants as any[])[0].sku
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flattened.primary_size = (product.variants as any[])[0].size
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flattened.primary_color = (product.variants as any[])[0].color
      }
    }

    if (options.includeImages && product.images) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattened.image_count = (product.images as any[]).length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((product.images as any[])[0]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flattened.primary_image_url = (product.images as any[])[0].url
      }
    }

    if (options.includeInventory && product.variants) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattened.total_inventory = (product.variants as any[]).reduce(
        (sum: number, variant: Record<string, unknown>) =>
          sum +
          ((variant.inventory as Record<string, unknown>[])?.reduce(
            (invSum: number, inv: Record<string, unknown>) =>
              invSum + (inv.quantity as number),
            0
          ) || 0),
        0
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattened.available_inventory = (product.variants as any[]).reduce(
        (sum: number, variant: Record<string, unknown>) =>
          sum +
          ((variant.inventory as Record<string, unknown>[])?.reduce(
            (invSum: number, inv: Record<string, unknown>) =>
              invSum + (inv.availableQuantity as number),
            0
          ) || 0),
        0
      )
    }

    return flattened
  }
}
