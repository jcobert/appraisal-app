/**
 * @jest-environment node
 */
import { config } from '../middleware'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'

describe('Middleware Configuration Tests', () => {
  describe('Configuration Validation', () => {
    it('should have valid middleware configuration', () => {
      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher).toHaveLength(1)
    })

    it('should use secure matcher pattern with minimal exclusions', () => {
      if (config.matcher && config.matcher.length > 0) {
        const pattern = config.matcher[0] as string

        expect(typeof pattern).toBe('string')
        expect(pattern.length).toBeGreaterThan(0)
        expect(pattern).toMatch(/^\/\(/) // Starts with /(
        expect(pattern).toContain('(?!') // Uses negative lookahead
        expect(pattern).toContain('api') // Excludes API routes
        expect(pattern).toContain('_next') // Excludes Next.js internals
        expect(pattern).toContain('favicon.ico') // Excludes favicon
        expect(pattern).toContain('robots.txt') // Excludes robots.txt
        expect(pattern).toContain('sitemap.xml') // Excludes sitemap.xml exactly
        expect(pattern).toContain('images/') // Excludes images directory
        expect(pattern).toContain('site.webmanifest') // Excludes web manifest

        // Should NOT contain broad file extension exclusions for security
        expect(pattern).not.toContain('css|js|png') // No broad extensions
        expect(pattern).not.toContain('pdf|csv|docx') // Documents require auth
      }
    })
  })

  describe('Route Matching with Next.js Utilities', () => {
    describe('API Routes (Should be Excluded)', () => {
      const apiRoutes = [
        '/api/auth/login',
        '/api/organizations',
        '/api/users/profile',
        '/api/webhooks/stripe',
      ]

      apiRoutes.forEach((route) => {
        it(`should exclude ${route}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: route })).toBe(
            false,
          )
        })
      })
    })

    describe('Next.js Internal Routes (Should be Excluded)', () => {
      const excludedNextRoutes = [
        '/_next/static/chunks/app.js',
        '/_next/static/css/app.css',
        '/_next/image/logo.png',
      ]

      excludedNextRoutes.forEach((route) => {
        it(`should exclude ${route}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: route })).toBe(
            false,
          )
        })
      })

      const includedNextRoutes = [
        '/_next/webpack-hmr', // Not specifically excluded by new pattern
      ]

      includedNextRoutes.forEach((route) => {
        it(`should include ${route} (not in exclusion list)`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: route })).toBe(
            true,
          )
        })
      })
    })

    describe('Specifically Excluded Files', () => {
      const excludedFiles = [
        '/favicon.ico', // Explicitly excluded
        '/robots.txt', // Explicitly excluded
        '/sitemap.xml', // Explicitly excluded
        '/site.webmanifest', // Explicitly excluded
      ]

      excludedFiles.forEach((file) => {
        it(`should exclude ${file}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: file })).toBe(
            false,
          )
        })
      })
    })

    describe('Images Directory Exclusion', () => {
      const imageFiles = [
        '/images/logo.png',
        '/images/hero.jpg',
        '/images/icons/favicon.svg',
        '/images/gallery/photo1.webp',
      ]

      imageFiles.forEach((file) => {
        it(`should exclude ${file}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: file })).toBe(
            false,
          )
        })
      })
    })

    describe('Files Requiring Authentication (Security Feature)', () => {
      const protectedFiles = [
        '/logo.png', // Images now require auth
        '/styles.css', // CSS now requires auth
        '/app.js', // JS now requires auth
        '/font.woff2', // Fonts now require auth
        '/image.webp', // Images now require auth
        '/data.csv', // Documents require auth (security)
        '/archive.zip', // Archives require auth (security)
        '/document.pdf', // Documents require auth (security)
        '/dashboard/report.pdf', // Protected location + document
      ]

      protectedFiles.forEach((file) => {
        it(`should require authentication for ${file}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: file })).toBe(true)
        })
      })
    })

    describe('Application Routes (Should be Included)', () => {
      const appRoutes = [
        '/dashboard',
        '/organizations',
        '/organizations/create',
        '/profile',
        '/settings',
      ]

      appRoutes.forEach((route) => {
        it(`should include ${route}`, () => {
          expect(unstable_doesMiddlewareMatch({ config, url: route })).toBe(
            true,
          )
        })
      })
    })

    describe('Security-First Behavior', () => {
      it('should require authentication for all file types (no broad exclusions)', () => {
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/script.js' }),
        ).toBe(true)
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/config.json' }),
        ).toBe(true)
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/styles.css' }),
        ).toBe(true)
      })

      it('should include organization invite routes (handled by publicPaths)', () => {
        expect(
          unstable_doesMiddlewareMatch({
            config,
            url: '/organization-invite/test/join',
          }),
        ).toBe(true)
      })

      it('should require authentication for all documents and data files', () => {
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/data.json' }),
        ).toBe(true)
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/report.md' }),
        ).toBe(true)
        expect(
          unstable_doesMiddlewareMatch({ config, url: '/document.pdf' }),
        ).toBe(true)
      })
    })
  })

  describe('Organization Invite Public Paths', () => {
    const invitePattern = /\/organization-invite\/[^?&]+\/join(?=\?|$)/

    it('should match valid organization invite URLs', () => {
      const validInvites = [
        '/organization-invite/acme-corp/join?inv=token123',
        '/organization-invite/my-org/join?inv=abc&redirect=/dashboard',
        '/organization-invite/org-123/join?inv=xyz',
        '/organization-invite/test/join', // No query params (matches $ in lookahead)
      ]

      validInvites.forEach((url) => {
        expect(invitePattern.test(url)).toBe(true)
      })
    })

    it('should reject invalid organization invite URLs', () => {
      const invalidInvites = [
        '/organization-invite//join?inv=token', // Empty org ID
        '/organization-invite/org/joins?inv=token', // Wrong action
        '/organization-invite/org?param=value/join', // Query in org path
        '/organization-invite/org&invalid=param/join', // Ampersand in org path
        '/organization-invite/org/join/extra', // Extra path segments
      ]

      invalidInvites.forEach((url) => {
        expect(invitePattern.test(url)).toBe(false)
      })
    })
  })

  describe('Middleware Flow Documentation', () => {
    it('should document complete middleware request flow', () => {
      // Complete middleware flow:
      // 1. Request comes to Next.js
      // 2. Next.js checks config.matcher pattern
      // 3. If pattern matches → Kinde middleware function runs
      // 4. Kinde checks publicPaths configuration
      // 5. If path is in publicPaths → allow access without auth
      // 6. If path not in publicPaths → require authentication
      // 7. Continue to page/API route

      expect(config.matcher).toBeDefined()

      // Matcher excludes routes that don't need any middleware processing
      const excludedByMatcher = [
        '/api/test',
        '/_next/static/app.js',
        '/favicon.ico',
      ]
      excludedByMatcher.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false)
      })

      // Matcher includes routes that need middleware processing
      const includedByMatcher = ['/dashboard', '/organization-invite/test/join']
      includedByMatcher.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
      })
    })

    it('should validate configuration architecture', () => {
      // Two-layer protection system:
      // Layer 1: config.matcher (determines what reaches middleware)
      // Layer 2: publicPaths in Kinde config (determines what bypasses auth)

      // Configuration provides optimal performance:
      // - Static files and API routes never reach middleware (performance)
      // - App routes reach middleware for authentication (security)
      // - Select app routes (like org invites) can bypass auth via publicPaths

      expect(config).toHaveProperty('matcher')
      expect(Array.isArray(config.matcher)).toBe(true)

      if (config.matcher) {
        expect(config.matcher.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Edge Cases and Performance', () => {
    it('should handle URLs with query parameters correctly', () => {
      expect(
        unstable_doesMiddlewareMatch({
          config,
          url: '/dashboard?tab=overview',
        }),
      ).toBe(true)
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/api/test?param=value' }),
      ).toBe(false)
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/favicon.ico?v=1' }),
      ).toBe(false)
    })

    it('should handle URLs with fragments correctly', () => {
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/dashboard#section' }),
      ).toBe(true)
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/api/test#fragment' }),
      ).toBe(false)
    })

    it('should handle case sensitivity appropriately', () => {
      expect(unstable_doesMiddlewareMatch({ config, url: '/API/test' })).toBe(
        true,
      ) // Different case
      expect(unstable_doesMiddlewareMatch({ config, url: '/api/TEST' })).toBe(
        false,
      ) // API prefix matches
    })

    it('should exclude only essential routes for performance', () => {
      // Updated pattern excludes specific files and directories
      const excludedRoutes = [
        '/_next/static/chunks/framework.js',
        '/_next/static/chunks/main.js',
        '/_next/static/css/globals.css',
        '/_next/image/logo.png',
        '/images/logo.png', // Images directory excluded
        '/images/hero.jpg', // Images directory excluded
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/ads.txt',
        '/app-ads.txt',
        '/manifest.json',
        '/site.webmanifest', // Web manifest excluded
      ]

      excludedRoutes.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false)
      })

      // Files that now require authentication (updated pattern)
      const protectedFiles = [
        '/sitemap-posts.xml', // Not exact sitemap.xml match
        '/.well-known/security.txt', // Security files now require auth
        '/google123456.html', // Verification files require auth
        '/BingSiteAuth.xml', // Verification files require auth
        '/sw.js', // Service worker now requires auth
        '/public/documents/file.pdf', // Files not in images/ require auth
      ]

      protectedFiles.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
      })
    })

    it('should require authentication for security-sensitive files', () => {
      // Files that now require authentication with secure pattern
      const protectedFiles = [
        '/public-styles.css', // No longer broadly excluded
        '/public-script.js', // No longer broadly excluded
        '/user-data.json', // Data files need protection
        '/financial-report.pdf', // Documents need protection
        '/client-list.csv', // Sensitive data needs protection
      ]

      protectedFiles.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
      })
    })

    it('should demonstrate comprehensive pattern testing methodology', () => {
      // This shows how to test patterns comprehensively to catch escaping issues

      // Only /sitemap.xml is excluded (exact match)
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/sitemap.xml' }),
      ).toBe(false)

      // All other sitemap-related files require auth
      const sitemapVariants = [
        '/sitemap-posts.xml', // Different naming
        '/mysitemap.xml', // Different prefix
        '/sitemap.json', // Different extension
        '/sitemap', // No extension
      ]

      sitemapVariants.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
      })
    })

    it('should demonstrate how escaping tests catch pattern issues', () => {
      // These tests demonstrate what WOULD catch escaping issues
      // Currently .well-known files will require auth since we removed them from exclusions

      const wellKnownFiles = [
        '/.well-known/security.txt',
        '/.well-known/apple-app-site-association',
      ]

      // These now require authentication (simplified pattern)
      wellKnownFiles.forEach((url) => {
        expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
      })
    })

    it('should demonstrate how proper testing catches pattern issues', () => {
      // METHODOLOGY: Test exact matches vs similar patterns

      // Exact exclusions work correctly
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/sitemap.xml' }),
      ).toBe(false) // Excluded
      expect(unstable_doesMiddlewareMatch({ config, url: '/robots.txt' })).toBe(
        false,
      ) // Excluded

      // Different patterns require auth
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/sitemap-posts.xml' }),
      ).toBe(true) // Not exact match
      expect(
        unstable_doesMiddlewareMatch({ config, url: '/robots-backup.txt' }),
      ).toBe(true) // Not exact match

      // KEY INSIGHT: These edge case tests would have caught the escaping issues
      // The original broad patterns with incorrect escaping would fail these tests
    })
  })
})
