# Genesis Roulette closed alpha: setup

The claim system lives at:

- `/projects/genesis-roulette/claim`: claim form (name, email, platform, agreement, Turnstile).
- `/projects/genesis-roulette/download`: email + redeem code, returns a private download link.
- `/admin/alpha`: private claims list (admin token), resend email, cancel/restore codes, CSV export.

How it works: the claim form shows a visible Cloudflare Turnstile check ("Verify you are human")
and a hidden honeypot field; the claim button stays disabled until the check passes, and the server
verifies the token before doing anything. Each claim then takes the next unused code from the game's
own code list (table `alpha_codes` in D1), up to `ALPHA_CAP` active claims, and the code is emailed
straight away through Resend from `admin@kenyalangku.my`. (From 2026-11-24 to 2026-11-25 claims
waited for manual approval; that gate was removed. Any request still waiting from that period is
approved and emailed when the tester submits again, or with **Approve & send code** in
`/admin/alpha`. Emails rejected in that period stay blocked until **Allow again**.) A correct email + code gives a signed link that streams the build from R2
and expires after `ALPHA_LINK_HOURS` (default 6). Cancelling a claim stops new and existing links
and frees the slot; it does not stop the game from accepting that code.

Run these once on a computer where `npx wrangler login` uses the Cloudflare account that owns the
`kenyalangku` Worker.

## 1. Database

```sh
# (done) database created as kenyalangku-alpha; its id is already in wrangler.jsonc
npx wrangler d1 migrations apply kenyalangku-alpha --remote
node scripts/import-alpha-codes.mjs path/to/tester-codes.csv
```

The import uses the `code` column and, when a `status` column exists, only rows marked `unused`.
Re-running it is safe; existing codes are skipped. Never commit the code list.

## 2. Builds (R2)

```sh
npx wrangler r2 bucket create genesis-roulette-closed-alpha
npx wrangler r2 object put genesis-roulette-closed-alpha/GenesisRoulette-0.2.1-tester.apk --file path/to/game.apk --remote
npx wrangler r2 object put genesis-roulette-closed-alpha/GenesisRoulette-0.2.1-win64.zip --file path/to/windows-build.zip --remote
```

The object names must match `ALPHA_BUILD_ANDROID` and `ALPHA_BUILD_WINDOWS` in `wrangler.jsonc`.
To ship a new build, upload it to the bucket, then change the two build names in `wrangler.jsonc` (`ALPHA_BUILD_ANDROID`, `ALPHA_BUILD_WINDOWS`, in both `vars` and `previews.vars`) and deploy. Or upload over the same name. The bucket stays private; only the Worker reads it.

## 3. Turnstile

Cloudflare dashboard > Turnstile > Add widget for `www.kenyalangku.my` and `kenyalangku.my`
(Managed mode). Put the **site key** in `wrangler.jsonc` `vars.TURNSTILE_SITE_KEY`, then:

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY
```

## 4. Email (Resend)

In Resend, add the domain `kenyalangku.my` and add the DNS records it lists in Cloudflare DNS.
These sit alongside the existing Email Routing records. Once verified, create an API key with
sending access and run:

```sh
npx wrangler secret put RESEND_API_KEY
```

## 5. Other secrets

```sh
npx wrangler secret put ALPHA_SIGNING_SECRET   # 32+ random characters, signs download links
npx wrangler secret put ALPHA_ADMIN_TOKEN      # 16+ characters, the password for /admin/alpha
```

## 6. Deploy

```sh
npm run deploy:cloudflare
```

## 7. Player feedback

Testers send bug reports and playtest feedback from `/projects/genesis-roulette/feedback`
(linked from the Genesis Roulette roadmap and the download page). Reports are stored in the same
D1 database (`feedback_reports`, `feedback_files`); screenshots go to the private R2 bucket under
`feedback/<report id>/`. Read and triage them at `/admin/feedback` with the same admin token.

Create the tables once:

```sh
npx wrangler d1 migrations apply kenyalangku-alpha --remote
```

or paste `migrations/0003_player_feedback.sql` into the D1 console in the Cloudflare dashboard.
Until the tables exist the form shows an error and the admin hub says "Not set up".

The form uses the same Turnstile widget, a hidden honeypot field, and a limit of 15 reports per
email and 30 per network a day. A report is marked "Verified tester" when its email and redeem code
match an alpha claim. The game can open the form pre-filled:
`/projects/genesis-roulette/feedback?type=bug&build=0.2.1&platform=android&device=Galaxy%20S23&os=Android%2014`
(`type=playtest` opens the playtest tab). Add new build numbers to `KNOWN_BUILDS` in
`src/lib/alpha/feedback.ts`.

## 8. Approval columns (migration 0004)

`migrations/0004_claim_approval.sql` adds `alpha_claims.approved_at` (empty = waiting for approval;
new claims are now approved automatically)
and the `alpha_rejections` table. Existing claims are marked approved, because their codes were
already emailed. Apply it **before** deploying the code that uses it:

```sh
npx wrangler d1 migrations apply kenyalangku-alpha --remote
```

or paste the file into the D1 console in the Cloudflare dashboard (Storage & Databases → D1 →
kenyalangku-alpha → Console). Run it once only; a second run fails on the existing column.

## Local testing

Create `.dev.vars` (git-ignored) with Cloudflare's always-pass Turnstile test keys and any
signing/admin values, then:

```sh
npx wrangler d1 migrations apply kenyalangku-alpha --local
node scripts/import-alpha-codes.mjs codes.csv --local
npx wrangler r2 object put genesis-roulette-closed-alpha/GenesisRoulette-0.2.1-tester.apk --file some.apk --local
npm run dev
```

```
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ALPHA_SIGNING_SECRET=local-only-signing-secret-at-least-32-chars
ALPHA_ADMIN_TOKEN=local-admin-token
```
