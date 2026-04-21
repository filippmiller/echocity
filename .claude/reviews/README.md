# Critical Project Review — echocity / ГдеСейчас

**Status (2026-04-21):** PAUSED at Domain 4. Domains 1-3 complete with locked TL verdicts + improvement plans (51 rows).

## Files in this directory

| File | Purpose |
|---|---|
| `active-review.md` | The shared review document. Single source of truth for all agent discussion. 1459 lines, 3 domains complete. |
| `HANDOFF-SESSION-A-CONTINUE-REVIEW.md` | For the next Claude session that resumes the review (Domains 4-12). |
| `HANDOFF-SESSION-B-SHIP-P0-P1.md` | For a parallel Claude session that ships the 51 improvement-plan rows from Domains 1-3. Can start immediately. |
| `HANDOFF-SESSION-C-OWNER-DECISIONS.md` | For the human owner: legal entity registration, Роскомнадзор, Yandex verification, merchant acquisition plan, brand/domain resolution. |
| `screenshot.mjs` | Playwright script that captured prod + competitor screenshots. |
| `screenshots/` | Visual evidence: echocity mobile/desktop, biglion, frendi. |

## How to resume

**Three sessions can run in parallel:**

1. **Session A** — Resume the review. Start Codex + Kimi in PowerShell tabs, let Claude (TL) drive Domains 4-12.
2. **Session B** — Ship code from Domains 1-3's improvement plans. Blocks nothing except P1 legal (waits on Session C env values).
3. **Session C** — Owner (human) delivers legal entity + Роскомнадзор + Yandex + merchant plan.

**Cross-machine resume:** `git pull` in `C:\dev\echocity`, read the `HANDOFF-SESSION-*.md` for your role, start there.

## Quick status facts

- Production root `/` = HTTP 500. Caused by unguarded `prisma.demandRequest.count` at `app/page.tsx:97-99`. Fix shipped in Session B day-1 hotfix.
- Production DB = empty (0 offers, 0 places, 0 collections, 0 bundles, 0 stories).
- Legal identity = missing (ФЗ-152 violation compounding per pageview).
- Brand/domain mismatch = `gdesejchas.ru` email on `vsedomatut.com` host.
- ~628 LOC P0 + ~718 LOC P1 specced, 32 hours of engineering to finish Domains 1-3 ship work.

## Domain completion tracker

| Domain | Lead | Status | Plan rows |
|---|---|---|---|
| 1 Homepage 500 | Codex | ✅ Complete | 15 |
| 2 /offers + onboarding + nav | Kimi | ✅ Complete | 20 |
| 3 OfferCard | Codex | ✅ Complete | 16 |
| 4 Subscription Plus | Kimi | ⏳ Directive posted, awaiting critics | — |
| 5 Trust/legal surface | Kimi | ⏳ | — |
| 6 Merchant onboarding | both | ⏳ | — |
| 7 Fraud + QR redemption | Codex | ⏳ | — |
| 8 Telegram miniapp | Kimi | ⏳ | — |
| 9 Yandex SEO | Codex | ⏳ | — |
| 10 Gamification vs 0 users | both | ⏳ | — |
| 11 Pricing psychology | Kimi | ⏳ | — |
| 12 12-week execution plan | all | ⏳ | — |
