import { animations, keyframes } from './animations'
import { brandColors, shadcnColors } from './colors'
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

/**
 * Base Tailwind configuration for the monorepo
 * Apps should extend this with their own content paths and customizations
 *
 * @example
 * // In your app's tailwind.config.ts:
 * import baseConfig from '@repo/tailwind-config'
 *
 * export default {
 *   ...baseConfig,
 *   content: ['./src/**\/*.{js,jsx,ts,tsx}'],
 * }
 */
const baseConfig: Omit<Config, 'content'> = {
  darkMode: ['class'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', ...defaultTheme.fontFamily.sans],
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ...brandColors,
        ...shadcnColors,
      },
      fontSize: {
        '2xs': ['0.625rem', '0.75rem'],
      },
      width: {
        layout: '103.125rem',
      },
      maxWidth: ({ theme }: any) => ({
        layout: theme('width.layout'),
      }),
      screens: {
        '2xl': '1440px',
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.950'),
            strong: { color: theme('colors.gray.950') },
            blockquote: { color: theme('colors.gray.700') },
            li: {
              color: theme('colors.gray.950'),
              '&::marker': { color: theme('colors.gray.800') },
            },
            a: {
              color: theme('colors.blue.700'),
              '&:hover': { color: theme('colors.blue.600') },
            },
            h1: {
              fontSize: theme('fontSize.4xl'),
              fontWeight: theme('fontWeight.bold'),
            },
            h2: {
              fontSize: theme('fontSize.3xl'),
              fontWeight: theme('fontWeight.bold'),
            },
            h3: {
              fontSize: theme('fontSize.2xl'),
              fontWeight: theme('fontWeight.bold'),
            },
            h4: {
              fontSize: theme('fontSize.xl'),
              fontWeight: theme('fontWeight.bold'),
            },
            h5: {
              fontSize: theme('fontSize.lg'),
              fontWeight: theme('fontWeight.bold'),
            },
            h6: {
              fontSize: theme('fontSize.base'),
              fontWeight: theme('fontWeight.bold'),
            },
          },
        },
      }),
      keyframes,
      animation: animations,
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}

export default baseConfig
