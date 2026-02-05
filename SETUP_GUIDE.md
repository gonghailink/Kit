# 🚀 設定指南

完整的從零開始設定教學。

## 📋 前置需求

- Node.js 18 或以上
- npm 或 yarn
- Supabase 帳號（僅用於身份驗證）
- Cloudflare 帳號（用於資料庫和託管）

---

## 步驟 1️⃣：安裝依賴套件

```bash
npm install
```

---

## 步驟 2️⃣：設定 Cloudflare D1

### 2.1 建立資料庫

1. 確保你已安裝 Wrangler 並登入：
   ```bash
   npx wrangler login
   ```
2. 建立 D1 資料庫：
   ```bash
   npx wrangler d1 create bookmarks-db
   ```
3. 複製輸出的內容（包含 `database_id`），並更新 `wrangler.toml` 中的 `database_id`。

### 2.2 套用資料庫 Schema

專案使用 Drizzle ORM 管理結構。執行以下指令初始化資料庫：

```bash
# 本地開發環境
npm run db:migrate

# 生產環境 (雲端)
npm run db:migrate:remote
```

---

## 步驟 3️⃣：設定 Supabase (僅 Auth)

雖然資料存在 D1，但我們仍使用 Supabase 處理登入。

1. 前往 [Supabase](https://supabase.com) 建立專案。
2. 左側選單點選「Authentication」→「Providers」→「Email」：
   - 確認已啟用。
   - 建議關閉「Confirm email」（開發階段）。
3. 前往 「Settings」→「API」，複製 **Project URL** 和 **anon public** key。

---

## 步驟 4️⃣：設定環境變數

複製 `.dev.vars.example` 並填入資訊：

```bash
cp .dev.vars.example .dev.vars
```

編輯 `.dev.vars`：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 步驟 5️⃣：本地開發測試

```bash
npm run dev
```

開啟瀏覽器前往 [http://localhost:8788](http://localhost:8788) (本地 Wrangler 模擬環境) 或 [http://localhost:5173](http://localhost:5173) (Vite 開發環境)。

---

## 步驟 6️⃣：部署到 Cloudflare Pages

1. **上傳程式碼到 GitHub**。
2. **在 Cloudflare 建立 Pages 專案**：
   - 連結 GitHub 倉庫。
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
3. **綁定 D1 資料庫**：
   - 在 Pages 專案設定中的「Bindings」功能，新增 D1 資料庫綁定。
   - 變數名稱必須為 `DB`。
4. **設定環境變數**：
   - 新增 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`。

部署完成後，需要將 Cloudflare Pages URL 加入 Supabase 允許清單：

1. 回到 Supabase Dashboard
2. 點選「Authentication」→「URL Configuration」
3. 在「Site URL」填入你的 Cloudflare Pages URL：
   ```
   https://bookmarks-remix.pages.dev
   ```
4. 在「Redirect URLs」新增：
   ```
   https://bookmarks-remix.pages.dev/auth/callback
   http://localhost:5173/auth/callback
   ```
5. 點選「Save」

---

## 🎉 完成！

現在你的Kit應該已經：
- ✅ 本地開發環境正常運作
- ✅ 部署到 Cloudflare Pages
- ✅ 使用者可以註冊和登入

---

## 🔧 常見問題

### Q1: npm install 失敗？

**A**: 嘗試以下方法：
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Q2: 無法連接 Supabase？

**A**: 檢查：
1. `.dev.vars` 檔案是否存在且格式正確
2. SUPABASE_URL 是否包含 `https://`
3. API Keys 是否正確複製（沒有多餘空格）

### Q3: 登入後出現 Unauthorized？

**A**: 檢查：
1. Supabase RLS 政策是否正確設定
2. 在 Supabase Dashboard → Authentication → Users 確認使用者已建立

### Q4: Cloudflare Pages 建置失敗？

**A**: 檢查：
1. Root directory 是否設定為 `app`
2. Build command 是否為 `npm run build`
3. 環境變數是否已設定

### Q5: 註冊後沒有收到確認信？

**A**: 我們已經關閉 Email 確認功能（開發階段）。如果你想啟用：
1. Supabase → Authentication → Providers → Email
2. 勾選「Enable email confirmations」
3. 設定 SMTP（或使用 Supabase 內建的 Email 服務）

---

## 📚 下一步

現在基礎架構已經完成，你可以：

1. **實作 CRUD 功能**：新增 API 路由來建立 Tabs/Folders/Bookmarks
2. **安裝 shadcn/ui 元件**：執行 `npx shadcn@latest add [component]`
3. **實作拖放功能**：使用 @dnd-kit 套件
4. **新增搜尋功能**：使用 Supabase 全文搜尋

詳細的功能實作指南請參考 `README.md`。

---

## 💡 開發建議

- 使用 `npm run typecheck` 檢查 TypeScript 錯誤
- 使用 `npm run build` 確保能正常建置
- 定期備份 Supabase 資料庫（Settings → Database → Backups）
- 為生產環境啟用 Email 確認功能

祝你開發順利！🚀
