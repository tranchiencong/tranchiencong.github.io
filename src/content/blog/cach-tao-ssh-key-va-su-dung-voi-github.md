---
title: "Cách tạo SSH key và sử dụng nó với GitHub"
description: "Hướng dẫn chi tiết cách tạo SSH key, thêm vào GitHub và sử dụng SSH để clone, push code an toàn hơn khi làm việc với Git."
pubDate: 2026-08-30
tags: ["git", "github", "ssh", "security", "devops"]
---

Nếu bạn đang làm việc với Git và GitHub, việc sử dụng SSH key là một cách tốt hơn rất nhiều so với nhập username/password mỗi lần push code. SSH giúp bạn xác thực một cách an toàn, tiện lợi và nhanh hơn.

Trong bài viết này, mình sẽ hướng dẫn bạn cách:

- tạo SSH key
- thêm public key vào GitHub
- test kết nối
- dùng SSH thay vì HTTPS để clone và push code

## 1. SSH key là gì?

SSH key là một cặp khóa:

- private key: lưu ở máy local, không chia sẻ
- public key: upload lên GitHub

Khi bạn dùng GitHub qua SSH, GitHub sẽ kiểm tra public key của bạn và xác thực với private key ở máy local. Đây là cách xác thực phổ biến trong môi trường lập trình, đặc biệt là khi làm việc với nhiều máy hoặc nhiều repo.

---

## 2. Tạo SSH key

### Trên Windows

Mở Git Bash hoặc PowerShell rồi chạy:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"