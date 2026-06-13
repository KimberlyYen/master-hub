import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { readNotifyConfig } from "../../config/notify/route";

type TestBody = {
  telegramToken?: string;
  telegramChatId?: string;
  emailTo?: string;
  emailFrom?: string;
  emailPassword?: string;
  emailSmtp?: string;
  emailPort?: number;
};

function resolveConfig(body: TestBody) {
  const saved = readNotifyConfig();
  return saved.then((s) => ({
    telegramToken:
      body.telegramToken && !body.telegramToken.startsWith("●")
        ? body.telegramToken
        : s.telegramToken,
    telegramChatId: body.telegramChatId?.trim() || s.telegramChatId,
    emailTo: body.emailTo?.trim() || s.emailTo,
    emailFrom: body.emailFrom?.trim() || s.emailFrom,
    emailPassword:
      body.emailPassword && !body.emailPassword.startsWith("●")
        ? body.emailPassword
        : s.emailPassword,
    emailSmtp: body.emailSmtp || s.emailSmtp || "smtp.gmail.com",
    emailPort: body.emailPort || s.emailPort || 587,
  }));
}

async function sendTelegramTest(token: string, chatId: string) {
  const text = "✅ Master Hub 測試通知\n\n若收到此訊息，Telegram 通知設定正確。";
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Telegram ${res.status}: ${body.description ?? res.statusText}`);
  }
}

async function sendEmailTest(cfg: {
  emailFrom: string;
  emailPassword: string;
  emailSmtp: string;
  emailPort: number;
  emailTo: string;
}) {
  const transporter = nodemailer.createTransport({
    host: cfg.emailSmtp,
    port: cfg.emailPort,
    secure: false,
    auth: { user: cfg.emailFrom, pass: cfg.emailPassword },
  });
  await transporter.sendMail({
    from: `Master Hub <${cfg.emailFrom}>`,
    to: cfg.emailTo,
    subject: "✅ Master Hub 測試通知",
    text: "若收到此信，Email 通知設定正確。",
    html: "<p>若收到此信，<strong>Email 通知設定正確</strong>。</p>",
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as TestBody;
  const config = await resolveConfig(body);

  const hasTelegram = !!(config.telegramToken && config.telegramChatId);
  const hasEmail = !!(config.emailTo && config.emailFrom && config.emailPassword);

  if (!hasTelegram && !hasEmail) {
    return NextResponse.json(
      { ok: false, error: "請先填寫 Telegram 或 Email 必要欄位，再按測試通知。" },
      { status: 400 }
    );
  }

  const errors: string[] = [];

  if (hasTelegram) {
    try {
      await sendTelegramTest(config.telegramToken!, config.telegramChatId!);
    } catch (e) {
      errors.push(`Telegram: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (hasEmail) {
    try {
      await sendEmailTest({
        emailFrom: config.emailFrom!,
        emailPassword: config.emailPassword!,
        emailSmtp: config.emailSmtp!,
        emailPort: config.emailPort!,
        emailTo: config.emailTo!,
      });
    } catch (e) {
      errors.push(`Email: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    errors: errors.length ? errors : undefined,
    error: errors.length ? errors.join("；") : undefined,
  });
}
