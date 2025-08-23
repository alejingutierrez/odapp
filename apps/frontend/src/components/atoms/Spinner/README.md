# Spinner Component

Un componente moderno y accesible para indicar estados de carga con múltiples variantes, tamaños y colores.

## Características

- ✅ **Sin dependencias externas**: Completamente independiente de Ant Design
- ✅ **Accesible**: Soporte completo para lectores de pantalla y navegación por teclado
- ✅ **Performante**: Animaciones optimizadas con aceleración GPU
- ✅ **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
- ✅ **Tema oscuro**: Soporte nativo para modo oscuro
- ✅ **Reducción de movimiento**: Respeta las preferencias de accesibilidad del usuario
- ✅ **TypeScript**: Completamente tipado

## Variantes Disponibles

### Animaciones

- `spin` - Círculo giratorio (por defecto)
- `dots` - Tres puntos pulsantes
- `pulse` - Círculo que pulsa
- `bars` - Barras verticales
- `ring` - Anillo doble giratorio
- `bounce` - Puntos que rebotan

### Tamaños

- `xs` - 12px
- `sm` - 16px
- `md` - 20px (por defecto)
- `lg` - 24px
- `xl` - 32px

### Colores

- `default` - Gris
- `primary` - Azul principal
- `secondary` - Gris secundario
- `success` - Verde
- `warning` - Amarillo
- `error` - Rojo
- `white` - Blanco

## Uso Básico

```tsx
import { Spinner } from '@/components/atoms/Spinner'

// Spinner básico
<Spinner />

// Con texto
<Spinner text="Cargando..." />

// Diferentes variantes
<Spinner variant="dots" color="primary" size="lg" />

// Centrado
<Spinner centered text="Cargando contenido..." />

// Como overlay
<Spinner overlay text="Procesando..." />
```

## Componentes Auxiliares

### LoadingButton

Para botones con estado de carga:

```tsx
import { LoadingButton } from '@/components/atoms/Spinner'
;<LoadingButton loading={isLoading} size='sm'>
  Guardar cambios
</LoadingButton>
```

### PageLoader

Para páginas completas:

```tsx
import { PageLoader } from '@/components/atoms/Spinner'
;<PageLoader text='Cargando dashboard...' variant='ring' minHeight='300px' />
```

### InlineLoader

Para uso en línea:

```tsx
import { InlineLoader } from '@/components/atoms/Spinner'
;<span>
  Guardando <InlineLoader size='sm' />
</span>
```

## Accesibilidad

El componente incluye soporte completo para accesibilidad:

```tsx
<Spinner
  aria-label='Cargando datos del usuario'
  text='Cargando...'
  testId='user-data-loader'
/>
```

## Personalización

El componente usa CSS custom properties para fácil personalización:

```css
:root {
  --oda-spinner-primary: #your-color;
  --oda-spinner-size-md: 24px;
  --oda-spinner-duration-normal: 1s;
}
```

## Mejoras Implementadas

1. **Eliminación de dependencias**: Ya no depende de Ant Design
2. **Mejor rendimiento**: Animaciones optimizadas con `will-change` y `transform3d`
3. **Accesibilidad mejorada**: Atributos ARIA apropiados y soporte para lectores de pantalla
4. **Diseño responsive**: Se adapta automáticamente a diferentes dispositivos
5. **Nuevas variantes**: Más opciones de animación y colores
6. **TypeScript completo**: Mejor experiencia de desarrollo
7. **CSS moderno**: Uso de custom properties y características CSS modernas
8. **Soporte para preferencias del usuario**: Respeta `prefers-reduced-motion` y `prefers-color-scheme`
