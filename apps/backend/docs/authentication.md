# Authentication and Authorization System

This document describes the comprehensive authentication and authorization system implemented for the Oda Fashion Platform.

## Overview

The authentication system provides:

- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) with granular permissions
- Two-factor authentication (TOTP and SMS)
- Account security features (lockout, password policies)
- Session management
- Email verification and password reset

## Architecture

### Core Components

1. **AuthService** - Core authentication logic
2. **TwoFactorService** - Two-factor authentication handling
3. **EmailService** - Email notifications and verification
4. **Authentication Middleware** - Route protection and authorization
5. **Authentication Routes** - API endpoints for auth operations

### Database Schema

The system uses the following main tables:

- `users` - User accounts and basic information
- `roles` - System roles with permissions
- `user_roles` - Many-to-many relationship between users and roles
- `user_sessions` - Active user sessions with JWT tokens
- `sms_verification_codes` - Temporary SMS codes for 2FA

## Authentication Flow

### User Registration

1. User submits registration form with email, password, and profile info
2. System validates input and checks for existing accounts
3. Password is hashed using bcrypt with configurable rounds
4. User account is created with `emailVerified: false`
5. Email verification link is sent to user's email
6. Default "user" role is assigned

### Email Verification

1. User clicks verification link from email
2. System validates token and marks email as verified
3. Welcome email is sent to user

### User Login

1. User submits email and password
2. System validates credentials and checks account status
3. If account is locked, login is rejected
4. If 2FA is enabled, TOTP token is required
5. Session is created with access and refresh tokens
6. Login attempts counter is reset on successful login

### Token Management

- **Access Token**: Short-lived JWT (default 7 days) containing user info and permissions
- **Refresh Token**: Longer-lived token (default 30 days) for obtaining new access tokens
- Tokens include user ID, email, roles, permissions, and session ID

## Authorization System

### Role-Based Access Control (RBAC)

The system implements a flexible RBAC system with the following default roles:

#### Admin Role

- Full system access with wildcard permission (`*`)
- Can manage users, roles, and system settings

#### Manager Role

- Access to most business operations
- Can manage products, inventory, orders, customers
- Can view analytics and generate reports
- Limited user management capabilities

#### Employee Role

- Daily operational access
- Can process orders and manage inventory
- Read-only access to products and customers
- Basic analytics access

#### User Role

- Basic read access to most entities
- Can manage own profile

#### Viewer Role

- Read-only access across the system
- Suitable for reporting and analytics users

### Permission System

Permissions follow a hierarchical naming convention:

```
resource:action
```

Examples:

- `products:read` - View products
- `products:write` - Create/update products
- `products:delete` - Delete products
- `orders:process` - Process orders
- `customers:export` - Export customer data

### Middleware Functions

The system provides several middleware functions for route protection:

```typescript
// Basic authentication
authenticate

// Role-based access
requireRole('admin')
requireAnyRole(['admin', 'manager'])

// Permission-based access
requirePermission('products:write')
requireAnyPermission(['products:read', 'products:write'])
requireAllPermissions(['products:read', 'products:write'])

// Self-access or admin
requireSelfOrAdmin()

// Two-factor authentication
requireTwoFactor
```

## Two-Factor Authentication

### TOTP (Time-based One-Time Password)

1. User enables 2FA in account settings
2. System generates secret key and QR code
3. User scans QR code with authenticator app
4. User verifies setup with TOTP token
5. 2FA is enabled and backup codes are generated
6. Future logins require TOTP token

### SMS Authentication

1. User requests SMS code for phone number
2. System generates 6-digit code with 5-minute expiration
3. Code is sent via configured SMS provider
4. User enters code for verification
5. Code is validated and removed after use

### Backup Codes

- 10 single-use backup codes generated during 2FA setup
- Codes are hashed before storage
- Can be used when TOTP device is unavailable

## Security Features

### Account Lockout

- Accounts are locked after 5 failed login attempts
- Default lockout duration is 30 minutes
- Lockout can be cleared by admin or expires automatically

### Password Security

- Minimum 8 characters required
- Must contain uppercase, lowercase, number, and special character
- Passwords are hashed using bcrypt with configurable rounds (default 12)

### Session Security

- Sessions have configurable expiration times
- Sessions can be revoked individually or all at once
- Session activity is tracked (IP address, user agent, last used)

### Rate Limiting

- Authentication endpoints have rate limiting
- Configurable limits per IP address
- Prevents brute force attacks

## API Endpoints

### Authentication

```
POST /api/v1/auth/register          - User registration
POST /api/v1/auth/login             - User login
POST /api/v1/auth/logout            - Logout current session
POST /api/v1/auth/logout-all        - Logout all sessions
POST /api/v1/auth/refresh           - Refresh access token
POST /api/v1/auth/verify-email      - Verify email address
POST /api/v1/auth/forgot-password   - Request password reset
POST /api/v1/auth/reset-password    - Reset password with token
POST /api/v1/auth/change-password   - Change password (authenticated)
GET  /api/v1/auth/me                - Get current user profile
GET  /api/v1/auth/sessions          - Get user sessions
DELETE /api/v1/auth/sessions/:id    - Revoke specific session
```

### Two-Factor Authentication

```
GET  /api/v1/two-factor/status           - Get 2FA status
POST /api/v1/two-factor/totp/setup       - Setup TOTP
POST /api/v1/two-factor/totp/enable      - Enable TOTP
POST /api/v1/two-factor/totp/disable     - Disable TOTP
POST /api/v1/two-factor/totp/verify      - Verify TOTP token
POST /api/v1/two-factor/sms/send         - Send SMS code
POST /api/v1/two-factor/sms/verify       - Verify SMS code
POST /api/v1/two-factor/backup-codes/generate - Generate backup codes
POST /api/v1/two-factor/backup-codes/verify   - Verify backup code
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Default Admin User

The system creates a default admin user during database seeding:

- Email: `admin@oda.local`
- Password: `admin123`
- Role: `admin`

**Important**: Change the default admin password in production!

## Testing

The authentication system includes comprehensive tests:

- Unit tests for core services
- Integration tests for API endpoints
- Middleware tests for authorization
- Security tests for account lockout and rate limiting

Run tests with:

```bash
npm test auth-unit
```

## Security Best Practices

1. **Use HTTPS in production** - All authentication should happen over encrypted connections
2. **Rotate JWT secrets regularly** - Implement secret rotation strategy
3. **Monitor failed login attempts** - Set up alerting for suspicious activity
4. **Use strong password policies** - Enforce complexity requirements
5. **Enable 2FA for admin accounts** - Require 2FA for privileged users
6. **Regular security audits** - Review permissions and access patterns
7. **Log security events** - Maintain audit trails for compliance

## Troubleshooting

### Common Issues

1. **Token validation fails**
   - Check JWT secret configuration
   - Verify token hasn't expired
   - Ensure session exists in database

2. **Email verification not working**
   - Check SMTP configuration
   - Verify email service is running
   - Check spam/junk folders

3. **Account lockout issues**
   - Check lockout duration settings
   - Verify failed attempt counting
   - Review rate limiting configuration

4. **2FA setup problems**
   - Ensure time synchronization
   - Verify TOTP secret generation
   - Check SMS provider configuration

### Debugging

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

This will provide detailed information about authentication flows and errors.
