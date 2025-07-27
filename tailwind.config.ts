import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
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
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', '0.75rem'],
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
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '0.99',
            filter:
              'drop-shadow(0 0 1px rgba(252, 211, 77)) drop-shadow(0 0 15px rgba(245, 158, 11)) drop-shadow(0 0 1px rgba(252, 211, 77))',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.4',
            filter: 'none',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-700px 0',
          },
          '100%': {
            backgroundPosition: '700px 0',
          },
        },
        blink: {
          '0%': {
            opacity: '0.2',
          },
          '20%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0.2',
          },
        },
        slowPing: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        collapseDown: {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-collapsible-content-height)',
          },
        },
        collapseUp: {
          from: {
            height: 'var(--radix-collapsible-content-height)',
          },
          to: {
            height: '0',
          },
        },
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
        enterFromRight: {
          from: {
            opacity: '0',
            transform: 'translateX(200px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        enterFromLeft: {
          from: {
            opacity: '0',
            transform: 'translateX(-200px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        exitToRight: {
          from: {
            opacity: '1',
            transform: 'translateX(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateX(200px)',
          },
        },
        exitToLeft: {
          from: {
            opacity: '1',
            transform: 'translateX(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateX(-200px)',
          },
        },
        scaleIn: {
          from: {
            opacity: '0',
            transform: 'rotateX(-10deg) scale(0.9)',
          },
          to: {
            opacity: '1',
            transform: 'rotateX(0deg) scale(1)',
          },
        },
        scaleOut: {
          from: {
            opacity: '1',
            transform: 'rotateX(0deg) scale(1)',
          },
          to: {
            opacity: '0',
            transform: 'rotateX(-10deg) scale(0.95)',
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
        flicker: 'flicker 3s linear infinite',
        shimmer: 'shimmer 1.3s linear infinite',
        ping: 'slowPing 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        collapseDown: 'collapseDown 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        collapseUp: 'collapseUp 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        scaleIn: 'scaleIn 200ms ease',
        scaleOut: 'scaleOut 200ms ease',
        fadeIn: 'fadeIn 200ms ease',
        fadeOut: 'fadeOut 200ms ease',
        enterFromLeft: 'enterFromLeft 250ms ease',
        enterFromRight: 'enterFromRight 250ms ease',
        exitToLeft: 'exitToLeft 250ms ease',
        exitToRight: 'exitToRight 250ms ease',
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
    plugin(({ matchUtilities }) => {
      matchUtilities({
        perspective: (value) => ({
          perspective: value,
        }),
      })
    }),
    require('tailwindcss-animate'),
  ],
} satisfies Config
