# Test-app

PWA đơn giản để xem dữ liệu từ API `kemono.cr`, tối ưu bố cục gọn nhẹ cho iPhone.

## Chạy local

Vì app dùng service worker, hãy chạy qua HTTP server:

```bash
cd /home/runner/work/Test-app/Test-app
python -m http.server 8080
```

Mở `http://localhost:8080`.

## Chạy trên GitHub Pages

Repo đã có workflow `.github/workflows/deploy-pages.yml` để deploy Pages khi push lên nhánh `main`.

Sau khi merge vào `main`, truy cập:

- `https://lynxdarealest.github.io/Test-app/`

Trên iPhone: mở bằng Safari → `Share` → `Add to Home Screen`.

## Tính năng

- Giao diện rõ ràng, đơn giản, responsive.
- Nhập `service` và `creator ID` để tải bài viết từ `https://kemono.cr/api/v1/{service}/user/{creatorId}`.
- Có `manifest.webmanifest` + `service worker` để dùng dạng PWA.
- Có thể cài lên iPhone qua Safari (`Share` → `Add to Home Screen`).
