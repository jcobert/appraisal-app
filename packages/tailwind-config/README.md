# @repo/tailwind-config

Shared Tailwind CSS configuration for the monorepo, providing consistent design tokens, brand colors, animations, and styling across all apps.

## Features

- 🎨 **Brand Colors** - Centralized brand color palette
- 🎭 **Design Tokens** - shadcn/ui color system with CSS variables
- ✨ **Animations** - Reusable keyframes and animation utilities
- 📏 **Typography** - Consistent font families and sizing
- 🎯 **Layout** - Shared breakpoints and spacing

## Usage

### In Your App's Tailwind Config

```typescript
// apps/app/tailwind.config.ts
import type { Config } from 'tailwindcss'

import baseConfig from '@repo/tailwind-config'

export default {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Add app-specific customizations
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
} satisfies Config
```

### In Your App's CSS File

**IMPORTANT:** You must import the shared styles to get shadcn CSS variables:

```css
/* apps/app/src/styles/tailwind.css */
@import '@repo/tailwind-config/styles.css';

/* App-specific styles below */
```

This imports:

- Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- shadcn/ui CSS variables (required for components to work)
- Base styles (body, links, etc.)

### Accessing Colors Directly

```typescript
// In your components
import { brandColors } from '@repo/tailwind-config/colors'

<div style={{ color: brandColors.brand }} />
```

## Brand Colors

- `brand` - Primary brand color (#0D9B8A)
- `brand-light` - Lighter brand variant
- `brand-dark` - Darker brand variant
- `almost-black` - Near-black for text (#1F2023)
- `almost-white` - Near-white for backgrounds (#FDFDFF)

## Animations

Pre-built animations available:

- `flicker` - Flickering glow effect
- `shimmer` - Loading shimmer effect
- `fadeIn` / `fadeOut` - Fade transitions
- `scaleIn` / `scaleOut` - Scale transitions
- `accordion-down` / `accordion-up` - Accordion animations
- And more...

## Structure

## Structure

```
packages/tailwind-config/
├── base.ts         # Main Tailwind config export
├── colors.ts       # Brand and shadcn colors
├── animations.ts   # Keyframes and animations
├── styles.css      # Base CSS with shadcn variables (REQUIRED)
├── package.json
└── README.md
```

## Adding New shadcn Components

When you add a new shadcn component to `@repo/ui`:

1. **CSS Variables are already shared** ✅  
   All apps that import `@repo/tailwind-config/styles.css` have access

2. **Tailwind config is already shared** ✅  
   All shadcn color utilities work automatically

3. **No changes needed** ✅  
   Just `npx shadcn add [component]` in `packages/ui`

Example:

```bash
cd packages/ui
npx shadcn@latest add badge
```

The new component will:

- ✅ Use shared CSS variables from `styles.css`
- ✅ Work in all apps (app + web)
- ✅ Follow the shared design system

## Structure

## Benefits

✅ **Single source of truth** for design tokens  
✅ **Consistent branding** across all apps  
✅ **Easy updates** - change once, applies everywhere  
✅ **Type-safe** - Full TypeScript support  
✅ **Modular** - Import only what you need
