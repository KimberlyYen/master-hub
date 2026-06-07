import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured, BUCKET } from "../../lib/supabaseClient";

const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

function safeName(original: string): string {
  const ext = path.extname(original);
  const base = path
    .basename(original, ext)
    .replace(/[^\w一-鿿぀-ヿ-]/g, "_")
    .slice(0, 60);
  return `${Date.now()}-${base}${ext}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "尚未設定 Supabase 環境變數，請填寫 .env.local" }, { status: 503 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const formData = await req.formData();
    const schoolId = (formData.get("schoolId") as string | null)?.trim();
    const files = formData.getAll("files") as File[];

    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "no files" }, { status: 400 });

    const results: { name: string; url: string; storageKey: string; type: string; size: number }[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `${file.name} 超過 30MB 限制` }, { status: 413 });
      }

      const filename = safeName(file.name);
      const storageKey = `${schoolId}/${filename}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storageKey, buffer, { contentType: file.type, upsert: false });

      if (error) throw new Error(`Supabase: ${error.message}`);

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storageKey);

      results.push({ name: file.name, url: publicUrl, storageKey, type: file.type, size: file.size });
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上傳失敗：" + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { storageKey } = await req.json() as { storageKey?: string };
    if (storageKey && isSupabaseConfigured()) {
      const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([storageKey]);
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
