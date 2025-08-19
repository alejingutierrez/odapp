export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: 'active' | 'archived' | 'draft';
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image: ShopifyImage;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2: string;
  option3: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  image_id: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

export interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip: string;
  buyer_accepts_marketing: boolean;
  cancel_reason: string;
  cancelled_at: string;
  cart_token: string;
  checkout_id: number;
  checkout_token: string;
  client_details: ShopifyClientDetails;
  closed_at: string;
  confirmed: boolean;
  contact_email: string;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_subtotal_price_set: ShopifyMoneySet;
  current_total_discounts: string;
  current_total_discounts_set: ShopifyMoneySet;
  current_total_duties_set: ShopifyMoneySet;
  current_total_price: string;
  current_total_price_set: ShopifyMoneySet;
  current_total_tax: string;
  current_total_tax_set: ShopifyMoneySet;
  customer_locale: string;
  device_id: number;
  discount_codes: ShopifyDiscountCode[];
  email: string;
  estimated_taxes: boolean;
  financial_status: string;
  fulfillment_status: string;
  gateway: string;
  landing_site: string;
  landing_site_ref: string;
  location_id: number;
  name: string;
  note: string;
  note_attributes: ShopifyNoteAttribute[];
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_duties_set: ShopifyMoneySet;
  payment_gateway_names: string[];
  phone: string;
  presentment_currency: string;
  processed_at: string;
  processing_method: string;
  reference: string;
  referring_site: string;
  source_identifier: string;
  source_name: string;
  source_url: string;
  subtotal_price: string;
  subtotal_price_set: ShopifyMoneySet;
  tags: string;
  tax_lines: ShopifyTaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_discounts_set: ShopifyMoneySet;
  total_line_items_price: string;
  total_line_items_price_set: ShopifyMoneySet;
  total_outstanding: string;
  total_price: string;
  total_price_set: ShopifyMoneySet;
  total_price_usd: string;
  total_shipping_price_set: ShopifyMoneySet;
  total_tax: string;
  total_tax_set: ShopifyMoneySet;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number;
  billing_address: ShopifyAddress;
  customer: ShopifyCustomer;
  discount_applications: ShopifyDiscountApplication[];
  fulfillments: ShopifyFulfillment[];
  line_items: ShopifyLineItem[];
  payment_details: ShopifyPaymentDetails;
  refunds: ShopifyRefund[];
  shipping_address: ShopifyAddress;
  shipping_lines: ShopifyShippingLine[];
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: number;
  note: string;
  verified_email: boolean;
  multipass_identifier: string;
  tax_exempt: boolean;
  phone: string;
  tags: string;
  last_order_name: string;
  currency: string;
  addresses: ShopifyAddress[];
  accepts_marketing_updated_at: string;
  marketing_opt_in_level: string;
  tax_exemptions: string[];
  admin_graphql_api_id: string;
  default_address: ShopifyAddress;
}

export interface ShopifyAddress {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
  name: string;
  province_code: string;
  country_code: string;
  country_name: string;
  default: boolean;
}

export interface ShopifyLineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  sku: string;
  variant_title: string;
  vendor: string;
  fulfillment_service: string;
  product_id: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management: string;
  properties: ShopifyProperty[];
  product_exists: boolean;
  fulfillable_quantity: number;
  grams: number;
  price: string;
  total_discount: string;
  fulfillment_status: string;
  price_set: ShopifyMoneySet;
  total_discount_set: ShopifyMoneySet;
  discount_allocations: ShopifyDiscountAllocation[];
  duties: ShopifyDuty[];
  admin_graphql_api_id: string;
  tax_lines: ShopifyTaxLine[];
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export interface ShopifyWebhook {
  id: number;
  address: string;
  topic: string;
  created_at: string;
  updated_at: string;
  format: string;
  fields: string[];
  metafield_namespaces: string[];
  api_client_id: number;
  private_metafield_namespaces: string[];
}

// Supporting interfaces
export interface ShopifyClientDetails {
  accept_language: string;
  browser_height: number;
  browser_ip: string;
  browser_width: number;
  session_hash: string;
  user_agent: string;
}

export interface ShopifyMoneySet {
  shop_money: ShopifyMoney;
  presentment_money: ShopifyMoney;
}

export interface ShopifyMoney {
  amount: string;
  currency_code: string;
}

export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: string;
}

export interface ShopifyNoteAttribute {
  name: string;
  value: string;
}

export interface ShopifyTaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: ShopifyMoneySet;
  channel_liable: boolean;
}

export interface ShopifyDiscountApplication {
  target_type: string;
  type: string;
  value: string;
  value_type: string;
  allocation_method: string;
  target_selection: string;
  code: string;
  description: string;
  title: string;
}

export interface ShopifyFulfillment {
  id: number;
  order_id: number;
  status: string;
  created_at: string;
  service: string;
  updated_at: string;
  tracking_company: string;
  shipment_status: string;
  location_id: number;
  line_items: ShopifyLineItem[];
  tracking_number: string;
  tracking_numbers: string[];
  tracking_url: string;
  tracking_urls: string[];
  receipt: ShopifyReceipt;
  name: string;
  admin_graphql_api_id: string;
}

export interface ShopifyPaymentDetails {
  credit_card_bin: string;
  avs_result_code: string;
  cvv_result_code: string;
  credit_card_number: string;
  credit_card_company: string;
}

export interface ShopifyRefund {
  id: number;
  order_id: number;
  created_at: string;
  note: string;
  user_id: number;
  processed_at: string;
  restock: boolean;
  duties: ShopifyDuty[];
  admin_graphql_api_id: string;
  refund_line_items: ShopifyRefundLineItem[];
  transactions: ShopifyTransaction[];
  order_adjustments: ShopifyOrderAdjustment[];
}

export interface ShopifyShippingLine {
  id: number;
  carrier_identifier: string;
  code: string;
  delivery_category: string;
  discounted_price: string;
  discounted_price_set: ShopifyMoneySet;
  phone: string;
  price: string;
  price_set: ShopifyMoneySet;
  requested_fulfillment_service_id: string;
  source: string;
  title: string;
  tax_lines: ShopifyTaxLine[];
  discount_allocations: ShopifyDiscountAllocation[];
}

export interface ShopifyProperty {
  name: string;
  value: string;
}

export interface ShopifyDiscountAllocation {
  amount: string;
  amount_set: ShopifyMoneySet;
  discount_application_index: number;
}

export interface ShopifyDuty {
  id: string;
  harmonized_system_code: string;
  country_code_of_origin: string;
  shop_money: ShopifyMoney;
  presentment_money: ShopifyMoney;
  tax_lines: ShopifyTaxLine[];
  admin_graphql_api_id: string;
}

export interface ShopifyReceipt {
  testcase: boolean;
  authorization: string;
}

export interface ShopifyRefundLineItem {
  id: number;
  quantity: number;
  line_item_id: number;
  location_id: number;
  restock_type: string;
  subtotal: string;
  subtotal_set: ShopifyMoneySet;
  total_tax: string;
  total_tax_set: ShopifyMoneySet;
  line_item: ShopifyLineItem;
}

export interface ShopifyTransaction {
  id: number;
  order_id: number;
  kind: string;
  gateway: string;
  status: string;
  message: string;
  created_at: string;
  test: boolean;
  authorization: string;
  location_id: number;
  user_id: number;
  parent_id: number;
  processed_at: string;
  device_id: number;
  receipt: ShopifyReceipt;
  currency_exchange_adjustment: ShopifyCurrencyExchangeAdjustment;
  amount: string;
  currency: string;
  admin_graphql_api_id: string;
}

export interface ShopifyOrderAdjustment {
  id: number;
  order_id: number;
  refund_id: number;
  amount: string;
  amount_set: ShopifyMoneySet;
  kind: string;
  reason: string;
  tax_amount: string;
  tax_amount_set: ShopifyMoneySet;
  admin_graphql_api_id: string;
}

export interface ShopifyCurrencyExchangeAdjustment {
  id: number;
  adjustment: string;
  original_amount: string;
  final_amount: string;
  currency: string;
}

// Webhook event types
export interface WebhookEvent {
  topic: string;
  shop_domain: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: Date;
}

// Sync related types
export interface SyncResult {
  syncId: string;
  successful: number;
  failed: number;
  total: number;
  errors: any[];
}

export interface SyncStatus {
  id: string;
  entityType: string;
  direction: 'push' | 'pull';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  successful: number;
  failed: number;
  total: number;
  errors: any[];
}

export interface ConflictResolution {
  action: 'merge' | 'overwrite' | 'skip';
  mergedData?: any;
  reason: string;
}

export interface ProductConflict {
  localProduct: any;
  shopifyProduct: ShopifyProduct;
  conflictFields: string[];
  conflictType: 'data' | 'timestamp' | 'version';
}

export interface CustomerConflict {
  localCustomer: any;
  shopifyCustomer: ShopifyCustomer;
  conflictFields: string[];
  conflictType: 'data' | 'timestamp' | 'duplicate';
}

// Rate limiting types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstLimit: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetTime: Date;
  isLimited: boolean;
}

// Circuit breaker types
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerStatus {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// Retry types
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: Error;
}