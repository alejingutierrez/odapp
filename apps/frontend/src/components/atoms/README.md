# Átomos del Sistema de Diseño ODA

Los átomos son los componentes más básicos y fundamentales de nuestro sistema de diseño. Están construidos sobre Ant Design y proporcionan una base sólida para construir componentes más complejos en nuestro ERP/CRM/CDP.

## Componentes Disponibles

### 1. StatusBadge

Muestra el estado de elementos con colores e iconos apropiados.

- **Casos de uso**: Estados de órdenes, usuarios, procesos
- **Estados**: active, inactive, pending, error, warning, success

### 2. PriorityTag

Etiquetas para indicar prioridad con colores distintivos.

- **Casos de uso**: Tickets, tareas, issues
- **Prioridades**: low, medium, high, urgent

### 3. CurrencyDisplay

Formatea y muestra valores monetarios con soporte internacional.

- **Casos de uso**: Precios, totales, reportes financieros
- **Características**: Múltiples monedas, colorización, precisión configurable

### 4. DateDisplay

Muestra fechas en diferentes formatos con tooltips informativos.

- **Casos de uso**: Fechas de creación, vencimientos, timestamps
- **Formatos**: short, medium, long, relative, time, datetime

### 5. ProgressIndicator

Indicadores de progreso en diferentes variantes y tamaños.

- **Casos de uso**: Carga de datos, progreso de tareas, completitud
- **Variantes**: line, circle, dashboard

### 6. LoadingSpinner

Spinners de carga con diferentes configuraciones.

- **Casos de uso**: Estados de carga, overlays, contenido dinámico
- **Características**: Overlay, centrado, con texto

### 7. IconButton

Botones con iconos optimizados para acciones rápidas.

- **Casos de uso**: Acciones de tabla, toolbar, navegación
- **Características**: Tooltips, variantes, forma circular

### 8. MetricCard

Tarjetas para mostrar métricas con tendencias.

- **Casos de uso**: Dashboards, KPIs, estadísticas
- **Características**: Tendencias, colores, prefijos/sufijos

### 9. EmptyState

Estados vacíos con acciones opcionales.

- **Casos de uso**: Listas vacías, resultados de búsqueda, estados iniciales
- **Características**: Acciones personalizables, diferentes tamaños

### 10. Avatar

Avatares de usuario con estados y badges.

- **Casos de uso**: Perfiles, equipos, asignaciones
- **Características**: Iniciales automáticas, estados online, badges

## Principios de Diseño

### Consistencia

Todos los átomos siguen patrones consistentes de:

- Props y API
- Naming conventions
- Comportamiento de estados
- Accesibilidad

### Flexibilidad

Cada átomo es configurable para diferentes casos de uso:

- Tamaños (small, default, large)
- Variantes de color y estilo
- Estados interactivos
- Contenido personalizable

### Composabilidad

Los átomos están diseñados para:

- Combinarse en componentes más complejos
- Mantener su funcionalidad independiente
- Ser reutilizables en diferentes contextos

## Testing

Cada átomo incluye:

- Tests unitarios completos
- Casos de edge cases
- Tests de accesibilidad
- Cobertura de props y estados

## Storybook

Cada átomo tiene stories que demuestran:

- Casos de uso básicos
- Todas las variantes
- Estados interactivos
- Ejemplos de composición

## Uso

```tsx
import {
  StatusBadge,
  PriorityTag,
  CurrencyDisplay,
  DateDisplay,
  MetricCard
} from '@oda/ui';

// Ejemplo de uso en un dashboard
<MetricCard
  title="Revenue"
  value={125430}
  prefix={<DollarOutlined />}
  trend="up"
  trendValue="+12.5%"
/>

// Ejemplo de estado en tabla
<StatusBadge status="active" />
<PriorityTag priority="high" />
<DateDisplay date={new Date()} format="relative" />
```

## Desarrollo y Documentación

### Storybook

Para ver los componentes en acción, usa el Storybook principal del proyecto:

```bash
# Opción 1: Con Docker (recomendado)
docker-compose -f docker/docker-compose.dev.yml up storybook

# Opción 2: Local
cd apps/frontend
npm run storybook
```

Storybook estará disponible en: http://localhost:6006

Los átomos aparecerán en la sección "Atoms" del Storybook.

### Testing

Para ejecutar los tests de los átomos:

```bash
cd packages/ui
npm test
```

## Próximos Pasos

Estos átomos servirán como base para construir:

- Moléculas (componentes compuestos)
- Organismos (secciones complejas)
- Templates (layouts)
- Pages (vistas completas)

Cada nivel construirá sobre estos fundamentos sólidos para crear una experiencia de usuario coherente y eficiente en todo el sistema ODA.
