# Master Hub

**給正在報考研究所的你** — 一個幫你集中管理多校申請、備審文件與重要時程的追蹤工具。

同時要準備好幾間學校的簡章、報名截止日、備審資料與面試日期？Master Hub 把這些資訊收在同一個地方，減少漏看公告、錯過截止日的風險。

線上版本：[master-hub-dun.vercel.app](https://master-hub-dun.vercel.app)

---

## 適合誰使用？

- 正在準備報考**碩士班**（含在職專班、一般生）的上班族或學生
- 同時申請**多所學校、多個系所**，需要比較志願與進度
- 想追蹤各校**報名、備審、面試**等關鍵日期，不想靠記憶或散落各處的筆記
- 希望系所官網有更新時能**自動提醒**，不用每天手動刷新網頁

---

## 你可以用它做什麼

| 功能 | 對你的幫助 |
|------|-----------|
| **申請追蹤** | 記錄每間學校的申請狀態（報名中、審查中、待面試、錄取等），勾選必繳文件是否完成 |
| **前三志願** | 標記第一～第三志願，一眼看出優先順序 |
| **文件總覽** | 跨校檢視必繳文件清單，集中管理備審進度 |
| **申請時程** | 甘特圖呈現報名、備審、面試等日期，避免撞期 |
| **自動爬蟲** | 定期抓取系所官網，偵測招生時程更新並提示是否套用 |
| **通知提醒** | 可設定 Telegram 或 Email，爬蟲完成後自動通知 |
| **附件上傳** | 上傳備審相關檔案（需 Supabase 設定，選用） |
| **多語系** | 支援 Google 翻譯切換語言，方便查閱外文簡章頁面時對照介面 |

---

## 快速開始（使用者）

1. 開啟 [master-hub-dun.vercel.app](https://master-hub-dun.vercel.app)
2. 使用 **Google 帳號登入**，或選擇 **以訪客身分繼續**（資料僅保存在本機瀏覽器）
3. 在 **研究所申請追蹤** 頁查看內建學校，或至 **學校設定** 新增你想報考的系所
4. 更新各校申請狀態、勾選文件、標記志願
5. 至 **追蹤設定** 設定爬蟲頻率與通知方式，讓系統幫你盯官網更新

> **小提醒：** 訪客模式的資料存在你的瀏覽器裡，清除快取或換裝置會消失；長期使用建議用 Google 登入（目前仍以本機資料為主，方便個人管理）。

---

## 內建學校

| 學校 | 系所 |
|------|------|
| 中原大學 | 資訊管理、資訊工程 |
| 輔仁大學 | 資訊管理、資訊工程 |
| 台灣科技大學 | EMRD |
| 大同科技大學 | 資訊工程 |
| 淡江大學 | 資訊工程、資訊管理 |

可在 **學校設定** 頁新增、編輯或隱藏學校，依你的報考清單客製化。

---

## 開發者指南

### 技術棧

- [Next.js 16](https://nextjs.org/)（App Router）
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Auth.js / next-auth](https://authjs.dev/)（Google OAuth）
- [Supabase](https://supabase.com/)（檔案儲存，選用）
- [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)

### 本機開發

**需求：** Node.js 20+、npm

```bash
git clone https://github.com/KimberlyYen/master-hub.git
cd master-hub
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

### 環境變數

複製並編輯 `.env.local`（此檔案不會被 git 追蹤）：

```bash
# Google 登入（必填）
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_TRUST_HOST=true            # 本機 dev 建議開啟，port 變動時不必改 AUTH_URL
# AUTH_URL=                     # 正式環境再設為你的網域，例如 https://master-hub-dun.vercel.app
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_ALLOWED_EMAILS=            # 選填，逗號分隔允許的 Gmail

# Supabase（附件上傳，選用）
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 通知 — Telegram（選用）
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=

# 通知 — Email（選用）
EMAIL_TO=
EMAIL_FROM=
EMAIL_PASSWORD=
EMAIL_SMTP=
EMAIL_PORT=587

# Cron 驗證（選用，用於 /api/notify）
CRON_SECRET=
```

未設定 Supabase 時，附件相關功能會停用，其餘功能仍可正常使用。

### Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. 建立 **OAuth 2.0 Client ID**（Web application）
3. 設定授權重新導向 URI（本機 port 依 `npm run dev` 顯示為準）：
   - 本機：`http://localhost:3000/api/auth/callback/google`（若改用 3002 等 port 需一併加入）
   - 正式：`https://master-hub-dun.vercel.app/api/auth/callback/google`
4. 將 Client ID / Secret 填入 `.env.local` 或 Vercel 環境變數
5. 若只要特定帳號能登入，設定 `AUTH_ALLOWED_EMAILS=your@gmail.com`

### 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置正式版 |
| `npm run start` | 啟動正式版伺服器 |
| `npm run lint` | 執行 ESLint |
| `npm test` | 執行 Jest 測試 |
| `npm run test:watch` | Jest 監看模式 |

### 專案結構

```
app/
├── applications/     # 申請追蹤主頁與學校資料
├── documents/        # 文件總覽
├── gantt/            # 申請時程甘特圖
├── tracking/         # 爬蟲追蹤設定
├── settings/         # 學校資料管理
├── login/            # 登入頁（Google OAuth、訪客模式）
├── api/              # API Routes（爬蟲、上傳、通知）
├── components/       # 共用 UI 元件
└── lib/              # 狀態管理、爬蟲、日期解析等
```

使用者資料（申請進度、志願、附件紀錄）主要儲存在瀏覽器 `localStorage`；上傳的檔案則存放於 Supabase Storage。

### 部署

本專案可部署至 [Vercel](https://vercel.com/)。連結 GitHub repo 後，在 Vercel 專案設定中填入上述環境變數，並 **Redeploy** 使設定生效。

```bash
npm run build   # 本地驗證建置是否成功
```

---

## 授權

Private project.
