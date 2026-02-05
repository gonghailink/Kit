# ⚡ 快速開始指南

5 分鐘內讓專案跑起來！

## 🚀 快速步驟

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數（複製並填入你的資訊）
cp .dev.vars.example .dev.vars

# 3. 初始化本地資料庫 (D1)
# 建立本地 D1 資料庫 (如果還沒建立)
npx wrangler d1 create bookmarks-db
# 套用遷移
npm run db:migrate

# 4. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:8788 (Wrangler Pages Dev) 或 http://localhost:5173 (Vite Dev)

---

## 📝 .dev.vars 設定

編輯 `.dev.vars` 檔案：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!NOTE]
> 目前專案仍使用 Supabase 處理身份驗證 (Auth)，但資料存儲已切換至 Cloudflare D1。

---

## 🗄️ 資料庫管理 (Drizzle + D1)

專案使用 Drizzle ORM 管理 Cloudflare D1 資料庫。

### 本地開發
```bash
# 生成遷移文件 (當修改 schema.ts 後)
npm run db:generate

# 推送結構到本地資料庫 (快速同步)
npm run db:push

# 套用遷移到本地 D1
npm run db:migrate

# 開啟資料庫管理界面 (GUI)
npm run db:studio
```

### 線上環境 (Production)
```bash
# 套用遷移到雲端 D1
npm run db:migrate:remote
```

---

## ✅ 測試

1. 開啟開發伺服器
2. 點選「註冊」建立新帳號
3. 登入後開始新增書籤

---

## 🔧 常用指令

```bash
npm run dev        # 開發模式
npm run build      # 建置生產版本
npm start          # 本地測試生產版本
npm run typecheck  # TypeScript 型別檢查
npm run deploy     # 部署到 Cloudflare Pages
```

---

## 🆘 遇到問題？

- 查看完整教學：`SETUP_GUIDE.md`
- 查看專案說明：`README.md`
- 檢查 Supabase 連線是否正常
- 確認 `.dev.vars` 檔案格式正確

---

## 📦 專案結構

```
app/
├── app/
│   ├── routes/          # 路由檔案
│   ├── lib/             # 工具和型別
│   └── components/      # UI 元件（待建立）
├── public/              # 靜態資源
└── package.json
```

---

就是這麼簡單！🎉
