import { Express } from 'express'
import * as yaml from 'js-yaml'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import { env } from '../config/env'


/**
 * Swagger configuration
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Oda Fashion Platform API',
      version: '1.0.0',
      description: `
        Oda es una aplicación web desacoplada que combina funcionalidades de ERP, CRM y CDP 
        específicamente diseñada para el sector de la moda. Esta API proporciona endpoints 
        para gestión de productos, inventario, clientes, órdenes y sincronización con Shopify.
      `,
      contact: {
        name: 'Oda API Support',
        email: 'api-support@oda.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: env.API_BASE_URL,
        description: `${env.NODE_ENV} server`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication',
        },
      },
      schemas: {
        // Common schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
            },
            data: {
              description: 'Response data (present on success)',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  description: 'Additional error details',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                },
                requestId: {
                  type: 'string',
                  description: 'Request ID for tracking',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  $ref: '#/components/schemas/Pagination',
                },
                version: {
                  type: 'string',
                  description: 'API version',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Number of items per page',
            },
            total: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of items',
            },
            totalPages: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of pages',
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: {
                            type: 'string',
                            description: 'Field that failed validation',
                          },
                          message: {
                            type: 'string',
                            description: 'Validation error message',
                          },
                          code: {
                            type: 'string',
                            description: 'Validation error code',
                          },
                        },
                      },
                    },
                  },
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        // Entity schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'user'],
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Product unique identifier',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            sku: {
              type: 'string',
              description: 'Product SKU',
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Product price',
            },
            compareAtPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Compare at price (original price)',
            },
            status: {
              type: 'string',
              enum: ['active', 'draft', 'archived'],
              description: 'Product status',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Product tags',
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                  },
                  altText: {
                    type: 'string',
                  },
                  position: {
                    type: 'integer',
                  },
                },
              },
            },
            variants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductVariant',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sku: {
              type: 'string',
            },
            price: {
              type: 'number',
              format: 'decimal',
            },
            compareAtPrice: {
              type: 'number',
              format: 'decimal',
            },
            size: {
              type: 'string',
            },
            color: {
              type: 'string',
            },
            material: {
              type: 'string',
            },
            weight: {
              type: 'number',
              format: 'decimal',
            },
            inventoryQuantity: {
              type: 'integer',
            },
            inventoryPolicy: {
              type: 'string',
              enum: ['deny', 'continue'],
            },
            requiresShipping: {
              type: 'boolean',
            },
            taxable: {
              type: 'boolean',
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description:
            'Sort field and direction (e.g., name:asc, createdAt:desc)',
          required: false,
          schema: {
            type: 'string',
          },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query',
          required: false,
          schema: {
            type: 'string',
          },
        },
        ApiVersionHeader: {
          name: 'X-API-Version',
          in: 'header',
          description: 'API version',
          required: false,
          schema: {
            type: 'string',
            enum: ['v1', 'v2'],
            default: 'v1',
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'UNAUTHORIZED',
                      },
                      message: {
                        type: 'string',
                        example: 'Authentication required',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'FORBIDDEN',
                      },
                      message: {
                        type: 'string',
                        example: 'Insufficient permissions',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'NOT_FOUND',
                      },
                      message: {
                        type: 'string',
                        example: 'Resource not found',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        RateLimit: {
          description: 'Rate Limit Exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'RATE_LIMIT_EXCEEDED',
                      },
                      message: {
                        type: 'string',
                        example:
                          'Too many requests from this IP, please try again later.',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'INTERNAL_ERROR',
                      },
                      message: {
                        type: 'string',
                        example: 'Internal server error',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
      {
        name: 'Inventory',
        description: 'Inventory management endpoints',
      },
      {
        name: 'Orders',
        description: 'Order management endpoints',
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints',
      },
      {
        name: 'Shopify',
        description: 'Shopify integration endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts', './src/middleware/*.ts'],
}

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions)

/**
 * Swagger UI options
 */
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #1890ff }
  `,
  customSiteTitle: 'Oda Fashion Platform API Documentation',
}

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  )

  // Serve raw OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  // Serve OpenAPI spec in YAML format
  app.get('/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml')
    res.send(yaml.dump(swaggerSpec))
  })
}

export default swaggerSpec
