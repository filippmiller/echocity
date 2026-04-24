# Role: Team Lead (TL) Verdict — Turn 4 — Domain 4 (Subscription Plus)

You are the Team Lead on the echocity critical review. Your job this turn is to issue the locked verdict for Domain 4 (Subscription Plus) based on the single critic (Codex, Turn 4) and Defender (Turn 4) outputs. Kimi was skipped for this turn — you must call that out explicitly and decide whether Domain 4 is locked on a single-critic basis or requires a Kimi follow-up round before closing.

## Working directory
`C:\dev\echocity`

## Shared doc (read, then append only at end)
`C:\dev\echocity\.claude\reviews\active-review.md`

## Required reading

1. Lines 85-110 — Agent Roster + 12 Review Domains
2. Lines 559-623 — your Turn 1 Verdict (format and quality bar)
3. Lines 949-1022 — Turn 2 Verdict
4. Lines 1368-1435 — Turn 3 Verdict
5. Lines 1436-end — Turn 4 directive, Codex Turn 4, Defender Turn 4. Read all three in full.

## What to do

1. **Convergence / divergence summary.** Where Codex and Defender agreed, where Defender rejected Codex, where Defender upgraded. One tight paragraph.

2. **Locked decisions (ship-all).** Numbered list of what ships in Domain 4 PR(s). These become rows 4.N in the improvement plan. Every item: file:line, change, priority P0/P1/P2, effort XS/S/M/L, approved: YES. These get implemented verbatim in Session B.

3. **Upgrades from debate.** If you add anything beyond what Codex + Defender proposed, justify why. Budget upgrades tightly — only items strictly better than what exists.

4. **Things NOT upgrading.** Note Defender rejections that you are preserving; note Codex findings you are leaving in P2 parking. Explain.

5. **Scoreboard update for Subscription Plus (element 4).** Table with 10 dimensions. Columns: Codex / (Kimi: MISSING) / TL Final. Note explicitly that Kimi column is absent this turn.

6. **Improvement Plan — Domain 4 rows.** Table: `#` (4.1 through 4.N), `Element`, `Improvement`, `Priority`, `Effort`, `Approved`. Match the format used in Domain 1/2/3 verdicts. Rows feed directly into Session B's ship queue.

7. **Kimi gap decision.** Single-critic turns lose legal/RU-market coverage. Decide one of:
   - (a) **PROCEED** to Domain 5 on single-critic basis — Defender's Kimi-lane gap analysis is sufficient.
   - (b) **LOCK-PENDING-KIMI** — Domain 4 code ships, but a Kimi-only follow-up turn is queued for when auth is restored, to pressure-test the RU legal surface before considering it fully closed.
   - (c) **HOLD** — do not advance until Kimi posts.
   Justify the choice.

8. **Handoff to Session B.** List the specific rows Session B should ship FIRST from Domain 4, noting blockers (e.g., "4.3 requires LEGAL_ENTITY env values from Session C").

9. **Handoff to Session C.** Any new user-blocker items surfaced by Domain 4 (e.g., ЮKassa merchant account, ERID registration, etc.).

10. **Turn 5 directive.** Open Domain 5 (Trust/legal surface — Kimi lead) with a scoped `@codex` block and a placeholder `@kimi` block that user will activate when Kimi auth is restored.

## Output contract (STRICT)

### Append-only. Never edit above.

### Exact header
```
### TL Verdict — Turn 4 (Domain 4: Subscription Plus)
<!-- tl-verdict-turn-4 -->
```

### After the verdict, in the same append, also add the Turn 5 opening directive with header:
```
### TL — Turn 5 (Opening)
<!-- tl-turn-5 -->
```

### Also update the `## Review Status` section at the top of the doc
Find the `> ## ⏸ REVIEW PAUSED — 2026-04-21` block near top (around line 3-10) and update it to reflect Domain 4 is closed (or lock-pending-kimi), advancing to Domain 5.

Wait — RULE: NEVER edit above the append-only marker. The review-status callout is above the marker. Do NOT edit it. Leave the status update for a final TL pass at end of review or a separate commit.

### Scoreboard in the verdict
Copy the scoreboard row format used in Turn 3. Note Kimi column missing.

## Completion signal

When append is saved:
```
TL VERDICT TURN 4 POSTED
```

Then stop. Do not commit, do not push.

## Quality reminder

The ship-all mode means rows you lock become reality within 24 hours. Every P0 must be defensible against a production engineer asking "why exactly is this P0 and not P1?" Be concrete, not aspirational. The Turn 5 directive you open will drive the next round — write it with the same rigor the prior directives had.
