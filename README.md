# 📚 書籤管理器 (Bookmarks Remix)

基於 **Remix + Cloudflare Pages + Supabase** 的現代化書籤管理系統。

## ✨ 功能特色

- 🎯 **多層級組織**：Tabs → Folders → Folders (巢狀) → Bookmarks
- 🔐 **使用者認證**：Supabase Auth (Email + 未來可擴展 OAuth)
- 🎨 **現代化 UI**：shadcn/ui + Tailwind CSS
- 🚀 **免費部署**：Cloudflare Pages (免費方案)
- 📱 **響應式設計**：完美支援桌面和行動裝置
- 🌙 **深色模式**：（待實作）

## 🏗️ 技術架構

### 前端
- **框架**：Remix (React Router)
- **UI 元件庫**：shadcn/ui
- **樣式**：Tailwind CSS
- **圖示**：Lucide React
- **拖放**：@dnd-kit（待實作）

### 後端
- **資料庫**：Supabase (PostgreSQL)
- **認證**：Supabase Auth
- **部署**：Cloudflare Pages

## 📦 專案結構

```
app/
├── functions/[[path]].ts    # Cloudflare Pages Functions 入口
├── app/
│   ├── routes/
│   │   ├── _index.tsx          # 首頁重定向
│   │   ├── login.tsx            # 登入/註冊頁面
│   │   ├── auth.callback.tsx   # Auth 回調
│   │   └── dashboard.tsx        # 主要書籤管理頁面
│   │
│   ├── lib/
│   │   ├── types.ts             # TypeScript 型別定義
│   │   ├── utils.ts             # 工具函數
│   │   ├── supabase.server.ts  # Supabase 伺服器端
│   │   └── supabase.client.ts  # Supabase 客戶端
│   │
│   ├── globals.css              # 全域樣式
│   ├── root.tsx                 # Root Layout
│   └── entry.{client,server}.tsx
│
├── public/                      # 靜態資源
├── wrangler.toml                # Cloudflare 配置
├── tailwind.config.ts           # Tailwind 配置
├── components.json              # shadcn/ui 配置
└── package.json
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd app
npm install
```

### 2. 設定 Supabase

1. 前往 [Supabase](https://supabase.com) 建立新專案
2. 執行 SQL Schema（見下方「資料庫設定」）
3. 複製 `.dev.vars.example` 為 `.dev.vars`
4. 填入你的 Supabase 資訊：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 本地開發

```bash
npm run dev
```

開啟 [http://localhost:5173](http://localhost:5173)

### 4. 建置與部署

```bash
# 建置
npm run build

# 本地測試生產版本
npm start

# 部署到 Cloudflare Pages
npm run deploy
```

## 🗄️ 資料庫設定

在 Supabase SQL Editor 執行以下 SQL：

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
  memo text,
  sort_order float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Shares 表：分享連結
create table public.shares (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  share_token text not null unique,
  short_link text,
  extra_btn_title text,
  extra_btn_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 為 short_link 新增唯一索引（null 值不受影響）
create unique index shares_short_link_unique on public.shares (short_link)
  where short_link is not null;

-- 5. 設定 RLS (Row Level Security)
alter table public.tabs enable row level security;
alter table public.folders enable row level security;
alter table public.bookmarks enable row level security;
alter table public.shares enable row level security;

create policy "Users can CRUD their own tabs" on public.tabs
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own folders" on public.folders
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own shares" on public.shares
  for all using (auth.uid() = user_id);

create policy "Anyone can read shares by token" on public.shares
  for select using (true);
```

## 🔧 Cloudflare Pages 部署設定

### 方式一：透過 Git 自動部署（推薦）

1. 將程式碼推送到 GitHub
2. 在 Cloudflare Dashboard → Pages → Create a project
3. 連結你的 GitHub repository
4. 建置設定：
   - **Framework preset**: Remix
   - **Build command**: \`npm run build\`
   - **Build output directory**: \`build/client\`
5. 環境變數：
   - \`SUPABASE_URL\`
   - \`SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`

### 方式二：手動部署

```bash
npm run deploy
```

## 📝 待實作功能

### Phase 1（基礎 CRUD）
- [ ] 新增/編輯/刪除 Tab
- [ ] 新增/編輯/刪除 Folder
- [ ] 新增/編輯/刪除 Bookmark
- [ ] Favicon 自動抓取

### Phase 2（進階功能）
- [ ] 拖放排序（dnd-kit）
- [ ] Folder 展開/收合
- [ ] 搜尋與過濾
- [ ] 右鍵選單

### Phase 3（優化）
- [ ] 深色模式切換
- [ ] 批量匯入書籤（Chrome/Firefox）
- [ ] 匯出書籤（JSON/HTML）
- [ ] 效能優化（虛擬滾動）
- [ ] 多語系支援

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🙏 致謝

- [Remix](https://remix.run)
- [Supabase](https://supabase.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
