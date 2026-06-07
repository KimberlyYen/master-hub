import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export type NotifyConfig = {
  telegramToken?: string;
  telegramChatId?: string;
  emailTo?: string;
  emailFrom?: string;
  emailPassword?: string;
  emailSmtp?: string;
  emailPort?: number;
};

const CONFIG_PATH = path.join(process.cwd(), "data", "notify.json");

export async function readNotifyConfig(): Promise<NotifyConfig> {
  // Cloud deployment (Vercel): read from environment variables
  const fromEnv: NotifyConfig = {
    telegramToken:  process.env.TELEGRAM_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    emailTo:        process.env.EMAIL_TO,
    emailFrom:      process.env.EMAIL_FROM,
    emailPassword:  process.env.EMAIL_PASSWORD,
    emailSmtp:      process.env.EMAIL_SMTP,
    emailPort:      process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  };
  if (
    process.env.VERCEL ||
    fromEnv.telegramToken ||
    fromEnv.emailFrom ||
    fromEnv.emailPassword
  ) {
    return fromEnv;
  }
  // Local: read from data/notify.json
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function writeNotifyConfig(config: NotifyConfig) {
  await mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  const config = await readNotifyConfig();
  return NextResponse.json({
    telegramToken:  config.telegramToken  ? "●".repeat(8) : "",
    telegramChatId: config.telegramChatId ?? "",
    emailTo:        config.emailTo        ?? "",
    emailFrom:      config.emailFrom      ?? "",
    emailPassword:  config.emailPassword  ? "●".repeat(8) : "",
    emailSmtp:      config.emailSmtp      ?? "",
    emailPort:      config.emailPort      ?? 587,
    hasTelegram: !!(config.telegramToken && config.telegramChatId),
    hasEmail:    !!(config.emailTo && config.emailFrom && config.emailPassword),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as NotifyConfig & {
    clearTelegram?: boolean;
    clearEmail?: boolean;
  };
  const current = await readNotifyConfig();
  const next: NotifyConfig = { ...current };

  if (body.clearTelegram) {
    delete next.telegramToken;
    delete next.telegramChatId;
  } else {
    if (body.telegramToken  && !body.telegramToken.startsWith("●"))  next.telegramToken  = body.telegramToken;
    if (body.telegramChatId && body.telegramChatId.trim())           next.telegramChatId = body.telegramChatId.trim();
  }

  if (body.clearEmail) {
    delete next.emailTo; delete next.emailFrom;
    delete next.emailPassword; delete next.emailSmtp; delete next.emailPort;
  } else {
    if (body.emailTo)    next.emailTo    = body.emailTo;
    if (body.emailFrom)  next.emailFrom  = body.emailFrom;
    if (body.emailPassword && !body.emailPassword.startsWith("●")) next.emailPassword = body.emailPassword;
    if (body.emailSmtp)  next.emailSmtp  = body.emailSmtp;
    if (body.emailPort)  next.emailPort  = body.emailPort;
  }

  if (process.env.VERCEL) {
    return NextResponse.json({
      ok: false,
      vercel: true,
      error:
        "Vercel 上請至 Project Settings → Environment Variables 設定通知變數，再 Redeploy。表單儲存僅適用本機開發。",
    });
  }

  await writeNotifyConfig(next);
  return NextResponse.json({ ok: true });
}
