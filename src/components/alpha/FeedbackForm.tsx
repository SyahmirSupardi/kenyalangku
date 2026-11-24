"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Bug, ImagePlus, MessageSquareHeart, Send, X } from "lucide-react";
import { loadTurnstile } from "@/src/lib/alpha/turnstile";
import {
  BUG_AREAS,
  DIFFICULTIES,
  FREQUENCIES,
  IMAGE_TYPES,
  KEEP_PLAYING,
  KNOWN_BUILDS,
  MAX_FILE_BYTES,
  MAX_FILES,
  PLAY_TIMES,
  RATINGS,
  SEVERITIES,
  type FeedbackKind,
} from "@/src/lib/alpha/feedback";
import styles from "./alpha.module.css";

type Done = { id: number; kind: FeedbackKind; message?: string };

function Scale({ name, label, min, max, required, lowLabel, highLabel }: { name: string; label: string; min: number; max: number; required?: boolean; lowLabel?: string; highLabel?: string }) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset className={styles.scale}>
      <legend className={styles.legend}>{label}{required ? "" : <em> · optional</em>}</legend>
      <div className={styles.scaleRow} style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((v) => (
          <label key={v} className={styles.scaleOption}>
            <input type="radio" name={name} value={v} required={required && v === min} />
            <span>{v}</span>
          </label>
        ))}
      </div>
      {(lowLabel || highLabel) && <div className={styles.scaleEnds} aria-hidden="true"><span>{lowLabel}</span><span>{highLabel}</span></div>}
    </fieldset>
  );
}

function Choice({ name, label, options, required }: { name: string; label: string; options: readonly { value: string; label: string; hint?: string }[]; required?: boolean }) {
  return (
    <fieldset className={styles.choices}>
      <legend className={styles.legend}>{label}{required ? "" : <em> · optional</em>}</legend>
      {options.map((o, i) => (
        <label key={o.value} className={styles.platform}>
          <input type="radio" name={name} value={o.value} required={required && i === 0} />
          <span><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
        </label>
      ))}
    </fieldset>
  );
}

const optional = <em> · optional</em>;

export default function FeedbackForm() {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [token, setToken] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const widgetEl = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);

  // Reads the security check key, and lets the game or a link pre-fill the form:
  // /projects/genesis-roulette/feedback?type=playtest&build=0.2.1&platform=android&device=Galaxy%20S23&os=Android%2014
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.get("type") === "playtest") setKind("playtest");
    const form = formRef.current;
    const put = (field: string, value: string | null) => {
      const el = form?.elements.namedItem(field);
      if (value && el instanceof HTMLInputElement) el.value = value.slice(0, 80);
    };
    put("build", params.get("build"));
    put("device", params.get("device"));
    put("os_version", params.get("os"));
    const platform = params.get("platform");
    if (platform === "android" || platform === "windows") {
      const radio = form?.querySelector<HTMLInputElement>(`input[name="platform"][value="${platform}"]`);
      if (radio) radio.checked = true;
    }
    fetch("/api/alpha/feedback", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((body: { turnstileSiteKey?: string }) => setSiteKey(body.turnstileSiteKey ?? ""))
      .catch(() => setUnavailable(true));
  }, []);

  useEffect(() => {
    if (!siteKey || done || !widgetEl.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !widgetEl.current || widgetId.current) return;
        widgetId.current = api.render(widgetEl.current, {
          sitekey: siteKey,
          theme: "dark",
          // Runs in the background. The box only appears if Cloudflare needs the visitor to click.
          appearance: "interaction-only",
          "before-interactive-callback": () => setChallenge(true),
          "after-interactive-callback": () => setChallenge(false),
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch(() => setError("The security check could not load. Please disable any blocker for this page and reload."));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, done]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} screenshots.`);
        break;
      }
      if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
        setError(`“${file.name}” is not a PNG, JPEG, WebP or GIF image. For a video, paste a link instead.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`“${file.name}” is larger than 5 MB.`);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) return setError(challenge ? "Please complete the security check above the button." : "We’re still checking your connection. Please press the button again in a few seconds.");
    const data = new FormData(event.currentTarget);
    data.delete("screenshots");
    for (const f of files) data.append("screenshots", f, f.name);
    data.set("kind", kind);
    data.set("turnstileToken", token);
    setSubmitting(true);
    try {
      const res = await fetch("/api/alpha/feedback", { method: "POST", body: data });
      const body = (await res.json().catch(() => ({}))) as { id?: number; message?: string; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        window.turnstile?.reset(widgetId.current);
        setToken("");
      } else {
        setDone({ id: body.id ?? 0, kind, message: body.message });
        setFiles([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={`${styles.intro} ${styles.sticky}`}>
        <p className={styles.eyebrow}><i aria-hidden="true" /> GENESIS ROULETTE / PLAYER FEEDBACK</p>
        <h1>Tell us what <span>you found.</span></h1>
        <p className={styles.lede}>Every report from a tester helps shape the next build. Report a bug when something breaks, or share how the game felt to play.</p>
        <ol className={styles.steps}>
          <li><b>01</b><span><strong>One problem per report.</strong> Two bugs are easier to fix as two reports.</span></li>
          <li><b>02</b><span><strong>Write the steps.</strong> Tell us exactly what you did, in order, so we can make it happen again.</span></li>
          <li><b>03</b><span><strong>Expected vs. actual.</strong> Say what should have happened and what happened instead.</span></li>
          <li><b>04</b><span><strong>Show it.</strong> A screenshot or a short screen recording link is worth a paragraph.</span></li>
        </ol>
        <p className={styles.note}>Not a tester yet? <Link href="/projects/genesis-roulette/claim">Claim a closed alpha slot</Link>.</p>
      </div>

      <section className={styles.card} aria-labelledby="feedback-title">
        <div className={styles.cardHead}><h2 id="feedback-title">{done ? "Report sent" : kind === "bug" ? "Bug report" : "Playtest feedback"}</h2><span>CLOSED ALPHA 0.2.1</span></div>
        {done ? (
          <div className={styles.success} role="status">
            <h3><Send size={22} aria-hidden="true" /> Terima kasih! Report #{done.id} received.</h3>
            <p>{done.kind === "bug" ? "The team will try to reproduce the bug in the next round of fixes. We may email you if we need more detail." : "Your feedback goes straight to the team and helps decide what changes next."}</p>
            {done.message && <p>{done.message}</p>}
            <div className={styles.adminBar}>
              <button className={styles.button} type="button" onClick={() => { setDone(null); setToken(""); }}>Send another report <ArrowUpRight size={18} /></button>
              <Link className={`${styles.button} ${styles.ghost}`} href="/projects/genesis-roulette">Back to Genesis Roulette</Link>
            </div>
          </div>
        ) : unavailable ? (
          <div className={styles.error} role="alert">The feedback service is not available right now. Please email your report to <a href="mailto:admin@kenyalangku.my">admin@kenyalangku.my</a>.</div>
        ) : (
          <form ref={formRef} onSubmit={submit}>
            <div className={styles.tabs} role="radiogroup" aria-label="Report type">
              <button type="button" role="radio" aria-checked={kind === "bug"} className={kind === "bug" ? styles.tabOn : undefined} onClick={() => setKind("bug")}><Bug size={18} aria-hidden="true" /> Report a bug</button>
              <button type="button" role="radio" aria-checked={kind === "playtest"} className={kind === "playtest" ? styles.tabOn : undefined} onClick={() => setKind("playtest")}><MessageSquareHeart size={18} aria-hidden="true" /> Share playtest feedback</button>
            </div>
            {error && <div className={styles.error} role="alert">{error}</div>}

            <h3 className={styles.section}>About you</h3>
            <div className={styles.deviceRow}>
              <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} /></label>
              <label className={styles.field}><span>Name{optional}</span><input name="name" autoComplete="name" maxLength={80} /></label>
            </div>
            <label className={styles.field}>
              <span>Redeem code{optional}</span>
              <input name="code" autoComplete="off" autoCapitalize="characters" maxLength={128} spellCheck={false} placeholder="The code from your alpha email" />
              <small className={styles.help}>Use the email you claimed with. Adding your code marks the report as from a verified tester.</small>
            </label>

            <h3 className={styles.section}>Your setup</h3>
            <fieldset className={styles.platforms}>
              <legend className={styles.legend}>Platform</legend>
              <label className={styles.platform}><input type="radio" name="platform" value="android" required defaultChecked /><span><b>Android</b><small>Phone or tablet</small></span></label>
              <label className={styles.platform}><input type="radio" name="platform" value="windows" /><span><b>Windows PC</b><small>Desktop or laptop</small></span></label>
            </fieldset>
            <div className={styles.deviceRow}>
              <label className={styles.field}><span>Device{optional}</span><input name="device" maxLength={80} placeholder="e.g. Galaxy S23, Redmi Note 12" autoComplete="off" /></label>
              <label className={styles.field}><span>OS version{optional}</span><input name="os_version" maxLength={60} placeholder="e.g. Android 14, Windows 11" autoComplete="off" /></label>
            </div>
            <label className={styles.field}>
              <span>Game version</span>
              <input name="build" list="gr-builds" maxLength={30} defaultValue={KNOWN_BUILDS[0]} required autoComplete="off" />
              <datalist id="gr-builds">{KNOWN_BUILDS.map((b) => <option key={b} value={b} />)}</datalist>
            </label>

            {kind === "bug" ? (
              <>
                <h3 className={styles.section}>The bug</h3>
                <label className={styles.field}><span>What went wrong, in one line</span><input name="title" required maxLength={140} placeholder="e.g. Game freezes after the second roulette spin" /></label>
                <label className={styles.field}>
                  <span>Where in the game</span>
                  <select name="area" required defaultValue="">
                    <option value="" disabled>Choose an area</option>
                    {BUG_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <Choice name="severity" label="How bad is it" options={SEVERITIES} required />
                <Choice name="frequency" label="How often does it happen" options={FREQUENCIES} required />
                <label className={styles.field}>
                  <span>Steps to reproduce</span>
                  <textarea name="steps" required rows={5} maxLength={4000} placeholder={"1. Open the game and tap Play\n2. Spin the roulette twice\n3. …"} />
                </label>
                <div className={styles.deviceRow}>
                  <label className={styles.field}><span>What you expected{optional}</span><textarea name="expected" rows={4} maxLength={2000} placeholder="The next round starts." /></label>
                  <label className={styles.field}><span>What happened instead</span><textarea name="actual" required rows={4} maxLength={2000} placeholder="The screen froze and I had to close the game." /></label>
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.section}>How it felt</h3>
                <label className={styles.field}>
                  <span>How long did you play{optional}</span>
                  <select name="play_time" defaultValue="">
                    <option value="">Choose one</option>
                    {PLAY_TIMES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <p className={styles.help} style={{ marginBottom: 14 }}>Rate from 1 (poor) to 5 (great).</p>
                {RATINGS.map((r) => <Scale key={r.key} name={r.key} label={r.label} min={1} max={5} required={r.key === "rating_overall"} lowLabel="Poor" highLabel="Great" />)}
                <Choice name="difficulty" label="Difficulty" options={DIFFICULTIES} />
                <label className={styles.field}><span>What did you enjoy most</span><textarea name="liked" rows={3} maxLength={3000} /></label>
                <label className={styles.field}><span>What confused or frustrated you</span><textarea name="frustrated" rows={3} maxLength={3000} /></label>
                <label className={styles.field}><span>What would you change or add</span><textarea name="suggestions" rows={3} maxLength={3000} /></label>
                <Choice name="keep_playing" label="Would you keep playing" options={KEEP_PLAYING} />
                <Scale name="recommend" label="How likely are you to recommend it to a friend" min={0} max={10} lowLabel="Not likely" highLabel="Very likely" />
              </>
            )}

            <h3 className={styles.section}>Screenshots and video</h3>
            <div className={styles.field}>
              <span>Screenshots{optional}</span>
              <label className={styles.drop}>
                <input ref={fileInput} type="file" name="screenshots" accept={IMAGE_TYPES.join(",")} multiple onChange={(e) => addFiles(e.currentTarget.files)} disabled={files.length >= MAX_FILES} />
                <ImagePlus size={20} aria-hidden="true" />
                <span>{files.length >= MAX_FILES ? `${MAX_FILES} screenshots attached` : `Add up to ${MAX_FILES} images · PNG, JPEG, WebP or GIF · 5 MB each`}</span>
              </label>
              {files.length > 0 && (
                <ul className={styles.fileList}>
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      <span>{f.name} <small>{(f.size / 1024 / 1024).toFixed(1)} MB</small></span>
                      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={16} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {kind === "bug" && (
              <label className={styles.field}>
                <span>Video or file link{optional}</span>
                <input name="media_link" type="url" inputMode="url" maxLength={500} placeholder="https:// a YouTube, Google Drive or other link" />
                <small className={styles.help}>Screen recordings are too big to upload here. Share a link that anyone with it can open.</small>
              </label>
            )}
            <label className={styles.field}><span>Anything else{optional}</span><textarea name="notes" rows={3} maxLength={3000} /></label>

            {/* Left empty by people. Bots that fill every field are ignored. */}
            <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

            <div ref={widgetEl} className={challenge ? `${styles.turnstile} ${styles.turnstileShown}` : styles.turnstile} />
            <button className={styles.button} type="submit" disabled={submitting || siteKey === null}>{submitting ? "Sending…" : kind === "bug" ? "Send bug report" : "Send feedback"} <Send size={18} /></button>
            <p className={styles.note}>Your email is used only to follow up on this report. Reports are read by the KenyalangKu team and are not public. Spam protection by Cloudflare Turnstile (<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">privacy</a>).</p>
          </form>
        )}
      </section>
    </>
  );
}
