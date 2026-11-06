# KenyalangKu project checkpoint

Updated: 2026-11-06. Verify current code, Git state, and deployment before relying on this checkpoint.

## Current site

- Local project: `D:\kenyalangku`; development URL when running: `http://localhost:3000`.
- GitHub remote: `https://github.com/SyahmirSupardi/kenyalangku.git`.
- Primary production URL: `https://www.kenyalangku.my` on Cloudflare Workers. The `kenyalangku` Worker in the Takeo Takeshi account was deployed on 2026-11-06 as version `aa58806f-5460-4f56-87b3-9427b25b9a38`. The checked pages and Steam icon asset returned HTTP 200. The bare `kenyalangku.my` hostname had no public DNS answer when checked; `www` is the verified live address.
- The Vercel project remains linked locally as an earlier hosting target. It is not the default release destination. The last verified Vercel deployment was `dpl_7jVimyx8KJY89LPARqyu6JN5XQfr` at `https://kenyalangku.vercel.app`.
- The homepage is the standalone Kenyalang journey. Inner pages use Next.js 16. `vercel.json` sets the Next.js framework so the inner routes deploy correctly.
- Active routes: `/`, `/about`, `/about/nazreen/assets`, `/projects`, `/projects/pusaka`, `/projects/myth-tanah`, `/projects/genesis-roulette`, `/collaboration`, and `/contact`.
- Project ordering: PUSAKA, MYTH: TANAH, then Genesis Roulette under Special Initiatives. Nazreen's interactive asset ordering: Pavilion, then Watchtower.
- About Us profiles: Syahmir Supardi, Nazreen Bin Abdul Radzak, Ku Nazrin Ardy, and Muhammad Daniel Erfan Bin Arbain. Nazrin's two photos alternate every five seconds while his profile is open.

## Release notes

- The 2026-11-06 GitHub release includes the updated studio pages, PUSAKA roadmap and platform icons, project categories, collaboration content, and mobile adjustments. Current remote branch history has no Claude co-author trailers; earlier branch history was rewritten to remove those trailers without changing file trees.
- Cloudflare is the primary release target. The OpenNext Cloudflare build and Worker deployment passed on 2026-11-06; this deployment was made directly from the CLI and does not establish automatic GitHub-to-Cloudflare releases.
- `npm run lint` passed with four existing warnings; `npm run typecheck` passed. The OpenNext Cloudflare production build passed. A previous local Next.js build was interrupted by a sandbox process/file permission error.

## Handoff rule

When scope, release state, or a product decision changes, replace stale details here with the verified current facts. Do not treat this file as a substitute for checking live state.
