# KenyalangKu project checkpoint

Updated: 2026-11-05. This is a compact handoff for new threads, not a substitute for checking the current code, Git state, and deployed site.

## Current state

- Local project: `D:\kenyalangku`; development URL when running: `http://localhost:3000`.
- GitHub remote: `https://github.com/SyahmirSupardi/kenyalangku.git`. The local Vercel project is `kenyalangku` (`prj_ed6EsSUONAcXLiPrFZ8J3QT5ECs9`); the old `https://kenyalangku.vercel.app` URL returned 404 on 2026-11-06. Verify a working deployment URL before calling this release live.
- Homepage is the standalone Kenyalang journey; inner pages use Next.js. Active routes and product rules are in `AGENTS.md`.
- Project ordering: PUSAKA, then MYTH: TANAH. Nazreen's interactive asset ordering: Pavilion, then Watchtower.
- About Us profiles now include Syahmir, Nazreen, Ku Nazrin Ardy (Narrative Designer), and Muhammad Daniel Erfan Bin Arbain (Technical Game Designer). Nazrin's two supplied photos alternate every five seconds while his profile is open; automatic story advancement stops on his profile so the photos can keep looping.
- The last known repository commit before this instruction update is `21beef3` (Add Pavilion to Nazreen asset gallery). The branch was clean and aligned with `origin/main` at the start of this task.

## Active work

- About Us intro and team copy were updated locally. Syahmir's portfolio button links to the user-supplied site; Nazreen's links to his asset gallery. Nazrin and Daniel have no portfolio link supplied, so no portfolio buttons are shown for them. The carousel portrait area uses an adapted ProfileCard with the hornbill logo pattern; Nazrin's two photos flip every five seconds. The About heading keeps “Imagined everywhere.” together at responsive widths.
- The homepage and inner pages use a shared, locally built minimal footer based on the user's supplied visual. React Bits Pro Footer 7 was not installed because `REACTBITS_LICENSE_KEY` is absent; the user chose the design without requiring the licensed block. The footer is now shorter and has no updates form. Lint, typecheck, and webpack production build passed; all active local routes returned 200 with the footer and no updates markup. Visual browser review is still pending because browser automation could not connect.
- The homepage's Section 03 project cards now open into a centered image preview with the existing project summary and details link. The original artwork and PUSAKA-first ordering remain. Desktop and mobile layouts were inspected in a local browser; both card interactions and the MYTH: TANAH route mapping were verified. Lint, typecheck, and webpack production build passed. This change is local only.
- The collaboration carousel and homepage strip now include the supplied Xsolla emblem labelled Game Academy and the supplied Godot logo labelled Technology We Build With. KrackedDevs remains labelled AI Community, and Unreal Engine remains technology. Desktop/mobile visual checks, asset requests, lint, typecheck, and webpack production build passed. This change is local only.

## Handoff rule

When a substantial task spans threads or changes the site's scope, release state, or a product decision, update this file with only the current facts, the remaining work, and the verified result. Remove stale entries rather than accumulating a historical task log.
