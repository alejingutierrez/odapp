# Guía de Seguridad - ODA Platform

## 🛡️ Configuración de Seguridad para Producción

### 1. Variables de Entorno Críticas

**Nunca uses valores por defecto en producción:**

```bash
# Contraseñas fuertes (mínimo 32 caracteres)
POSTGRES_PASSWORD=tu-contraseña-super-segura-postgres-min-32-chars
REDIS_PASSWORD=tu-contraseña-super-segura-redis-min-32-chars
JWT_SECRET=tu-jwt-secret-super-seguro-min-32-chars-aleatorio
SESSION_SECRET=tu-session-secret-super-seguro-min-32-chars

# Credenciales de servicios
ELASTIC_PASSWORD=tu-contraseña-elasticsearch-segura
RABBITMQ_PASSWORD=tu-contraseña-rabbitmq-segura
MINIO_ROOT_PASSWORD=tu-contraseña-minio-segura
```

### 2. Configuración de Red

**Firewall y Puertos:**

```bash
# Solo exponer puertos necesarios
# Producción - Solo estos puertos deben ser públicos:
80/tcp    # HTTP (redirigir a HTTPS)
443/tcp   # HTTPS
22/tcp    # SSH (cambiar puerto por defecto)

# Puertos internos (solo acceso desde red interna):
5432/tcp  # PostgreSQL
6379/tcp  # Redis
9200/tcp  # Elasticsearch
5672/tcp  # RabbitMQ
9000/tcp  # MinIO
```

**Configuración de CORS:**

```bash
# Restringir orígenes permitidos
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### 3. SSL/TLS

**Nginx con SSL:**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer-when-downgrade always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4. Base de Datos

**PostgreSQL Security:**

```sql
-- Crear usuario con permisos limitados
CREATE USER oda_app WITH PASSWORD 'contraseña-segura';
GRANT CONNECT ON DATABASE oda_prod TO oda_app;
GRANT USAGE ON SCHEMA public TO oda_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO oda_app;

-- Configurar pg_hba.conf
# Solo conexiones SSL
hostssl all all 0.0.0.0/0 md5
```

### 5. Contenedores Docker

**Mejores Prácticas:**

```dockerfile
# Usar usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Escanear vulnerabilidades
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Limitar recursos
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### 6. Secrets Management

**Docker Secrets:**

```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

services:
  backend:
    secrets:
      - postgres_password
      - jwt_secret
```

### 7. Logging y Auditoría

**Configurar logs de seguridad:**

```yaml
# En docker-compose.prod.yml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
    labels: 'service,environment'
```

### 8. Monitoreo de Seguridad

**Alertas críticas:**

```yaml
# Prometheus rules
groups:
  - name: security
    rules:
      - alert: HighFailedLogins
        expr: rate(failed_login_attempts[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'Alto número de intentos de login fallidos'

      - alert: UnauthorizedAccess
        expr: rate(http_requests_total{status=~"401|403"}[5m]) > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Intentos de acceso no autorizado detectados'
```

### 9. Actualizaciones de Seguridad

**Script de actualización:**

```bash
#!/bin/bash
# Actualizar imágenes base regularmente
docker-compose pull
docker-compose build --no-cache
docker-compose up -d

# Verificar vulnerabilidades
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image oda-backend:latest
```

### 10. Backup Seguro

**Encriptar backups:**

```bash
# Backup encriptado
pg_dump -U oda_user oda_prod | gpg --symmetric --cipher-algo AES256 > backup.sql.gpg

# Restore
gpg --decrypt backup.sql.gpg | psql -U oda_user -d oda_prod
```

## ✅ Checklist de Seguridad

### Pre-Producción

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar SSL/TLS
- [ ] Restringir acceso de red (firewall)
- [ ] Configurar CORS apropiadamente
- [ ] Habilitar logs de auditoría
- [ ] Configurar monitoreo de seguridad
- [ ] Escanear vulnerabilidades en imágenes
- [ ] Configurar backups encriptados

### Post-Despliegue

- [ ] Verificar certificados SSL
- [ ] Probar configuración de firewall
- [ ] Validar logs de seguridad
- [ ] Configurar alertas de monitoreo
- [ ] Documentar procedimientos de respuesta a incidentes
- [ ] Programar actualizaciones regulares

### Mantenimiento Regular

- [ ] Actualizar imágenes base mensualmente
- [ ] Rotar secretos trimestralmente
- [ ] Revisar logs de seguridad semanalmente
- [ ] Probar procedimientos de backup mensualmente
- [ ] Auditar accesos y permisos trimestralmente

## 🚨 Respuesta a Incidentes

### Detección de Intrusión

1. Aislar el sistema afectado
2. Preservar evidencia (logs, memoria)
3. Notificar al equipo de seguridad
4. Analizar el alcance del incidente
5. Implementar medidas correctivas
6. Documentar lecciones aprendidas

### Contactos de Emergencia

```bash
# Logs críticos
tail -f /var/log/auth.log
docker-compose logs --tail=100 -f backend

# Detener servicios comprometidos
docker-compose stop [servicio]

# Backup de emergencia
./scripts/backup-restore.sh backup
```

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
