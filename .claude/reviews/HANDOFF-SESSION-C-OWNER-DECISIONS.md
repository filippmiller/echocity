# HANDOFF — Session C: Owner Decisions + Environment Values

**Scope:** Non-engineering decisions and asset delivery that unblock Sessions A and B. These are YOUR decisions — no amount of code review will produce them. Deliver these fast; every hour you delay blocks trust/legal rollout.

---

## TL;DR

1. **Register a legal entity** (ИП or ООО) if you haven't — required before accepting any paying users.
2. **Apply to Роскомнадзор** for ПДн operator registration — free, ~15 days processing.
3. **Register Yandex.Metrika + Yandex.Webmaster** — free, 10 minutes each.
4. **Decide image CDN** — where will merchant photos be hosted?
5. **Commit to a merchant acquisition plan** — 0 → 50 places in SPb in how many days?
6. **Resolve the brand/domain mismatch** — `echocity.vsedomatut.com` vs `gdesejchas.ru` email — which is the real brand?

Once delivered, Session B can ship the P1 legal/SEO PR. Until delivered, the container's legal assertion in `instrumentation.ts` will refuse to start in prod (by design — compounding ФЗ-152 exposure with every pageview is worse than being down).

---

## 1. Legal entity registration

### What you need

Russian commercial marketplace requires identifiable seller per ЗоЗПП ст. 9. Choose:

- **ИП (Individual Entrepreneur)** — fastest, cheapest. Files: паспорт + заявление Р21001. 3 days. 800₽ гос. пошлина. УСН 6% доход or 15% доход-расход.
- **ООО (LLC)** — more credible for merchants, required for payouts >60М/year. 5-7 days. 4,000₽ гос. пошлина. Minimum уставный капитал 10,000₽. УСН recommended for first year.

Given echocity's stage (pre-revenue, solo/small team), **ИП is almost certainly correct**. File via госуслуги or налоговая directly.

### What Session B needs from you

After registration, you'll have:
- `LEGAL_NAME` — e.g., `ИП Миллер Филипп Игоревич` (full form for ИП) or `ООО "ГдеСейчас"`.
- `LEGAL_INN` — 12 digits (ИП) or 10 digits (ООО).
- `LEGAL_OGRN` (for ООО) or `LEGAL_OGRNIP` (for ИП) — 13 or 15 digits.
- `LEGAL_ADDRESS` — mailing / registered address.

Put them in Coolify env on the `echocity` app (UUID `ki5yt1xyoo1lgsbp5lv39p96`) and restart the container.

---

## 2. Роскомнадзор operator registration

### What you need

ФЗ-152 ст. 22 requires notification to Роскомнадзор (Федеральная служба по надзору в сфере связи) **before** starting to process personal data. echocity collects: phone (PhoneOtp), email (subscription + waitlist), geolocation (NearbyOffers), payment tokens (via ЮKassa/similar), IP (server logs).

You are a **ПДн operator** under the law. The registration is free, filed via Госуслуги or through Роскомнадзор's "Уведомление оператора" portal (https://pd.rkn.gov.ru/operators-registry/notification/form/). Processing time ~15 days.

### What Session B needs from you

- `LEGAL_ROSKOMNADZOR_NUMBER` — the реестровый номер (registry number) assigned to your operator record.
- The date of registration (goes in privacy policy).

Without this, the footer and `/legal/requisites` page cannot display the operator ID, which means every PhoneOtp collection + waitlist email + user signup is a live ФЗ-152 violation with per-occurrence fines.

### Interim

While the 15-day processing runs, **do not accept any user registrations, do not collect PhoneOtp, do not accept payments.** The P1 legal PR ships with all those endpoints gated by `assertLegalIdentityConfigured()` returning 503 "Сервис временно недоступен — проводится регистрация оператора". Hard gate. This is the safest posture.

---

## 3. Yandex.Metrika + Yandex.Webmaster

### Metrika

Go to https://metrika.yandex.ru, click "Добавить счётчик", paste `echocity.vsedomatut.com`. Choose "Автоматическая обработка", enable "Вебвизор" (optional, ФЗ-152 consent required). Copy the numeric counter ID (e.g., `98765432`).

- `YANDEX_METRIKA_ID` = the numeric ID.

### Webmaster

Go to https://webmaster.yandex.ru, click "Добавить сайт", paste URL. Verify via meta tag. Yandex gives you a token like `a1b2c3d4e5f6789`.

- `YANDEX_WEBMASTER_TOKEN` = the verification token.

### Why this matters

Yandex is ~60% of Russian search. Until you're verified in Webmaster, Yandex's crawler treats the site as unverified and ranking signals are weaker. Metrika is required for measuring Russian user behavior — Google Analytics is blocked in Russia for many users post-2022.

---

## 4. Image CDN decision

### The problem

`next.config.js` needs `images.remotePatterns` to allow merchant photos to render via `next/image`. Session B is shipping with permissive `remotePatterns: [{protocol: 'https', hostname: '**'}]` as a temporary state, which you'll want to tighten.

### Options

- **Supabase Storage** (if you already have Supabase for anything else) — easiest, cheap tier, CDN built in.
- **Cloudflare Images** — $5/month for 100k images, global CDN, automatic WebP/AVIF.
- **Самохостинг в Coolify с MinIO** — self-hosted S3-compatible, zero per-image cost, but you operate it.
- **Yandex Object Storage** — Russian data residency (helpful for ФЗ-152), pay-as-you-go.

**Recommendation for Russian-market ПДн compliance:** Yandex Object Storage — keeps user-uploaded content (reviews, UserPhoto) in-country, simplifies ФЗ-242 cross-border transfer compliance.

### What Session B needs from you

The domain name of your chosen CDN (e.g., `storage.yandexcloud.net` or `your-bucket.s3.ru-1.storage.selcloud.ru`). Session B will add it to `next.config.js` `remotePatterns` and tighten the wildcard.

---

## 5. Merchant acquisition plan

### Why this matters

The baseline audit established: `placeCount = 0`, `allActive = 0`. Every single UI decision downstream — the mode switch, the empty states, the blur-lock treatment, the subscription paywall — depends on supply. The review Domain 1-3 verdicts lock the mode switch at `placeCount ≥ 20 AND allActive ≥ 20` as the threshold to show consumer UI.

No amount of engineering will get you across that gate. You have to sign up merchants.

### What you owe Session A / B

A commitment to ONE of:
- **30-day merchant pilot plan**: target 50 SPb places across 5 categories (HoReCa, beauty, nails, hair, laundry), 0% commission for first 3 months, hand-onboard each.
- **B2B2C wholesale**: partner with a food delivery or 2ГИС-style directory that already has the merchant relationships; lease offers in.
- **Ops-curated "editor's picks"**: hand-negotiate 20 deals weekly as a "тематическая подборка" until marketplace self-sustains.
- **Explicit go-no-go**: if supply isn't coming, cut the consumer site entirely and pivot to a waitlist landing page.

The review's Domain 6 will stress-test whichever plan you commit to. It will NOT invent one.

### Interim

Until a plan is committed, the prelaunch mode (`MerchantFirstLanding`) stays. That's fine for a few weeks, but not for months — Yandex will deprioritize a site that's been prelaunch-only for 90 days.

---

## 6. Brand/domain resolution

### The problem

- Production host: `echocity.vsedomatut.com`
- Footer email: `info@gdesejchas.ru`
- Brand displayed: `ГдеСейчас`
- Repo name: `echocity`

Four different identities. A user who wants to contact you can't verify which one is real.

### Three possible resolutions

1. **Migrate to `gdesejchas.ru`** — the email domain becomes the production domain. Buy/verify the domain, point at Cloudflare Tunnel, update Coolify + DNS, keep `vsedomatut.com` as a redirect.
2. **Migrate footer email to `vsedomatut.com`** (e.g., `info@echocity.vsedomatut.com` or `support@vsedomatut.com`) — keeps current infra, forgets the `gdesejchas.ru` identity.
3. **Keep both, explain on legal page** — "ГдеСейчас" is a trading name, operated by ИП XYZ at legal address Z, reachable at `support@vsedomatut.com`; `gdesejchas.ru` is a parked marketing domain. Works legally but confusing.

### What Session B needs

- `SUPPORT_EMAIL` env value — a real inbox you actually monitor. This replaces the hardcoded `info@gdesejchas.ru` at `components/Footer.tsx:32`.

Session A (when it re-runs Domain 5) will re-open the brand/domain question. Best to decide now so Session A has ground truth.

---

## 7. Other decisions Sessions A/B will need

These surface as Sessions A/B progress. Flag them to yourself so you can answer fast when asked:

- **Payment gateway choice.** ЮKassa, CloudPayments, Tinkoff, Сбер. Each has different integration cost, take rate, ФЗ-54 fiscal receipt delivery story. Domain 4 will demand this decision.
- **ОФД provider for fiscal receipts.** If paying via ЮKassa they bundle ОФД; otherwise choose separately (OFD.ru, Первый ОФД, Такском).
- **Telegram channel strategy.** `app/miniapp/` exists but is empty. Are you launching a Telegram mini-app? A channel for deals? Deeplinks? Domain 8 will ask.
- **18+ gate for bars category.** ФЗ-171 prohibits alcohol advertising to minors. Do bar offers need an age confirmation? Yes, but you can defer execution until a bar actually lists.
- **Tier pricing** — 199₽/мес is advertised but Session A Domain 4 will question whether it's the right price, whether there should be annual (-20%), whether corporate tier pricing is different.
- **Cancellation UX.** ЗоЗПП ст. 32.1 + 2024 amendments on recurring subscriptions require same-channel cancellation. Will you build an in-app "Отменить подписку" flow that works in one click, or try a retention funnel?
- **Moderation policy for UGC.** `Review`, `OfferReview`, `UserPhoto`, `Complaint` models exist. ФЗ-149 requires UGC moderation. Who moderates? What's the SLA? This is non-technical policy.

---

## Priority order for you

### This week (unblocks Sessions A + B)
1. Register ИП. 3 days.
2. File Роскомнадзор operator notification. Parallel to ИП registration.
3. Set up Yandex.Metrika + Yandex.Webmaster. 20 minutes total.
4. Pick image CDN. Create bucket. Share domain with Session B.
5. Decide SUPPORT_EMAIL. Set up the inbox.
6. Put all env values in Coolify. Restart container.

### Next week (unblocks Session A Domain 4-6)
7. Commit to merchant acquisition plan (30-day pilot OR pivot).
8. Pick payment gateway.
9. Decide brand/domain migration path.

### As needed (Domains 7-12)
10. Telegram strategy.
11. Tier pricing.
12. Cancellation UX policy.
13. UGC moderation policy.

---

## How to deliver env values to Session B

Use Coolify env var UI on the `echocity` app. Do NOT commit values to git. Session B will read them via `process.env.*` with zod validation at boot.

Recommended env var names (exact):

```
LEGAL_NAME=<e.g. "ИП Миллер Филипп Игоревич">
LEGAL_INN=<e.g. "781234567890">
LEGAL_OGRN=<e.g. "1047812345678" — or LEGAL_OGRNIP for ИП>
LEGAL_ADDRESS=<mailing address>
LEGAL_ROSKOMNADZOR_NUMBER=<e.g. "78-24-123456">
SUPPORT_EMAIL=<real inbox>
YANDEX_METRIKA_ID=<numeric>
YANDEX_WEBMASTER_TOKEN=<token from verification meta>
WAITLIST_IP_SALT=<random 32-byte hex — generate once, never change>
NEXT_IMAGE_CDN_DOMAIN=<e.g. "storage.yandexcloud.net">
```

---

## Success criteria

- [ ] ИП / ООО registered, legal entity docs in hand.
- [ ] Роскомнадзор operator registry entry issued, номер recorded.
- [ ] Yandex.Metrika + Webmaster counters active, tokens in Coolify env.
- [ ] Image CDN chosen, bucket created, domain shared.
- [ ] `SUPPORT_EMAIL` inbox monitored.
- [ ] All 10 env values in Coolify, container restarts cleanly.
- [ ] Merchant acquisition plan documented in `.claude/ops/merchant-acquisition-plan.md` (new file — you write it, not an agent).

Once complete, Session B can ship P1 legal/SEO PR in full. Session A's Domain 4-6 can proceed with real inputs.
