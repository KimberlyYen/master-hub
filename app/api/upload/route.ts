import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 30 * 1024 * 1024; // 30 MB per file

function safeName(original: string): string {
  const ext = path.extname(original);
  const base = path
    .basename(original, ext)
    .replace(/[^\w一-鿿぀-ヿ-]/g, "_")
    .slice(0, 60);
  return `${Date.now()}-${base}${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const schoolId = (formData.get("schoolId") as string | null)?.trim();
    const files = formData.getAll("files") as File[];

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ error: "no files" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", schoolId);
    await mkdir(uploadDir, { recursive: true });

    const results: { name: string; url: string; type: string; size: number }[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${file.name} 超過 30MB 限制` },
          { status: 413 }
        );
      }
      const filename = safeName(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      results.push({
        name: file.name,
        url: `/uploads/${schoolId}/${filename}`,
        type: file.type,
        size: file.size,
      });
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上傳失敗" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { filePath } = (await req.json()) as { filePath: string };

    // Guard against path traversal
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith("/uploads/") || normalized.includes("..")) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }

    const abs = path.join(process.cwd(), "public", normalized);
    await unlink(abs);
    return NextResponse.json({ ok: true });
  } catch {
    // File already gone — treat as success
    return NextResponse.json({ ok: true });
  }
}
