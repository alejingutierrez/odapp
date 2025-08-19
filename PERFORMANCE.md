# Guía de Optimización de Performance - ODA Platform

## 🚀 Configuraciones de Performance para Producción

### 1. Optimización de Base de Datos (PostgreSQL)

**Configuración postgresql.conf:**

```sql
# Memoria
shared_buffers = 256MB                    # 25% de RAM disponible
effective_cache_size = 1GB               # 75% de RAM disponible
work_mem = 4MB                           # Para consultas complejas
maintenance_work_mem = 64MB              # Para VACUUM, CREATE INDEX

# Conexiones
max_connections = 100                    # Ajustar según carga
shared_preload_libraries = 'pg_stat_statements'

# WAL y Checkpoints
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 1GB
min_wal_size = 80MB

# Logging para análisis
log_min_duration_statement = 1000        # Log queries > 1s
log_statement = 'mod'                    # Log modificaciones
```

**Índices optimizados:**

```sql
-- Índices compuestos para consultas frecuentes
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email, is_active);
CREATE INDEX CONCURRENTLY idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_products_category_status ON products(category_id, status) WHERE status = 'active';

-- Índices parciales para mejor performance
CREATE INDEX CONCURRENTLY idx_active_sessions ON user_sessions(user_id) WHERE expires_at > NOW();
```

### 2. Optimización de Redis

**Configuración redis.conf:**

```conf
# Memoria
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistencia optimizada
save 900 1
save 300 10
save 60 10000

# Red
tcp-keepalive 300
timeout 0

# Performance
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
```

### 3. Configuración de Elasticsearch

**Optimización de heap y memoria:**

```yaml
# docker-compose.prod.yml
environment:
  - 'ES_JAVA_OPTS=-Xms2g -Xmx2g' # 50% de RAM disponible
  - bootstrap.memory_lock=true
  - indices.memory.index_buffer_size=10%
  - indices.memory.min_index_buffer_size=48mb
```

**Configuración de índices:**

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "30s",
    "index.mapping.total_fields.limit": 2000,
    "index.max_result_window": 50000
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      }
    }
  }
}
```

### 4. Optimización de Contenedores Docker

**Límites de recursos optimizados:**

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

**Configuración de logging:**

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
    compress: 'true'
```

### 5. Optimización de Nginx

**Configuración nginx.conf:**

```nginx
worker_processes auto;
worker_connections 1024;

# Compresión
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;

# Cache de archivos estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;

# Timeouts
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

### 6. Optimización de Node.js Backend

**Variables de entorno de performance:**

```bash
# Cluster mode
NODE_ENV=production
UV_THREADPOOL_SIZE=128
NODE_OPTIONS="--max-old-space-size=1024"

# V8 optimizations
NODE_OPTIONS="--optimize-for-size --gc-interval=100"
```

**Configuración de PM2:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'oda-backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
```

### 7. Optimización de Frontend (React)

**Webpack optimizations:**

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}
```

**Service Worker para cache:**

```javascript
// sw.js
const CACHE_NAME = 'oda-v1'
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})
```

### 8. Monitoreo de Performance

**Métricas clave a monitorear:**

```yaml
# Prometheus alerts
groups:
  - name: performance
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Alto tiempo de respuesta (>2s)'

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Alto uso de memoria (>85%)'

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Alto uso de CPU (>80%)'
```

### 9. Scripts de Optimización

**Script de análisis de performance:**

```bash
#!/bin/bash
# scripts/performance-check.sh

echo "🔍 Análisis de Performance ODA Platform"
echo "========================================"

# Database performance
echo "📊 PostgreSQL Stats:"
docker-compose exec postgres psql -U oda_user -d oda_prod -c "
SELECT schemaname,tablename,attname,n_distinct,correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC LIMIT 10;"

# Redis memory usage
echo "💾 Redis Memory:"
docker-compose exec redis redis-cli -a "$REDIS_PASSWORD" info memory | grep used_memory_human

# Container resources
echo "🐳 Container Resources:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Disk usage
echo "💿 Disk Usage:"
docker system df

# Network latency
echo "🌐 Network Latency:"
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/health"
```

### 10. Configuración de CDN

**Cloudflare optimizations:**

```javascript
// cloudflare-worker.js
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)

  // Check cache first
  let response = await cache.match(cacheKey)

  if (!response) {
    response = await fetch(request)

    // Cache static assets for 1 year
    if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      response = new Response(response.body, { ...response, headers })

      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }

  return response
}
```

## 📈 Benchmarks y Testing

### Load Testing con Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: 'API Load Test'
    requests:
      - get:
          url: '/api/products'
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
```

### Database Performance Testing

```sql
-- Query performance analysis
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active'
ORDER BY p.created_at DESC
LIMIT 20;

-- Index usage analysis
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('products', 'orders', 'users');
```

## 🎯 Checklist de Optimización

### Base de Datos

- [ ] Configurar shared_buffers apropiadamente
- [ ] Crear índices para consultas frecuentes
- [ ] Habilitar pg_stat_statements
- [ ] Configurar autovacuum
- [ ] Monitorear slow queries

### Cache y Redis

- [ ] Configurar política de eviction
- [ ] Implementar cache de sesiones
- [ ] Cache de consultas frecuentes
- [ ] Configurar TTL apropiados

### Frontend

- [ ] Implementar code splitting
- [ ] Optimizar imágenes (WebP, lazy loading)
- [ ] Configurar Service Worker
- [ ] Minificar CSS/JS
- [ ] Implementar CDN

### Backend

- [ ] Configurar cluster mode
- [ ] Implementar rate limiting
- [ ] Optimizar queries de base de datos
- [ ] Configurar connection pooling
- [ ] Implementar caching strategies

### Infraestructura

- [ ] Configurar límites de recursos
- [ ] Optimizar configuración de Nginx
- [ ] Implementar health checks
- [ ] Configurar log rotation
- [ ] Monitorear métricas clave
