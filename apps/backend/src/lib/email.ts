import nodemailer, { type Transporter } from 'nodemailer'

import { env } from '../config/env'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailVerificationData {
  userName: string
  verificationUrl: string
}

export interface PasswordResetData {
  userName: string
  resetUrl: string
}

export interface WelcomeEmailData {
  userName: string
  loginUrl: string
}

export class EmailService {
  private static transporter: Transporter | null = null

  /**
   * Initialize email transporter
   */
  static async initialize(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // true for 465, false for other ports
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
              }
            : undefined,
      })

      // Verify connection
      await this.transporter.verify()
      console.log('Email service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize email service:', error)
      throw error
    }
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      await this.initialize()
    }

    try {
      const result = await this.transporter!.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  /**
   * Send email verification email
   */
  static async sendEmailVerification(
    email: string,
    data: EmailVerificationData
  ): Promise<boolean> {
    const html = this.generateEmailVerificationHTML(data)
    const text = this.generateEmailVerificationText(data)

    return this.sendEmail({
      to: email,
      subject: 'Verify your email address - Oda Fashion Platform',
      html,
      text,
    })
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    email: string,
    data: PasswordResetData
  ): Promise<boolean> {
    const html = this.generatePasswordResetHTML(data)
    const text = this.generatePasswordResetText(data)

    return this.sendEmail({
      to: email,
      subject: 'Reset your password - Oda Fashion Platform',
      html,
      text,
    })
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    email: string,
    data: WelcomeEmailData
  ): Promise<boolean> {
    const html = this.generateWelcomeHTML(data)
    const text = this.generateWelcomeText(data)

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Oda Fashion Platform',
      html,
      text,
    })
  }

  /**
   * Send two-factor authentication setup email
   */
  static async sendTwoFactorSetupEmail(
    email: string,
    userName: string
  ): Promise<boolean> {
    const html = this.generateTwoFactorSetupHTML(userName)
    const text = this.generateTwoFactorSetupText(userName)

    return this.sendEmail({
      to: email,
      subject: 'Two-Factor Authentication Enabled - Oda Fashion Platform',
      html,
      text,
    })
  }

  /**
   * Send account locked notification
   */
  static async sendAccountLockedEmail(
    email: string,
    userName: string,
    unlockTime: Date
  ): Promise<boolean> {
    const html = this.generateAccountLockedHTML(userName, unlockTime)
    const text = this.generateAccountLockedText(userName, unlockTime)

    return this.sendEmail({
      to: email,
      subject: 'Account Temporarily Locked - Oda Fashion Platform',
      html,
      text,
    })
  }

  /**
   * Generate email verification HTML template
   */
  private static generateEmailVerificationHTML(
    data: EmailVerificationData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Oda Fashion Platform</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Thank you for signing up for Oda Fashion Platform. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate email verification text template
   */
  private static generateEmailVerificationText(
    data: EmailVerificationData
  ): string {
    return `
Hello ${data.userName}!

Thank you for signing up for Oda Fashion Platform. To complete your registration, please verify your email address by visiting this link:

${data.verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with us, please ignore this email.

Best regards,
Oda Fashion Platform Team
    `.trim()
  }

  /**
   * Generate password reset HTML template
   */
  private static generatePasswordResetHTML(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          .warning { background: #fff2e8; border-left: 4px solid #fa8c16; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Oda Fashion Platform</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>We received a request to reset your password for your Oda Fashion Platform account.</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This reset link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate password reset text template
   */
  private static generatePasswordResetText(data: PasswordResetData): string {
    return `
Hello ${data.userName}!

We received a request to reset your password for your Oda Fashion Platform account.

To reset your password, please visit this link:
${data.resetUrl}

Security Notice:
- This reset link will expire in 1 hour for security reasons
- If you didn't request this password reset, please ignore this email
- Your password will remain unchanged until you create a new one

Best regards,
Oda Fashion Platform Team
    `.trim()
  }

  /**
   * Generate welcome email HTML template
   */
  private static generateWelcomeHTML(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Oda Fashion Platform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          .features { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Oda Fashion Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Welcome to Oda Fashion Platform! Your account has been successfully created and verified.</p>
            <div class="features">
              <h3>What you can do now:</h3>
              <ul>
                <li>Manage your fashion product catalog</li>
                <li>Track inventory across multiple locations</li>
                <li>Process and fulfill orders</li>
                <li>Manage customer relationships</li>
                <li>Sync with Shopify in real-time</li>
                <li>Generate comprehensive reports</li>
              </ul>
            </div>
            <p style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Login to Your Account</a>
            </p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate welcome email text template
   */
  private static generateWelcomeText(data: WelcomeEmailData): string {
    return `
Hello ${data.userName}!

Welcome to Oda Fashion Platform! Your account has been successfully created and verified.

What you can do now:
- Manage your fashion product catalog
- Track inventory across multiple locations
- Process and fulfill orders
- Manage customer relationships
- Sync with Shopify in real-time
- Generate comprehensive reports

Login to your account: ${data.loginUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Oda Fashion Platform Team
    `.trim()
  }

  /**
   * Generate two-factor setup HTML template
   */
  private static generateTwoFactorSetupHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Two-Factor Authentication Enabled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          .security-notice { background: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Enhanced!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Two-factor authentication has been successfully enabled on your Oda Fashion Platform account.</p>
            <div class="security-notice">
              <strong>Your account is now more secure!</strong>
              <p>From now on, you'll need to provide a verification code from your authenticator app when logging in.</p>
            </div>
            <p>If you didn't enable two-factor authentication, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate two-factor setup text template
   */
  private static generateTwoFactorSetupText(userName: string): string {
    return `
Hello ${userName}!

Two-factor authentication has been successfully enabled on your Oda Fashion Platform account.

Your account is now more secure! From now on, you'll need to provide a verification code from your authenticator app when logging in.

If you didn't enable two-factor authentication, please contact our support team immediately.

Best regards,
Oda Fashion Platform Team
    `.trim()
  }

  /**
   * Generate account locked HTML template
   */
  private static generateAccountLockedHTML(
    userName: string,
    unlockTime: Date
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Temporarily Locked</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fa541c; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          .warning { background: #fff1f0; border-left: 4px solid #ff4d4f; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Your Oda Fashion Platform account has been temporarily locked due to multiple failed login attempts.</p>
            <div class="warning">
              <strong>Account Status:</strong>
              <p>Your account will be automatically unlocked at: <strong>${unlockTime.toLocaleString()}</strong></p>
            </div>
            <p>If you believe this was not you attempting to access your account, please contact our support team immediately.</p>
            <p>To prevent future lockouts:</p>
            <ul>
              <li>Ensure you're using the correct password</li>
              <li>Consider enabling two-factor authentication for added security</li>
              <li>Use a password manager to avoid typos</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate account locked text template
   */
  private static generateAccountLockedText(
    userName: string,
    unlockTime: Date
  ): string {
    return `
Hello ${userName}!

Your Oda Fashion Platform account has been temporarily locked due to multiple failed login attempts.

Account Status: Your account will be automatically unlocked at: ${unlockTime.toLocaleString()}

If you believe this was not you attempting to access your account, please contact our support team immediately.

To prevent future lockouts:
- Ensure you're using the correct password
- Consider enabling two-factor authentication for added security
- Use a password manager to avoid typos

Best regards,
Oda Fashion Platform Team
    `.trim()
  }
}
