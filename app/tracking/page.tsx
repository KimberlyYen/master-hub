"use client";

import { useState, useEffect } from "react";
import {
  useTracking,
  nextRunDate,
  formatRelative,
  formatDate,
  type ScrapeRun,
} from "../lib/trackingStore";
import type { ScrapeResult } from "../lib/scraper";

// ── Interval presets ──────────────────────────────────────────────────────────

const PRESETS = [
  { label: "每月一次", days: 30 },
  { label: "每兩週",   days: 14 },
  { label: "每週",     days: 7  },
  { label: "每三天",   days: 3  },
] as const;

// Cron expression generator
function toCron(days: number): string {
  if (days >= 28) return "0 9 1 * *";          // 每月1日 09:00
  if (days >= 14) return "0 9 1,15 * *";       // 每月1,15日
  if (days >= 7)  return "0 9 * * 1";           // 每週一
  if (days >= 3)  return "0 9 */3 * *";         // 每3天
  return `0 9 */${days} * *`;
}

function cronDescription(days: number): string {
  if (days >= 28) return "每月 1 日早上 9:00";
  if (days >= 14) return "每月 1 日、15 日早上 9:00";
  if (days >= 7)  return "每週一早上 9:00";
  if (days >= 3)  return "每 3 天早上 9:00";
  return `每 ${days} 天早上 9:00`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScrapeResult["status"] }) {
  const map = {
    found:     "bg-green-50 text-green-700 border-green-200",
    not_found: "bg-amber-50 text-amber-600 border-amber-200",
    error:     "bg-red-50   text-red-600   border-red-200",
  };
  const label = { found: "找到資料", not_found: "未找到", error: "錯誤" };
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 border font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: ScrapeResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">{result.name}</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline truncate block">
            {result.url}
          </a>
        </div>
        <StatusBadge status={result.status} />
        {result.snippets.length > 0 && (
          <button onClick={() => setOpen(v => !v)} className="text-xs text-blue-500 hover:underline shrink-0">
            {open ? "收起" : `查看 ${result.snippets.length} 筆`}
          </button>
        )}
      </div>
      {result.error && <p className="px-4 pb-2 text-xs text-red-500">{result.error}</p>}
      {open && (
        <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50 space-y-1.5">
          {result.snippets.map((s, i) => <p key={i} className="text-xs text-zinc-600">· {s}</p>)}
        </div>
      )}
    </div>
  );
}

function RunSummary({ run }: { run: ScrapeRun }) {
  const found  = run.results.filter(r => r.status === "found").length;
  const errors = run.results.filter(r => r.status === "error").length;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>爬取時間：{formatDate(run.ranAt)}</span>
        <span className="text-green-600">{found} 個找到</span>
        {errors > 0 && <span className="text-red-500">{errors} 個錯誤</span>}
      </div>
      <div className="space-y-2">{run.results.map(r => <ResultCard key={r.ids.join()} result={r} />)}</div>
    </div>
  );
}

// ── Notification config section ───────────────────────────────────────────────

type NotifySaved = {
  hasTelegram: boolean;
  telegramChatId: string;
  hasEmail: boolean;
  emailTo: string;
  emailFrom: string;
  emailSmtp: string;
  emailPort: number;
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="text-xs text-zinc-500 leading-relaxed">{children}</div>
    </div>
  );
}

function NotifySettings() {
  const [saved, setSaved]             = useState<NotifySaved | null>(null);
  const [tgToken, setTgToken]         = useState("");
  const [tgChatId, setTgChatId]       = useState("");
  const [emailTo, setEmailTo]         = useState("");
  const [emailFrom, setEmailFrom]     = useState("");
  const [emailPwd, setEmailPwd]       = useState("");
  const [emailSmtp, setEmailSmtp]     = useState("smtp.gmail.com");
  const [emailPort, setEmailPort]     = useState("587");
  const [showTgGuide, setShowTgGuide] = useState(false);
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState(false);
  const [msg, setMsg]                 = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/config/notify").then(r => r.json()).then(d => {
      setSaved(d);
      setTgChatId(d.telegramChatId ?? "");
      setEmailTo(d.emailTo ?? "");
      setEmailFrom(d.emailFrom ?? "");
      setEmailSmtp(d.emailSmtp || "smtp.gmail.com");
      setEmailPort(String(d.emailPort || 587));
    });
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    await fetch("/api/config/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramToken: tgToken, telegramChatId: tgChatId,
        emailTo, emailFrom, emailPassword: emailPwd, emailSmtp, emailPort: Number(emailPort),
      }),
    });
    const d = await fetch("/api/config/notify").then(r => r.json());
    setSaved(d); setTgToken(""); setEmailPwd("");
    setMsg({ ok: true, text: "✓ 已儲存" });
    setSaving(false);
  }

  async function test() {
    setTesting(true); setMsg(null);
    const res  = await fetch("/api/notify", { method: "POST" });
    const data = await res.json();
    setMsg({ ok: data.ok, text: data.ok ? "✓ 測試通知已送出！" : (data.errors?.join("；") ?? data.error ?? "失敗") });
    setTesting(false);
  }

  const inp = "rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 placeholder:text-zinc-500 w-full bg-white";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
      <p className="text-sm font-semibold text-zinc-700">通知設定</p>

      {/* ── Telegram ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Telegram Bot</label>
          {saved?.hasTelegram && <span className="text-xs text-green-600 font-medium">✓ 已設定</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Bot Token</p>
            <input className={inp} type="password"
              placeholder={saved?.hasTelegram ? "已設定（輸入新 token 可覆蓋）" : "110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"}
              value={tgToken} onChange={e => setTgToken(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Chat ID</p>
            <input className={inp}
              placeholder={saved?.telegramChatId || "例：123456789 或 -987654321"}
              value={tgChatId} onChange={e => setTgChatId(e.target.value)} />
          </div>
        </div>

        <button onClick={() => setShowTgGuide(v => !v)}
          className="text-xs text-blue-500 hover:underline">
          {showTgGuide ? "▲ 收起教學" : "▼ 如何取得 Bot Token 和 Chat ID？"}
        </button>

        {showTgGuide && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-semibold text-blue-700">Telegram Bot 設定步驟</p>
            <Step n={1}>
              在 Telegram 搜尋 <span className="font-mono bg-blue-100 px-1 rounded">@BotFather</span>，
              點「Start」，傳送 <span className="font-mono bg-blue-100 px-1 rounded">/newbot</span>
            </Step>
            <Step n={2}>
              依指示輸入 Bot 名稱（顯示名）和使用者名稱（需以 <code className="bg-blue-100 px-0.5 rounded">bot</code> 結尾）。
              BotFather 會給你一串 <strong>Bot Token</strong>，格式像 <code className="bg-blue-100 px-0.5 rounded">110201543:AAHdq...</code>，
              複製貼入左方欄位。
            </Step>
            <Step n={3}>
              取得 <strong>Chat ID</strong>（選一種方式）：
              <ul className="mt-1 space-y-1 ml-1">
                <li>• <strong>個人：</strong>搜尋 <span className="font-mono bg-blue-100 px-0.5 rounded">@userinfobot</span>，傳送任意訊息，它會回覆你的 Chat ID（數字）</li>
                <li>• <strong>透過 API：</strong>對你的 Bot 傳一則訊息，再開瀏覽器前往：
                  <br />
                  <span className="font-mono bg-blue-100 px-1 rounded text-[11px]">
                    {"https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates"}
                  </span>
                  <br />找 <code className="bg-blue-100 px-0.5 rounded">{'"chat":{"id":XXXXXXX}'}</code>，那個數字就是 Chat ID
                </li>
                <li>• <strong>群組：</strong>將 Bot 加入群組，Chat ID 為負數（如 <code className="bg-blue-100 px-0.5 rounded">-987654321</code>）</li>
              </ul>
            </Step>
            <Step n={4}>
              填入 Token 和 Chat ID 後點「儲存設定」，再點「測試通知」確認收到訊息。
            </Step>
          </div>
        )}
      </div>

      <hr className="border-zinc-100" />

      {/* ── Email ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Email（Gmail / SMTP）</label>
          {saved?.hasEmail && <span className="text-xs text-green-600 font-medium">✓ 已設定</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-zinc-400 mb-1">收件人 Email</p>
            <input className={inp} placeholder="you@example.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">寄件 Gmail 帳號</p>
            <input className={inp} placeholder="sender@gmail.com" value={emailFrom} onChange={e => setEmailFrom(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Gmail 應用程式密碼</p>
            <input className={inp} type="password"
              placeholder={saved?.hasEmail ? "已設定（輸入新密碼可覆蓋）" : "16 位英文字（無空格）"}
              value={emailPwd} onChange={e => setEmailPwd(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-zinc-400 mb-1">SMTP（預設 Gmail）</p>
              <input className={inp} placeholder="smtp.gmail.com" value={emailSmtp} onChange={e => setEmailSmtp(e.target.value)} />
            </div>
            <div className="w-20">
              <p className="text-xs text-zinc-400 mb-1">Port</p>
              <input className={inp} type="number" value={emailPort} onChange={e => setEmailPort(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={() => setShowGmailGuide(v => !v)}
          className="text-xs text-blue-500 hover:underline">
          {showGmailGuide ? "▲ 收起教學" : "▼ Gmail 應用程式密碼詳細步驟"}
        </button>

        {showGmailGuide && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-semibold text-amber-700">Gmail 應用程式密碼設定</p>
            <div className="rounded bg-amber-100 px-2 py-1.5 text-xs text-amber-800">
              ⚠️ 應用程式密碼只在開啟「兩步驟驗證」後才能建立
            </div>
            <Step n={1}>
              前往{" "}
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline">myaccount.google.com/security</a>
              ，在「如何登入 Google」區塊點「<strong>兩步驟驗證</strong>」。
              若尚未開啟，按照指示完成開啟（設定手機驗證即可）。
            </Step>
            <Step n={2}>
              兩步驟驗證開啟後，搜尋列直接搜尋「<strong>應用程式密碼</strong>」，
              或前往{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline">myaccount.google.com/apppasswords</a>
            </Step>
            <Step n={3}>
              「應用程式名稱」輸入 <strong>Master Hub</strong>（或任何名稱方便識別），點「<strong>建立</strong>」。
            </Step>
            <Step n={4}>
              Google 會顯示一組 <strong>16 位英文字密碼</strong>，格式如：
              <code className="block bg-amber-100 px-2 py-1 rounded mt-1 font-mono text-[12px] tracking-widest">
                abcd efgh ijkl mnop
              </code>
              <span className="text-amber-700">複製時請去除空格</span>，貼入上方「應用程式密碼」欄位：
              <code className="block bg-amber-100 px-2 py-1 rounded mt-1 font-mono text-[12px]">
                abcdefghijklmnop
              </code>
            </Step>
            <Step n={5}>
              填完後點「儲存設定」→「測試通知」，若收件人信箱收到測試信即設定成功。
              <br />
              <span className="text-amber-600 text-[11px]">
                提示：收件人和寄件人可以是同一個 Gmail 帳號。
              </span>
            </Step>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={save} disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
          {saving ? "儲存中..." : "儲存設定"}
        </button>
        {(saved?.hasTelegram || saved?.hasEmail) && (
          <button onClick={test} disabled={testing}
            className="rounded-lg px-4 py-2 text-sm border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors">
            {testing ? "送出中..." : "測試通知"}
          </button>
        )}
        {msg && <p className={`text-xs ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

// ── Cron setup section ────────────────────────────────────────────────────────

function CronSetup({ intervalDays }: { intervalDays: number }) {
  const [tab, setTab]     = useState<"vercel" | "local">("vercel");
  const [copied, setCopied] = useState(false);
  const cron = toCron(intervalDays);
  const desc = cronDescription(intervalDays);

  // Vercel Cron uses UTC. Taiwan = UTC+8, so 09:00 TW = 01:00 UTC.
  const [utcH, utcM] = [1, 0];
  const vercelCron   = cron.replace(/^0 \d+/, `${utcM} ${utcH}`);
  const vercelJson   = JSON.stringify({ crons: [{ path: "/api/notify", schedule: vercelCron }] }, null, 2);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-700">自動排程設定</p>
        <p className="text-xs text-zinc-400 mt-1">目前頻率：{desc}</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
        {(["vercel", "local"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}>
            {t === "vercel" ? "☁ Vercel（推薦）" : "💻 本機 crontab"}
          </button>
        ))}
      </div>

      {/* ── Vercel ── */}
      {tab === "vercel" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700 space-y-0.5">
            <p className="font-semibold">優點：完全不需要電腦開著，排程在雲端執行</p>
            <p className="text-blue-500">免費方案 Hobby Plan：每個專案最多 2 個 Cron Job，每天最多 2 次</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500">步驟 1 — 將專案推上 GitHub</p>
              <CodeBlock text="git init && git add . && git commit -m 'init'" onCopy={copy} copied={copied} />
              <p className="text-xs text-zinc-400">到 github.com 建立新 repo，再 push 上去</p>
              <CodeBlock text="git remote add origin https://github.com/你的帳號/master-hub.git && git push -u origin main" onCopy={copy} copied={copied} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500">步驟 2 — 在 Vercel 匯入專案</p>
              <p className="text-xs text-zinc-400">
                前往{" "}
                <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 hover:underline">vercel.com/new</a>
                {" "}→ 選 <strong>「Import Git Repository」</strong> →
                選你的 GitHub repo →
                Framework 確認是 <strong>Next.js</strong> →
                點 <strong>「Deploy」</strong>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500">步驟 3 — 設定環境變數（最新介面）</p>
              <ol className="space-y-1.5 text-xs text-zinc-500 list-none">
                <li className="flex gap-2"><span className="shrink-0 font-bold text-zinc-400">①</span>
                  進入你的 Vercel 專案頁面（vercel.com/dashboard → 點專案名稱）
                </li>
                <li className="flex gap-2"><span className="shrink-0 font-bold text-zinc-400">②</span>
                  左側 sidebar 點 <strong className="text-zinc-700">「Environment Variables」</strong>
                </li>
                <li className="flex gap-2"><span className="shrink-0 font-bold text-zinc-400">③</span>
                  點右上角 <strong className="text-zinc-700">「Add Environment Variable」</strong>，依序加入以下 5 個變數，
                  每個都選 <strong className="text-zinc-700">Production</strong> 環境，填完點 <strong className="text-zinc-700">「Save」</strong>
                </li>
              </ol>
              <div className="rounded-lg bg-zinc-900 px-3 py-2 space-y-1">
                {[
                  ["TELEGRAM_TOKEN",  "你的 Bot Token（必填）"],
                  ["TELEGRAM_CHAT_ID","你的 Chat ID（必填）"],
                  ["EMAIL_TO",        "收件 Email（選填）"],
                  ["EMAIL_FROM",      "寄件 Gmail（選填）"],
                  ["EMAIL_PASSWORD",  "Gmail App 密碼（選填）"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs font-mono items-baseline">
                    <span className="text-yellow-400 shrink-0">{k}</span>
                    <span className="text-zinc-600 text-[10px]">← {v}</span>
                  </div>
                ))}
              </div>
              <li className="flex gap-2 text-xs text-zinc-500 list-none">
                <span className="shrink-0 font-bold text-zinc-400">④</span>
                全部加完後，回到 Deployments 點 <strong className="text-zinc-700">「Redeploy」</strong>，
                環境變數才會生效
              </li>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500">步驟 4 — Cron 排程（vercel.json）</p>
              <p className="text-xs text-zinc-400">
                專案裡的 <code className="bg-zinc-100 px-1 rounded">vercel.json</code> 已包含排程設定（{desc}，UTC 時間）。
                Push 後 Vercel 自動套用，無需在 Dashboard 額外操作。
              </p>
              <CodeBlock text={vercelJson} onCopy={copy} copied={copied} />
              <p className="text-xs text-zinc-400">
                如需調整時間，修改 <code className="bg-zinc-100 px-1 rounded">schedule</code> 後 git commit + push 即可。
                注意：Vercel Cron 使用 <strong className="text-zinc-600">UTC 時間</strong>，台灣時間 09:00 = UTC 01:00。
              </p>
              <p className="text-xs text-zinc-400">
                部署後可在 Vercel 專案頁 → 左側 sidebar →{" "}
                <strong className="text-zinc-600">Cron Jobs</strong> 查看排程狀態與執行紀錄。
              </p>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700">
              ✓ 設定完成後，Vercel 會按排程自動呼叫 <code className="bg-green-100 px-1 rounded">/api/notify</code>，
              爬完自動發 Telegram / Email 通知，完全不需要電腦開著。
            </div>
          </div>
        </div>
      )}

      {/* ── Local crontab ── */}
      {tab === "local" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
            ⚠ 本機 crontab 需要電腦開著且不能睡眠才會執行
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-500">開啟 crontab 編輯器</p>
            <CodeBlock text="crontab -e" onCopy={copy} copied={copied} />
            <p className="text-xs text-zinc-400">加入以下一行（i 編輯、:wq 儲存）：</p>
            <CodeBlock
              text={`${cron} curl -s -X POST http://localhost:3000/api/notify >> ~/master-hub-scrape.log 2>&1`}
              onCopy={copy} copied={copied} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-500">確認已加入</p>
            <CodeBlock text="crontab -l" onCopy={copy} copied={copied} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-500">讓 Next.js 在背景持續運行</p>
            <CodeBlock text="npm install -g pm2" onCopy={copy} copied={copied} />
            <CodeBlock text={`pm2 start "npm run dev" --name master-hub && pm2 save`} onCopy={copy} copied={copied} />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ text, onCopy, copied }: { text: string; onCopy: (t: string) => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
      <code className="flex-1 text-xs text-green-400 font-mono break-all">{text}</code>
      <button onClick={() => onCopy(text)}
        className="shrink-0 text-xs text-zinc-400 hover:text-white transition-colors">
        {copied ? "✓" : "複製"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { config, saveConfig, history, latestRun, running, loaded, runScrape, isDue } = useTracking();
  const [customDays, setCustomDays] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  if (!loaded) return (
    <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">載入中...</div>
  );

  const next = config.lastRun ? nextRunDate(config) : null;

  function applyInterval(days: number) {
    saveConfig({ ...config, intervalDays: days });
    setCustomDays("");
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-zinc-800">追蹤設定</h1>
          <p className="text-sm text-zinc-400 mt-1">定期爬取各校官網，並透過 LINE / Email 通知</p>
        </div>

        {/* Interval */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-zinc-700">爬取頻率</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => {
              const active = config.intervalDays === p.days;
              return (
                <button key={p.days} onClick={() => applyInterval(p.days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    active ? "bg-zinc-800 text-white border-zinc-800"
                           : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
                  {p.label}
                </button>
              );
            })}
            <div className="flex items-center gap-1.5">
              <input type="number" min={1} placeholder="自訂" value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && customDays) applyInterval(parseInt(customDays)); }}
                className="w-16 rounded-lg border border-zinc-200 px-2 py-2 text-sm text-center outline-none focus:border-blue-300" />
              <span className="text-sm text-zinc-400">天</span>
              <button onClick={() => customDays && applyInterval(parseInt(customDays))}
                disabled={!customDays}
                className="text-xs text-blue-500 hover:underline disabled:opacity-40">套用</button>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            目前：每 <span className="font-semibold text-zinc-600">{config.intervalDays}</span> 天 ·{" "}
            {cronDescription(config.intervalDays)}
          </p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={config.autoRun}
              onChange={e => saveConfig({ ...config, autoRun: e.target.checked })}
              className="accent-zinc-700" />
            <span className="text-sm text-zinc-600">開啟此頁面時，若已到期則自動爬取</span>
          </label>
        </div>

        {/* Status & manual run */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-zinc-700">執行狀態</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">上次爬取</p>
              <p className="text-zinc-700 font-medium">
                {config.lastRun ? (
                  <>{formatDate(config.lastRun)} <span className="text-zinc-400 font-normal">（{formatRelative(config.lastRun)}）</span></>
                ) : "從未執行"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">下次爬取</p>
              <p className={`font-medium ${isDue ? "text-amber-600" : "text-zinc-700"}`}>
                {isDue ? "已到期，建議立即爬取" : next ? formatDate(next.toISOString()) : "—"}
              </p>
            </div>
          </div>
          <button onClick={() => runScrape()} disabled={running}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors">
            {running ? <><span className="animate-spin">⟳</span>爬取中…</> : "⟳ 立即爬取全部"}
          </button>
          {isDue && !running && (
            <p className="text-xs text-amber-600">距上次爬取已超過 {config.intervalDays} 天，建議重新爬取。</p>
          )}
        </div>

        {/* Notification settings */}
        <NotifySettings />

        {/* Cron setup */}
        <CronSetup intervalDays={config.intervalDays} />

        {/* Latest results */}
        {latestRun && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-700">最新爬取結果</p>
            <RunSummary run={latestRun} />
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <button onClick={() => setShowHistory(v => !v)} className="text-xs text-zinc-400 hover:text-zinc-600">
              {showHistory ? "▲ 收起" : `▼ 歷史紀錄（${history.length - 1} 筆）`}
            </button>
            {showHistory && (
              <div className="mt-4 space-y-6">
                {[...history].reverse().slice(1).map((run, i) => (
                  <div key={i}>
                    <p className="text-xs text-zinc-400 mb-2">{formatDate(run.ranAt)}</p>
                    <div className="space-y-2">
                      {run.results.map(r => (
                        <div key={r.ids.join()} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-100 bg-white">
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-zinc-600 hover:text-blue-500 flex-1 truncate">
                            {r.name}
                          </a>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
