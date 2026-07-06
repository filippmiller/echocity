# EchoCity - Project Instructions

## Session Start Protocol

1. Read `.claude/deploy-instructions.md` for deployment details
2. Read this full `CLAUDE.md` for project rules and conventions
3. Report to user: "I've read the deployment instructions and all important notices for **echocity**. Deploy target: https://echocity.vsedomatut.com. Last verified: 2026-04-09. Build status: OK. WARNING: root URL returns 404."
4. Run `git status` and report current branch and any uncommitted changes

---

## Deployment

**Production**: Laptop server via Coolify (vsedomatut.com)

| Key | Value |
|-----|-------|
| URL | https://echocity.vsedomatut.com |
| Coolify UUID | ki5yt1xyoo1lgsbp5lv39p96 |
| Coolify API | https://coolify.vsedomatut.com/api/v1 |
| Coolify Token | `$COOLIFY_API_TOKEN` (see `~/.claude/projects/C--dev/memory/hetzner-vps.md`) |
| Build pack | dockerfile (`/Dockerfile`) |
| Git repo | git@github.com:filippmiller/echocity.git (main) |
| DB UUID | b13rk5k1ix7mckiqotydobja (separate Coolify resource) |

### How to Deploy

```bash
# Trigger deploy via Coolify API
curl -s -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "https://coolify.vsedomatut.com/api/v1/deploy?uuid=ki5yt1xyoo1lgsbp5lv39p96&force=true"
```

Coolify auto-deploys on push to `main`. Manual deploy via API if needed.

### Architecture

- **App**: Next.js (Dockerfile build)
- **Database**: PostgreSQL (separate Coolify resource, UUID: b13rk5k1ix7mckiqotydobja)
- **Migrations**: Prisma

### SSH Access to Server

```bash
ssh -o ProxyCommand="cloudflared access ssh --hostname ssh.vsedomatut.com" filip@ssh.vsedomatut.com
```

Container names use Coolify UUID pattern: `ki5yt1xyoo1lgsbp5lv39p96-*`

### Database

- **Type**: PostgreSQL
- **User**: echocity
- **DB**: echocity
- **Migrations**: Prisma
- **Container**: `b13rk5k1ix7mckiqotydobja` (stable name, separate resource)
- Access: `docker exec b13rk5k1ix7mckiqotydobja psql -U echocity -d echocity`

### Known Issues

- **Failed Prisma migrations**: If the app won't start with `Error: P3009 - migrate found failed migrations`, check `_prisma_migrations` table:
  ```sql
  SELECT migration_name, finished_at FROM _prisma_migrations WHERE finished_at IS NULL;
  ```
  Fix by marking as complete:
  ```sql
  UPDATE _prisma_migrations SET finished_at = NOW(), rolled_back_at = NULL, logs = NULL WHERE finished_at IS NULL;
  ```
  Then restart the app. **Note**: This marks migrations as done without actually running them — ensure the schema changes were already applied or apply them manually.

### DNS

All `*.vsedomatut.com` subdomains route through Cloudflare Tunnel to the laptop.
**Never create A records in Cloudflare** — the wildcard CNAME handles everything.

### Important Notes

- This app was migrated from Hetzner to laptop on 2026-03-24
- The laptop server is a SEPARATE machine from the dev machine (C:\dev)
- `docker.exe` on the dev machine shows LOCAL containers, not server containers
- Use SSH or Coolify API to interact with production containers


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
