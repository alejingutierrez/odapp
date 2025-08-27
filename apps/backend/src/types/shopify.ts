// Shopify API Types
export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  created_at: string
  handle: string
  updated_at: string
  published_at: string
  template_suffix: string
  status: string
  published_scope: string
  tags: string
  admin_graphql_api_id: string
  variants: ShopifyVariant[]
  options: ShopifyOption[]
  images: ShopifyImage[]
  image: ShopifyImage
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  position: number
  inventory_policy: string
  compare_at_price: string
  fulfillment_service: string
  inventory_management: string
  option1: string
  option2: string
  option3: string
  created_at: string
  updated_at: string
  taxable: boolean
  barcode: string
  grams: number
  image_id: number
  weight: number
  weight_unit: string
  inventory_item_id: number
  inventory_quantity: number
  old_inventory_quantity: number
  requires_shipping: boolean
  admin_graphql_api_id: string
}

export interface ShopifyOption {
  id: number
  product_id: number
  name: string
  position: number
  values: string[]
}

export interface ShopifyImage {
  id: number
  product_id: number
  position: number
  created_at: string
  updated_at: string
  alt: string
  width: number
  height: number
  src: string
  variant_ids: number[]
  admin_graphql_api_id: string
}

export interface ShopifyOrder {
  id: number
  email: string
  closed_at: string
  created_at: string
  updated_at: string
  number: number
  note: string
  token: string
  gateway: string
  test: boolean
  total_price: string
  subtotal_price: string
  total_weight: number
  total_tax: string
  taxes_included: boolean
  currency: string
  financial_status: string
  confirmed: boolean
  total_discounts: string
  total_line_items_price: string
  cart_token: string
  buyer_accepts_marketing: boolean
  name: string
  referring_site: string
  landing_site: string
  cancelled_at: string
  cancel_reason: string
  total_price_usd: string
  checkout_token: string
  reference: string
  user_id: number
  location_id: number
  source_identifier: string
  source_url: string
  processed_at: string
  device_id: number
  phone: string
  customer_locale: string
  app_id: number
  browser_ip: string
  landing_site_ref: string
  order_number: number
  discount_applications: any[]
  discount_codes: any[]
  note_attributes: any[]
  payment_gateway_names: string[]
  processing_method: string
  checkout_id: number
  source_name: string
  fulfillment_status: string
  tax_lines: any[]
  tags: string
  contact_email: string
  order_status_url: string
  presentment_currency: string
  total_line_items_price_set: any
  total_discounts_set: any
  total_shipping_price_set: any
  subtotal_price_set: any
  total_price_set: any
  total_tax_set: any
  line_items: any[]
  shipping_lines: any[]
  billing_address: any
  shipping_address: any
  fulfillments: any[]
  client_details: any
  refunds: any[]
  customer: ShopifyCustomer
}

export interface ShopifyCustomer {
  id: number
  email: string
  accepts_marketing: boolean
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  orders_count: number
  state: string
  total_spent: string
  last_order_id: number
  note: string
  verified_email: boolean
  multipass_identifier: string
  tax_exempt: boolean
  tags: string
  last_order_name: string
  currency: string
  phone: string
  addresses: any[]
  accepts_marketing_updated_at: string
  marketing_opt_in_level: string
  tax_exemptions: any[]
  admin_graphql_api_id: string
  default_address: any
}

export interface SyncResult {
  syncId: string
  successful: number
  failed: number
  total: number
  errors: string[]
}

export interface SyncStatus {
  id: string
  entity: string
  direction: 'push' | 'pull'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  error?: string
  results?: {
    successful: number
    failed: number
    total: number
  }
}

export interface WebhookEvent {
  id: string
  type: string
  shop_domain: string
  created_at: string
  data: any
}
