# 🚀 設定指南

完整的從零開始設定教學。

## 📋 前置需求

- Node.js 18 或以上
- npm 或 yarn
- Supabase 帳號（免費）
- Cloudflare 帳號（免費）

---

## 步驟 1️⃣：安裝依賴套件

```bash
cd app
npm install
```

如果遇到套件版本問題，可以使用：
```bash
npm install --legacy-peer-deps
```

---

## 步驟 2️⃣：設定 Supabase

### 2.1 建立 Supabase 專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 點選「Start your project」
3. 建立新專案：
   - **Organization**: 建立或選擇現有的
   - **Project name**: bookmarks-remix
   - **Database Password**: 設定一個強密碼（記下來！）
   - **Region**: 選擇離你最近的區域（建議 Northeast Asia (Tokyo)）
4. 等待專案建立完成（約 2 分鐘）

### 2.2 建立資料庫表格

1. 在 Supabase Dashboard 左側選單點選「SQL Editor」
2. 點選「New query」
3. 複製貼上以下 SQL 並執行：

```sql
-- 1. Tabs 表：最頂層的分頁
create table public.tabs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  sort_order float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Folders 表：支援無限層級嵌套
create table public.folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tab_id uuid references public.tabs on delete cascade not null,
  parent_id uuid references public.folders on delete cascade,
  title text not null,
  is_collapsed boolean default false,
  sort_order float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Bookmarks 表：實際的書籤
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  folder_id uuid references public.folders on delete cascade not null,
  title text not null,
  url text not null,
  favicon_url text,
  sort_order float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 設定 RLS (Row Level Security)
alter table public.tabs enable row level security;
alter table public.folders enable row level security;
alter table public.bookmarks enable row level security;

create policy "Users can CRUD their own tabs" on public.tabs
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own folders" on public.folders
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);
```

4. 點選「Run」執行 SQL
5. 驗證：左側選單「Table Editor」應該會看到 3 個新表格

### 2.3 設定 Email Auth

1. 左側選單點選「Authentication」→「Providers」
2. 找到「Email」並確認已啟用
3. **重要**：關閉「Confirm email」（開發階段）
   - 展開 Email Provider 設定
   - 取消勾選「Enable email confirmations」
   - 點選「Save」

### 2.4 取得 API Keys

1. 左側選單點選「Settings」→「API」
2. 複製以下資訊：
   - **Project URL** (例如: https://xxxxx.supabase.co)
   - **anon public** key
   - **service_role** key（點選「Reveal」顯示）

---

## 步驟 3️⃣：設定環境變數

在 `app/` 目錄下：

```bash
cp .dev.vars.example .dev.vars
```

編輯 `.dev.vars` 並填入你的 Supabase 資訊：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**：`.dev.vars` 已加入 `.gitignore`，不會被提交到 Git

---

## 步驟 4️⃣：本地開發測試

```bash
npm run dev
```

開啟瀏覽器前往 [http://localhost:5173](http://localhost:5173)

### 測試流程

1. **註冊帳號**
   - 輸入 Email 和密碼（至少 6 個字元）
   - 點選「註冊」
   - 因為關閉了 Email 確認，應該會直接註冊成功

2. **登入**
   - 使用剛註冊的帳號登入
   - 應該會自動跳轉到 Dashboard

3. **驗證 Dashboard**
   - 目前應該顯示「還沒有任何書籤」
   - 這是正常的，因為還沒實作新增功能

---

## 步驟 5️⃣：部署到 Cloudflare Pages

### 5.1 方式一：透過 Git 自動部署（推薦）

1. **將程式碼推送到 GitHub**
   ```bash
   cd /Users/meowlu/Documents/github/Personal-BookmarksRemix
   git add .
   git commit -m "Initial commit: Remix + Supabase Bookmarks"
   git push origin main
   ```

2. **連結 Cloudflare Pages**
   - 前往 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 點選「Workers & Pages」→「Create application」
   - 選擇「Pages」→「Connect to Git」
   - 授權並選擇你的 GitHub repository

3. **設定建置**
   - **Framework preset**: Remix
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
   - **Root directory**: `app`（如果你的 package.json 在 app 資料夾內）

4. **設定環境變數**
   - 在專案設定頁面找到「Settings」→「Environment variables」
   - 新增以下變數：
     ```
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_ANON_KEY=eyJhbG...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
     ```

5. **部署**
   - 點選「Save and Deploy」
   - 等待建置完成（約 2-3 分鐘）
   - 你會得到一個 `.pages.dev` 的網址

### 5.2 方式二：手動部署

```bash
cd app
npm run build
npx wrangler pages deploy ./build/client --project-name=bookmarks-remix
```

第一次執行會要求登入 Cloudflare 帳號。

---

## 步驟 6️⃣：設定 Supabase Auth 回調 URL

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

現在你的書籤管理器應該已經：
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
