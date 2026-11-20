import { alphaEnv } from "@/src/lib/alpha/env";
import { noStore, readDownloadToken } from "@/src/lib/alpha/server";

export const dynamic = "force-dynamic";

const text = (message: string, status: number) => new Response(message, { status, headers: { ...noStore, "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  try {
    const grant = await readDownloadToken(token);
    if (!grant) return text("This download link is not valid. Get a new one from kenyalangku.my/projects/genesis-roulette/download.", 403);
    if (grant.expiresAt * 1000 < Date.now()) return text("This download link has expired. Get a new one from kenyalangku.my/projects/genesis-roulette/download.", 410);

    const { db, env, buildKey } = alphaEnv();
    const claim = await db.prepare("SELECT revoked_at FROM alpha_claims WHERE id = ?1").bind(grant.claimId).first<{ revoked_at: string | null }>();
    if (!claim || claim.revoked_at) return text("This redeem code has been cancelled.", 403);
    if (!env.ALPHA_BUILDS) throw new Error("ALPHA_BUILDS binding is missing");

    const key = buildKey(grant.platform);
    const ranged = request.headers.has("Range");
    let object;
    try {
      object = await env.ALPHA_BUILDS.get(key, ranged ? { range: request.headers } : undefined);
    } catch {
      return new Response(null, { status: 416, headers: noStore });
    }
    if (!object) return text("This build is not available yet. Please try again later.", 404);

    // Count a download once per fresh start, not for every resumed chunk.
    const offset = object.range ? ("suffix" in object.range && object.range.suffix !== undefined ? object.size - object.range.suffix : object.range.offset ?? 0) : 0;
    if (offset === 0) {
      await db.prepare("UPDATE alpha_claims SET downloads = downloads + 1, last_download_at = datetime('now') WHERE id = ?1").bind(grant.claimId).run();
    }

    const filename = key.split("/").pop() ?? key;
    const headers = new Headers({
      ...noStore,
      "Content-Type": filename.endsWith(".apk") ? "application/vnd.android.package-archive" : filename.endsWith(".zip") ? "application/zip" : "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Accept-Ranges": "bytes",
      ETag: object.httpEtag,
      "X-Robots-Tag": "noindex",
    });
    if (ranged && object.range) {
      const length = "suffix" in object.range && object.range.suffix !== undefined ? object.range.suffix : object.range.length ?? object.size - offset;
      headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set("Content-Length", String(length));
      return new Response(object.body, { status: 206, headers });
    }
    headers.set("Content-Length", String(object.size));
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("alpha download failed", error);
    return text("The download is not available right now. Please try again in a moment.", 500);
  }
}
