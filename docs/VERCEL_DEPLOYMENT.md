# Vercel Deployment Guide for Monorepo

## Overview

Your monorepo has two separate apps that can be deployed independently:

- **Protected App** (`apps/app`) - Main application at `app.mysite.com`
- **Marketing Site** (`apps/web`) - Public website at `mysite.com`

---

## Initial Setup

### 1. Install Vercel CLI

```bash
pnpm add -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

---

## Deploying the Protected App (`apps/app`)

### First-Time Deployment

**IMPORTANT**: You must deploy from the repository root, not from `apps/app`.

```bash
# From the repository root
vercel
```

**Follow the prompts:**

- Set up and deploy? **Yes**
- Which scope? Choose your team/personal account
- Link to existing project? **No** (first time)
- What's your project's name? `appraisal-app` (or your preferred name)
- In which directory is your code located? `./` (repository root)

**Then configure in Vercel Dashboard:**

1. Go to Project Settings → General
2. Set **Root Directory**: `apps/app`
3. Framework Preset: **Other**
4. Build & Development Settings:
   - Build Command: `pnpm turbo build --filter=@repo/app`
   - Output Directory: `.next`
   - Install Command: `pnpm install --frozen-lockfile`
   - Development Command: `pnpm turbo dev --filter=@repo/app`

Or use the `vercel.json` file already configured in `apps/app/vercel.json`.

This creates `.vercel/` folder with your project link.

### Environment Variables

Add your environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add all variables from your `.env.local`:
   - `DATABASE_URL`
   - `KINDE_CLIENT_ID`
   - `KINDE_CLIENT_SECRET`
   - `KINDE_ISSUER_URL`
   - `KINDE_SITE_URL` (use your production URL)
   - `KINDE_DOMAIN`
   - `KINDE_MANAGEMENT_CLIENT_ID`
   - `KINDE_MANAGEMENT_CLIENT_SECRET`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_SITE_BASE_URL` (production URL)

### Subsequent Deployments

```bash
# From repository root
vercel --prod  # Deploy to production
```

Or just push to your main branch if you've set up Git integration.

---

## Deploying the Marketing Site (`apps/web`)

### First-Time Deployment

**IMPORTANT**: You must deploy from the repository root, not from `apps/web`.

```bash
# From the repository root
vercel
```

**Follow the prompts:**

- Set up and deploy? **Yes**
- Which scope? Choose your team/personal account
- Link to existing project? **No** (first time)
- What's your project's name? `appraisal-marketing` (or your preferred name)
- In which directory is your code located? `./` (repository root)

**Then configure in Vercel Dashboard:**

1. Go to Project Settings → General
2. Set **Root Directory**: `apps/web`
3. Framework Preset: **Other**
4. Build & Development Settings:
   - Build Command: `pnpm turbo build --filter=@repo/web`
   - Output Directory: `.next`
   - Install Command: `pnpm install --frozen-lockfile`
   - Development Command: `pnpm turbo dev --filter=@repo/web`

Or use the `vercel.json` file already configured in `apps/web/vercel.json`.

This creates `.vercel/` folder.

### Environment Variables

Add environment variables for the marketing site:

- `NEXT_PUBLIC_SITE_BASE_URL` (marketing site URL)

### Subsequent Deployments

```bash
# From repository root
vercel --prod
```

---

## Vercel Configuration Files

Both apps have `vercel.json` with these settings:

### `apps/app/vercel.json`

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@repo/app",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "outputDirectory": ".next",
  "devCommand": "cd ../.. && pnpm turbo dev --filter=@repo/app",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/app"
}
```

### `apps/web/vercel.json`

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@repo/web",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "outputDirectory": ".next",
  "devCommand": "cd ../.. && pnpm turbo dev --filter=@repo/web",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/web"
}
```

**Key Features:**

- `buildCommand`: Uses Turborepo to build only the specific app and its dependencies
- `installCommand`: Installs from the monorepo root
- `ignoreCommand`: Only rebuilds if files in that app's directory changed
- `framework: null`: Prevents Vercel from auto-detecting Next.js (we handle it manually)

---

## Custom Domains

### Protected App (`app.mysite.com`)

1. Go to Project Settings → Domains
2. Add domain: `app.mysite.com`
3. Follow DNS configuration instructions

### Marketing Site (`mysite.com`)

1. Go to Project Settings → Domains
2. Add domains: `mysite.com` and `www.mysite.com`
3. Follow DNS configuration instructions

---

## Git Integration (Recommended)

### Setup

1. In Vercel Dashboard, go to Project Settings → Git
2. Connect your GitHub repository
3. Set the **Root Directory** to the app's path:
   - For protected app: `apps/app`
   - For marketing site: `apps/web`

### Auto-Deployments

With Git integration:

- **Push to main branch** → Auto-deploy to production
- **Open PR** → Auto-deploy preview
- **Merge PR** → Auto-deploy to production

The `ignoreCommand` in `vercel.json` ensures apps only rebuild when their files change.

---

## Turborepo Remote Caching (Optional)

Enable Vercel's Remote Caching for faster builds:

```bash
# Link Turborepo to Vercel
pnpm turbo login
pnpm turbo link
```

Add to your repository secrets:

- `TURBO_TOKEN` (from `turbo login`)
- `TURBO_TEAM` (your team slug)

---

## Testing Deployments

### Preview Deployments

```bash
cd apps/app
vercel  # Creates preview deployment
```

Preview URL will be provided (e.g., `appraisal-app-xyz.vercel.app`)

### Production Deployments

```bash
cd apps/app
vercel --prod
```

---

## Troubleshooting

### Build Fails

**Problem:** Build command can't find packages

**Solution:** Make sure `installCommand` runs from root with `cd ../..`

### Environment Variables Not Working

**Problem:** App can't access env vars

**Solution:**

- Check they're set in Vercel dashboard
- `NEXT_PUBLIC_*` vars must be set at build time
- Redeploy after adding new env vars

### Monorepo Not Detected

**Problem:** Vercel treats app as standalone

**Solution:** Make sure:

- Root Directory is set to `apps/app` or `apps/web`
- Build command uses `cd ../..` to access root
- `pnpm-workspace.yaml` exists at root

### Wrong App Building

**Problem:** Changes to one app trigger builds of the other

**Solution:** Check `ignoreCommand` in `vercel.json` is correct

---

## Directory Structure

```
appraisal-app/
├── apps/
│   ├── app/
│   │   ├── .vercel/           # Vercel project link (gitignored)
│   │   ├── vercel.json        # Vercel config
│   │   └── ...
│   └── web/
│       ├── .vercel/           # Vercel project link (gitignored)
│       ├── vercel.json        # Vercel config
│       └── ...
├── packages/                  # Shared code
└── pnpm-workspace.yaml        # Monorepo config
```

---

## Quick Commands Reference

```bash
# Deploy protected app to preview
cd apps/app && vercel

# Deploy protected app to production
cd apps/app && vercel --prod

# Deploy marketing site to preview
cd apps/web && vercel

# Deploy marketing site to production
cd apps/web && vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Pull environment variables locally
cd apps/app && vercel env pull .env.local
```

---

## Best Practices

1. ✅ **Separate Projects**: Use different Vercel projects for each app
2. ✅ **Environment Variables**: Set per-project in Vercel dashboard
3. ✅ **Git Integration**: Connect GitHub for automatic deployments
4. ✅ **Preview Deployments**: Test PRs with preview deployments
5. ✅ **Custom Domains**: Use subdomains for clear separation
6. ✅ **Ignore Commands**: Prevent unnecessary rebuilds with `ignoreCommand`
7. ✅ **Remote Caching**: Enable Turborepo caching for faster builds

---

## Next Steps

1. Deploy protected app: `cd apps/app && vercel`
2. Set up environment variables in Vercel dashboard
3. Configure custom domain (app.mysite.com)
4. Deploy marketing site when ready: `cd apps/web && vercel`
5. Set up Git integration for auto-deployments

---

**Need Help?**

- Vercel Docs: https://vercel.com/docs
- Turborepo + Vercel: https://turbo.build/repo/docs/handbook/deploying-with-docker
- Monorepo Guide: https://vercel.com/docs/monorepos
