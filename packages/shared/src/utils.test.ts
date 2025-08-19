import { describe, it, expect } from 'vitest'
import { formatDate, slugify, capitalize } from './utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/2024-01-1[45]/) // Account for timezone differences
    })
  })

  describe('slugify', () => {
    it('should create a slug from text', () => {
      expect(slugify('Hello World!')).toBe('hello-world')
      expect(slugify('Test & Example')).toBe('test-example')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
    })
  })
})
