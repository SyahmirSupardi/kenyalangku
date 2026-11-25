"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./alpha.module.css";

type Status = { total: number; claimed: number; remaining: number; open: boolean };

/* Highlighted call to action for the Genesis Roulette closed alpha.
   It links to the claim form (the form is filled in before any code is given)
   and shows the live number of tester slots left. */
export default function ClaimCta() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/alpha/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        if (alive) setStatus(data);
      } catch {
        /* The button still works without the live count. */
      }
    }
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const full = status ? !status.open : false;
  const pct = status ? Math.min(100, (status.claimed / Math.max(1, status.total)) * 100) : 0;

  return (
    <div className={styles.cta}>
      <p className={styles.ctaEyebrow}><i aria-hidden="true" /> CLOSED ALPHA · GAME TESTERS</p>
      {full ? (
        <span className={`${styles.ctaButton} ${styles.ctaButtonFull}`} aria-disabled="true">Closed alpha is full</span>
      ) : (
        <Link href="/projects/genesis-roulette/claim" className={styles.ctaButton}>
          Claim game tester slot <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      )}
      <div className={styles.ctaCount} aria-live="polite">
        <strong>{status ? status.remaining : "—"}</strong>
        <span>{status ? `of ${status.total} slots left` : "slots left"}</span>
      </div>
      <div className={styles.ctaMeter} aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      <p className={styles.ctaNote}>Fill in a short form and pass a quick security check. Your redeem code is emailed to you straight away.</p>
      <div className={styles.ctaFeedback}>
        <p>Already testing?</p>
        <Link href="/projects/genesis-roulette/feedback">
          Report a bug or share feedback <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
