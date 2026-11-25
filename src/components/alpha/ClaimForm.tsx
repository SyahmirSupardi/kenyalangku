"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, MailCheck } from "lucide-react";
import { ANDROID_BRANDS } from "@/src/lib/alpha/devices";
import { loadTurnstile } from "@/src/lib/alpha/turnstile";
import styles from "./alpha.module.css";

type Status = { total: number; claimed: number; remaining: number; open: boolean; turnstileSiteKey: string };

export function SlotCounter({ status }: { status: Status | null }) {
  const pct = status ? Math.min(100, (status.claimed / Math.max(1, status.total)) * 100) : 0;
  return (
    <div className={styles.counter} aria-live="polite">
      <strong>{status ? status.remaining : "—"}</strong>
      <span>{status ? `of ${status.total} tester slots left` : "Checking slots…"}</span>
      <div className={styles.meter} aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function ClaimForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ message: string } | null>(null);
  const [token, setToken] = useState("");
  const [platform, setPlatform] = useState<"android" | "windows">("android");
  const widgetEl = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/alpha/status", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setStatus((await res.json()) as Status);
      setStatusError(false);
    } catch {
      setStatusError(true);
    }
  }, []);

  useEffect(() => {
    // Fetching the live slot count once on mount, then every 30 seconds.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const siteKey = status?.turnstileSiteKey;
  const open = status?.open;
  useEffect(() => {
    if (!siteKey || !open || done || !widgetEl.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !widgetEl.current || widgetId.current) return;
        widgetId.current = api.render(widgetEl.current, {
          sitekey: siteKey,
          theme: "dark",
          // Always shown on the claim form, so every visitor passes the check before claiming.
          appearance: "always",
          action: "alpha-claim",
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
  }, [siteKey, open, done]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    if (!token) return setError("Please complete the “Verify you are human” check above the button.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/alpha/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          platform: data.get("platform"),
          deviceBrand: data.get("deviceBrand"),
          deviceModel: data.get("deviceModel"),
          agree: data.get("agree") === "on",
          website: data.get("website"),
          turnstileToken: token,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        window.turnstile?.reset(widgetId.current);
        setToken("");
      } else {
        setDone({ message: body.message ?? "Check your inbox for your redeem code." });
      }
      void refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <p className={styles.eyebrow}><i aria-hidden="true" /> GENESIS ROULETTE / CLOSED ALPHA</p>
        <h1>Claim your <span>alpha slot.</span></h1>
        <p className={styles.lede}>Genesis Roulette is opening to a small group of closed alpha testers. Fill in the form once and your personal redeem code arrives by email.</p>
        <ol className={styles.steps}>
          <li><b>01</b><span>Claim a slot with your name, email and platform.</span></li>
          <li><b>02</b><span>Open the email and use your redeem code on the download page.</span></li>
          <li><b>03</b><span>Install the game and type the same code when the game asks for it.</span></li>
        </ol>
        <SlotCounter status={status} />
      </div>

      <section className={styles.card} aria-labelledby="claim-title">
        <div className={styles.cardHead}><h2 id="claim-title">Tester details</h2><span>ONE CLAIM PER EMAIL</span></div>
        {done ? (
          <div className={styles.success} role="status">
            <h3><MailCheck size={24} aria-hidden="true" /> You’re in.</h3>
            <p>{done.message}</p>
            <Link className={styles.button} href="/projects/genesis-roulette/download">Go to the download page <ArrowUpRight size={18} /></Link>
          </div>
        ) : statusError && !status ? (
          <div className={styles.error} role="alert">The claim service is not available right now. Please try again later.</div>
        ) : status && !status.open ? (
          <div className={styles.full}>
            <h3>The closed alpha is full.</h3>
            <p>All {status.total} tester slots have been claimed. Thank you for your interest. Follow KenyalangKu for the next chapter of Genesis Roulette.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <label className={styles.field}><span>Full name</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>
            <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} /></label>
            <fieldset className={styles.platforms}>
              <legend className={styles.legend}>Platform</legend>
              <label className={styles.platform}><input type="radio" name="platform" value="android" required checked={platform === "android"} onChange={() => setPlatform("android")} /><span><b>Android</b><small>APK · 156 MB</small></span></label>
              <label className={styles.platform}><input type="radio" name="platform" value="windows" checked={platform === "windows"} onChange={() => setPlatform("windows")} /><span><b>Windows PC</b><small>Download · 193 MB</small></span></label>
            </fieldset>
            {platform === "android" && (
              <div className={styles.deviceRow}>
                <label className={styles.field}>
                  <span>Device brand</span>
                  <select name="deviceBrand" required defaultValue="">
                    <option value="" disabled>Select your brand</option>
                    {ANDROID_BRANDS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Model</span>
                  <input name="deviceModel" required maxLength={60} placeholder="e.g. Galaxy S23, Redmi Note 12" autoComplete="off" />
                </label>
              </div>
            )}
            <label className={styles.check}>
              <input type="checkbox" name="agree" required />
              <span>I understand this is an unfinished closed alpha build for testing. I will keep the build and my redeem code to myself, and I agree that KenyalangKu may email me about this alpha.</span>
            </label>
            {/* Left empty by people. Bots that fill every field are ignored. */}
            <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <div className={styles.captcha}>
              <span className={styles.legend}>Security check</span>
              <div ref={widgetEl} className={`${styles.turnstile} ${styles.turnstileShown}`} />
            </div>
            <button className={styles.button} type="submit" disabled={submitting || !status || !token}>{submitting ? "Claiming…" : "Claim my slot"} <ArrowUpRight size={18} /></button>
            <p className={styles.note}>Your name and email are used only to send your code and to contact you about this alpha. Already claimed? Submit the same email again and we’ll resend your code, or go to the <Link href="/projects/genesis-roulette/download">download page</Link>. Spam protection by Cloudflare Turnstile (<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">privacy</a>).</p>
          </form>
        )}
      </section>
    </>
  );
}
