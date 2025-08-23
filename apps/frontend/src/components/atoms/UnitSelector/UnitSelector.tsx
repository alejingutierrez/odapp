import { SwapOutlined } from '@ant-design/icons'
import { Select, SelectProps, Tooltip } from 'antd'
import React from 'react'
import './UnitSelector.css'

const { Option } = Select

export interface Unit {
  code: string
  name: string
  symbol: string
  category: 'weight' | 'length' | 'area' | 'volume' | 'quantity'
  baseUnit?: string
  conversionFactor?: number
}

export interface UnitSelectorProps
  extends Omit<SelectProps, 'value' | 'onChange'> {
  /** Selected unit code */
  value?: string
  /** Change handler */
  onChange?: (unit: string, unitData: Unit) => void
  /** Available units */
  units?: Unit[]
  /** Unit category filter */
  category?: 'weight' | 'length' | 'area' | 'volume' | 'quantity' | 'all'
  /** Whether to show conversion display */
  showConversion?: boolean
  /** Base value for conversion display */
  baseValue?: number
  /** Whether to allow unit conversion */
  allowConversion?: boolean
  /** Conversion callback */
  onConvert?: (fromUnit: string, toUnit: string, value: number) => number
  /** Whether to show unit symbols */
  showSymbols?: boolean
  /** Whether to group units by category */
  groupByCategory?: boolean
  /** Custom unit renderer */
  unitRender?: (unit: Unit) => React.ReactNode
}

const DEFAULT_UNITS: Unit[] = [
  // Weight units
  {
    code: 'kg',
    name: 'Kilogram',
    symbol: 'kg',
    category: 'weight',
    baseUnit: 'kg',
    conversionFactor: 1,
  },
  {
    code: 'g',
    name: 'Gram',
    symbol: 'g',
    category: 'weight',
    baseUnit: 'kg',
    conversionFactor: 0.001,
  },
  {
    code: 'lb',
    name: 'Pound',
    symbol: 'lb',
    category: 'weight',
    baseUnit: 'kg',
    conversionFactor: 0.453592,
  },
  {
    code: 'oz',
    name: 'Ounce',
    symbol: 'oz',
    category: 'weight',
    baseUnit: 'kg',
    conversionFactor: 0.0283495,
  },

  // Length units
  {
    code: 'm',
    name: 'Meter',
    symbol: 'm',
    category: 'length',
    baseUnit: 'm',
    conversionFactor: 1,
  },
  {
    code: 'cm',
    name: 'Centimeter',
    symbol: 'cm',
    category: 'length',
    baseUnit: 'm',
    conversionFactor: 0.01,
  },
  {
    code: 'mm',
    name: 'Millimeter',
    symbol: 'mm',
    category: 'length',
    baseUnit: 'm',
    conversionFactor: 0.001,
  },
  {
    code: 'ft',
    name: 'Foot',
    symbol: 'ft',
    category: 'length',
    baseUnit: 'm',
    conversionFactor: 0.3048,
  },
  {
    code: 'in',
    name: 'Inch',
    symbol: 'in',
    category: 'length',
    baseUnit: 'm',
    conversionFactor: 0.0254,
  },

  // Area units
  {
    code: 'm2',
    name: 'Square Meter',
    symbol: 'm²',
    category: 'area',
    baseUnit: 'm2',
    conversionFactor: 1,
  },
  {
    code: 'cm2',
    name: 'Square Centimeter',
    symbol: 'cm²',
    category: 'area',
    baseUnit: 'm2',
    conversionFactor: 0.0001,
  },
  {
    code: 'ft2',
    name: 'Square Foot',
    symbol: 'ft²',
    category: 'area',
    baseUnit: 'm2',
    conversionFactor: 0.092903,
  },

  // Volume units
  {
    code: 'l',
    name: 'Liter',
    symbol: 'L',
    category: 'volume',
    baseUnit: 'l',
    conversionFactor: 1,
  },
  {
    code: 'ml',
    name: 'Milliliter',
    symbol: 'mL',
    category: 'volume',
    baseUnit: 'l',
    conversionFactor: 0.001,
  },
  {
    code: 'gal',
    name: 'Gallon',
    symbol: 'gal',
    category: 'volume',
    baseUnit: 'l',
    conversionFactor: 3.78541,
  },

  // Quantity units
  { code: 'pcs', name: 'Pieces', symbol: 'pcs', category: 'quantity' },
  { code: 'pair', name: 'Pair', symbol: 'pair', category: 'quantity' },
  { code: 'set', name: 'Set', symbol: 'set', category: 'quantity' },
  {
    code: 'dozen',
    name: 'Dozen',
    symbol: 'dz',
    category: 'quantity',
    baseUnit: 'pcs',
    conversionFactor: 12,
  },
]

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  value,
  onChange,
  units = DEFAULT_UNITS,
  category = 'all',
  showConversion = false,
  baseValue,
  allowConversion = false,
  onConvert,
  showSymbols = true,
  groupByCategory = false,
  unitRender,
  className = '',
  ...props
}) => {
  const filteredUnits =
    category === 'all'
      ? units
      : units.filter((unit) => unit.category === category)

  const selectedUnit = units.find((unit) => unit.code === value)

  const selectorClasses = [
    'oda-unit-selector',
    showConversion && 'oda-unit-selector--with-conversion',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const convertValue = (
    fromUnit: string,
    toUnit: string,
    val: number
  ): number => {
    if (onConvert) {
      return onConvert(fromUnit, toUnit, val)
    }

    const fromUnitData = units.find((u) => u.code === fromUnit)
    const toUnitData = units.find((u) => u.code === toUnit)

    if (
      !fromUnitData ||
      !toUnitData ||
      fromUnitData.baseUnit !== toUnitData.baseUnit ||
      !fromUnitData.conversionFactor ||
      !toUnitData.conversionFactor
    ) {
      return val
    }

    // Convert to base unit, then to target unit
    const baseValue = val * fromUnitData.conversionFactor
    return baseValue / toUnitData.conversionFactor
  }

  const handleUnitChange = (unitCode: string) => {
    const unitData = units.find((u) => u.code === unitCode)
    if (unitData && onChange) {
      onChange(unitCode, unitData)
    }
  }

  const renderUnitOption = (unit: Unit) => {
    if (unitRender) {
      return unitRender(unit)
    }

    return (
      <div className='oda-unit-selector__option'>
        <div className='oda-unit-selector__option-main'>
          <span className='oda-unit-selector__option-name'>{unit.name}</span>
          {showSymbols && (
            <span className='oda-unit-selector__option-symbol'>
              ({unit.symbol})
            </span>
          )}
        </div>
        <span className='oda-unit-selector__option-category'>
          {unit.category}
        </span>
      </div>
    )
  }

  const renderConversionDisplay = () => {
    if (!showConversion || !selectedUnit || !baseValue) return null

    const compatibleUnits = units.filter(
      (unit) =>
        unit.category === selectedUnit.category &&
        unit.code !== selectedUnit.code &&
        unit.baseUnit === selectedUnit.baseUnit
    )

    if (compatibleUnits.length === 0) return null

    return (
      <div className='oda-unit-selector__conversion'>
        <div className='oda-unit-selector__conversion-header'>
          <SwapOutlined className='oda-unit-selector__conversion-icon' />
          <span>Conversions</span>
        </div>
        <div className='oda-unit-selector__conversion-list'>
          {compatibleUnits.slice(0, 3).map((unit) => {
            const convertedValue = convertValue(
              selectedUnit.code,
              unit.code,
              baseValue
            )
            return (
              <div
                key={unit.code}
                className='oda-unit-selector__conversion-item'
              >
                <span className='oda-unit-selector__conversion-value'>
                  {convertedValue.toFixed(2)} {unit.symbol}
                </span>
                <span className='oda-unit-selector__conversion-name'>
                  {unit.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderGroupedOptions = () => {
    const groupedUnits = filteredUnits.reduce(
      (groups, unit) => {
        const category = unit.category
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(unit)
        return groups
      },
      {} as Record<string, Unit[]>
    )

    return Object.entries(groupedUnits).map(([categoryName, categoryUnits]) => (
      <Select.OptGroup
        key={categoryName}
        label={categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
      >
        {categoryUnits.map((unit) => (
          <Option key={unit.code} value={unit.code}>
            {renderUnitOption(unit)}
          </Option>
        ))}
      </Select.OptGroup>
    ))
  }

  const renderOptions = () => {
    if (groupByCategory) {
      return renderGroupedOptions()
    }

    return filteredUnits.map((unit) => (
      <Option key={unit.code} value={unit.code}>
        {renderUnitOption(unit)}
      </Option>
    ))
  }

  return (
    <div className={selectorClasses}>
      <Select
        value={value}
        onChange={handleUnitChange}
        className='oda-unit-selector__select'
        placeholder='Select unit'
        showSearch
        filterOption={(input, option) => {
          const unit = units.find((u) => u.code === option?.value)
          return unit
            ? unit.name.toLowerCase().includes(input.toLowerCase()) ||
                unit.symbol.toLowerCase().includes(input.toLowerCase()) ||
                unit.code.toLowerCase().includes(input.toLowerCase())
            : false
        }}
        {...props}
      >
        {renderOptions()}
      </Select>

      {renderConversionDisplay()}

      {allowConversion && selectedUnit && (
        <Tooltip title='Convert to another unit'>
          <SwapOutlined
            className='oda-unit-selector__convert-button'
            onClick={() => {
              // Implementation for conversion modal/dropdown
            }}
          />
        </Tooltip>
      )}
    </div>
  )
}

UnitSelector.displayName = 'UnitSelector'
