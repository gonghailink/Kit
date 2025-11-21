# 📚 書籤管理器 - Personal Bookmarks Remix

> 基於 **Remix + Cloudflare Pages + Supabase** 的現代化書籤管理系統

## 🎯 專案特色

- ✅ **三層級結構**：Tabs → Folders (支援巢狀) → Bookmarks
- ✅ **完全免費部署**：Cloudflare Pages + Supabase 免費方案
- ✅ **現代化技術棧**：Remix + TypeScript + Tailwind CSS
- ✅ **使用者認證**：Supabase Auth
- ✅ **響應式設計**：完美支援桌面和行動裝置
- 🚧 **拖放排序**：dnd-kit（待實作）
- 🚧 **深色模式**：（待實作）

---

## 📁 專案結構

```
Personal-BookmarksRemix/
├── app/                    # 主要應用程式碼
│   ├── app/               # Remix 應用程式
│   │   ├── routes/        # 路由檔案
│   │   │   ├── _index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── auth.callback.tsx
│   │   │   └── dashboard.tsx
│   │   ├── lib/           # 工具庫
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   ├── supabase.server.ts
│   │   │   └── supabase.client.ts
│   │   └── globals.css
│   ├── public/            # 靜態資源
│   ├── package.json
│   ├── README.md          # 詳細技術文件
│   ├── SETUP_GUIDE.md     # 完整設定指南
│   └── QUICKSTART.md      # 快速開始
└── README.md              # 本檔案
```

---

## ⚡ 快速開始

```bash
# 1. 進入專案目錄
cd app

# 2. 安裝依賴
npm install

# 3. 設定環境變數（複製並填入 Supabase 資訊）
cp .dev.vars.example .dev.vars

# 4. 啟動開發伺服器
npm run dev
```

開啟瀏覽器前往 [http://localhost:5173](http://localhost:5173)

---

## 📚 文件導覽

### 🚀 [QUICKSTART.md](app/QUICKSTART.md)
5 分鐘快速開始指南，適合想立即跑起來的開發者。

### 📖 [SETUP_GUIDE.md](app/SETUP_GUIDE.md)
完整的設定教學，包含：
- Supabase 專案建立
- 資料庫 Schema 設定
- Cloudflare Pages 部署
- 常見問題排解

### 💻 [app/README.md](app/README.md)
技術文件，包含：
- 詳細的專案架構
- API 設計說明
- 開發路線圖
- 貢獻指南

---

## 🏗️ 技術架構

### 前端
- **框架**：[Remix](https://remix.run) 2.x
- **語言**：TypeScript
- **樣式**：Tailwind CSS
- **UI 元件**：shadcn/ui
- **圖示**：Lucide React
- **拖放**：@dnd-kit

### 後端
- **資料庫**：Supabase (PostgreSQL)
- **認證**：Supabase Auth
- **RLS**：Row Level Security（資料隔離）

### 部署
- **平台**：Cloudflare Pages（免費）
- **建置工具**：Vite
- **執行環境**：Cloudflare Workers

---

## 🗄️ 資料庫結構

```sql
Tabs (分頁)
├── id
├── user_id
├── title
└── sort_order

Folders (資料夾，支援巢狀)
├── id
├── user_id
├── tab_id (外鍵 → Tabs)
├── parent_id (外鍵 → Folders, nullable)
├── title
├── is_collapsed
└── sort_order

Bookmarks (書籤)
├── id
├── user_id
├── folder_id (外鍵 → Folders)
├── title
├── url
├── favicon_url
└── sort_order
```

---

## 🎨 UI 預覽

### 登入頁面
- 簡潔的 Email/密碼登入
- 支援註冊新帳號
- 響應式設計

### Dashboard
```
┌─────────────────────────────────────────────┐
│  📚 書籤管理器    [搜尋...]     user@email  │
├─────────────────────────────────────────────┤
│  [Tab1] [Tab2] [Tab3] [+]                   │
├─────────────────────────────────────────────┤
│                                             │
│  Folder 1                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🔖  │ │ 🔖  │ │ 🔖  │ │ 🔖  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  Folder 2                                   │
│  └─ Folder 2-1                              │
│     ┌─────┐ ┌─────┐                        │
│     │ 🔖  │ │ 🔖  │                        │
│     └─────┘ └─────┘                        │
└─────────────────────────────────────────────┘
```

---

## 🚀 部署到 Cloudflare Pages

### 自動部署（推薦）

1. 推送程式碼到 GitHub
2. 連結 Cloudflare Pages
3. 設定環境變數
4. 自動建置和部署

詳細步驟請參考 [SETUP_GUIDE.md](app/SETUP_GUIDE.md)

### 手動部署

```bash
cd app
npm run deploy
```

---

## 📝 開發路線圖

### ✅ Phase 1 - 基礎功能（已完成）
- [x] 使用者認證（登入/註冊）
- [x] Dashboard 頁面框架
- [x] 資料庫架構設計
- [x] Supabase 整合

### 🚧 Phase 2 - CRUD 功能（開發中）
- [ ] 新增/編輯/刪除 Tab
- [ ] 新增/編輯/刪除 Folder
- [ ] 新增/編輯/刪除 Bookmark
- [ ] Favicon 自動抓取

### 📋 Phase 3 - 進階功能
- [ ] 拖放排序（Tabs/Folders/Bookmarks）
- [ ] Folder 展開/收合狀態
- [ ] 全域搜尋功能
- [ ] 右鍵選單

### 🎨 Phase 4 - 優化與擴充
- [ ] 深色模式
- [ ] 批量匯入（Chrome/Firefox）
- [ ] 匯出書籤（JSON/HTML）
- [ ] 效能優化
- [ ] PWA 支援

---

## 💡 為什麼選擇這個技術棧？

### Remix
- ✅ 完整的 SSR 支援
- ✅ 優秀的資料載入機制
- ✅ 內建的表單處理
- ✅ 與 Cloudflare Pages 完美整合

### Supabase
- ✅ 完全免費（500MB 資料庫 + 認證）
- ✅ PostgreSQL（強大且可靠）
- ✅ RLS 自動資料隔離
- ✅ 即時訂閱支援

### Cloudflare Pages
- ✅ 完全免費
- ✅ 全球 CDN
- ✅ 自動 HTTPS
- ✅ Git 整合自動部署

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發流程

1. Fork 本專案
2. 建立 feature branch (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE)

---

## 🙏 致謝

- [Remix](https://remix.run) - 全端 React 框架
- [Supabase](https://supabase.com) - 開源的 Firebase 替代方案
- [Cloudflare Pages](https://pages.cloudflare.com) - 邊緣運算部署平台
- [shadcn/ui](https://ui.shadcn.com) - 精美的 React 元件庫
- [Lucide Icons](https://lucide.dev) - 優雅的圖示庫

---

## 📮 聯絡方式

如有問題或建議，歡迎：
- 開 Issue
- 提交 PR
- 發送 Email（待補充）

---

**⭐ 如果這個專案對你有幫助，請給個 Star！**
