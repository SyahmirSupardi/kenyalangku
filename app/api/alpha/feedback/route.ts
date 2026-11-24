import { alphaEnv } from "@/src/lib/alpha/env";
import { clientIp, isPlatform, json, normaliseEmail, safeEqual, verifyTurnstile } from "@/src/lib/alpha/server";
import {
  BUG_AREAS,
  DIFFICULTIES,
  FREQUENCIES,
  IMAGE_TYPES,
  KEEP_PLAYING,
  MAX_FILE_BYTES,
  MAX_FILES,
  PLAY_TIMES,
  RATINGS,
  SEVERITIES,
} from "@/src/lib/alpha/feedback";

export const dynamic = "force-dynamic";

/* Limits per sender in 24 hours, so a script cannot flood the inbox. */
const PER_EMAIL_PER_DAY = 15;
const PER_IP_PER_DAY = 30;

class InputError extends Error {}

const text = (form: FormData, key: string, max: number, required = false, label = key) => {
  const value = String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim();
  if (required && !value) throw new InputError(`Please fill in “${label}”.`);
  if (value.length > max) throw new InputError(`“${label}” is too long (up to ${max} characters).`);
  return value || null;
};
const oneOf = (form: FormData, key: string, allowed: readonly string[], required = false, label = key) => {
  const value = String(form.get(key) ?? "");
  if (!value) {
    if (required) throw new InputError(`Please choose “${label}”.`);
    return null;
  }
  if (!allowed.includes(value)) throw new InputError(`Please choose a valid option for “${label}”.`);
  return value;
};
const whole = (form: FormData, key: string, min: number, max: number, required = false, label = key) => {
  const raw = String(form.get(key) ?? "");
  if (!raw) {
    if (required) throw new InputError(`Please rate “${label}”.`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new InputError(`Please give “${label}” a value from ${min} to ${max}.`);
  return n;
};
const link = (form: FormData, key: string) => {
  const value = text(form, key, 500, false, "Video or file link");
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.toString();
  } catch {
    throw new InputError("The video or file link must be a full web address starting with https://.");
  }
};

/* Checks the first bytes so only real images are stored, whatever the file claims to be. */
function imageType(bytes: Uint8Array): (typeof IMAGE_TYPES)[number] | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };

async function hashIp(ip: string | undefined, salt: string) {
  if (!ip) return null;
  const sum = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(sum).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Gives the form its security check key. */
export async function GET() {
  try {
    const { env } = alphaEnv();
    return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "" });
  } catch (error) {
    console.error("feedback config failed", error);
    return json({ error: "The feedback service is not available right now." }, 503);
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Please fill in the form again." }, 400);
  }

  // Hidden field that people never see. Bots that fill it get a normal-looking reply.
  if (String(form.get("website") ?? "")) return json({ ok: true, id: 0 });

  let values: Record<string, string | number | null>;
  let files: File[];
  let email: string;
  let code: string | null;
  try {
    const kind = oneOf(form, "kind", ["bug", "playtest"], true, "Report type") as "bug" | "playtest";
    const mail = normaliseEmail(form.get("email"));
    if (!mail) throw new InputError("Please enter a valid email address, so we can follow up if needed.");
    email = mail;
    code = text(form, "code", 128, false, "Redeem code")?.toUpperCase() ?? null;
    const platform = String(form.get("platform") ?? "");
    if (!isPlatform(platform)) throw new InputError("Please choose Android or Windows.");

    values = {
      kind,
      name: text(form, "name", 80, false, "Name"),
      email,
      platform,
      device: text(form, "device", 80, false, "Device"),
      os_version: text(form, "os_version", 60, false, "OS version"),
      build: text(form, "build", 30, false, "Game version"),
      notes: text(form, "notes", 3000, false, "Anything else"),
    };

    if (kind === "bug") {
      Object.assign(values, {
        title: text(form, "title", 140, true, "What went wrong"),
        area: oneOf(form, "area", BUG_AREAS, true, "Where in the game"),
        severity: oneOf(form, "severity", SEVERITIES.map((s) => s.value), true, "How bad is it"),
        frequency: oneOf(form, "frequency", FREQUENCIES.map((s) => s.value), true, "How often"),
        steps: text(form, "steps", 4000, true, "Steps to reproduce"),
        expected: text(form, "expected", 2000, false, "What you expected"),
        actual: text(form, "actual", 2000, true, "What happened instead"),
        media_link: link(form, "media_link"),
      });
    } else {
      const ratings = Object.fromEntries(RATINGS.map((r) => [r.key, whole(form, r.key, 1, 5, r.key === "rating_overall", r.label)]));
      Object.assign(values, ratings, {
        play_time: oneOf(form, "play_time", PLAY_TIMES, false, "How long you played"),
        difficulty: oneOf(form, "difficulty", DIFFICULTIES.map((d) => d.value), false, "Difficulty"),
        liked: text(form, "liked", 3000, false, "What you enjoyed"),
        frustrated: text(form, "frustrated", 3000, false, "What confused or frustrated you"),
        suggestions: text(form, "suggestions", 3000, false, "Suggestions"),
        keep_playing: oneOf(form, "keep_playing", KEEP_PLAYING.map((k) => k.value), false, "Keep playing"),
        recommend: whole(form, "recommend", 0, 10, false, "Recommend to a friend"),
      });
      if (!values.liked && !values.frustrated && !values.suggestions) {
        throw new InputError("Please tell us at least one thing: what you enjoyed, what frustrated you, or a suggestion.");
      }
    }

    files = form.getAll("screenshots").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f && f.size > 0);
    if (files.length > MAX_FILES) throw new InputError(`Please attach up to ${MAX_FILES} screenshots.`);
    for (const f of files) if (f.size > MAX_FILE_BYTES) throw new InputError(`“${f.name}” is larger than 5 MB. Please attach a smaller screenshot.`);
  } catch (error) {
    if (error instanceof InputError) return json({ error: error.message }, 400);
    throw error;
  }

  try {
    if (!(await verifyTurnstile(form.get("turnstileToken"), request))) {
      return json({ error: "The security check did not pass. Please try again." }, 400);
    }
    const { env, db } = alphaEnv();
    const ipHash = await hashIp(clientIp(request), env.ALPHA_SIGNING_SECRET ?? "kenyalangku");

    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM feedback_reports WHERE email = ?1 AND created_at > datetime('now', '-1 day')) AS byEmail,
           (SELECT COUNT(*) FROM feedback_reports WHERE ?2 IS NOT NULL AND ip_hash = ?2 AND created_at > datetime('now', '-1 day')) AS byIp`,
      )
      .bind(email, ipHash)
      .first<{ byEmail: number; byIp: number }>();
    if ((counts?.byEmail ?? 0) >= PER_EMAIL_PER_DAY || (counts?.byIp ?? 0) >= PER_IP_PER_DAY) {
      return json({ error: "You have sent a lot of reports today. Thank you! Please try again tomorrow, or email admin@kenyalangku.my." }, 429);
    }

    // Links the report to the tester's alpha claim. Only the studio sees whether it matched.
    const claim = await db.prepare("SELECT id, code FROM alpha_claims WHERE email = ?1").bind(email).first<{ id: number; code: string }>();
    const codeVerified = claim && code ? await safeEqual(code, claim.code.toUpperCase()) : false;

    const columns = Object.keys(values);
    const inserted = await db
      .prepare(
        `INSERT INTO feedback_reports (${columns.join(", ")}, claim_id, code_verified, ip_hash)
         VALUES (${columns.map((_, i) => `?${i + 1}`).join(", ")}, ?${columns.length + 1}, ?${columns.length + 2}, ?${columns.length + 3})
         RETURNING id`,
      )
      .bind(...columns.map((c) => values[c]), claim?.id ?? null, codeVerified ? 1 : 0, ipHash)
      .first<{ id: number }>();
    if (!inserted) throw new Error("insert returned no row");

    let skipped = 0;
    if (files.length) {
      const bucket = env.ALPHA_BUILDS;
      for (const [i, file] of files.entries()) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const type = imageType(bytes);
        if (!type || !bucket) {
          skipped++;
          continue;
        }
        const key = `feedback/${inserted.id}/${i + 1}-${crypto.randomUUID().slice(0, 8)}.${EXT[type]}`;
        await bucket.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType: type } });
        await db
          .prepare("INSERT INTO feedback_files (report_id, r2_key, content_type, size, original_name) VALUES (?1, ?2, ?3, ?4, ?5)")
          .bind(inserted.id, key, type, bytes.byteLength, file.name.slice(0, 120) || null)
          .run();
      }
    }

    return json({
      ok: true,
      id: inserted.id,
      message: skipped ? `${skipped} attachment${skipped > 1 ? "s were" : " was"} not a PNG, JPEG, WebP or GIF image and was left out.` : undefined,
    });
  } catch (error) {
    console.error("feedback submit failed", error);
    return json({ error: "Something went wrong on our side. Please try again in a moment, or email admin@kenyalangku.my." }, 500);
  }
}
