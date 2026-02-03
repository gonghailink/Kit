# 🔗 Share Mode 實作完成（更新版）

## ✅ 實作內容

已成功為Kit加入分享功能，讓使用者可以**生成唯讀的分享連結，分享整個帳號的所有書籤**。

---

## 📊 資料庫結構

### **建立的 SQL 檔案**
檔案位置：[database/shares_table.sql](database/shares_table.sql)

### **Shares 表格結構**
```sql
create table public.shares (
  id uuid primary key,
  user_id uuid references auth.users not null,
  share_token text unique not null,
  created_at timestamp with time zone not null
);
```

**重要變更：**
- ❌ 移除 `tab_id`（不再分享單一 Tab）
- ❌ 移除 `expires_at`（分享連結永久有效）
- ✅ 直接綁定 `user_id`（分享整個使用者的書籤）

### **RLS 政策**
1. **使用者管理自己的分享**
   - 使用者只能建立、讀取、刪除自己的分享連結
   - 每個使用者只能有一個分享連結

2. **公開讀取分享內容**
   - 任何人都可以透過有效的 share_token 讀取該使用者的所有 Tabs、Folders、Bookmarks
   - 分享連結永久有效，無過期限制

---

## 🛠️ API 實作

### **檔案位置**
[app/routes/api.shares.tsx](app/app/routes/api.shares.tsx)

### **API 端點**

#### **GET `/api/shares`**
取得當前使用者的分享連結

**回應範例：**
```json
{
  "shares": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "share_token": "unique-token",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### **POST `/api/shares` (intent: create)**
建立新的分享連結

**限制：** 每個使用者只能建立一個分享連結

**回應範例：**
```json
{
  "share": {
    "id": "uuid",
    "share_token": "abc123def456...",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "success": true
}
```

#### **POST `/api/shares` (intent: delete)**
刪除分享連結

**請求參數：**
- `intent`: "delete"
- `id`: Share 的 ID

---

## 🌐 分享頁面

### **檔案位置**
[app/routes/share.$token.tsx](app/app/routes/share.$token.tsx)

### **路由**
`/share/{share_token}`

### **功能特色**
- ✅ 顯示該使用者的**所有 Tabs**（完整的書籤集合）
- ✅ 支援 Tab 切換
- ✅ 唯讀瀏覽模式（無編輯、刪除、拖放功能）
- ✅ 保留原有的樹狀結構和折疊功能
- ✅ 支援 Favicon 顯示
- ✅ 書籤可點擊開啟新分頁
- ✅ 美觀的漸層背景設計
- ✅ 包含「建立你的書籤」CTA 按鈕

### **頁面結構**
```
┌─────────────────────────────────────┐
│  分享的書籤                          │
│  唯讀分享模式 - 此頁面無法編輯        │
│                      [建立你的書籤]   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Tab1  │  Tab2  │  Tab3              │ ← Tab 切換
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📁 資料夾 1                         │
│    🔖 書籤 1                         │
│    🔖 書籤 2                         │
│  📁 資料夾 2                         │
│    📁 子資料夾                       │
│      🔖 書籤 3                       │
└─────────────────────────────────────┘
```

---

## 💬 分享對話框

### **檔案位置**
[app/components/dialogs/ShareDialog.tsx](app/app/components/dialogs/ShareDialog.tsx)

### **功能簡化**

**移除的功能：**
- ❌ Tab 選擇（現在分享整個帳號）
- ❌ 過期時間設定（分享連結永久有效）
- ❌ 多個分享連結（每個使用者只有一個）

**保留的功能：**
- ✅ 建立分享連結按鈕
- ✅ 顯示分享連結和建立時間
- ✅ 一鍵複製分享 URL
- ✅ 開啟分享連結預覽
- ✅ 刪除分享連結

### **UI 狀態**

#### **未建立分享時：**
```
┌─────────────────────────────────────┐
│  🔗 分享我的書籤                     │
│  建立唯讀分享連結，讓其他人可以瀏覽   │
│  您的所有書籤（不可編輯）             │
├─────────────────────────────────────┤
│           🔗                        │
│     您尚未建立分享連結                │
│  建立後，任何人都可以透過連結瀏覽     │
│  您的所有書籤                        │
│                                     │
│      [🔗 建立分享連結]               │
└─────────────────────────────────────┘
```

#### **已建立分享時：**
```
┌─────────────────────────────────────┐
│  🔗 分享我的書籤                     │
│  建立唯讀分享連結，讓其他人可以瀏覽   │
│  您的所有書籤（不可編輯）             │
├─────────────────────────────────────┤
│  您的分享連結                        │
│                                     │
│  建立於：2025/01/01 12:00            │
│  ┌─────────────────────────────┐   │
│  │ https://domain.com/share/... │   │
│  └─────────────────────────────┘   │
│                                     │
│  [📋 複製連結] [🔗] [🗑️]            │
└─────────────────────────────────────┘
```

---

## 🎨 Dashboard 整合

### **修改檔案**
[app/routes/dashboard.tsx](app/app/routes/dashboard.tsx)

### **新增功能**
**分享按鈕位置：Header 右側**（不是 Tab 下拉選單）

```
┌──────────────────────────────────────────────────┐
│  📖 Kit    🔍 [搜尋...]                    │
│                   [🔗 分享] user@email.com [登出] │
└──────────────────────────────────────────────────┘
```

**按鈕位置邏輯：**
- 位於 Header 右側
- 在搜尋框和使用者資訊之間
- 點擊後開啟分享對話框

---

## 📝 TypeScript 型別

### **修改檔案**
[app/lib/types.ts](app/app/lib/types.ts)

### **Share 型別**
```typescript
export interface Share {
  id: string;
  user_id: string;
  share_token: string;
  created_at: string;
}
```

**移除的欄位：**
- ❌ `tab_id`
- ❌ `expires_at`

---

## 🚀 使用流程

### **第一步：建立分享連結**
1. 登入後點選 Header 右側的「**分享**」按鈕
2. 在對話框中點選「**建立分享連結**」
3. 系統自動生成唯一的分享連結

### **第二步：複製和分享**
1. 點選「**複製連結**」按鈕
2. 分享連結格式：`https://your-domain.com/share/abc123def456...`
3. 將連結傳送給其他人

### **第三步：瀏覽分享內容**
1. 收到連結的人開啟後會看到：
   - 所有 Tabs（可切換）
   - 完整的資料夾和書籤結構
   - 唯讀模式提示
2. 可以：
   - 切換不同的 Tab
   - 展開/收合資料夾
   - 點擊書籤開啟網站
   - 查看書籤備註
3. 無法：
   - 編輯任何內容
   - 新增書籤
   - 刪除資料
   - 拖放排序

### **第四步：管理分享連結**
1. 重新開啟分享對話框
2. 查看分享連結和建立時間
3. 可以：
   - 預覽分享連結
   - 刪除分享連結（刪除後無法透過該連結訪問）

---

## 🔒 安全性設計

### **Token 生成**
使用 `crypto.randomUUID()` 生成唯一 token，並移除破折號
- 範例：`550e8400e29b41d4a716446655440000`
- 長度：32 字元
- 碰撞機率：極低（UUID v4）

### **權限控制**
1. **建立分享**
   - 只能建立自己的分享連結
   - 每個使用者限制一個分享連結
   - 重複建立會返回錯誤

2. **刪除分享**
   - 只能刪除自己建立的分享
   - 刪除後該 token 立即失效

3. **瀏覽分享**
   - 任何人都可以透過有效 token 瀏覽
   - 只能讀取，無法修改
   - 分享連結永久有效（除非被刪除）

### **RLS 政策**
- Supabase Row Level Security 確保資料安全
- 分享連結不會洩露使用者隱私資訊
- 每個使用者的分享是獨立的

---

## ⚙️ 部署前準備

### **1. 執行 SQL**
在 Supabase Dashboard → SQL Editor 執行：
```bash
cat database/shares_table.sql
```

### **2. 驗證 RLS 政策**
確認以下政策已啟用：
- ✅ Users can CRUD their own shares
- ✅ Anyone can read shares with valid token
- ✅ Anyone can read shared user tabs
- ✅ Anyone can read shared user folders
- ✅ Anyone can read shared user bookmarks

### **3. 測試流程**
1. 本地測試：開啟 http://localhost:5176
2. 建立分享連結
3. 在無痕模式開啟分享連結
4. 驗證可以看到所有 Tabs
5. 驗證無法編輯
6. 測試刪除分享連結

---

## 📁 檔案清單

### **新建檔案**
```
database/
  shares_table.sql                          # 資料庫 Schema

app/app/routes/
  api.shares.tsx                            # Share API
  share.$token.tsx                          # 分享頁面

app/app/components/dialogs/
  ShareDialog.tsx                           # 分享對話框
```

### **修改檔案**
```
app/app/lib/
  types.ts                                  # 新增 Share 型別

app/app/routes/
  dashboard.tsx                             # 在 Header 加入分享按鈕
```

---

## 🎯 功能總結

### ✅ **已完成**
- [x] 設計 share 資料表結構和 RLS 政策
- [x] 建立 share API 路由（生成、刪除分享連結）
- [x] 建立 share 頁面（唯讀瀏覽模式，顯示所有 Tabs）
- [x] 在 Dashboard Header 加入分享按鈕
- [x] 簡化分享對話框（移除過期設定和 Tab 選擇）
- [x] 限制每個使用者只能有一個分享連結
- [x] 複製分享連結功能
- [x] 刪除分享連結功能

### 🆕 **與原設計的差異**
| 項目 | 原設計 | 新設計 |
|------|--------|--------|
| 分享範圍 | 單一 Tab | 整個帳號的所有書籤 |
| 過期設定 | 可設定過期天數 | 永久有效 |
| 分享數量 | 可建立多個 | 每個使用者限制一個 |
| 按鈕位置 | Tab 下拉選單 | Header 右側 |

---

## 💡 使用範例

### **分享連結格式**
```
https://bookmarks-remix.pages.dev/share/550e8400e29b41d4a716446655440000
```

### **API 請求範例**

#### **建立分享連結**
```javascript
fetch('/api/shares', {
  method: 'POST',
  body: new FormData({
    intent: 'create'
  })
})
```

#### **刪除分享連結**
```javascript
fetch('/api/shares', {
  method: 'POST',
  body: new FormData({
    intent: 'delete',
    id: 'share-uuid-here'
  })
})
```

---

## ✨ 現在就試試！

1. 啟動開發伺服器（已在 http://localhost:5176 運行）

2. 點選 Header 的「**分享**」按鈕

3. 建立分享連結並測試！

---

## 🔄 與原實作的主要變更

### **資料庫變更**
```sql
-- 移除
- tab_id uuid references public.tabs
- expires_at timestamp with time zone

-- RLS 政策變更
- 從檢查 tab_id 改為檢查 user_id
- 移除過期時間檢查
```

### **API 變更**
```typescript
// 移除的參數
- tabId (不再需要指定 Tab)
- expiresInDays (不再支援過期設定)

// 新增的驗證
- 檢查使用者是否已有分享連結（限制一個）
```

### **UI 變更**
```typescript
// ShareDialog Props
- 移除 tabId: string
- 移除 tabTitle: string

// Dashboard
- 移除 Tab 下拉選單的分享選項
- 在 Header 新增分享按鈕
- 移除 sharingTab state
```

---

**🎉 Share Mode 實作完成！現在分享的是整個帳號的書籤集合，更簡單、更直觀！**
