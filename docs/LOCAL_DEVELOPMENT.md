# Local Development

## Install

Use the lockfile:

```powershell
npm ci
```

If the npm registry is slow or the cache is already warm, this variant is equivalent and may complete faster:

```powershell
npm ci --prefer-offline --no-audit --no-fund
```

## Verify

Run the full Vitest suite:

```powershell
npm test
```

Run a production build:

```powershell
npm run build
```

Both `npm test` and `npm run build` run `prisma generate` first. This keeps smoke tests that import Prisma enums reproducible after a clean install.
