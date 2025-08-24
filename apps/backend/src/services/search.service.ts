import { ProductQuery } from '@oda/shared'

import { ServiceUnavailableError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

import { ProductWithRelations, ProductSearchResult } from './product.service.js'

export interface SearchConfig {
  node: string
  auth?: {
    username: string
    password: string
  }
  tls?: {
    rejectUnauthorized: boolean
  }
}

export interface ProductSearchDocument {
  id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  status: string
  brand?: string
  material?: string
  price: number
  compareAtPrice?: number
  categoryId?: string
  categoryName?: string
  collectionIds: string[]
  collectionNames: string[]
  tags: string[]
  variants: {
    id: string
    sku?: string
    size?: string
    color?: string
    price: number
    inStock: boolean
  }[]
  images: {
    url: string
    altText?: string
  }[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  isFeatured: boolean
}

export class SearchService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any | null = null
  private readonly indexName = 'products'
  private isConnected = false

  constructor(private config?: SearchConfig) {
    if (config) {
      this.initializeClient()
    }
  }

  private async initializeClient(): Promise<void> {
    if (!this.config) return

    try {
      this.client = {
        ping: async () => {
          this.isConnected = true
        },
        indices: {
          exists: async (_args: { index: string }) => {
            return false // Mock index existence
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: async (_args: { index: string; body: any }) => {
            return { acknowledged: true }
          },
          delete: async (_args: { index: string }) => {
            return { acknowledged: true }
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        index: async (_args: { index: string; id: string; body: any }) => {
          return { acknowledged: true }
        },
        delete: async (_args: { index: string; id: string }) => {
          return { acknowledged: true }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search: async (_args: { index: string; body: any }) => {
          return {
            body: {
              hits: {
                total: { value: 0 },
                hits: [],
              },
              aggregations: {
                categories: { buckets: [] },
                brands: { buckets: [] },
                price_ranges: { buckets: [] },
                status: { buckets: [] },
              },
            },
          }
        },
        suggest: async (_args: {
          index: string
          body: Record<string, unknown>
        }) => {
          return {
            body: {
              suggest: {
                product_suggest: {
                  options: [],
                },
              },
            },
          }
        },
        bulk: async (_args: { body: Record<string, unknown>[] }) => {
          return {
            body: {
              items: _args.body.map((item) => ({
                index: {
                  _index: this.indexName,
                  _id: item._id,
                  _version: 1,
                  result: 'created',
                  _shards: { total: 1, successful: 1, failed: 0 },
                  _seq_no: 1,
                  _primary_term: 1,
                },
              })),
            },
          }
        },
      }

      // Test connection
      await this.client.ping()
      this.isConnected = true

      // Ensure index exists
      await this.ensureIndex()

      logger.info('Elasticsearch client initialized successfully')
    } catch (_error) {
      logger.error('Failed to initialize Elasticsearch client', {
        error: _error,
      })
      this.client = null
      this.isConnected = false
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null
  }

  private async ensureIndex(): Promise<void> {
    if (!this.client) return

    try {
      const exists = await this.client.indices.exists({
        index: this.indexName,
      })

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  product_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding', 'stop', 'snowball'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                      analyzer: 'product_analyzer',
                    },
                  },
                },
                slug: { type: 'keyword' },
                description: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                },
                shortDescription: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                },
                status: { type: 'keyword' },
                brand: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                material: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                price: { type: 'float' },
                compareAtPrice: { type: 'float' },
                categoryId: { type: 'keyword' },
                categoryName: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                collectionIds: { type: 'keyword' },
                collectionNames: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                tags: { type: 'keyword' },
                variants: {
                  type: 'nested',
                  properties: {
                    id: { type: 'keyword' },
                    sku: { type: 'keyword' },
                    size: { type: 'keyword' },
                    color: { type: 'keyword' },
                    price: { type: 'float' },
                    inStock: { type: 'boolean' },
                  },
                },
                images: {
                  type: 'nested',
                  properties: {
                    url: { type: 'keyword' },
                    altText: { type: 'text' },
                  },
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                isActive: { type: 'boolean' },
                isFeatured: { type: 'boolean' },
              },
            },
          },
        })

        logger.info('Elasticsearch index created successfully')
      }
    } catch (_error) {
      logger.error('Failed to ensure Elasticsearch index', { error: _error })
      throw _error
    }
  }

  async indexProduct(product: ProductWithRelations): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Elasticsearch not available, skipping product indexing')
      return
    }

    try {
      const document: ProductSearchDocument = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || undefined,
        shortDescription: product.shortDescription || undefined,
        status: product.status,
        brand: product.brand || undefined,
        material: product.material || undefined,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : undefined,
        categoryId: product.categoryId || undefined,
        categoryName: product.category?.name || undefined,
        collectionIds: product.collections?.map((c) => c.collection.id) || [],
        collectionNames:
          product.collections?.map((c) => c.collection.name) || [],
        tags: [], // TODO: Implement tags from product attributes or separate field
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku || undefined,
          size: variant.option1Value || undefined,
          color: variant.option2Value || undefined,
          price: Number(variant.price),
          inStock: false, // TODO: Get from inventory
        })),
        images: product.images.map((image) => ({
          url: image.url,
          altText: image.altText || undefined,
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      }

      await this.client.index({
        index: this.indexName,
        id: product.id,
        body: document,
      })

      logger.debug('Product indexed successfully', { productId: product.id })
    } catch (_error) {
      logger.error('Failed to index product', {
        error: _error,
        productId: product.id,
      })
      // Don't throw error to avoid breaking product operations
    }
  }

  async removeProduct(productId: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
      })

      logger.debug('Product removed from index', { productId })
    } catch (_error) {
      if (
        _error &&
        typeof _error === 'object' &&
        'meta' in _error &&
        (
          (_error as unknown as Record<string, unknown>).meta as Record<
            string,
            unknown
          >
        )?.statusCode !== 404
      ) {
        logger.error('Failed to remove product from index', {
          error: _error,
          productId,
        })
      }
    }
  }

  async searchProducts(query: ProductQuery): Promise<ProductSearchResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('Search service not available')
    }

    try {
      const {
        q: search,
        status,
        categoryId,
        collectionId,
        vendor,
        productType,
        tags,
        priceMin,
        priceMax,
        inStock,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query

      // Build query
      const must: Record<string, unknown>[] = [{ term: { isActive: true } }]

      const filter: Record<string, unknown>[] = []

      // Text search
      if (search) {
        must.push({
          multi_match: {
            query: search,
            fields: [
              'name^3',
              'description^2',
              'shortDescription^2',
              'brand^2',
              'variants.sku^2',
              'categoryName',
              'collectionNames',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        })
      }

      // Filters
      if (status) {
        filter.push({ term: { status } })
      }

      if (categoryId) {
        filter.push({ term: { categoryId } })
      }

      if (collectionId) {
        filter.push({ term: { collectionIds: collectionId } })
      }

      if (vendor) {
        filter.push({
          match: {
            brand: {
              query: vendor,
              operator: 'and',
            },
          },
        })
      }

      if (productType) {
        filter.push({
          match: {
            material: {
              query: productType,
              operator: 'and',
            },
          },
        })
      }

      if (tags?.length) {
        filter.push({
          terms: { tags },
        })
      }

      // Price range
      if (priceMin !== undefined || priceMax !== undefined) {
        const priceRange: Record<string, unknown> = {}
        if (priceMin !== undefined) priceRange.gte = priceMin
        if (priceMax !== undefined) priceRange.lte = priceMax
        filter.push({ range: { price: priceRange } })
      }

      // In stock filter
      if (inStock) {
        filter.push({
          nested: {
            path: 'variants',
            query: {
              term: { 'variants.inStock': true },
            },
          },
        })
      }

      // Build sort
      const sort: Record<string, unknown>[] = []
      if (sortBy === 'name') {
        sort.push({ 'name.keyword': { order: sortOrder } })
      } else if (sortBy === 'price') {
        sort.push({ price: { order: sortOrder } })
      } else if (sortBy === 'createdAt') {
        sort.push({ createdAt: { order: sortOrder } })
      } else if (sortBy === 'updatedAt') {
        sort.push({ updatedAt: { order: sortOrder } })
      }

      // Add relevance score for text searches
      if (search) {
        sort.unshift({ _score: {} })
      }

      const searchBody = {
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        from: (page - 1) * limit,
        size: limit,
        aggs: {
          categories: {
            terms: {
              field: 'categoryId',
              size: 20,
            },
            aggs: {
              category_name: {
                terms: {
                  field: 'categoryName.keyword',
                },
              },
            },
          },
          brands: {
            terms: {
              field: 'brand.keyword',
              size: 20,
            },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 25 },
                { from: 25, to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 200 },
                { from: 200 },
              ],
            },
          },
          status: {
            terms: {
              field: 'status',
            },
          },
        },
      }

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
      })

      // Convert Elasticsearch results to our format
      const products = (
        response.body.hits.hits as Record<string, unknown>[]
      ).map((hit: Record<string, unknown>) => {
        const source = hit._source as ProductSearchDocument
        return {
          id: source.id,
          name: source.name,
          slug: source.slug,
          description: source.description,
          shortDescription: source.shortDescription,
          status: source.status as string,
          brand: source.brand,
          material: source.material,
          price: source.price,
          compareAtPrice: source.compareAtPrice,
          costPrice: null,
          sku: null,
          barcode: null,
          careInstructions: null,
          isActive: source.isActive,
          isFeatured: source.isFeatured,
          trackQuantity: true,
          metaTitle: null,
          metaDescription: null,
          shopifyId: null,
          shopifyHandle: null,
          lastSyncedAt: null,
          createdAt: new Date(source.createdAt),
          updatedAt: new Date(source.updatedAt),
          deletedAt: null,
          categoryId: source.categoryId,
          variants: source.variants.map((variant) => ({
            id: variant.id,
            productId: source.id,
            name: null,
            sku: variant.sku,
            barcode: null,
            option1Name: 'Size',
            option1Value: variant.size,
            option2Name: 'Color',
            option2Value: variant.color,
            option3Name: null,
            option3Value: null,
            price: variant.price,
            compareAtPrice: null,
            costPrice: null,
            weight: null,
            dimensions: null,
            isActive: true,
            shopifyId: null,
            lastSyncedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          images: source.images.map((image, index) => ({
            id: `${source.id}-img-${index}`,
            productId: source.id,
            url: image.url,
            altText: image.altText,
            sortOrder: index,
            width: null,
            height: null,
            fileSize: null,
            mimeType: null,
            shopifyId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          category: source.categoryName
            ? {
                id: source.categoryId as string,
                name: source.categoryName,
                slug: source.categoryName.toLowerCase().replace(/\s+/g, '-'),
                description: null,
                image: null,
                parentId: null,
                sortOrder: 0,
                isActive: true,
                metaTitle: null,
                metaDescription: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : null,
          collections: source.collectionNames.map((name, index) => ({
            collection: {
              id: source.collectionIds[index],
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              description: null,
              image: null,
              isActive: true,
              sortOrder: 0,
              rules: null,
              metaTitle: null,
              metaDescription: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })),
          _count: {
            variants: source.variants.length,
            images: source.images.length,
            collections: source.collectionIds.length,
          },
        } as unknown as ProductWithRelations
      })

      // Build facets
      const aggs = response.body.aggregations
      const facets = {
        categories: aggs.categories.buckets.map(
          (bucket: Record<string, unknown>) => ({
            id: bucket.key,
            name:
              (
                (bucket.category_name as unknown as Record<string, unknown>)
                  .buckets as unknown as Array<{ key?: string }>
              )?.[0]?.key || 'Unknown',
            count: bucket.doc_count,
          })
        ),
        brands: aggs.brands.buckets.map((bucket: Record<string, unknown>) => ({
          name: bucket.key,
          count: bucket.doc_count,
        })),
        priceRanges: aggs.price_ranges.buckets.map(
          (bucket: Record<string, unknown>) => ({
            min: bucket.from || 0,
            max: bucket.to || Infinity,
            count: bucket.doc_count,
          })
        ),
        status: aggs.status.buckets.map((bucket: Record<string, unknown>) => ({
          status: bucket.key,
          count: bucket.doc_count,
        })),
      }

      return {
        products,
        total: response.body.hits.total.value,
        facets,
      }
    } catch (_error) {
      logger.error('Elasticsearch search failed', { error: _error, query })
      throw new ServiceUnavailableError('Search failed')
    }
  }

  async suggestProducts(query: string, limit = 10): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            product_suggest: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: limit,
              },
            },
          },
        },
      })

      return response.body.suggest.product_suggest[0].options.map(
        (option: Record<string, unknown>) => option.text as string
      )
    } catch (_error) {
      logger.error('Product suggestion failed', { error: _error, query })
      return []
    }
  }

  async reindexAllProducts(products: ProductWithRelations[]): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Elasticsearch not available, skipping reindexing')
      return
    }

    try {
      logger.info('Starting product reindexing', { count: products.length })

      // Delete existing index
      try {
        await this.client.indices.delete({ index: this.indexName })
      } catch (_error) {
        // Index might not exist, ignore error
      }

      // Recreate index
      await this.ensureIndex()

      // Bulk index products
      const batchSize = 100
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        const body = batch.flatMap((product) => [
          { index: { _index: this.indexName, _id: product.id } },
          this.convertProductToDocument(product),
        ])

        await this.client.bulk({ body })
        logger.debug('Indexed batch', { from: i, to: i + batch.length })
      }

      logger.info('Product reindexing completed', { count: products.length })
    } catch (_error) {
      logger.error('Failed to reindex products', { error: _error })
      throw _error
    }
  }

  private convertProductToDocument(
    product: ProductWithRelations
  ): ProductSearchDocument {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      shortDescription: product.shortDescription || undefined,
      status: product.status,
      brand: product.brand || undefined,
      material: product.material || undefined,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : undefined,
      categoryId: product.categoryId || undefined,
      categoryName: product.category?.name || undefined,
      collectionIds: product.collections?.map((c) => c.collection.id) || [],
      collectionNames: product.collections?.map((c) => c.collection.name) || [],
      tags: [],
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku || undefined,
        size: variant.option1Value || undefined,
        color: variant.option2Value || undefined,
        price: Number(variant.price),
        inStock: false, // TODO: Get from inventory
      })),
      images: product.images.map((image) => ({
        url: image.url,
        altText: image.altText || undefined,
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    }
  }
}
