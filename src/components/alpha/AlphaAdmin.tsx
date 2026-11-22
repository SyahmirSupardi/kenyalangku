"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Download, LogOut, RefreshCw } from "lucide-react";
import styles from "./alpha.module.css";

type Claim = {
  id: number;
  name: string;
  email: string;
  platform: "android" | "windows";
  device_brand: string | null;
  device_model: string | null;
  code: string;
  created_at: string;
  email_sent_at: string | null;
  email_error: string | null;
  revoked_at: string | null;
  downloads: number;
  last_download_at: string | null;
  failed_redeems: number;
};
type Slots = { total: number; claimed: number; remaining: number; unusedCodes: number };

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
const when = (value: string | null) => (value ? new Date(`${value.replace(" ", "T")}Z`).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—");

export default function AlphaAdmin() {
  const [token, setToken] = useState("");
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | "load" | "csv" | null>(null);

  const load = useCallback(async (value: string) => {
    setBusy("load");
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/claims", { headers: { Authorization: `Bearer ${value}` }, cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as { claims?: Claim[]; slots?: Slots; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not load claims.");
        if (res.status === 401) {
          saveToken("");
          setToken("");
          setClaims(null);
        }
        return;
      }
      saveToken(value);
      setToken(value);
      setClaims(body.claims ?? []);
      setSlots(body.slots ?? null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    // Reopens the admin view with the token saved for this browser tab.
    const saved = readToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) void load(saved);
  }, [load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    if (value) await load(value);
  }

  async function act(id: number, action: "revoke" | "restore" | "resend") {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/claims", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(body.error ?? "The action failed.");
    } finally {
      setBusy(null);
      await load(token);
    }
  }

  async function exportCsv() {
    setBusy("csv");
    try {
      const res = await fetch("/api/alpha/admin/export", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return setError("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "alpha-claims.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  if (!claims) {
    return (
      <section className={styles.card} style={{ maxWidth: 520 }} aria-labelledby="admin-title">
        <div className={styles.cardHead}><h2 id="admin-title">Alpha claims admin</h2><span>PRIVATE</span></div>
        <form onSubmit={signIn}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <label className={styles.field}><span>Admin token</span><input name="token" type="password" autoComplete="current-password" required /></label>
          <button className={styles.button} type="submit" disabled={busy === "load"}>{busy === "load" ? "Checking…" : "Open claims"}</button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-title">
      <p className={styles.eyebrow}><i aria-hidden="true" /> GENESIS ROULETTE / CLOSED ALPHA</p>
      <h1 id="admin-title" style={{ fontSize: 36, fontWeight: 450, margin: "14px 0 0" }}>Alpha claims</h1>
      {slots && (
        <div className={styles.stats}>
          <span><b>{slots.claimed}</b>active claims</span>
          <span><b>{slots.remaining}</b>slots left of {slots.total}</span>
          <span><b>{slots.unusedCodes}</b>unused codes</span>
          <span><b>{claims.reduce((n, c) => n + c.downloads, 0)}</b>downloads</span>
        </div>
      )}
      <div className={styles.adminBar}>
        <button className={`${styles.button} ${styles.small}`} onClick={exportCsv} disabled={busy === "csv"}><Download size={15} /> Export CSV</button>
        <button className={`${styles.button} ${styles.ghost} ${styles.small}`} onClick={() => load(token)} disabled={busy === "load"}><RefreshCw size={15} /> Refresh</button>
        <button className={`${styles.button} ${styles.ghost} ${styles.small}`} onClick={() => { saveToken(""); setToken(""); setClaims(null); }}><LogOut size={15} /> Sign out</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Platform</th><th>Device</th><th>Code</th><th>Claimed</th><th>Email</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {claims.length === 0 && <tr><td colSpan={11}>No claims yet.</td></tr>}
            {claims.map((c) => (
              <tr key={c.id} className={c.revoked_at ? styles.revoked : undefined}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.platform === "android" ? "Android" : "Windows"}</td>
                <td>{c.device_brand ? `${c.device_brand} ${c.device_model ?? ""}` : "—"}</td>
                <td><code>{c.code}</code></td>
                <td>{when(c.created_at)}</td>
                <td>{c.email_sent_at ? <span className={`${styles.tag} ${styles.tagOk}`} title={when(c.email_sent_at)}>Sent</span> : <span className={`${styles.tag} ${styles.tagWarn}`} title={c.email_error ?? ""}>Not sent</span>}</td>
                <td title={c.last_download_at ? `Last: ${when(c.last_download_at)}` : undefined}>{c.downloads}</td>
                <td>{c.revoked_at ? <span className={`${styles.tag} ${styles.tagWarn}`}>Cancelled</span> : c.failed_redeems >= 10 ? <span className={`${styles.tag} ${styles.tagWarn}`}>Locked</span> : <span className={styles.tag}>Active</span>}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button className={`${styles.button} ${styles.ghost} ${styles.small}`} disabled={busy === c.id || !!c.revoked_at} onClick={() => act(c.id, "resend")}>Resend</button>
                    {c.revoked_at || c.failed_redeems >= 10 ? (
                      <button className={`${styles.button} ${styles.ghost} ${styles.small}`} disabled={busy === c.id} onClick={() => act(c.id, "restore")}>{c.revoked_at ? "Restore" : "Unlock"}</button>
                    ) : (
                      <button className={`${styles.button} ${styles.ghost} ${styles.small}`} disabled={busy === c.id} onClick={() => act(c.id, "revoke")}>Cancel code</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>Cancelling a code stops its download links and frees a slot, and the code is never handed out again. The game still accepts that code unless you also remove it from the game’s own list.</p>
    </section>
  );
}
