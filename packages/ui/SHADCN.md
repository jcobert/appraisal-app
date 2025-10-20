# @repo/ui - Adding shadcn Components

This package uses shadcn/ui components. To add new components:

## Adding a New Component

```bash
# From the packages/ui directory
cd packages/ui
npx shadcn@latest add button

# Or from the root
npx shadcn@latest add button -c packages/ui/components.json
```

The component will be added to `packages/ui/src/ui/[component].tsx`

## Using Components in Apps

```tsx
// In apps/core or apps/web
import { Button } from '@repo/ui'

export default function Page() {
  return <Button>Click me</Button>
}
```

## Configuration

- **Tailwind Config**: Shared from `@repo/tailwind-config`
- **CSS Variables**: Defined in `@repo/tailwind-config/styles.css`
- **Utils**: Shared from `@repo/utils` (includes `cn()` helper)

## Component Structure

```
packages/ui/src/
├── ui/              # shadcn components (generated)
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── general/         # Custom shared components
│   ├── avatar.tsx
│   ├── spinner.tsx
│   └── ...
└── index.ts         # Re-exports all components
```

## Important Notes

1. **CSS Variables Required**: Apps must import `@repo/tailwind-config/styles.css` for shadcn components to work
2. **Tailwind Config**: Apps must extend `@repo/tailwind-config` base config
3. **Path Aliases**: Components use `@repo/utils` for utility functions
4. **Tailwind IntelliSense**: VS Code is configured to use `apps/core/tailwind.config.ts` for autocomplete

## VS Code IntelliSense Setup

Tailwind IntelliSense is already configured! The workspace settings point to the app's Tailwind config:

```json
// packages/ui/.vscode/settings.json
{
  "tailwindCSS.experimental.configFile": "../../apps/core/tailwind.config.ts"
}
```

This gives you:

- ✅ Tailwind class autocomplete
- ✅ Color previews
- ✅ Hover documentation
- ✅ Class validation

If IntelliSense isn't working, try:

1. **Reload VS Code**: Cmd+Shift+P → "Reload Window"
2. **Restart Tailwind server**: Cmd+Shift+P → "Tailwind CSS: Restart IntelliSense Server"

## When to Add Components Here vs Apps

**Add to `packages/ui` when:**

- ✅ Component is used in multiple apps
- ✅ Component is part of your design system
- ✅ You want consistency across apps

**Add to app-specific `components/` when:**

- ❌ Component is highly specific to one app
- ❌ Component has app-specific business logic
- ❌ You need per-app customization
