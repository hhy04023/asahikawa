# 旭川地點清單

這是一個不需要建置工具的靜態網站，入口檔案是 `index.html`。

## 地點資料

地點資料集中在 `index.html` 的 `places` 陣列，按餐廳、景點、滑雪、娛樂、購物、溫泉休閒、住宿與交通分類。雪具租借店歸在「滑雪」。Google Maps 收藏清單「ASAHIKAWA」是資料來源之一；尚未核實的 MapCode 會標示「MapCode 尚未整理」。使用者可在瀏覽器中儲存收藏、加入標籤，或新增自訂地點。

來源清單：[ASAHIKAWA（Google Maps）](https://maps.app.goo.gl/QFkyHzmQSeDnJdwj7)

## 使用 GitHub Pages 發布

1. 解壓縮 `ASAHIKAWA-site.zip`，將 `index.html` 和 `assets/` 放在 GitHub 儲存庫根目錄，保留 `assets/` 內的目錄結構。
2. 在儲存庫開啟 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**。
4. 選擇 `main` 分支與 `/(root)` 資料夾，按 **Save**。
5. 等待 GitHub Pages 顯示網站網址。

GitHub Pages 網站可被公開瀏覽。發布前請確認頁面上的民宿與旅遊地點資料適合公開。

## 本機預覽

建議用本機網站伺服器預覽，確保瀏覽器可載入地圖元件。在此資料夾執行：

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

接著在瀏覽器開啟 `http://127.0.0.1:8000/`。結束預覽時，在伺服器視窗按 `Ctrl+C`。
