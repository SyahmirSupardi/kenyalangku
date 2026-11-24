"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import styles from "./alpha.module.css";

type Overview = {
  genesisAlpha: {
    slots: { total: number; claimed: number; remaining: number; unusedCodes: number };
    claims: number;
    downloads: number;
    android: number;
    windows: number;
    pending: number;
    emailsNotSent: number;
    lastClaimAt: string | null;
  };
  genesisFeedback: { reports: number; unread: number; bugs: number; openBlockers: number; lastReportAt: string | null } | null;
};

// Same key as the alpha claims page, so signing in here also opens that page.
const STORAGE_KEY = "kk-alpha-admin";
const readToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};
const saveToken = (value: string) => {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: keep the token in memory only */
  }
};
const when = (value: string | null, empty = "No claims yet") =>
  value ? new Date(`${value.replace(" ", "T")}Z`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : empty;

export default function AdminHub() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (token: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/overview", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as Partial<Overview> & { error?: string };
      if (!res.ok || !body.genesisAlpha) {
        setError(body.error ?? "Could not load the overview.");
        if (res.status === 401) saveToken("");
        return;
      }
      saveToken(token);
      setData(body as Overview);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const saved = readToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) void load(saved);
  }, [load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    if (value) await load(value);
  }

  if (!data) {
    return (
      <section className={styles.card} style={{ maxWidth: 520 }} aria-labelledby="hub-title">
        <div className={styles.cardHead}><h2 id="hub-title">Admin</h2><span>PRIVATE</span></div>
        <form onSubmit={signIn}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <label className={styles.field}><span>Admin token</span><input name="token" type="password" autoComplete="current-password" required /></label>
          <button className={styles.button} type="submit" disabled={busy}>{busy ? "Checking…" : "Open admin"}</button>
        </form>
      </section>
    );
  }

  const g = data.genesisAlpha;
  const f = data.genesisFeedback;
  return (
    <section aria-labelledby="hub-title">
      <p className={styles.eyebrow}><i aria-hidden="true" /> KENYALANGKU / ADMIN</p>
      <h1 id="hub-title" style={{ fontSize: 36, fontWeight: 450, margin: "14px 0 0" }}>Admin</h1>
      <div className={styles.adminBar}>
        <button className={`${styles.button} ${styles.ghost} ${styles.small}`} onClick={() => { saveToken(""); setData(null); }}><LogOut size={15} /> Sign out</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Project</th><th>Status</th><th>Data</th><th>Link</th></tr></thead>
          <tbody>
            <tr>
              <td>Genesis Roulette closed alpha</td>
              <td>{g.pending > 0 ? <span className={`${styles.tag} ${styles.tagWarn}`}>{g.pending} to approve</span> : <span className={styles.tag}>{g.slots.remaining > 0 ? "Open" : "Full"}</span>}</td>
              <td>
                {g.claims} claims · {g.slots.remaining} of {g.slots.total} slots left · {g.downloads} downloads<br />
                Android {g.android} · Windows {g.windows}{g.emailsNotSent > 0 ? ` · ${g.emailsNotSent} emails not sent` : ""}<br />
                Last claim: {when(g.lastClaimAt)}
              </td>
              <td><Link className={`${styles.button} ${styles.small}`} href="/admin/alpha">Open claims <ArrowUpRight size={15} /></Link></td>
            </tr>
            <tr>
              <td>Genesis Roulette player feedback</td>
              <td>{f ? <span className={`${styles.tag} ${f.unread > 0 ? styles.tagWarn : ""}`}>{f.unread > 0 ? `${f.unread} new` : "Up to date"}</span> : <span className={`${styles.tag} ${styles.tagWarn}`}>Not set up</span>}</td>
              <td>
                {f ? (
                  <>
                    {f.reports} reports · {f.bugs} bugs · {f.reports - f.bugs} playtest reviews<br />
                    {f.openBlockers} open blockers<br />
                    Last report: {when(f.lastReportAt, "No reports yet")}
                  </>
                ) : (
                  "Apply migration 0003_player_feedback.sql to the database."
                )}
              </td>
              <td><Link className={`${styles.button} ${styles.small}`} href="/admin/feedback">Open feedback <ArrowUpRight size={15} /></Link></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={styles.note}>Only projects with admin data are listed. New ones appear here as they are added.</p>
    </section>
  );
}
