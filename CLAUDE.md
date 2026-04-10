# Personal-Kit

書籤管理系統，部署於 Cloudflare Pages + D1。

## 部署規則

完成 `git commit` 與 `git push` 後，必須執行 `npm run deploy`。

## 技術棧

- **框架**: React Router v7 + Vite
- **樣式**: Tailwind CSS + shadcn/ui (Radix)
- **資料庫**: Cloudflare D1 (SQLite) + Drizzle ORM
- **語言**: TypeScript (strict mode)
- **部署**: Cloudflare Pages

## 常用指令

```bash
npm run dev              # 本地開發 (localhost:5173)
npm run build            # 生產構建
npm run typecheck        # TypeScript 型別檢查
npm run deploy           # 部署到 Cloudflare Pages

npm run db:generate      # 生成 migration
npm run db:migrate       # 套用本地 migration
npm run db:migrate:remote # 套用到生產環境
npm run db:studio        # Drizzle Studio GUI
```

## 專案結構

```
app/
  routes/      # 頁面路由與 API endpoints
  components/  # 可複用 UI 元件
  drizzle/     # 資料庫 schema
  lib/         # auth、DB 初始化、工具函式
drizzle/       # D1 migrations
```

## 路徑別名

`~/*` → `./app/*`（在 tsconfig.json 設定）

## 環境變數

| 變數 | 說明 |
|------|------|
| `JWT_KW` | JWT 簽名密鑰（必填） |
| `REGISTRATION_WHITELIST` | 允許註冊的 email 列表，逗號分隔（留空表示開放註冊） |

## 資料庫 Schema 重點

- `workspaces` → `folders`（無限層級巢狀）→ `bookmarks`
- `tag_groups` → `tags` → `bookmark_tags`（書籤標籤關聯）
- `shares`（分享連結設定）
- `users`（JWT 認證）
