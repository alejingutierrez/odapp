import React from 'react'
import { Tooltip, Tag } from 'antd'
import { InfoCircleOutlined, CalculatorOutlined } from '@ant-design/icons'
import './TaxRateDisplay.css'

export interface TaxBreakdown {
  name: string
  rate: number
  amount: number
  type: 'federal' | 'state' | 'local' | 'vat' | 'gst' | 'sales'
}

export interface TaxRateDisplayProps {
  /** Main tax rate percentage */
  rate: number
  /** Tax amount in currency */
  amount?: number
  /** Currency symbol */
  currency?: string
  /** Tax breakdown by type */
  breakdown?: TaxBreakdown[]
  /** Tax region/jurisdiction */
  region?: string
  /** Whether tax is included in price */
  inclusive?: boolean
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed' | 'badge'
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Whether to show breakdown tooltip */
  showBreakdown?: boolean
  /** Custom label */
  label?: string
  /** Whether tax is exempt */
  exempt?: boolean
  /** Tax exemption reason */
  exemptReason?: string
  /** Click handler */
  onClick?: () => void
}

export const TaxRateDisplay: React.FC<TaxRateDisplayProps> = ({
  rate,
  amount,
  currency = '$',
  breakdown = [],
  region,
  inclusive = false,
  variant = 'default',
  size = 'medium',
  showBreakdown = true,
  label,
  exempt = false,
  exemptReason,
  onClick,
}) => {
  const displayClasses = [
    'oda-tax-rate-display',
    `oda-tax-rate-display--${variant}`,
    `oda-tax-rate-display--${size}`,
    exempt && 'oda-tax-rate-display--exempt',
    onClick && 'oda-tax-rate-display--clickable',
  ]
    .filter(Boolean)
    .join(' ')

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`
  }

  const formatAmount = (value: number): string => {
    return `${currency}${value.toFixed(2)}`
  }

  const renderBreakdownTooltip = () => {
    if (!showBreakdown || breakdown.length === 0) return null

    return (
      <div className='oda-tax-rate-display__breakdown'>
        <div className='oda-tax-rate-display__breakdown-header'>
          <CalculatorOutlined className='oda-tax-rate-display__breakdown-icon' />
          <span>Tax Breakdown</span>
          {region && (
            <span className='oda-tax-rate-display__region'>({region})</span>
          )}
        </div>
        <div className='oda-tax-rate-display__breakdown-list'>
          {breakdown.map((tax, index) => (
            <div key={index} className='oda-tax-rate-display__breakdown-item'>
              <div className='oda-tax-rate-display__breakdown-name'>
                <span>{tax.name}</span>
                <Tag size='small' color={getTaxTypeColor(tax.type)}>
                  {tax.type.toUpperCase()}
                </Tag>
              </div>
              <div className='oda-tax-rate-display__breakdown-values'>
                <span className='oda-tax-rate-display__breakdown-rate'>
                  {formatPercentage(tax.rate)}
                </span>
                {tax.amount > 0 && (
                  <span className='oda-tax-rate-display__breakdown-amount'>
                    {formatAmount(tax.amount)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className='oda-tax-rate-display__breakdown-total'>
          <div className='oda-tax-rate-display__breakdown-name'>
            <strong>Total Tax</strong>
          </div>
          <div className='oda-tax-rate-display__breakdown-values'>
            <strong className='oda-tax-rate-display__breakdown-rate'>
              {formatPercentage(rate)}
            </strong>
            {amount && (
              <strong className='oda-tax-rate-display__breakdown-amount'>
                {formatAmount(amount)}
              </strong>
            )}
          </div>
        </div>
        {inclusive && (
          <div className='oda-tax-rate-display__breakdown-note'>
            Tax included in price
          </div>
        )}
      </div>
    )
  }

  const getTaxTypeColor = (type: TaxBreakdown['type']): string => {
    const colors = {
      federal: 'blue',
      state: 'green',
      local: 'orange',
      vat: 'purple',
      gst: 'cyan',
      sales: 'red',
    }
    return colors[type] || 'default'
  }

  const renderExemptDisplay = () => {
    if (!exempt) return null

    const exemptTooltip = exemptReason ? (
      <div>
        <div>
          <strong>Tax Exempt</strong>
        </div>
        <div>{exemptReason}</div>
      </div>
    ) : (
      'Tax Exempt'
    )

    return (
      <Tooltip title={exemptTooltip}>
        <Tag color='gold' className='oda-tax-rate-display__exempt-tag'>
          EXEMPT
        </Tag>
      </Tooltip>
    )
  }

  const renderBadgeVariant = () => (
    <div className={displayClasses} onClick={onClick}>
      {exempt ? (
        renderExemptDisplay()
      ) : (
        <Tag color='blue' className='oda-tax-rate-display__badge'>
          {formatPercentage(rate)}
        </Tag>
      )}
    </div>
  )

  const renderCompactVariant = () => (
    <div className={displayClasses} onClick={onClick}>
      {exempt ? (
        renderExemptDisplay()
      ) : (
        <span className='oda-tax-rate-display__compact-content'>
          {label && (
            <span className='oda-tax-rate-display__label'>{label}: </span>
          )}
          <span className='oda-tax-rate-display__rate'>
            {formatPercentage(rate)}
          </span>
          {amount && (
            <span className='oda-tax-rate-display__amount'>
              ({formatAmount(amount)})
            </span>
          )}
          {inclusive && (
            <span className='oda-tax-rate-display__inclusive'>incl.</span>
          )}
        </span>
      )}
    </div>
  )

  const renderDetailedVariant = () => (
    <div className={displayClasses} onClick={onClick}>
      <div className='oda-tax-rate-display__detailed-content'>
        <div className='oda-tax-rate-display__main'>
          <div className='oda-tax-rate-display__rate-section'>
            {label && (
              <span className='oda-tax-rate-display__label'>{label}</span>
            )}
            {exempt ? (
              renderExemptDisplay()
            ) : (
              <span className='oda-tax-rate-display__rate'>
                {formatPercentage(rate)}
              </span>
            )}
          </div>
          {amount && !exempt && (
            <div className='oda-tax-rate-display__amount-section'>
              <span className='oda-tax-rate-display__amount'>
                {formatAmount(amount)}
              </span>
            </div>
          )}
        </div>
        {region && <div className='oda-tax-rate-display__region'>{region}</div>}
        {inclusive && !exempt && (
          <div className='oda-tax-rate-display__inclusive-note'>
            Tax included in price
          </div>
        )}
      </div>
    </div>
  )

  const renderDefaultVariant = () => (
    <div className={displayClasses} onClick={onClick}>
      <div className='oda-tax-rate-display__content'>
        {label && <span className='oda-tax-rate-display__label'>{label}</span>}
        {exempt ? (
          renderExemptDisplay()
        ) : (
          <>
            <span className='oda-tax-rate-display__rate'>
              {formatPercentage(rate)}
            </span>
            {amount && (
              <span className='oda-tax-rate-display__amount'>
                {formatAmount(amount)}
              </span>
            )}
            {showBreakdown && breakdown.length > 0 && (
              <InfoCircleOutlined className='oda-tax-rate-display__info-icon' />
            )}
          </>
        )}
      </div>
      {inclusive && !exempt && (
        <div className='oda-tax-rate-display__inclusive-indicator'>incl.</div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (variant) {
      case 'badge':
        return renderBadgeVariant()
      case 'compact':
        return renderCompactVariant()
      case 'detailed':
        return renderDetailedVariant()
      default:
        return renderDefaultVariant()
    }
  }

  const content = renderContent()

  if (showBreakdown && breakdown.length > 0 && !exempt) {
    return (
      <Tooltip title={renderBreakdownTooltip()} placement='top'>
        {content}
      </Tooltip>
    )
  }

  return content
}

TaxRateDisplay.displayName = 'TaxRateDisplay'
