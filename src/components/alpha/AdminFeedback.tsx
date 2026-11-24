"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Download, LogOut, RefreshCw } from "lucide-react";
import {
  DIFFICULTIES,
  FREQUENCIES,
  KEEP_PLAYING,
  RATINGS,
  SEVERITIES,
  STATUSES,
  labelOf,
  type FeedbackFile,
  type FeedbackReport,
} from "@/src/lib/alpha/feedback";
import styles from "./alpha.module.css";

// Same key as the other admin pages, so one sign-in opens them all.
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
const when = (value: string) => new Date(`${value.replace(" ", "T")}Z`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function Shot({ file, token }: { file: FeedbackFile; token: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let objectUrl = "";
    let alive = true;
    fetch(`/api/alpha/admin/feedback/file?id=${file.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error())))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (alive) setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, token]);
  if (!url) return <span className={styles.tag}>Loading {file.original_name ?? "image"}…</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" title={file.original_name ?? undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.original_name ?? `Screenshot ${file.id}`} />
    </a>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (<><dt>{label}</dt><dd>{value}</dd></>);
}

function Triage({ report, token, onSaved }: { report: FeedbackReport; token: string; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/feedback", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, status: data.get("status"), adminNote: data.get("adminNote") }),
      });
      if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Save failed.");
      else onSaved();
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={styles.triage} onSubmit={save}>
      <label className={styles.field} style={{ flex: "0 1 180px" }}>
        <span>Status</span>
        <select name="status" defaultValue={report.status}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </label>
      <label className={styles.field}><span>Studio note</span><input name="adminNote" defaultValue={report.admin_note ?? ""} maxLength={2000} placeholder="e.g. fixed in 0.2.2" /></label>
      <button className={`${styles.button} ${styles.small}`} type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      {error && <div className={styles.error} role="alert" style={{ flexBasis: "100%" }}>{error}</div>}
    </form>
  );
}

export default function AdminFeedback() {
  const [token, setToken] = useState("");
  const [reports, setReports] = useState<FeedbackReport[] | null>(null);
  const [files, setFiles] = useState<FeedbackFile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"load" | "csv" | null>(null);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("all");

  const load = useCallback(async (value: string) => {
    setBusy("load");
    setError("");
    try {
      const res = await fetch("/api/alpha/admin/feedback", { headers: { Authorization: `Bearer ${value}` }, cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as { reports?: FeedbackReport[]; files?: FeedbackFile[]; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not load feedback.");
        if (res.status === 401) {
          saveToken("");
          setToken("");
          setReports(null);
        }
        return;
      }
      saveToken(value);
      setToken(value);
      setReports(body.reports ?? []);
      setFiles(body.files ?? []);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    const saved = readToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) void load(saved);
  }, [load]);

  const shown = useMemo(
    () =>
      (reports ?? []).filter(
        (r) =>
          (kind === "all" || r.kind === kind) &&
          (status === "all" || (status === "open" ? !["fixed", "wont_fix", "duplicate"].includes(r.status) : r.status === status)) &&
          (severity === "all" || r.severity === severity),
      ),
    [reports, kind, status, severity],
  );

  const stats = useMemo(() => {
    const list = reports ?? [];
    const playtests = list.filter((r) => r.kind === "playtest");
    const avg = (key: keyof FeedbackReport) => {
      const values = playtests.map((r) => r[key]).filter((v): v is number => typeof v === "number");
      return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "—";
    };
    return {
      bugs: list.filter((r) => r.kind === "bug").length,
      blockers: list.filter((r) => r.kind === "bug" && r.severity === "blocker" && !["fixed", "wont_fix", "duplicate"].includes(r.status)).length,
      unread: list.filter((r) => r.status === "new").length,
      playtests: playtests.length,
      overall: avg("rating_overall"),
      fun: avg("rating_fun"),
    };
  }, [reports]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    if (value) await load(value);
  }

  async function exportCsv() {
    setBusy("csv");
    try {
      const res = await fetch("/api/alpha/admin/feedback/export", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return setError("Export failed.");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "feedback.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  if (!reports) {
    return (
      <section className={styles.card} style={{ maxWidth: 520 }} aria-labelledby="fb-admin-title">
        <div className={styles.cardHead}><h2 id="fb-admin-title">Player feedback</h2><span>PRIVATE</span></div>
        <form onSubmit={signIn}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <label className={styles.field}><span>Admin token</span><input name="token" type="password" autoComplete="current-password" required /></label>
          <button className={styles.button} type="submit" disabled={busy === "load"}>{busy === "load" ? "Checking…" : "Open feedback"}</button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="fb-admin-title">
      <Link className={styles.back} href="/admin"><ArrowLeft size={16} /> Admin</Link>
      <p className={styles.eyebrow} style={{ marginTop: 14 }}><i aria-hidden="true" /> GENESIS ROULETTE / CLOSED ALPHA</p>
      <h1 id="fb-admin-title" style={{ fontSize: 36, fontWeight: 450, margin: "14px 0 0" }}>Player feedback</h1>
      <div className={styles.stats}>
        <span><b>{stats.unread}</b>new</span>
        <span><b>{stats.bugs}</b>bug reports</span>
        <span><b>{stats.blockers}</b>open blockers</span>
        <span><b>{stats.playtests}</b>playtest reviews</span>
        <span><b>{stats.overall}</b>avg overall / 5</span>
        <span><b>{stats.fun}</b>avg fun / 5</span>
      </div>
      <div className={styles.adminBar}>
        <button className={`${styles.button} ${styles.small}`} onClick={exportCsv} disabled={busy === "csv"}><Download size={15} /> Export CSV</button>
        <button className={`${styles.button} ${styles.ghost} ${styles.small}`} onClick={() => load(token)} disabled={busy === "load"}><RefreshCw size={15} /> Refresh</button>
        <button className={`${styles.button} ${styles.ghost} ${styles.small}`} onClick={() => { saveToken(""); setToken(""); setReports(null); }}><LogOut size={15} /> Sign out</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <div className={styles.filters}>
        <label className={styles.field}><span>Type</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All</option><option value="bug">Bug reports</option><option value="playtest">Playtest feedback</option></select></label>
        <label className={styles.field}><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">Open</option><option value="all">All</option>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
        <label className={styles.field}><span>Severity</span><select value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="all">All</option>{SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      </div>
      <div className={styles.reports}>
        {shown.length === 0 && <p className={styles.note}>{reports.length === 0 ? "No reports yet." : "No reports match these filters."}</p>}
        {shown.map((r) => {
          const shots = files.filter((f) => f.report_id === r.id);
          const sevClass = r.severity === "blocker" ? styles.sevBlocker : r.severity === "major" ? styles.sevMajor : "";
          return (
            <details key={r.id} className={styles.report}>
              <summary>
                <span>#{r.id}</span>
                <span>
                  <b>{r.kind === "bug" ? r.title : `Playtest · overall ${r.rating_overall ?? "—"}/5`}</b>
                  <small>{when(r.created_at)} · {r.name || r.email} · {r.platform === "windows" ? "Windows" : "Android"}{r.device ? ` · ${r.device}` : ""}{r.build ? ` · v${r.build}` : ""}</small>
                </span>
                <span className={styles.reportTags}>
                  {r.kind === "bug" && <span className={`${styles.tag} ${sevClass}`}>{labelOf(SEVERITIES, r.severity)}</span>}
                  <span className={styles.tag}>{r.kind === "bug" ? "Bug" : "Playtest"}</span>
                  {r.code_verified ? <span className={`${styles.tag} ${styles.tagOk}`}>Verified tester</span> : r.claim_id ? <span className={styles.tag}>Tester email</span> : null}
                  {shots.length > 0 && <span className={styles.tag}>{shots.length} image{shots.length > 1 ? "s" : ""}</span>}
                  <span className={`${styles.tag} ${r.status === "new" ? styles.tagWarn : ""}`}>{labelOf(STATUSES, r.status)}</span>
                </span>
              </summary>
              <div className={styles.reportBody}>
                <dl className={styles.reportGrid}>
                  <Row label="From" value={<>{r.name ? `${r.name} · ` : ""}<a href={`mailto:${r.email}`}>{r.email}</a></>} />
                  <Row label="Setup" value={[r.platform === "windows" ? "Windows" : "Android", r.device, r.os_version, r.build && `build ${r.build}`].filter(Boolean).join(" · ")} />
                  {r.kind === "bug" ? (
                    <>
                      <Row label="Area" value={r.area} />
                      <Row label="Severity" value={labelOf(SEVERITIES, r.severity)} />
                      <Row label="How often" value={labelOf(FREQUENCIES, r.frequency)} />
                      <Row label="Steps" value={r.steps} />
                      <Row label="Expected" value={r.expected} />
                      <Row label="Actual" value={r.actual} />
                      <Row label="Video / link" value={r.media_link && <a href={r.media_link} target="_blank" rel="noreferrer noopener">{r.media_link}</a>} />
                    </>
                  ) : (
                    <>
                      <Row label="Played" value={r.play_time} />
                      <Row label="Ratings" value={RATINGS.map((x) => `${x.label} ${r[x.key] ?? "—"}`).join(" · ")} />
                      <Row label="Difficulty" value={r.difficulty && labelOf(DIFFICULTIES, r.difficulty)} />
                      <Row label="Enjoyed" value={r.liked} />
                      <Row label="Frustrated" value={r.frustrated} />
                      <Row label="Suggestions" value={r.suggestions} />
                      <Row label="Keep playing" value={r.keep_playing && labelOf(KEEP_PLAYING, r.keep_playing)} />
                      <Row label="Recommend" value={r.recommend !== null ? `${r.recommend} / 10` : null} />
                    </>
                  )}
                  <Row label="Anything else" value={r.notes} />
                  {shots.length > 0 && <Row label="Screenshots" value={<div className={styles.shots}>{shots.map((f) => <Shot key={f.id} file={f} token={token} />)}</div>} />}
                </dl>
                <Triage report={r} token={token} onSaved={() => load(token)} />
              </div>
            </details>
          );
        })}
      </div>
      <p className={styles.note}>Players send reports from <Link href="/projects/genesis-roulette/feedback">/projects/genesis-roulette/feedback</Link>. “Verified tester” means the email and redeem code matched an alpha claim.</p>
    </section>
  );
}
