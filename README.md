# Kit (Bookmarks Clip)

基於 **React Router v7 + Cloudflare Pages + D1** 的現代化書籤管理系統。

## 功能特色

- **多層級組織**：Workspaces → Tabs → Folders (無限巢狀) → Bookmarks
- **標籤系統**：標籤群組 + 多種篩選模式（AND / OR / 單選）
- **拖放排序**：透過 @dnd-kit 支援書籤、資料夾、分頁拖放排序
- **公開分享**：產生分享連結 / 短網址，支援標籤篩選
- **使用者認證**：JWT Cookie Session（Email + 密碼）
- **現代化 UI**：shadcn/ui + Tailwind CSS + Phosphor Icons
- **免費部署**：Cloudflare Pages + D1（免費方案即可運行）
- **響應式設計**：支援桌面和行動裝置

## 技術架構

### 前端

- **框架**：React Router v7
- **UI 元件庫**：shadcn/ui (Radix UI)
- **樣式**：Tailwind CSS
- **圖示**：Phosphor Icons
- **拖放**：@dnd-kit

### 後端

- **資料庫**：Cloudflare D1 (SQLite)
- **ORM**：Drizzle ORM
- **認證**：JWT (jose) + Cookie Session
- **部署**：Cloudflare Pages

## 專案結構

```
app/
├── routes/
│   ├── _index.tsx              # 首頁
│   ├── intro.tsx               # 介紹頁面
│   ├── login.tsx               # 登入 / 註冊
│   ├── dashboard.tsx           # 主要書籤管理介面
│   ├── me.tsx                  # 使用者公開頁面
│   ├── share.$token.tsx        # 分享頁面（以 token 存取）
│   ├── s.$shortLink.tsx        # 短網址重導向
│   ├── api.bookmarks.tsx       # Bookmark CRUD API
│   ├── api.folders.tsx         # Folder CRUD API
│   ├── api.tabs.tsx            # Tab CRUD API
│   ├── api.workspaces.tsx      # Workspace CRUD API
│   ├── api.shares.tsx          # Share 管理 API
│   ├── api.tags.tsx            # Tag CRUD API
│   ├── api.tag-groups.tsx      # Tag Group CRUD API
│   └── api.bookmark-tags.tsx   # Bookmark-Tag 關聯 API
│
├── components/
│   ├── dialogs/                # 對話框元件
│   ├── page-ui/
│   │   ├── dashboard/          # Dashboard 頁面元件
│   │   ├── view/               # 分享檢視元件
│   │   └── shared/             # 共用元件（TagFilterBar 等）
│   └── ui/                     # 基礎 UI 元件（shadcn/ui）
│
├── drizzle/
│   └── schema.ts               # 資料庫 Schema（Drizzle ORM）
│
├── lib/
│   ├── auth.server.ts          # JWT 認證邏輯
│   ├── db.server.ts            # Drizzle DB 初始化
│   ├── types.ts                # TypeScript 型別定義
│   └── utils.ts                # 工具函數
│
├── globals.css                 # 全域樣式（含深色模式）
├── root.tsx                    # Root Layout
└── entry.{client,server}.tsx

drizzle/                        # D1 Migration 檔案
wrangler.toml                   # Cloudflare 配置
drizzle.config.ts               # Drizzle ORM 配置
tailwind.config.ts              # Tailwind 配置
```

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數設定

複製 `.env.example` 為 `.dev.vars`（本地開發用）：

```bash
cp .env.example .dev.vars
```

填入以下環境變數：

```env
# JWT Secret - 請改為你自己的安全金鑰
JWT_KW=your_very_secret_key_here

# Registration Whitelist（註冊白名單）
# 留空 = 開放所有人註冊
# 有值 = 僅限白名單內的 email 可以註冊（用逗號分隔）
# 範例：REGISTRATION_WHITELIST=user1@example.com,user2@example.com
REGISTRATION_WHITELIST=
```

**註冊白名單說明：**
- **完全公開註冊**：`REGISTRATION_WHITELIST=`（留空）
- **限制特定人員**：`REGISTRATION_WHITELIST=alice@example.com,bob@example.com`
- **僅限自己使用**：`REGISTRATION_WHITELIST=your@email.com`

### 3. 資料庫設定

建立 D1 資料庫並執行 Migration：

```bash
# 本地開發用 Migration
npm run db:migrate

# 遠端正式環境 Migration
npm run db:migrate:remote
```

### 4. 本地開發

```bash
npm run dev
```

開啟 [http://localhost:5173](http://localhost:5173)

### 5. 建置與部署

```bash
# 建置
npm run build

# 本地測試生產版本
npm start

# 部署到 Cloudflare Pages
npm run deploy
```

## 資料庫架構

使用 Cloudflare D1 (SQLite) + Drizzle ORM，共 9 張表：

| 資料表 | 說明 |
|--------|------|
| `users` | 使用者帳號（Email + 密碼雜湊） |
| `workspaces` | 工作區，每位使用者可建立多個 |
| `tabs` | 分頁，支援 `folders` 和 `tags` 兩種類型 |
| `folders` | 資料夾，支援無限巢狀（self-reference） |
| `bookmarks` | 書籤項目 |
| `tag_groups` | 標籤群組，含篩選模式（and / or / single） |
| `tags` | 標籤 |
| `bookmark_tags` | 書籤與標籤的多對多關聯 |
| `shares` | 公開分享連結（token + 短網址） |

Schema 定義位於 [app/drizzle/schema.ts](app/drizzle/schema.ts)。

## Cloudflare Pages 部署設定

### 方式一：透過 Git 自動部署（推薦）

1. 將程式碼推送到 GitHub
2. 在 Cloudflare Dashboard → Pages → Create a project
3. 連結你的 GitHub repository
4. 建置設定：
   - **Framework preset**: Remix
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
5. 綁定 D1 資料庫（Settings → Functions → D1 database bindings）：
   - Variable name: `DB`
   - D1 database: 選擇你的資料庫
6. 環境變數（Settings → Environment variables）：
   - `JWT_KW` - JWT 簽名密鑰
   - `REGISTRATION_WHITELIST` - 註冊白名單（選填，留空表示開放註冊）

### 方式二：手動部署

```bash
npm run deploy
```

## 待實作功能

- [ ] 深色模式切換 UI（CSS 已支援，需加入切換按鈕）
- [ ] 批量匯入書籤（Chrome / Firefox）
- [ ] 匯出書籤（JSON / HTML）
- [ ] 右鍵選單
- [ ] 效能優化（虛擬滾動）
- [ ] 多語系支援

## 授權

MIT License

## 致謝

- [Remix](https://remix.run)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com)
- [Phosphor Icons](https://phosphoricons.com)
- [dnd kit](https://dndkit.com)
