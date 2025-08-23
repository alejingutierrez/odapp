import { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../lib/errors'

// Extend Request interface to include API version
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiVersion: string
    }
  }
}

/**
 * Supported API versions
 */
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const
export type ApiVersion = (typeof SUPPORTED_VERSIONS)[number]

/**
 * Default API version
 */
export const DEFAULT_VERSION: ApiVersion = 'v1'

/**
 * Extract API version from request
 */
const extractVersion = (req: Request): string => {
  // 1. Check URL path (/api/v1/...)
  const pathMatch = req.path.match(/^\/api\/(v\d+)/)
  if (pathMatch) {
    return pathMatch[1]
  }

  // 2. Check Accept header (application/vnd.oda.v1+json)
  const acceptHeader = req.headers.accept
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(
      /application\/vnd\.oda\.(v\d+)\+json/
    )
    if (versionMatch) {
      return versionMatch[1]
    }
  }

  // 3. Check custom header (X-API-Version)
  const versionHeader = req.headers['x-api-version'] as string
  if (versionHeader) {
    return versionHeader.startsWith('v') ? versionHeader : `v${versionHeader}`
  }

  // 4. Check query parameter (?version=v1)
  const versionQuery = req.query.version as string
  if (versionQuery) {
    return versionQuery.startsWith('v') ? versionQuery : `v${versionQuery}`
  }

  return DEFAULT_VERSION
}

/**
 * Validate API version
 */
const isValidVersion = (version: string): version is ApiVersion => {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion)
}

/**
 * API versioning middleware
 */
export const apiVersion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const version = extractVersion(req)

  if (!isValidVersion(version)) {
    throw new ValidationError(
      `Unsupported API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      undefined,
      { requestedVersion: version, supportedVersions: SUPPORTED_VERSIONS }
    )
  }

  req.apiVersion = version

  // Set response headers
  res.setHeader('X-API-Version', version)
  res.setHeader('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '))

  next()
}

/**
 * Version-specific route handler
 */
export const versionHandler = (
  handlers: Partial<
    Record<
      ApiVersion,
      (_req: Request, _res: Response, _next: NextFunction) => unknown
    >
  >
) => {
  return (_req: Request, _res: Response, _next: NextFunction) => {
    const handler = handlers[_req.apiVersion as ApiVersion]

    if (!handler) {
      throw new ValidationError(
        `Handler not implemented for API version ${_req.apiVersion}`,
        undefined,
        { version: _req.apiVersion }
      )
    }

    return handler(_req, _res, _next)
  }
}

/**
 * Deprecation warning middleware
 */
export const deprecationWarning = (
  version: ApiVersion,
  deprecatedIn?: string,
  removedIn?: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.apiVersion === version) {
      let warningMessage = `API version ${version} is deprecated`

      if (deprecatedIn) {
        warningMessage += ` since ${deprecatedIn}`
      }

      if (removedIn) {
        warningMessage += ` and will be removed in ${removedIn}`
      }

      res.setHeader('Warning', `299 - "${warningMessage}"`)
      res.setHeader('Sunset', removedIn || 'TBD')
    }

    next()
  }
}

/**
 * Backward compatibility middleware
 */
export const backwardCompatibility = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle legacy endpoints that don't have version in path
  if (!_req.path.startsWith('/api/v') && _req.path.startsWith('/api/')) {
    // Redirect to versioned endpoint
    const versionedPath = _req.path.replace('/api/', `/api/${DEFAULT_VERSION}/`)

    // Set deprecation warning
    res.setHeader(
      'Warning',
      '299 - "Unversioned API endpoints are deprecated. Please use versioned endpoints."'
    )
    res.setHeader('Location', versionedPath)

    // For GET requests, redirect
    if (_req.method === 'GET') {
      return res.redirect(301, versionedPath)
    }
  }

  next()
}

/**
 * Content negotiation for API versioning
 */
export const contentNegotiation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const acceptHeader = req.headers.accept

  // If client specifies versioned content type, ensure it matches URL version
  if (acceptHeader && acceptHeader.includes('application/vnd.oda.')) {
    const headerVersion = acceptHeader.match(
      /application\/vnd\.oda\.(v\d+)\+json/
    )?.[1]

    if (headerVersion && headerVersion !== req.apiVersion) {
      throw new ValidationError(
        'Version mismatch between URL and Accept header',
        undefined,
        {
          urlVersion: req.apiVersion,
          headerVersion,
        }
      )
    }
  }

  // Set appropriate content type in response
  res.setHeader(
    'Content-Type',
    `application/vnd.oda.${req.apiVersion}+json; charset=utf-8`
  )

  next()
}
