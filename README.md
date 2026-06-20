# Master Hub

研究所在職專班申請追蹤系統。集中管理各校碩士在職專班的招生資訊、申請進度、備審文件與重要時程。

線上版本：[master-hub-dun.vercel.app](https://master-hub-dun.vercel.app)

## 功能

- **Google 登入** — 使用 Google OAuth 保護應用程式，未登入會導向登入頁
- **申請追蹤** — 追蹤各校申請狀態（報名中、審查中、待面試、錄取等），勾選必繳文件進度
- **前三志願** — 在申請頁標記第一～第三志願
- **文件總覽** — 跨校檢視必繳文件與上傳附件
- **申請時程** — 甘特圖呈現報名、備審、面試等關鍵日期
- **自動爬蟲** — 定期抓取系所網站，偵測招生時程更新並提示套用
- **附件上傳** — 支援圖片預覽與 PDF 檢視（需設定 Supabase Storage）
- **通知** — 可設定 Telegram 或 Email 提醒（部署於 Vercel 時使用環境變數）

## 內建學校

| 學校 | 系所 |
|------|------|
| 中原大學 | 資訊管理、資訊工程 |
| 輔仁大學 | 資訊管理、資訊工程 |
| 台灣科技大學 | EMRD |
| 大同科技大學 | 資訊工程 |
| 淡江大學 | 資訊工程、資訊管理 |

可在「學校設定」頁新增、編輯或隱藏學校。

## 技術棧

- [Next.js 16](https://nextjs.org/)（App Router）
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)（檔案儲存，選用）
- [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)

## 快速開始

### 需求

- Node.js 20+
- npm

### 安裝與啟動

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
AUTH_URL=http://localhost:3000  # 正式環境改為你的網域
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
3. 設定授權重新導向 URI：
   - 本機：`http://localhost:3000/api/auth/callback/google`
   - 正式：`https://你的網域/api/auth/callback/google`
4. 將 Client ID / Secret 填入 `.env.local` 或 Vercel 環境變數
5. 若只要特定帳號能登入，設定 `AUTH_ALLOWED_EMAILS=your@gmail.com`

## 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置正式版 |
| `npm run start` | 啟動正式版伺服器 |
| `npm run lint` | 執行 ESLint |
| `npm test` | 執行 Jest 測試 |
| `npm run test:watch` | Jest 監看模式 |

## 專案結構

```
app/
├── applications/     # 申請追蹤主頁與學校資料
├── documents/        # 文件總覽
├── gantt/            # 申請時程甘特圖
├── tracking/         # 爬蟲追蹤設定
├── settings/         # 學校資料管理
├── api/              # API Routes（爬蟲、上傳、通知）
├── components/       # 共用 UI 元件
└── lib/              # 狀態管理、爬蟲、日期解析等
```

使用者資料（申請進度、志願、附件紀錄）主要儲存在瀏覽器 `localStorage`；上傳的檔案則存放於 Supabase Storage。

## 部署

本專案可部署至 [Vercel](https://vercel.com/)。連結 GitHub repo 後，在 Vercel 專案設定中填入上述環境變數即可。

```bash
npm run build   # 本地驗證建置是否成功
```

## 授權

Private project.
