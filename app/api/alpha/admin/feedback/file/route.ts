import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json, noStore } from "@/src/lib/alpha/server";

export const dynamic = "force-dynamic";

/* Streams one feedback screenshot from the private bucket to the signed-in admin. */
export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return json({ error: "Missing file id." }, 400);
    const { db, env } = alphaEnv();
    const file = await db.prepare("SELECT r2_key, content_type FROM feedback_files WHERE id = ?1").bind(id).first<{ r2_key: string; content_type: string }>();
    if (!file || !env.ALPHA_BUILDS) return json({ error: "File not found." }, 404);
    const object = await env.ALPHA_BUILDS.get(file.r2_key);
    if (!object) return json({ error: "File not found." }, 404);
    return new Response(object.body, {
      headers: { ...noStore, "Content-Type": file.content_type, "Content-Length": String(object.size), "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" },
    });
  } catch (error) {
    console.error("feedback file failed", error);
    return json({ error: "Could not load the file." }, 500);
  }
}
