import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: ['class'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', ...defaultTheme.fontFamily.sans],
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: '#0D9B8A',
        'brand-light': '#12A594',
        'brand-extra-light': '#d8edea',
        'brand-dark': '#008573',
        'brand-extra-dark': '#0D3D38',
        'medium-gray': '#696A72',
        'dark-gray': '#5B5D6B',
        'almost-black': '#1F2023',
        'almost-white': '#FDFDFF',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      width: {
        layout: '103.125rem',
      },
      maxWidth: ({ theme }) => ({ layout: theme('width.layout') }),
      screens: {
        '2xl': '1440px',
      },
      typography: (theme) => ({
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
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        fadeIn: {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        fadeOut: {
          from: {
            opacity: '1',
          },
          to: {
            opacity: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 200ms ease',
        fadeOut: 'fadeOut 200ms ease',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
} satisfies Config