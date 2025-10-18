import type { Config } from 'tailwindcss'

import baseConfig from '@repo/tailwind-config'

/**
 * Tailwind config for UI package development
 * This config is used by Tailwind IntelliSense for autocomplete
 */
export default {
  ...baseConfig,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    // Include app content for context
    '../../apps/app/src/**/*.{js,jsx,ts,tsx}',
  ],
  plugins: [require('tailwindcss-animate')],
} satisfies Config
