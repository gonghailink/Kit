# 🔄 環境變數更新說明

## ✅ 已完成的更新

根據 Supabase 新版 API 和 Vite 環境變數規範，所有環境變數已更新。

---

## 📋 環境變數更改對照

### **舊版 (已棄用)**
```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### **新版 (Vite + Supabase 新版)**
```env
VITE_SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kkYDdEyDTzqzYj1qKFwmUA_bAbWpSCV
```

---

## 🔧 已更新的檔案

### 1. **配置檔案**
- ✅ [.dev.vars.example](app/.dev.vars.example) - 範例檔案
- ✅ [.dev.vars](app/.dev.vars) - 實際環境變數（已填入你的資料）
- ✅ [wrangler.toml](app/wrangler.toml) - Cloudflare 配置註解

### 2. **程式碼檔案**
- ✅ [app/lib/supabase.server.ts](app/app/lib/supabase.server.ts)
  ```typescript
  // 更新為
  env.VITE_SUPABASE_URL
  env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ```

- ✅ [app/lib/supabase.client.ts](app/app/lib/supabase.client.ts)
  ```typescript
  // 更新為
  window.ENV.VITE_SUPABASE_URL
  window.ENV.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ```

- ✅ [app/root.tsx](app/app/root.tsx)
  ```typescript
  // TypeScript 型別定義更新
  interface Window {
    ENV: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
    };
  }

  // Loader 更新
  return {
    ENV: {
      VITE_SUPABASE_URL: context.cloudflare.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: context.cloudflare.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    },
  };
  ```

---

## 🚀 現在可以立即使用

### **1. 本地開發**
`.dev.vars` 檔案已經建立並填入你的 Supabase 資訊：

```env
VITE_SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kkYDdEyDTzqzYj1qKFwmUA_bAbWpSCV
```

直接執行：
```bash
cd app
npm run dev
```

### **2. Cloudflare Pages 部署**
在 Cloudflare Dashboard → Pages → Settings → Environment variables 設定：

```
VITE_SUPABASE_URL=https://isgvbsdmbiqzvrknqooc.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kkYDdEyDTzqzYj1qKFwmUA_bAbWpSCV
```

---

## 📚 為什麼使用 VITE_ 前綴？

### **Vite 環境變數規則**
Vite 只會將以 `VITE_` 開頭的環境變數暴露給客戶端程式碼。這是一個安全機制：

- ✅ **VITE_SUPABASE_URL** - 會被暴露到瀏覽器
- ✅ **VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY** - 會被暴露到瀏覽器（公開金鑰，安全）
- ❌ **SECRET_KEY** - 不會被暴露（伺服器專用）

### **Supabase Publishable Key**
- 這是**公開金鑰**（Publishable Key），可以安全地暴露在客戶端
- 用於瀏覽器端的 Supabase 連接
- 受 Row Level Security (RLS) 保護
- 不同於舊版的 `ANON_KEY`，新版直接命名為 `PUBLISHABLE_DEFAULT_KEY`

---

## 🔐 安全性說明

### **可以公開的**
- ✅ `VITE_SUPABASE_URL` - Supabase 專案 URL
- ✅ `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - 公開金鑰

### **不應該公開的（如果需要）**
- ❌ Service Role Key - 伺服器端專用，有完整權限
- ❌ Database Password - 資料庫密碼
- ❌ JWT Secret - 加密金鑰

---

## 📖 相關文件

### **Supabase 文件**
- [新版 API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### **Vite 文件**
- [環境變數和模式](https://vitejs.dev/guide/env-and-mode.html)

### **Remix/React Router 文件**
- [環境變數](https://remix.run/docs/en/main/guides/envvars)

---

## ✅ 驗證環境變數

執行以下指令確認環境變數正確載入：

```bash
cd app
npm run dev
```

開啟瀏覽器控制台（F12）並執行：
```javascript
console.log(window.ENV);
// 應該會看到：
// {
//   VITE_SUPABASE_URL: "https://isgvbsdmbiqzvrknqooc.supabase.co",
//   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "sb_publishable_..."
// }
```

---

## 🎯 下一步

所有環境變數已更新完成，現在可以：

1. ✅ **啟動開發伺服器**
   ```bash
   cd app
   npm run dev
   ```

2. ✅ **測試登入功能**
   - 開啟 http://localhost:5173
   - 註冊/登入測試

3. ✅ **測試 CRUD 功能**
   - 建立 Tab
   - 建立 Folder
   - 新增 Bookmark

4. ✅ **準備部署**
   - 在 Cloudflare Dashboard 設定環境變數
   - 執行 `npm run deploy`

---

## 🆘 常見問題

### Q1: 為什麼不再使用 ANON_KEY？
**A**: Supabase 新版 API 將 `anon` key 重新命名為 `publishable_default` key，更清楚地表達這是可以公開的金鑰。

### Q2: VITE_ 前綴是必要的嗎？
**A**: 是的！Vite 只會將 `VITE_` 開頭的變數暴露給客戶端。這是安全機制，避免敏感資訊洩漏。

### Q3: 如何在伺服器端使用非 VITE_ 變數？
**A**: 在 `context.cloudflare.env` 中可以存取所有環境變數，不限於 VITE_ 開頭。

### Q4: 舊的 .dev.vars 需要刪除嗎？
**A**: 如果有舊的檔案，可以刪除或更新為新格式。現在的 `.dev.vars` 已經是新格式了。

---

**✨ 環境變數更新完成！現在可以開始使用了！**
