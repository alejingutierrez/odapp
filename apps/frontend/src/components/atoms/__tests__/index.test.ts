/**
 * Comprehensive test suite for all new atomic components
 * This file ensures all components are properly exported and testable
 */

// Import all new components to verify they export correctly
import {
  Tooltip,
  Chip,
  Toggle,
  Dropdown,
  Accordion,
  CurrencyInput,
  QuantityCounter,
  UnitSelector,
  FabricSwatch,
  TrendIndicator,
  RangeSlider,
} from '../index'

describe('Atomic Components Export', () => {
  it('exports all new atomic components', () => {
    expect(Tooltip).toBeDefined()
    expect(Chip).toBeDefined()
    expect(Toggle).toBeDefined()
    expect(Dropdown).toBeDefined()
    expect(Accordion).toBeDefined()
    expect(CurrencyInput).toBeDefined()
    expect(QuantityCounter).toBeDefined()
    expect(UnitSelector).toBeDefined()
    expect(FabricSwatch).toBeDefined()
    expect(TrendIndicator).toBeDefined()
    expect(RangeSlider).toBeDefined()
  })

  it('components have correct display names', () => {
    expect(Tooltip.displayName).toBe('Tooltip')
    expect(Chip.displayName).toBe('Chip')
    expect(Toggle.displayName).toBe('Toggle')
    expect(Dropdown.displayName).toBe('Dropdown')
    expect(Accordion.displayName).toBe('Accordion')
    expect(CurrencyInput.displayName).toBe('CurrencyInput')
    expect(QuantityCounter.displayName).toBe('QuantityCounter')
    expect(UnitSelector.displayName).toBe('UnitSelector')
    expect(FabricSwatch.displayName).toBe('FabricSwatch')
    expect(TrendIndicator.displayName).toBe('TrendIndicator')
    expect(RangeSlider.displayName).toBe('RangeSlider')
  })
})