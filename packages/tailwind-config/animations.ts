/**
 * Shared animation keyframes and animations
 * Provides consistent motion design across the monorepo
 */
export const keyframes = {
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
}

export const animations = {
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
}
