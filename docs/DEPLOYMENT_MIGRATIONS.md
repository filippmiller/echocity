# Deployment Migrations

EchoCity uses Prisma migrations against PostgreSQL. Production startup must apply only committed migrations:

```sh
npx prisma migrate deploy
```

Do not run `prisma db push --accept-data-loss` from the application container. `db push` is a schema synchronization tool, not a production migration runner, and can hide drift or apply destructive changes unexpectedly.

## Normal Deploy Flow

1. Build the Docker image.
2. Run `npx prisma migrate deploy`.
3. Start the app with `npm start`.
4. Verify the application URL and health route.

The Dockerfile runs this as:

```sh
npx prisma migrate deploy && npm start
```

## One-Time Legacy Baseline Recovery

Use this only for an environment that already has the expected schema but has broken Prisma migration history from the historical `0_init` squash.

1. Take a database backup.
2. Inspect migration state:

   ```sql
   SELECT migration_name, finished_at, rolled_back_at
   FROM _prisma_migrations
   ORDER BY started_at;
   ```

3. Confirm the live schema matches `prisma/migrations/0_init/migration.sql`.
4. If and only if `0_init` is already applied in the database schema but not recorded as applied, run:

   ```sh
   npx prisma migrate resolve --applied 0_init
   ```

5. Validate:

   ```sh
   npx prisma migrate deploy
   ```

If `migrate deploy` reports drift or failed migrations, stop the deploy and investigate. Do not fall back to `db push --accept-data-loss` during application startup.
