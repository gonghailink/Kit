# 🔧 修正環境變數設定

## ❌ 問題：登入時出現 JSON 錯誤

**錯誤訊息：**
```
{"error":"Unexpected token 'I', \"Internal s\"... is not valid JSON"}
```

**原因：** `.dev.vars` 檔案缺少必要的環境變數

---

## ✅ 解決方案

### **步驟 1：更新 `.dev.vars` 檔案**

開啟 `/Users/meowlu/Documents/github/Personal-BookmarksRemix/app/.dev.vars` 檔案，確保包含以下變數：

```bash
# Supabase URL (不含 /auth/v1 等後綴)
SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co
VITE_SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co

# Supabase Anon/Public Key (從 Supabase Dashboard → Settings → API 取得)
SUPABASE_ANON_KEY=你的_anon_public_key
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=你的_anon_public_key

# Supabase Service Role Key (選填)
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### **步驟 2：找到 Supabase Anon Key**

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點選左側選單的 **Settings** → **API**
4. 複製 **Project URL** 和 **anon public** key

**重要：**
- `SUPABASE_ANON_KEY` 應該是 **anon public** key（以 `eyJ` 開頭的長字串）
- 不要使用 `service_role` key 作為 `SUPABASE_ANON_KEY`

### **步驟 3：完整的 `.dev.vars` 範例**

```bash
# Supabase 環境變數
SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co
VITE_SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（這裡是 anon public key）
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kkYDdEyDTzqzYj1qKFwmUA_bAbWpSCV

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（這裡是 service role key）
```

### **步驟 4：重新啟動開發伺服器**

```bash
# 停止當前的伺服器 (Ctrl+C)

# 重新啟動
cd /Users/meowlu/Documents/github/Personal-BookmarksRemix/app
npm run dev
```

---

## 🔍 程式碼修正說明

### **修改的檔案：** [app/lib/supabase.server.ts](app/app/lib/supabase.server.ts)

**修正內容：** 支援多種環境變數名稱的回退機制

```typescript
export function createSupabaseServerClient(request: Request, env: any) {
  const headers = new Headers();

  // 支援兩種變數名稱格式
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // 檢查環境變數是否存在
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    { /* ... */ }
  );

  return { supabase, headers };
}
```

**為什麼需要兩個變數？**
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`：給伺服器端使用
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`：給客戶端使用（Vite 會自動注入以 `VITE_` 開頭的變數）

---

## 📝 環境變數說明

### **SUPABASE_URL**
- Supabase 專案的 URL
- 格式：`https://[project-id].supabase.co`
- 取得位置：Supabase Dashboard → Settings → API → Project URL

### **SUPABASE_ANON_KEY**
- Supabase 的公開匿名金鑰
- 用於客戶端和伺服器端的一般操作
- 取得位置：Supabase Dashboard → Settings → API → **anon public** key
- ⚠️ **注意：** 這是 **anon** key，不是 service_role key

### **SUPABASE_SERVICE_ROLE_KEY**
- Supabase 的服務角色金鑰
- 擁有完整的資料庫權限，僅用於伺服器端
- 取得位置：Supabase Dashboard → Settings → API → **service_role** key
- ⚠️ **警告：** 絕對不要在客戶端使用或洩露此 key

---

## 🎯 快速修正指令

直接編輯 `.dev.vars` 檔案，加入缺少的變數：

```bash
# 編輯檔案
code /Users/meowlu/Documents/github/Personal-BookmarksRemix/app/.dev.vars

# 或使用 vim
vim /Users/meowlu/Documents/github/Personal-BookmarksRemix/app/.dev.vars
```

**必須加入的行：**
```bash
SUPABASE_URL=你的_supabase_url
SUPABASE_ANON_KEY=你的_anon_key
```

---

## ✅ 驗證修正

1. 重新啟動開發伺服器
2. 開啟 http://localhost:5177/login
3. 嘗試登入
4. ✅ 應該不再出現 JSON 錯誤

---

## 🚨 常見錯誤

### **錯誤 1：使用了 service_role key 作為 ANON_KEY**
```bash
# ❌ 錯誤
SUPABASE_ANON_KEY=eyJhbG...（這是 service_role key）

# ✅ 正確
SUPABASE_ANON_KEY=eyJhbG...（這是 anon public key）
```

### **錯誤 2：變數名稱拼寫錯誤**
```bash
# ❌ 錯誤
SUPABASE_ANON=...
SUPABASE_PUBLIC_KEY=...

# ✅ 正確
SUPABASE_ANON_KEY=...
```

### **錯誤 3：URL 包含多餘的路徑**
```bash
# ❌ 錯誤
SUPABASE_URL=https://xxx.supabase.co/auth/v1

# ✅ 正確
SUPABASE_URL=https://xxx.supabase.co
```

---

**🎉 修正完成後，登入功能應該就能正常運作了！**
