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
  approved_at: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  revoked_at: string | null;
  downloads: number;
  last_download_at: string | null;
  failed_redeems: number;
};
type Rejection = { email: string; name: string; platform: string | null; device: string | null; requested_at: string | null; rejected_at: string };
type Action = "approve" | "reject" | "revoke" | "restore" | "resend";
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
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [confirmReject, setConfirmReject] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | string | null>(null);

  const load = useCallback(async (value: string) => {
    setBusy("load");
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/claims", { headers: { Authorization: `Bearer ${value}` }, cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as { claims?: Claim[]; rejections?: Rejection[]; slots?: Slots; error?: string };
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
      setRejections(body.rejections ?? []);
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

  async function post(key: number | string, payload: Record<string, unknown>, success: string) {
    setBusy(key);
    setError("");
    setNotice("");
    setConfirmReject(null);
    try {
      const res = await fetch("/api/alpha/admin/claims", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(body.error ?? "The action failed.");
      else if (success) setNotice(success);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
      await load(token);
    }
  }

  const act = (c: Claim, action: Action) =>
    post(c.id, { id: c.id, action }, action === "approve" ? `Approved. The redeem code was emailed to ${c.email}.` : action === "reject" ? `Rejected ${c.email}. The code and slot are free again.` : action === "resend" ? `Code re-sent to ${c.email}.` : "");

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

  const pendingCount = claims.filter((c) => !c.approved_at).length;
  // Requests waiting for approval come first, oldest first; the rest keep their claim order.
  const rows = [...claims].sort((a, b) => Number(!!a.approved_at) - Number(!!b.approved_at) || a.id - b.id);
  const small = `${styles.button} ${styles.ghost} ${styles.small}`;

  return (
    <section aria-labelledby="admin-title">
      <p className={styles.eyebrow}><i aria-hidden="true" /> GENESIS ROULETTE / CLOSED ALPHA</p>
      <h1 id="admin-title" style={{ fontSize: 36, fontWeight: 450, margin: "14px 0 0" }}>Alpha claims</h1>
      {slots && (
        <div className={styles.stats}>
          <span><b>{pendingCount}</b>awaiting approval</span>
          <span><b>{slots.claimed - pendingCount}</b>approved</span>
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
      {notice && <div className={styles.notice} role="status">{notice}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Platform</th><th>Device</th><th>Code</th><th>Claimed</th><th>Email</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {claims.length === 0 && <tr><td colSpan={11}>No claims yet.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className={c.revoked_at ? styles.revoked : !c.approved_at ? styles.pendingRow : undefined}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.platform === "android" ? "Android" : "Windows"}</td>
                <td>{c.device_brand ? `${c.device_brand} ${c.device_model ?? ""}` : "—"}</td>
                <td><code>{c.code}</code></td>
                <td>{when(c.created_at)}</td>
                <td>{!c.approved_at ? "—" : c.email_sent_at ? <span className={`${styles.tag} ${styles.tagOk}`} title={when(c.email_sent_at)}>Sent</span> : <span className={`${styles.tag} ${styles.tagWarn}`} title={c.email_error ?? ""}>Not sent</span>}</td>
                <td title={c.last_download_at ? `Last: ${when(c.last_download_at)}` : undefined}>{c.downloads}</td>
                <td>{c.revoked_at ? <span className={`${styles.tag} ${styles.tagWarn}`}>Cancelled</span> : !c.approved_at ? <span className={`${styles.tag} ${styles.tagWarn}`}>Awaiting approval</span> : c.failed_redeems >= 10 ? <span className={`${styles.tag} ${styles.tagWarn}`}>Locked</span> : <span className={styles.tag}>Active</span>}</td>
                <td>
                  <div className={styles.rowActions}>
                    {!c.approved_at ? (
                      <>
                        <button className={`${styles.button} ${styles.small}`} disabled={busy === c.id} onClick={() => act(c, "approve")}>{busy === c.id ? "Sending…" : "Approve & send code"}</button>
                        {confirmReject === c.id ? (
                          <>
                            <button className={small} disabled={busy === c.id} onClick={() => act(c, "reject")}>Confirm reject</button>
                            <button className={small} onClick={() => setConfirmReject(null)}>Keep</button>
                          </>
                        ) : (
                          <button className={small} disabled={busy === c.id} onClick={() => setConfirmReject(c.id)}>Reject</button>
                        )}
                      </>
                    ) : (
                      <>
                        <button className={small} disabled={busy === c.id || !!c.revoked_at} onClick={() => act(c, "resend")}>Resend</button>
                        {c.revoked_at || c.failed_redeems >= 10 ? (
                          <button className={small} disabled={busy === c.id} onClick={() => act(c, "restore")}>{c.revoked_at ? "Restore" : "Unlock"}</button>
                        ) : (
                          <button className={small} disabled={busy === c.id} onClick={() => act(c, "revoke")}>Cancel code</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejections.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 450, margin: "36px 0 0" }}>Rejected requests</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Email</th><th>Platform</th><th>Device</th><th>Requested</th><th>Rejected</th><th>Actions</th></tr></thead>
              <tbody>
                {rejections.map((r) => (
                  <tr key={r.email} className={styles.revoked}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.platform === "android" ? "Android" : r.platform === "windows" ? "Windows" : "—"}</td>
                    <td>{r.device ?? "—"}</td>
                    <td>{when(r.requested_at)}</td>
                    <td>{when(r.rejected_at)}</td>
                    <td><button className={small} disabled={busy === r.email} onClick={() => post(r.email, { action: "allow", email: r.email }, `${r.email} can request a slot again.`)}>Allow again</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className={styles.note}>New requests hold a code and a slot while they wait. Approve & send code emails the code to the tester. Reject frees the code and slot without emailing anyone, and that email cannot request again unless you allow it. </p>
      <p className={styles.note}>Cancelling a code stops its download links and frees a slot, and the code is never handed out again. The game still accepts that code unless you also remove it from the game’s own list.</p>
    </section>
  );
}
