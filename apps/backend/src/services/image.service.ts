import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../lib/logger.js'
import { AppError } from '../lib/errors.js'

export interface ImageProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  background?: string
}

export interface ImageVariant {
  name: string
  width: number
  height: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ProcessedImage {
  id: string
  originalUrl: string
  variants: {
    [key: string]: {
      url: string
      width: number
      height: number
      fileSize: number
      format: string
    }
  }
  metadata: {
    originalWidth: number
    originalHeight: number
    originalSize: number
    originalFormat: string
    mimeType: string
  }
}

export interface ImageUploadResult {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  fileSize: number
  mimeType: string
  variants: {
    [key: string]: string
  }
}

export class ImageService {
  private readonly uploadDir: string
  private readonly baseUrl: string
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]

  // Standard image variants for products
  private readonly standardVariants: ImageVariant[] = [
    { name: 'thumbnail', width: 150, height: 150, quality: 80, format: 'webp' },
    { name: 'small', width: 300, height: 300, quality: 85, format: 'webp' },
    { name: 'medium', width: 600, height: 600, quality: 90, format: 'webp' },
    { name: 'large', width: 1200, height: 1200, quality: 95, format: 'webp' },
    { name: 'original', width: 2000, height: 2000, quality: 100, format: 'jpeg' }
  ]

  constructor(
    uploadDir = './uploads/images',
    baseUrl = '/uploads/images'
  ) {
    this.uploadDir = uploadDir
    this.baseUrl = baseUrl
    this.ensureUploadDirectory()
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
      logger.info('Created upload directory', { path: this.uploadDir })
    }
  }

  async uploadAndProcessImage(
    file: Express.Multer.File,
    options: {
      variants?: ImageVariant[]
      generateThumbnail?: boolean
      optimizeOriginal?: boolean
    } = {}
  ): Promise<ImageUploadResult> {
    logger.info('Processing image upload', { 
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype 
    })

    try {
      // Validate file
      this.validateImageFile(file)

      // Generate unique ID and filename
      const imageId = uuidv4()
      const ext = path.extname(file.originalname).toLowerCase()
      const baseName = `${imageId}${ext}`
      const originalPath = path.join(this.uploadDir, baseName)

      // Get image metadata
      const metadata = await sharp(file.buffer).metadata()
      
      if (!metadata.width || !metadata.height) {
        throw new AppError('Invalid image file', 400)
      }

      // Save original file (optionally optimized)
      let originalBuffer = file.buffer
      if (options.optimizeOriginal) {
        originalBuffer = await this.optimizeImage(file.buffer, {
          quality: 95,
          format: metadata.format as any
        })
      }

      await fs.writeFile(originalPath, originalBuffer)

      // Generate variants
      const variants = options.variants || this.standardVariants
      const processedVariants: { [key: string]: string } = {}

      for (const variant of variants) {
        const variantPath = await this.generateImageVariant(
          originalBuffer,
          imageId,
          variant
        )
        processedVariants[variant.name] = `${this.baseUrl}/${path.basename(variantPath)}`
      }

      // Generate thumbnail if requested
      let thumbnailUrl = processedVariants.thumbnail
      if (options.generateThumbnail && !thumbnailUrl) {
        const thumbnailPath = await this.generateImageVariant(
          originalBuffer,
          imageId,
          { name: 'thumb', width: 150, height: 150, quality: 80, format: 'webp' }
        )
        thumbnailUrl = `${this.baseUrl}/${path.basename(thumbnailPath)}`
      }

      const result: ImageUploadResult = {
        id: imageId,
        url: `${this.baseUrl}/${baseName}`,
        thumbnailUrl: thumbnailUrl || `${this.baseUrl}/${baseName}`,
        width: metadata.width,
        height: metadata.height,
        fileSize: originalBuffer.length,
        mimeType: file.mimetype,
        variants: processedVariants
      }

      logger.info('Image processed successfully', {
        imageId,
        originalSize: file.size,
        processedSize: originalBuffer.length,
        variants: Object.keys(processedVariants)
      })

      return result
    } catch (error) {
      logger.error('Failed to process image', { error, filename: file.originalname })
      throw error
    }
  }

  async processImageFromUrl(
    imageUrl: string,
    options: {
      variants?: ImageVariant[]
      generateThumbnail?: boolean
    } = {}
  ): Promise<ImageUploadResult> {
    logger.info('Processing image from URL', { imageUrl })

    try {
      // Download image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new AppError(`Failed to download image: ${response.statusText}`, 400)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || 'image/jpeg'

      // Create mock file object
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: path.basename(imageUrl) || 'image.jpg',
        encoding: '7bit',
        mimetype: contentType,
        size: buffer.length,
        buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      }

      return await this.uploadAndProcessImage(mockFile, options)
    } catch (error) {
      logger.error('Failed to process image from URL', { error, imageUrl })
      throw error
    }
  }

  async generateImageVariant(
    sourceBuffer: Buffer,
    imageId: string,
    variant: ImageVariant
  ): Promise<string> {
    const filename = `${imageId}_${variant.name}.${variant.format || 'webp'}`
    const outputPath = path.join(this.uploadDir, filename)

    let processor = sharp(sourceBuffer)
      .resize(variant.width, variant.height, {
        fit: 'cover',
        position: 'center'
      })

    // Apply format and quality
    if (variant.format === 'jpeg') {
      processor = processor.jpeg({ quality: variant.quality || 90 })
    } else if (variant.format === 'png') {
      processor = processor.png({ quality: variant.quality || 90 })
    } else if (variant.format === 'webp') {
      processor = processor.webp({ quality: variant.quality || 90 })
    }

    await processor.toFile(outputPath)

    return outputPath
  }

  async optimizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    let processor = sharp(buffer)

    // Resize if dimensions provided
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
      })
    }

    // Apply format and quality
    const format = options.format || 'jpeg'
    const quality = options.quality || 90

    if (format === 'jpeg') {
      processor = processor.jpeg({ quality })
    } else if (format === 'png') {
      processor = processor.png({ quality })
    } else if (format === 'webp') {
      processor = processor.webp({ quality })
    }

    return await processor.toBuffer()
  }

  async deleteImage(imageId: string): Promise<void> {
    logger.info('Deleting image', { imageId })

    try {
      // Find all files with this image ID
      const files = await fs.readdir(this.uploadDir)
      const imageFiles = files.filter(file => file.startsWith(imageId))

      // Delete all variants
      await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = path.join(this.uploadDir, file)
          try {
            await fs.unlink(filePath)
            logger.debug('Deleted image file', { file })
          } catch (error) {
            logger.warn('Failed to delete image file', { file, error })
          }
        })
      )

      logger.info('Image deleted successfully', { imageId, filesDeleted: imageFiles.length })
    } catch (error) {
      logger.error('Failed to delete image', { error, imageId })
      throw error
    }
  }

  async getImageInfo(imageId: string): Promise<ProcessedImage | null> {
    try {
      const files = await fs.readdir(this.uploadDir)
      const imageFiles = files.filter(file => file.startsWith(imageId))

      if (imageFiles.length === 0) {
        return null
      }

      // Find original file
      const originalFile = imageFiles.find(file => 
        !file.includes('_') || file.includes('_original.')
      ) || imageFiles[0]

      const originalPath = path.join(this.uploadDir, originalFile)
      const metadata = await sharp(originalPath).metadata()
      const stats = await fs.stat(originalPath)

      // Build variants info
      const variants: { [key: string]: any } = {}
      for (const file of imageFiles) {
        if (file === originalFile) continue

        const variantName = file.split('_')[1]?.split('.')[0] || 'unknown'
        const variantPath = path.join(this.uploadDir, file)
        const variantMetadata = await sharp(variantPath).metadata()
        const variantStats = await fs.stat(variantPath)

        variants[variantName] = {
          url: `${this.baseUrl}/${file}`,
          width: variantMetadata.width,
          height: variantMetadata.height,
          fileSize: variantStats.size,
          format: variantMetadata.format
        }
      }

      return {
        id: imageId,
        originalUrl: `${this.baseUrl}/${originalFile}`,
        variants,
        metadata: {
          originalWidth: metadata.width || 0,
          originalHeight: metadata.height || 0,
          originalSize: stats.size,
          originalFormat: metadata.format || 'unknown',
          mimeType: `image/${metadata.format}`
        }
      }
    } catch (error) {
      logger.error('Failed to get image info', { error, imageId })
      return null
    }
  }

  async bulkProcessImages(
    files: Express.Multer.File[],
    options: {
      variants?: ImageVariant[]
      generateThumbnails?: boolean
      optimizeOriginals?: boolean
    } = {}
  ): Promise<ImageUploadResult[]> {
    logger.info('Bulk processing images', { count: files.length })

    const results: ImageUploadResult[] = []
    const errors: { file: string; error: string }[] = []

    // Process images in parallel (with concurrency limit)
    const concurrency = 3
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency)
      
      const batchResults = await Promise.allSettled(
        batch.map(file => this.uploadAndProcessImage(file, options))
      )

      batchResults.forEach((result, index) => {
        const file = batch[index]
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          errors.push({
            file: file.originalname,
            error: result.reason.message
          })
          logger.error('Failed to process image in batch', {
            filename: file.originalname,
            error: result.reason
          })
        }
      })
    }

    logger.info('Bulk image processing completed', {
      total: files.length,
      successful: results.length,
      failed: errors.length
    })

    if (errors.length > 0) {
      logger.warn('Some images failed to process', { errors })
    }

    return results
  }

  private validateImageFile(file: Express.Multer.File): void {
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
        400
      )
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 10MB', 400)
    }

    // Check if file has content
    if (file.size === 0) {
      throw new AppError('Empty file', 400)
    }
  }

  async generateImageVariants(
    imageId: string,
    variants: ImageVariant[]
  ): Promise<{ [key: string]: string }> {
    logger.info('Generating additional image variants', { imageId, variants })

    try {
      // Find original image
      const files = await fs.readdir(this.uploadDir)
      const originalFile = files.find(file => 
        file.startsWith(imageId) && (!file.includes('_') || file.includes('_original.'))
      )

      if (!originalFile) {
        throw new AppError('Original image not found', 404)
      }

      const originalPath = path.join(this.uploadDir, originalFile)
      const originalBuffer = await fs.readFile(originalPath)

      const generatedVariants: { [key: string]: string } = {}

      for (const variant of variants) {
        const variantPath = await this.generateImageVariant(
          originalBuffer,
          imageId,
          variant
        )
        generatedVariants[variant.name] = `${this.baseUrl}/${path.basename(variantPath)}`
      }

      logger.info('Image variants generated successfully', {
        imageId,
        variants: Object.keys(generatedVariants)
      })

      return generatedVariants
    } catch (error) {
      logger.error('Failed to generate image variants', { error, imageId })
      throw error
    }
  }
}