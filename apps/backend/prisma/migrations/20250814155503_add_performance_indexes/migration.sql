-- Add performance indexes for frequently accessed fields

-- Products performance indexes
CREATE INDEX IF NOT EXISTS "idx_products_name_search" ON "products" USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS "idx_products_description_search" ON "products" USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS "idx_products_brand" ON "products" ("brand");
CREATE INDEX IF NOT EXISTS "idx_products_material" ON "products" ("material");
CREATE INDEX IF NOT EXISTS "idx_products_price_range" ON "products" ("price", "compareAtPrice");
CREATE INDEX IF NOT EXISTS "idx_products_created_at_desc" ON "products" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_products_updated_at_desc" ON "products" ("updatedAt" DESC);

-- Product variants performance indexes
CREATE INDEX IF NOT EXISTS "idx_product_variants_options" ON "product_variants" ("option1Value", "option2Value", "option3Value");
CREATE INDEX IF NOT EXISTS "idx_product_variants_price" ON "product_variants" ("price");

-- Inventory performance indexes
CREATE INDEX IF NOT EXISTS "idx_inventory_low_stock" ON "inventory_items" ("quantity", "lowStockThreshold") WHERE "quantity" <= "lowStockThreshold";
CREATE INDEX IF NOT EXISTS "idx_inventory_available" ON "inventory_items" ("availableQuantity") WHERE "availableQuantity" > 0;
CREATE INDEX IF NOT EXISTS "idx_inventory_location_product" ON "inventory_items" ("locationId", "productId");
CREATE INDEX IF NOT EXISTS "idx_inventory_updated_at" ON "inventory_items" ("updatedAt" DESC);

-- Orders performance indexes
CREATE INDEX IF NOT EXISTS "idx_orders_customer_date" ON "orders" ("customerId", "orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_status_date" ON "orders" ("status", "orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_financial_status" ON "orders" ("financialStatus", "orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_fulfillment_status" ON "orders" ("fulfillmentStatus", "orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_total_amount" ON "orders" ("totalAmount" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_date_range" ON "orders" ("orderDate" DESC, "status");

-- Customers performance indexes
CREATE INDEX IF NOT EXISTS "idx_customers_lifetime_value" ON "customers" ("lifetimeValue" DESC);
CREATE INDEX IF NOT EXISTS "idx_customers_total_orders" ON "customers" ("totalOrders" DESC);
CREATE INDEX IF NOT EXISTS "idx_customers_last_order" ON "customers" ("lastOrderAt" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_customers_loyalty_points" ON "customers" ("loyaltyPoints" DESC);
CREATE INDEX IF NOT EXISTS "idx_customers_created_at" ON "customers" ("customerSince" DESC);

-- Customer addresses performance indexes
CREATE INDEX IF NOT EXISTS "idx_customer_addresses_location" ON "customer_addresses" ("country", "state", "city");
CREATE INDEX IF NOT EXISTS "idx_customer_addresses_postal" ON "customer_addresses" ("postalCode");

-- Order items performance indexes
CREATE INDEX IF NOT EXISTS "idx_order_items_product_date" ON "order_items" ("productId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_order_items_variant_date" ON "order_items" ("variantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_order_items_sku" ON "order_items" ("sku") WHERE "sku" IS NOT NULL;

-- Inventory adjustments performance indexes
CREATE INDEX IF NOT EXISTS "idx_inventory_adjustments_date" ON "inventory_adjustments" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_inventory_adjustments_type_date" ON "inventory_adjustments" ("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_inventory_adjustments_reference" ON "inventory_adjustments" ("referenceType", "referenceId") WHERE "referenceType" IS NOT NULL;

-- Shopify sync performance indexes
CREATE INDEX IF NOT EXISTS "idx_shopify_syncs_status_date" ON "shopify_syncs" ("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_shopify_syncs_type_status" ON "shopify_syncs" ("type", "status");
CREATE INDEX IF NOT EXISTS "idx_shopify_webhooks_processed" ON "shopify_webhooks" ("processed", "receivedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_shopify_webhooks_topic" ON "shopify_webhooks" ("topic", "receivedAt" DESC);

-- Audit logs performance indexes
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_date" ON "audit_logs" ("entity", "entityId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_date" ON "audit_logs" ("userId", "createdAt" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_date" ON "audit_logs" ("action", "createdAt" DESC);

-- System health performance indexes
CREATE INDEX IF NOT EXISTS "idx_system_health_service_date" ON "system_health" ("service", "checkedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_system_health_status_date" ON "system_health" ("status", "checkedAt" DESC);

-- User sessions performance indexes
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires" ON "user_sessions" ("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_last_used" ON "user_sessions" ("lastUsedAt" DESC NULLS LAST);

-- Collections performance indexes
CREATE INDEX IF NOT EXISTS "idx_collection_products_sort" ON "collection_products" ("collectionId", "sortOrder");

-- Categories performance indexes
CREATE INDEX IF NOT EXISTS "idx_categories_parent_sort" ON "categories" ("parentId", "sortOrder") WHERE "parentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_categories_active_sort" ON "categories" ("isActive", "sortOrder") WHERE "isActive" = true;

-- Customer interactions performance indexes
CREATE INDEX IF NOT EXISTS "idx_customer_interactions_type_date" ON "customer_interactions" ("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_customer_interactions_channel" ON "customer_interactions" ("channel", "createdAt" DESC);

-- Loyalty transactions performance indexes
CREATE INDEX IF NOT EXISTS "idx_loyalty_transactions_type_date" ON "loyalty_transactions" ("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_loyalty_transactions_reference" ON "loyalty_transactions" ("referenceType", "referenceId") WHERE "referenceType" IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_products_category_status_active" ON "products" ("categoryId", "status", "isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_inventory_location_available" ON "inventory_items" ("locationId", "availableQuantity") WHERE "availableQuantity" > 0;
CREATE INDEX IF NOT EXISTS "idx_orders_customer_status_date" ON "orders" ("customerId", "status", "orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_customers_status_value" ON "customers" ("status", "lifetimeValue" DESC) WHERE "status" = 'ACTIVE';

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "products" ("isFeatured", "createdAt" DESC) WHERE "isFeatured" = true;
CREATE INDEX IF NOT EXISTS "idx_products_active_price" ON "products" ("price", "createdAt" DESC) WHERE "isActive" = true AND "status" = 'ACTIVE';
CREATE INDEX IF NOT EXISTS "idx_orders_pending" ON "orders" ("createdAt" DESC) WHERE "status" = 'PENDING';
CREATE INDEX IF NOT EXISTS "idx_orders_processing" ON "orders" ("createdAt" DESC) WHERE "status" = 'PROCESSING';
CREATE INDEX IF NOT EXISTS "idx_customers_vip" ON "customers" ("lifetimeValue" DESC) WHERE "lifetimeValue" > 500;

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS "idx_products_full_text" ON "products" USING gin(
  to_tsvector('english', 
    COALESCE("name", '') || ' ' || 
    COALESCE("description", '') || ' ' || 
    COALESCE("brand", '') || ' ' || 
    COALESCE("material", '')
  )
);