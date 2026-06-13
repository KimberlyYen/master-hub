import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { ProposedUpdate } from "../../lib/dateParser";

const FILE = path.join(process.cwd(), "data", "proposed-updates.json");

export type UpdatesFile = {
  savedAt: string;
  updates: ProposedUpdate[];
};

export async function readUpdates(): Promise<UpdatesFile> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8"));
  } catch {
    return { savedAt: "", updates: [] };
  }
}

export async function saveUpdates(data: UpdatesFile) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2));
}

// GET: return pending proposed updates
export async function GET() {
  return NextResponse.json(await readUpdates());
}

// POST: dismiss applied update keys so they don't show again
export async function POST(req: NextRequest) {
  const { applied }: { applied: string[] } = await req.json(); // "schoolId::field"
  const current = await readUpdates();
  current.updates = current.updates.filter(
    (u) => !applied.includes(`${u.schoolId}::${u.field}`)
  );
  await saveUpdates(current);
  return NextResponse.json({ ok: true });
}
