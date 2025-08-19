import { PrismaClient } from '@prisma/client'
import { parse as csvParse } from 'csv-parse'
import { stringify as csvStringify } from 'csv-stringify'
import { Readable } from 'stream'
import { logger } from '../lib/logger.js'
import { AppError } from '../lib/errors.js'
import { ProductService } from './product.service.js'
import { CreateProduct, ProductImport, ProductExport } from '@oda/shared'

export interface ImportResult {
  success: boolean
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: {
    row: number
    error: string
    data?: any
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
    private prisma: PrismaClient,
    private productService: ProductService
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
      updatedProducts: []
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

      result.success = result.failedRows === 0 || (result.successfulRows > 0 && options.skipInvalid)

      logger.info('CSV import completed', {
        totalRows: result.totalRows,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
        success: result.success
      })

      return result
    } catch (error) {
      logger.error('CSV import failed', { error })
      result.errors.push({
        row: 0,
        error: `Import failed: ${error.message}`
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
      updatedProducts: []
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

      result.success = result.failedRows === 0 || (result.successfulRows > 0 && options.skipInvalid)

      logger.info('JSON import completed', {
        totalRows: result.totalRows,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
        success: result.success
      })

      return result
    } catch (error) {
      logger.error('JSON import failed', { error })
      result.errors.push({
        row: 0,
        error: `Import failed: ${error.message}`
      })
      return result
    }
  }

  // ============================================================================
  // PRODUCT EXPORT
  // ============================================================================

  async exportProducts(
    filters: any = {},
    options: ExportOptions
  ): Promise<ExportResult> {
    logger.info('Starting product export', { filters, options })

    try {
      // Get products based on filters
      const products = await this.getProductsForExport(filters, options)
      
      logger.info('Products retrieved for export', { count: products.length })

      let content: string
      let filename: string
      let mimeType: string

      switch (options.format) {
        case 'csv':
          content = await this.generateCSV(products, options)
          filename = `products_export_${Date.now()}.csv`
          mimeType = 'text/csv'
          break
        case 'json':
          content = JSON.stringify(products, null, 2)
          filename = `products_export_${Date.now()}.json`
          mimeType = 'application/json'
          break
        case 'xlsx':
          // TODO: Implement XLSX export
          throw new AppError('XLSX export not yet implemented', 501)
        default:
          throw new AppError('Unsupported export format', 400)
      }

      // Save file (in a real implementation, you'd save to cloud storage)
      const fileSize = Buffer.byteLength(content, 'utf8')
      const downloadUrl = `/api/exports/${filename}` // Mock URL

      const result: ExportResult = {
        success: true,
        filename,
        recordCount: products.length,
        fileSize,
        downloadUrl
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

  private async parseCSV(csvContent: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = []
      const parser = csvParse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      parser.on('readable', function() {
        let record
        while (record = parser.read()) {
          records.push(record)
        }
      })

      parser.on('error', reject)
      parser.on('end', () => resolve(records))

      parser.write(csvContent)
      parser.end()
    })
  }

  private async processBatch(
    batch: any[],
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
            await this.productService.updateProduct(existingProduct.id, productData)
            result.updatedProducts.push(existingProduct.id)
            result.successfulRows++
          } else if (!existingProduct) {
            // Create new product
            const newProduct = await this.productService.createProduct(productData)
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
              data: record
            })
          }
        }
      } catch (error) {
        result.failedRows++
        result.errors.push({
          row: rowIndex,
          error: error.message,
          data: record
        })

        if (!options.skipInvalid) {
          throw error
        }
      }
    }
  }

  private async processJSONBatch(
    batch: any[],
    startIndex: number,
    options: ImportOptions,
    result: ImportResult
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const rowIndex = startIndex + i + 1
      const productData = batch[i]

      try {
        if (options.validateOnly) {
          await this.validateProductData(productData)
          result.successfulRows++
        } else {
          const existingProduct = await this.findExistingProduct(productData)

          if (existingProduct && options.updateExisting) {
            await this.productService.updateProduct(existingProduct.id, productData)
            result.updatedProducts.push(existingProduct.id)
            result.successfulRows++
          } else if (!existingProduct) {
            const newProduct = await this.productService.createProduct(productData)
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
              data: productData
            })
          }
        }
      } catch (error) {
        result.failedRows++
        result.errors.push({
          row: rowIndex,
          error: error.message,
          data: productData
        })

        if (!options.skipInvalid) {
          throw error
        }
      }
    }
  }

  private mapCSVRecordToProduct(record: any): CreateProduct {
    // Map CSV columns to product structure
    const variants = []

    // Handle single variant from main row
    if (record.sku || record.size || record.color) {
      variants.push({
        sku: record.sku || `${record.name?.replace(/\s+/g, '-').toLowerCase()}-001`,
        size: record.size || 'One Size',
        color: record.color || 'Default',
        price: parseFloat(record.price) || 0,
        compareAtPrice: record.compare_at_price ? parseFloat(record.compare_at_price) : undefined,
        cost: record.cost ? parseFloat(record.cost) : undefined,
        weight: record.weight ? parseFloat(record.weight) : undefined,
        barcode: record.barcode,
        inventoryQuantity: parseInt(record.inventory_quantity) || 0,
        requiresShipping: record.requires_shipping !== 'false',
        taxable: record.taxable !== 'false'
      })
    }

    // Handle multiple variants (if CSV has variant columns)
    for (let i = 1; i <= 10; i++) {
      const variantSku = record[`variant_${i}_sku`]
      if (variantSku) {
        variants.push({
          sku: variantSku,
          size: record[`variant_${i}_size`] || 'One Size',
          color: record[`variant_${i}_color`] || 'Default',
          price: parseFloat(record[`variant_${i}_price`]) || 0,
          compareAtPrice: record[`variant_${i}_compare_at_price`] ? parseFloat(record[`variant_${i}_compare_at_price`]) : undefined,
          cost: record[`variant_${i}_cost`] ? parseFloat(record[`variant_${i}_cost`]) : undefined,
          weight: record[`variant_${i}_weight`] ? parseFloat(record[`variant_${i}_weight`]) : undefined,
          barcode: record[`variant_${i}_barcode`],
          inventoryQuantity: parseInt(record[`variant_${i}_inventory_quantity`]) || 0,
          requiresShipping: record[`variant_${i}_requires_shipping`] !== 'false',
          taxable: record[`variant_${i}_taxable`] !== 'false'
        })
      }
    }

    // Handle images
    const images = []
    if (record.image_url) {
      images.push({
        url: record.image_url,
        altText: record.image_alt_text,
        position: 0
      })
    }

    // Handle additional images
    for (let i = 1; i <= 10; i++) {
      const imageUrl = record[`image_${i}_url`]
      if (imageUrl) {
        images.push({
          url: imageUrl,
          altText: record[`image_${i}_alt_text`],
          position: i
        })
      }
    }

    return {
      name: record.name || record.title,
      slug: record.slug || record.handle,
      description: record.description,
      shortDescription: record.short_description,
      status: record.status || 'draft',
      vendor: record.vendor || record.brand,
      productType: record.product_type || record.type,
      tags: record.tags ? record.tags.split(',').map((tag: string) => tag.trim()) : [],
      variants,
      images,
      seo: {
        title: record.seo_title,
        description: record.seo_description,
        keywords: record.seo_keywords ? record.seo_keywords.split(',').map((kw: string) => kw.trim()) : []
      },
      metafields: record.metafields ? JSON.parse(record.metafields) : undefined
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
    const skus = productData.variants.map(v => v.sku)
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicates.length > 0) {
      throw new Error(`Duplicate SKUs found: ${duplicates.join(', ')}`)
    }
  }

  private async findExistingProduct(productData: CreateProduct): Promise<{ id: string } | null> {
    // Try to find by SKU first
    if (productData.variants?.[0]?.sku) {
      const existingVariant = await this.prisma.productVariant.findFirst({
        where: {
          sku: productData.variants[0].sku,
          isActive: true
        },
        select: { productId: true }
      })

      if (existingVariant) {
        return { id: existingVariant.productId }
      }
    }

    // Try to find by name
    if (productData.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          name: productData.name,
          deletedAt: null
        },
        select: { id: true }
      })

      if (existingProduct) {
        return existingProduct
      }
    }

    return null
  }

  private async getProductsForExport(filters: any, options: ExportOptions): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      include: {
        variants: options.includeVariants ? {
          where: { isActive: true },
          include: {
            inventory: options.includeInventory
          }
        } : false,
        images: options.includeImages ? {
          orderBy: { sortOrder: 'asc' }
        } : false,
        category: true,
        collections: {
          include: { collection: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return products.map(product => this.formatProductForExport(product, options))
  }

  private formatProductForExport(product: any, options: ExportOptions): any {
    const formatted: any = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      status: product.status,
      brand: product.brand,
      productType: product.material,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      category: product.category?.name,
      collections: product.collections?.map((c: any) => c.collection.name).join(', '),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }

    if (options.includeVariants && product.variants) {
      formatted.variants = product.variants.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.option1Value,
        color: variant.option2Value,
        price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
        weight: variant.weight ? Number(variant.weight) : null,
        barcode: variant.barcode,
        inventory: options.includeInventory ? variant.inventory : undefined
      }))
    }

    if (options.includeImages && product.images) {
      formatted.images = product.images.map((image: any) => ({
        url: image.url,
        altText: image.altText,
        position: image.sortOrder
      }))
    }

    // Filter fields if specified
    if (options.fields?.length) {
      const filtered: any = {}
      options.fields.forEach(field => {
        if (formatted.hasOwnProperty(field)) {
          filtered[field] = formatted[field]
        }
      })
      return filtered
    }

    return formatted
  }

  private async generateCSV(products: any[], options: ExportOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const columns = this.getCSVColumns(options)
      const records = products.map(product => this.flattenProductForCSV(product, options))

      csvStringify(records, {
        header: true,
        columns
      }, (err, output) => {
        if (err) {
          reject(err)
        } else {
          resolve(output)
        }
      })
    })
  }

  private getCSVColumns(options: ExportOptions): string[] {
    const baseColumns = [
      'id', 'name', 'slug', 'description', 'shortDescription', 
      'status', 'brand', 'productType', 'price', 'compareAtPrice',
      'category', 'collections', 'createdAt', 'updatedAt'
    ]

    if (options.includeVariants) {
      baseColumns.push(
        'variant_count', 'primary_sku', 'primary_size', 'primary_color'
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

  private flattenProductForCSV(product: any, options: ExportOptions): any {
    const flattened: any = {
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
      updatedAt: product.updatedAt
    }

    if (options.includeVariants && product.variants) {
      flattened.variant_count = product.variants.length
      if (product.variants[0]) {
        flattened.primary_sku = product.variants[0].sku
        flattened.primary_size = product.variants[0].size
        flattened.primary_color = product.variants[0].color
      }
    }

    if (options.includeImages && product.images) {
      flattened.image_count = product.images.length
      if (product.images[0]) {
        flattened.primary_image_url = product.images[0].url
      }
    }

    if (options.includeInventory && product.variants) {
      flattened.total_inventory = product.variants.reduce((sum: number, variant: any) => 
        sum + (variant.inventory?.reduce((invSum: number, inv: any) => invSum + inv.quantity, 0) || 0), 0
      )
      flattened.available_inventory = product.variants.reduce((sum: number, variant: any) => 
        sum + (variant.inventory?.reduce((invSum: number, inv: any) => invSum + inv.availableQuantity, 0) || 0), 0
      )
    }

    return flattened
  }
}