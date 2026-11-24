"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, KeyRound } from "lucide-react";
import styles from "./alpha.module.css";

type Grant = { url: string; expiresAt: number; platform: "android" | "windows"; label: string; size: string };

export default function RedeemForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [grant, setGrant] = useState<Grant | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/alpha/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), code: data.get("code") }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<Grant> & { error?: string };
      if (!res.ok || !body.url) setError(body.error ?? "Something went wrong. Please try again.");
      else setGrant(body as Grant);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const expires = grant ? new Date(grant.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <>
      <div className={styles.intro}>
        <p className={styles.eyebrow}><i aria-hidden="true" /> GENESIS ROULETTE / CLOSED ALPHA</p>
        <h1>Download the <span>closed alpha.</span></h1>
        <p className={styles.lede}>Enter the email you claimed with and the redeem code from your email. You’ll get a private download link that works for a few hours. Come back any time for a fresh one.</p>
        <p className={styles.lede}>No code yet? <Link href="/projects/genesis-roulette/claim">Claim a tester slot</Link> while slots remain.</p>
      </div>

      <section className={styles.card} aria-labelledby="redeem-title">
        <div className={styles.cardHead}><h2 id="redeem-title">Redeem your code</h2><span>TESTERS ONLY</span></div>
        {grant ? (
          <div className={styles.success} role="status">
            <h3><KeyRound size={24} aria-hidden="true" /> Code accepted.</h3>
            <div className={styles.downloadBox}>
              <p>{grant.label} build · {grant.size}. This link expires {expires}.</p>
              <a className={styles.button} href={grant.url} download>Download Genesis Roulette <ArrowDown size={18} /></a>
            </div>
            {grant.platform === "android" ? (
              <ol className={styles.install}>
                <li>Open the downloaded APK on your Android phone.</li>
                <li>If Android asks, allow your browser or file manager to install unknown apps.</li>
                <li>Launch Genesis Roulette and type your redeem code when asked.</li>
              </ol>
            ) : (
              <ol className={styles.install}>
                <li>Extract the downloaded file to a folder on your PC.</li>
                <li>Run the game. If Windows SmartScreen appears, choose More info, then Run anyway.</li>
                <li>Type your redeem code when the game asks for it.</li>
              </ol>
            )}
            <p className={styles.note}>Found a bug or have thoughts after playing? <Link href={`/projects/genesis-roulette/feedback?platform=${grant.platform}`}>Send player feedback</Link>.</p>
            <button type="button" className={`${styles.button} ${styles.ghost}`} onClick={() => setGrant(null)} style={{ marginTop: 22 }}>Use another code</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} /></label>
            <label className={styles.field}><span>Redeem code</span><input name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} required maxLength={128} /></label>
            <button className={styles.button} type="submit" disabled={submitting}>{submitting ? "Checking…" : "Get my download link"} <ArrowUpRight size={18} /></button>
            <p className={styles.note}>Lost your code? Submit the <Link href="/projects/genesis-roulette/claim">claim form</Link> again with the same email and we’ll resend it. Need help? Email <a href="mailto:admin@kenyalangku.my">admin@kenyalangku.my</a>.</p>
          </form>
        )}
      </section>
    </>
  );
}
