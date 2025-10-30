import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import baseConfig from '@repo/tailwind-config'

export default {
  ...baseConfig,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
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
