# WebSocket Infrastructure Documentation

## Overview

The WebSocket infrastructure provides real-time communication capabilities for the Oda Fashion Platform, enabling instant updates for inventory changes, order status updates, Shopify synchronization, and system notifications.

## Architecture

### Core Components

- **WebSocketService**: Main service handling Socket.io connections and broadcasting
- **Authentication Middleware**: JWT-based authentication for WebSocket connections
- **Room-based Subscriptions**: Organized event broadcasting using Socket.io rooms
- **Event Integration**: Seamless integration with InventoryService, OrderService, and ShopifyService

### Technology Stack

- **Socket.io 4.7.4**: WebSocket library with fallback support
- **JWT Authentication**: Secure token-based authentication
- **Room Management**: Efficient event broadcasting to specific user groups
- **Error Handling**: Comprehensive error handling and connection resilience

## Features Implemented

### ✅ WebSocket Server with Socket.io

- Real-time bidirectional communication
- Support for WebSocket and polling transports
- Connection management and tracking
- Graceful disconnection handling

### ✅ Authentication and Authorization

- JWT token validation on connection
- User role loading and permission checking
- Secure connection establishment
- Automatic token refresh support

### ✅ Real-time Inventory Updates

- Stock level change notifications
- Low stock alerts with thresholds
- Inventory reservation updates
- Multi-location inventory tracking
- Product and variant-specific subscriptions

### ✅ Order Status Notifications

- Real-time order status changes
- Customer-specific order subscriptions
- Order lifecycle event broadcasting
- Payment and fulfillment updates

### ✅ Shopify Sync Status

- Sync progress notifications (products, inventory, orders, customers)
- Webhook event broadcasting
- Error and completion notifications
- Detailed sync metrics and status

### ✅ User Activity Broadcasting

- User login/logout notifications
- Product creation/modification events
- System maintenance announcements
- Security alerts and warnings

## API Reference

### Connection Events

```typescript
// Client connection
socket.on('connect', () => {
  console.log('Connected to WebSocket server')
})

// Connection confirmation
socket.on('connected', (data) => {
  console.log('Connection confirmed:', data)
})
```

### Subscription Events

```typescript
// Subscribe to inventory updates
socket.emit('subscribe:inventory', {
  locationIds: ['location-1', 'location-2'],
  productIds: ['product-1', 'product-2'],
})

// Subscribe to order updates
socket.emit('subscribe:orders', {
  customerId: 'customer-123', // Optional
})

// Subscribe to notifications
socket.emit('subscribe:notifications')
```

### Inventory Events

```typescript
// Inventory level updates
socket.on('inventory:updated', (payload) => {
  console.log('Inventory updated:', payload.data)
})

// Low stock alerts
socket.on('inventory:lowStock', (payload) => {
  console.log('Low stock alert:', payload.data)
})

// Inventory operations
socket.emit('inventory:update', {
  inventoryItemId: 'item-123',
  quantity: 100,
  reason: 'Stock adjustment',
})

socket.emit('inventory:reserve', {
  inventoryItemId: 'item-123',
  quantity: 10,
  reason: 'Order reservation',
})
```

### Order Events

```typescript
// Order status updates
socket.on('order:updated', (payload) => {
  console.log('Order updated:', payload.data)
})
```

### Shopify Events

```typescript
// Sync status updates
socket.on('shopify:syncStatus', (payload) => {
  console.log('Sync status:', payload.data)
})

// Product sync events
socket.on('shopify:product:progress', (payload) => {
  console.log('Product sync progress:', payload.data)
})

// Webhook events
socket.on('shopify:webhook:received', (payload) => {
  console.log('Webhook received:', payload.data)
})
```

### Notification Events

```typescript
// General notifications
socket.on('notification', (payload) => {
  switch (payload.type) {
    case 'user:activity':
      console.log('User activity:', payload.data)
      break
    case 'system:event':
      console.log('System event:', payload.data)
      break
    case 'system:maintenance':
      console.log('Maintenance notification:', payload.data)
      break
    case 'security:alert':
      console.log('Security alert:', payload.data)
      break
  }
})
```

## Room Structure

### Inventory Rooms

- `inventory:all` - All inventory updates
- `inventory:location:{locationId}` - Location-specific updates
- `inventory:product:{productId}` - Product-specific updates

### Order Rooms

- `orders:all` - All order updates
- `orders:customer:{customerId}` - Customer-specific orders

### User Rooms

- `user:{userId}` - User-specific notifications
- `notifications:{userId}` - User notification preferences

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message)
})
```

### Operation Errors

```typescript
socket.on('inventory:updateError', (data) => {
  console.error('Inventory update failed:', data.error)
})

socket.on('inventory:reservationError', (data) => {
  console.error('Reservation failed:', data.error)
})
```

## Security Features

- JWT token validation on connection
- Role-based permission checking
- Secure room subscriptions
- Rate limiting protection
- CORS configuration
- Input validation and sanitization

## Performance Considerations

- Efficient room-based broadcasting
- Connection pooling and management
- Memory-efficient user tracking
- Optimized event payload sizes
- Graceful degradation on high load

## Integration Points

### InventoryService Integration

- Automatic event listening for inventory changes
- Real-time stock level broadcasting
- Low stock alert propagation

### OrderService Integration

- Order status change notifications
- Customer-specific order updates
- Payment and fulfillment events

### ShopifyService Integration

- Sync progress notifications
- Webhook event broadcasting
- Error and completion status

## Testing

Comprehensive test coverage includes:

- Connection and authentication tests
- Event broadcasting verification
- Permission-based access control
- Error handling scenarios
- Integration with other services
- Connection resilience testing

## Monitoring and Logging

- Connection statistics tracking
- Event broadcasting metrics
- Error logging and alerting
- Performance monitoring
- User activity tracking

## Future Enhancements

- Push notification integration
- Message queuing for offline users
- Advanced analytics and metrics
- Horizontal scaling support
- Enhanced security features
