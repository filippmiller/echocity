# Prisma Pooling

EchoCity uses Prisma ORM 6 with PostgreSQL. Prisma Client owns an application-side connection pool per running Node.js process. Pool behavior is configured through the PostgreSQL `DATABASE_URL`.

Current recommended baseline:

```text
DATABASE_URL=postgresql://user:password@host:5432/echocity?connection_limit=10&pool_timeout=30&connect_timeout=30
```

## Parameters

- `connection_limit` caps Prisma Client's pool size per app process.
- `pool_timeout` controls how long Prisma waits to acquire a pooled connection.
- `connect_timeout` controls how long Prisma waits while opening a DB connection.

Prisma's documented v6 defaults include a computed pool size, `pool_timeout=10s`, and `connect_timeout=5s`. EchoCity uses explicit values so deploy behavior does not vary with host CPU count.

Reference: [Prisma connection pool documentation](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool).

## Deployment Guidance

For a single long-running container, start with:

```text
connection_limit=10&pool_timeout=30&connect_timeout=30
```

For multiple app containers, multiple Node.js workers, or bursty traffic, calculate total possible connections:

```text
total_app_connections = app_process_count * connection_limit
```

Keep that below the PostgreSQL `max_connections` budget after reserving connections for admin tools, migrations, and monitoring.

If that budget is too tight, add an external pooler such as PgBouncer for application traffic. Run Prisma migration commands through a direct database connection, not through transaction pooling.

## Investigation Checklist

When API requests become unresponsive under bursts:

1. Confirm the active `DATABASE_URL` includes explicit pool parameters.
2. Check the number of app containers/processes.
3. Compare `app_process_count * connection_limit` with the DB connection budget.
4. Inspect PostgreSQL active/idle connections during a burst.
5. Check logs for Prisma pool timeout messages.
6. Lower `connection_limit` or add PgBouncer if the database is saturated.
7. Increase `pool_timeout` only after confirming the DB has capacity; it hides pressure but does not add capacity.

## Notes From 2026-07-06

The code already uses a singleton Prisma Client in `lib/prisma.ts`, which prevents hot-reload connection growth in development. The remaining risk is deployment-level pool sizing: each production container/process still has its own Prisma pool.
