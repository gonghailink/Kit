# ⚡ 快速開始指南

5 分鐘內讓專案跑起來！

## 🚀 快速步驟

```bash
# 1. 安裝依賴
cd app
npm install

# 2. 設定環境變數（複製並填入你的 Supabase 資訊）
cp .dev.vars.example .dev.vars

# 3. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:5173

---

## 📝 .dev.vars 設定

編輯 `.dev.vars` 檔案：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 如何取得這些值？

1. 前往 [Supabase](https://supabase.com) 並登入
2. 選擇你的專案（或建立新專案）
3. 左側選單：Settings → API
4. 複製 Project URL 和 API Keys

---

## 🗄️ Supabase 資料庫設定

在 Supabase SQL Editor 執行以下 SQL：

```sql
-- Tabs 表
create table public.tabs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  sort_order float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Folders 表
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

-- Bookmarks 表
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

-- RLS 政策
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

---

## ✅ 測試

1. 開啟 http://localhost:5173
2. 點選「註冊」建立新帳號
3. 登入後應該會看到 Dashboard

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
