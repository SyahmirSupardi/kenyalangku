# KenyalangKu project checkpoint

Updated: 2026-11-06. Verify current code, Git state, and deployment before relying on this checkpoint.

## Current site

- Local project: `D:\kenyalangku`; development URL when running: `http://localhost:3000`.
- GitHub remote: `https://github.com/SyahmirSupardi/kenyalangku.git`.
- Public production URL: `https://kenyalangku.vercel.app`. Vercel project: `kenyalangku` in `syahmirsupardis-projects` (`prj_g0CJRpn1E2pqj23NYTodsvMINue6`). The 2026-11-06 production deployment `dpl_GfnbqX8LeY8Uoobfni1HhxwKXkLE` built successfully; the homepage, active inner pages, and logo asset returned HTTP 200.
- The homepage is the standalone Kenyalang journey. Inner pages use Next.js 16. `vercel.json` sets the Next.js framework so the inner routes deploy correctly.
- Active routes: `/`, `/about`, `/about/nazreen/assets`, `/projects`, `/projects/pusaka`, `/projects/myth-tanah`, `/projects/genesis-roulette`, `/collaboration`, and `/contact`.
- Project ordering: PUSAKA, MYTH: TANAH, then Genesis Roulette under Special Initiatives. Nazreen's interactive asset ordering: Pavilion, then Watchtower.
- About Us profiles: Syahmir Supardi, Nazreen Bin Abdul Radzak, Ku Nazrin Ardy, and Muhammad Daniel Erfan Bin Arbain. Nazrin's two photos alternate every five seconds while his profile is open.

## Release notes

- The 2026-11-06 GitHub release includes the updated studio pages, PUSAKA roadmap and platform icons, project categories, collaboration content, and mobile adjustments. Current remote branch history has no Claude co-author trailers; earlier branch history was rewritten to remove those trailers without changing file trees.
- The Vercel deployment was made directly from the CLI. Automatic GitHub-to-Vercel integration is not connected; its connection request was rejected by automatic approval review because it would grant ongoing external Git access beyond the requested one-time release. A future push will require a separate deployment unless that integration is explicitly approved.
- `npm run lint` passed with four existing warnings; `npm run typecheck` passed. Vercel's Next.js production build passed. A local production build was interrupted by a sandbox process/file permission error, so the Vercel build is the verified production build.

## Handoff rule

When scope, release state, or a product decision changes, replace stale details here with the verified current facts. Do not treat this file as a substitute for checking live state.
