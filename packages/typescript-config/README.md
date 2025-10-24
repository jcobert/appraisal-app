# TypeScript config presets

This package provides shared tsconfig presets for the monorepo. Use these to keep TypeScript behavior consistent while avoiding accidental leakage of Node-only globals into browser code.

## Presets

- base.json

  - Neutral, shared defaults for all packages
  - Key options:
    - target ES6, module ESNext, moduleResolution bundler
    - lib: ["dom", "dom.iterable", "esnext"]
    - strict, isolatedModules, resolveJsonModule, etc.
  - Intentionally does NOT include Node types. This keeps browser-facing packages clean and avoids accidental reliance on `process`, `Buffer`, etc.

- nextjs.json

  - Extends base.json
  - Adds Next.js plugin and types:
    - plugins: [{ name: "next" }]
    - types: ["node", "jest", "@testing-library/jest-dom"]
  - Use for app packages built with Next.js (e.g., `apps/core`, `apps/web`). Next apps often need Node types at build time (config, tooling) and test types.

- server.json

  - Extends base.json
  - Adds Node globals for server-side code:
    - types: ["node"]
  - Use for server-side libraries (e.g., `packages/database`, `packages/utils`) where `process`, filesystem, etc. are expected.

- react-library.json
  - Extends base.json
  - Tailored for browser React components
    - jsx: react-jsx
    - lib: ["ES2015", "DOM"]
  - Node types are intentionally excluded to keep UI SSR/browser-safe.

## Recommended usage

- Apps (Next.js): extend `@repo/typescript-config/nextjs.json`

  - `apps/core/tsconfig.json`
  - `apps/web/tsconfig.json`

- Server libraries: extend `@repo/typescript-config/server.json`

  - `packages/database/tsconfig.json`
  - `packages/utils/tsconfig.json`

- Browser libraries: extend `@repo/typescript-config/react-library.json` (or base.json if preferred)
  - `packages/ui/tsconfig.json`
  - `packages/types/tsconfig.json` (keeps shared types browser-neutral)

## @types/node guidance

Vercel/CI runs typecheck for each workspace package in isolation. Any package that includes Node globals via `server.json` (or directly sets `types: ["node"]`) must declare `@types/node` in its own devDependencies.

- Root `package.json` pins the version, e.g. `@types/node: 22.9.0`.
- Packages that extend `server.json` add:
  - `devDependencies: { "@types/node": "22.9.0" }`
- Browser libraries (UI, shared types) should NOT depend on `@types/node`.

## TypeScript version alignment

- Root `package.json`:
  - `devDependencies: { "typescript": "5.6.3" }`
  - `pnpm.overrides: { "typescript": "5.6.3" }` to enforce a single TS version across the graph
- All packages:
  - `devDependencies: { "typescript": "workspace:*" }`

This ensures the same TS version is used by tsc, ESLint’s parser, and any plugins, preventing subtle AST/peer mismatches.

## CI/build notes

- `turbo.json` config ensures `build` depends on `typecheck`, catching type errors before producing builds.
- `globalEnv` lists environment variables exposed to Turbo tasks to avoid warning noise in CI.

## Gotchas and tips

- Avoid adding `"types": ["node"]` to `base.json`.
  - Doing so forces `@types/node` into every package and can hide browser/Edge runtime mistakes.
- If a library needs Jest types for local tests, prefer a `tsconfig.test.json` that adds `types: ["jest"]` instead of polluting the main config.
- If you add a new server-side package, extend `server.json` and add `@types/node` in its devDependencies.

## Quick reference

- Next apps → `nextjs.json`
- Server libs → `server.json`
- Browser libs → `react-library.json` (or `base.json`)

If in doubt, keep Node types out of shared/browser libraries; add them only where server-side globals are truly required.
