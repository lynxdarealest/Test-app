# Test-app

PWA đơn giản để xem dữ liệu từ API `kemono.cr`, tối ưu bố cục gọn nhẹ cho iPhone.

## Chạy local

Vì app dùng service worker, hãy chạy qua HTTP server:

```bash
cd /home/runner/work/Test-app/Test-app
python -m http.server 8080
```

Mở `http://localhost:8080`.

## Tính năng

- Giao diện rõ ràng, đơn giản, responsive.
- Nhập `service` và `creator ID` để tải bài viết từ `https://kemono.cr/api/v1/{service}/user/{creatorId}`.
- Có `manifest.webmanifest` + `service worker` để dùng dạng PWA.
- Có thể cài lên iPhone qua Safari (`Share` → `Add to Home Screen`).
