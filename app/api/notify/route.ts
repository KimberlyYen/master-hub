import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { runScrape, type ScrapeResult } from "../../lib/scraper";
import { readNotifyConfig } from "../config/notify/route";
import { parseSnippets } from "../../lib/dateParser";
import { saveUpdates } from "../updates/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ts(): string {
  const now = new Date();
  return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Telegram message（HTML mode，支援 <a href>）────────────────────────────────

function buildTelegramHtml(results: ScrapeResult[]): string {
  const found    = results.filter(r => r.status === "found");
  const notFound = results.filter(r => r.status === "not_found");
  const errors   = results.filter(r => r.status === "error");

  const lines: string[] = [
    `🎓 <b>研究所申請追蹤 爬蟲報告</b>`,
    `📅 ${ts()}`,
    "",
  ];

  if (found.length) {
    lines.push(`✅ <b>找到資料（${found.length} 個）</b>`);
    for (const r of found) {
      lines.push(`  • <a href="${r.url}">${esc(r.name)}</a>`);
      for (const s of r.snippets.slice(0, 2)) lines.push(`    → ${esc(s)}`);
    }
    lines.push("");
  }
  if (notFound.length) {
    lines.push(`⚪ <b>未找到資料（${notFound.length} 個）</b>`);
    for (const r of notFound)
      lines.push(`  • <a href="${r.url}">${esc(r.name)}</a>`);
    lines.push("");
  }
  if (errors.length) {
    lines.push(`❌ <b>連線錯誤（${errors.length} 個）</b>`);
    for (const r of errors)
      lines.push(`  • <a href="${r.url}">${esc(r.name)}</a>：${esc(r.error ?? "")}`);
  }

  return lines.join("\n");
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildEmailHtml(results: ScrapeResult[]): string {
  const found    = results.filter(r => r.status === "found");
  const notFound = results.filter(r => r.status === "not_found");
  const errors   = results.filter(r => r.status === "error");

  const row = (icon: string, r: ScrapeResult, snippets?: string[]) => `
    <tr>
      <td style="padding:6px 0;vertical-align:top;font-size:14px;">
        ${icon} <a href="${r.url}" style="color:#2563eb;text-decoration:none;font-weight:500;">${esc(r.name)}</a>
        ${r.error ? `<span style="color:#ef4444;font-size:12px;"> — ${esc(r.error)}</span>` : ""}
        ${(snippets ?? []).map(s => `<div style="font-size:12px;color:#6b7280;margin-left:16px;">→ ${esc(s)}</div>`).join("")}
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">
  <h2 style="margin:0 0 4px;font-size:18px;">🎓 研究所申請追蹤 爬蟲報告</h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">📅 ${ts()}</p>

  ${found.length ? `
  <h3 style="font-size:14px;color:#16a34a;margin-bottom:8px;">✅ 找到資料（${found.length} 個）</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${found.map(r => row("", r, r.snippets.slice(0, 2))).join("")}
  </table>` : ""}

  ${notFound.length ? `
  <h3 style="font-size:14px;color:#6b7280;margin:16px 0 8px;">⚪ 未找到資料（${notFound.length} 個）</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${notFound.map(r => row("", r)).join("")}
  </table>` : ""}

  ${errors.length ? `
  <h3 style="font-size:14px;color:#ef4444;margin:16px 0 8px;">❌ 連線錯誤（${errors.length} 個）</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${errors.map(r => row("", r)).join("")}
  </table>` : ""}

  <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
  <p style="font-size:11px;color:#9ca3af;">由 Master Hub 自動發送</p>
</body>
</html>`;
}

// ── Telegram send ─────────────────────────────────────────────────────────────

async function sendTelegram(token: string, chatId: string, html: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Telegram ${res.status}: ${body.description ?? res.statusText}`);
  }
}

// ── Email send ────────────────────────────────────────────────────────────────

async function sendEmail(
  cfg: { emailFrom: string; emailPassword: string; emailSmtp?: string; emailPort?: number; emailTo: string },
  html: string
) {
  const transporter = nodemailer.createTransport({
    host: cfg.emailSmtp ?? "smtp.gmail.com",
    port: cfg.emailPort ?? 587,
    secure: false,
    auth: { user: cfg.emailFrom, pass: cfg.emailPassword },
  });
  await transporter.sendMail({
    from: `研究所追蹤 <${cfg.emailFrom}>`,
    to: cfg.emailTo,
    subject: `🎓 研究所申請追蹤 爬蟲報告 ${ts()}`,
    html,
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

// GET: called by Vercel Cron (with Authorization: Bearer CRON_SECRET header)
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = (req as { headers: { get(k: string): string | null } }).headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  return POST();
}

export async function POST() {
  const config      = await readNotifyConfig();
  const hasTelegram = !!(config.telegramToken && config.telegramChatId);
  const hasEmail    = !!(config.emailTo && config.emailFrom && config.emailPassword);

  if (!hasTelegram && !hasEmail) {
    return NextResponse.json(
      { ok: false, error: "尚未設定 Telegram 或 Email，請先至追蹤設定填寫。" },
      { status: 400 }
    );
  }

  const results        = await runScrape();

  // Parse scraped snippets → proposed date updates (saved server-side)
  const proposed = parseSnippets(results);
  if (proposed.length > 0) {
    await saveUpdates({ savedAt: new Date().toISOString(), updates: proposed });
  }

  const telegramMsg    = buildTelegramHtml(results);
  const emailHtml      = buildEmailHtml(results);
  const notifyErrors: string[] = [];

  if (hasTelegram) {
    try { await sendTelegram(config.telegramToken!, config.telegramChatId!, telegramMsg); }
    catch (e) { notifyErrors.push(`Telegram: ${e instanceof Error ? e.message : String(e)}`); }
  }

  if (hasEmail) {
    try { await sendEmail(config as Required<typeof config>, emailHtml); }
    catch (e) { notifyErrors.push(`Email: ${e instanceof Error ? e.message : String(e)}`); }
  }

  return NextResponse.json({
    ok: notifyErrors.length === 0,
    results,
    errors: notifyErrors.length ? notifyErrors : undefined,
    ranAt: new Date().toISOString(),
  });
}
