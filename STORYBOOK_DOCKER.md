# Storybook con Docker

Este documento explica cómo usar Storybook con Docker en el proyecto Oda.

## Configuración

Storybook está configurado para ejecutarse tanto en modo desarrollo como producción usando Docker.

### Desarrollo

Para ejecutar Storybook en modo desarrollo:

```bash
# Levantar solo Storybook
pnpm docker:storybook

# Ver logs de Storybook
pnpm docker:storybook:logs

# Levantar todos los servicios incluyendo Storybook
pnpm docker:dev
```

Storybook estará disponible en: http://localhost:6006

### Producción

Para ejecutar Storybook en modo producción:

```bash
# Construir y ejecutar todos los servicios
docker-compose -f docker/docker-compose.prod.yml up -d

# Solo Storybook
docker-compose -f docker/docker-compose.prod.yml up -d storybook
```

## Características

### Modo Desarrollo

- **Hot Reload**: Los cambios en los componentes se reflejan automáticamente
- **Volúmenes montados**: El código fuente está montado para desarrollo en tiempo real
- **Puerto**: 6006

### Modo Producción

- **Build estático**: Storybook se construye como archivos estáticos
- **Nginx**: Servido a través de Nginx optimizado
- **Compresión**: Gzip habilitado para mejor rendimiento
- **Cache**: Headers de cache optimizados para assets estáticos
- **Puerto**: 6006 (mapeado a puerto 80 interno)

## Estructura de Archivos

```
├── Dockerfile.storybook          # Dockerfile multi-stage para Storybook
├── apps/frontend/
│   ├── .storybook/
│   │   ├── main.ts              # Configuración principal
│   │   └── preview.ts           # Configuración de preview y decorators
│   └── src/
│       └── stories/             # Historias de componentes
└── docker/
    ├── docker-compose.dev.yml   # Configuración desarrollo
    └── docker-compose.prod.yml  # Configuración producción
```

## Comandos Útiles

```bash
# Construir imagen de Storybook
docker build -f Dockerfile.storybook -t oda-storybook .

# Ejecutar solo el contenedor de Storybook
docker run -p 6006:6006 oda-storybook

# Ver logs en tiempo real
docker-compose -f docker/docker-compose.dev.yml logs -f storybook

# Reconstruir el servicio
docker-compose -f docker/docker-compose.dev.yml up -d --build storybook

# Parar solo Storybook
docker-compose -f docker/docker-compose.dev.yml stop storybook
```

## Configuración de Ant Design

Storybook está configurado con:

- **Locale**: Español (es_ES)
- **ConfigProvider**: Envuelve todos los componentes
- **Padding**: Espaciado por defecto en las historias

## Addons Incluidos

- **@storybook/addon-docs**: Documentación automática
- **@storybook/addon-essentials**: Controles, acciones, viewport, etc.
- **@storybook/addon-interactions**: Testing de interacciones
- **@storybook/addon-links**: Enlaces entre historias

## Troubleshooting

### Puerto ocupado

Si el puerto 6006 está ocupado:

```bash
# Cambiar puerto en docker-compose.dev.yml
ports:
  - "6007:6006"  # Usar puerto 6007 en su lugar
```

### Problemas de build

```bash
# Limpiar y reconstruir
docker-compose -f docker/docker-compose.dev.yml down
docker system prune -f
pnpm docker:storybook
```

### Hot reload no funciona

Verificar que los volúmenes estén correctamente montados en docker-compose.dev.yml:

```yaml
volumes:
  - ../apps/frontend:/app/apps/frontend
  - ../packages:/app/packages
```

### Verificar que funciona

```bash
# Verificar estado del contenedor
docker ps | grep storybook

# Verificar que responde
curl -I http://localhost:6006

# Ver logs en tiempo real
docker-compose -f docker/docker-compose.dev.yml logs -f storybook
```

## Estado Actual

✅ **Funcionando correctamente**

- Storybook v9.1.2 ejecutándose en Node.js 20
- Disponible en http://localhost:6006
- Hot reload habilitado para desarrollo
- Build time: ~5 segundos
- Manager: ~700ms, Preview: ~4.6s
- Optimización automática de dependencias habilitada

### Logs de éxito:

```
Storybook 9.1.2 for react-vite started
693 ms for manager and 4.63 s for preview

Local:            http://localhost:6006/
On your network:  http://0.0.0.0:6006/
```
