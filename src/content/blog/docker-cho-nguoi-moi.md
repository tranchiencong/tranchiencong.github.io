---
title: "Docker cho người mới bắt đầu: Container là gì và tại sao nên dùng?"
description: "Giải thích Docker từ đầu: container là gì, khác VM như thế nào, và cách bắt đầu trong 10 phút."
pubDate: 2026-08-25
tags: ["docker", "devops", "linux"]
---

Docker đã trở thành một công cụ **không thể thiếu** trong quy trình phát triển phần mềm hiện đại.
Nhưng nếu bạn chưa biết gì về Docker, bài này dành cho bạn.

## Container là gì?

Hãy tưởng tượng bạn viết một ứng dụng Node.js chạy hoàn hảo trên máy tính của mình.
Nhưng khi deploy lên server của đồng nghiệp hoặc lên production: **bị lỗi**.

Nguyên nhân thường là:
- Node.js version khác nhau
- Thư viện system khác nhau
- Environment variable bị thiếu
- OS khác nhau

**Container giải quyết vấn đề này** bằng cách đóng gói ứng dụng cùng với toàn bộ môi trường cần thiết vào một "hộp" tiêu chuẩn.

## Container vs Virtual Machine

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│   Virtual Machine (VM)      │    │   Container (Docker)        │
├─────────┬───────────────────┤    ├──────────────────────────── ┤
│  App A  │  App B            │    │ App A │ App B │ App C       │
├─────────┼───────────────────┤    ├───────┴───────┴─────────────┤
│  OS A   │  OS B             │    │   Container Runtime         │
├─────────┴───────────────────┤    ├─────────────────────────────┤
│       Hypervisor            │    │   Host OS (Linux)           │
├─────────────────────────────┤    ├─────────────────────────────┤
│       Hardware              │    │       Hardware              │
└─────────────────────────────┘    └─────────────────────────────┘
```

| | VM | Container |
|---|---|---|
| Startup time | Phút | Giây |
| Kích thước | GB | MB |
| Isolation | Hoàn toàn | Process-level |
| Overhead | Cao | Thấp |

## Cài Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh

# Kiểm tra
docker --version
# Docker version 26.x.x
```

## Lệnh Docker cơ bản

```bash
# Pull image từ Docker Hub
docker pull nginx

# Chạy container
docker run -d -p 8080:80 --name my-nginx nginx

# Xem containers đang chạy
docker ps

# Xem logs
docker logs my-nginx

# Dừng và xóa container
docker stop my-nginx && docker rm my-nginx
```

## Dockerfile

Dockerfile là file hướng dẫn để build Docker image của riêng bạn:

```dockerfile
# Dùng Node.js 20 làm base image
FROM node:20-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Copy package files và install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Lệnh chạy khi container khởi động
CMD ["node", "server.js"]
```

```bash
# Build image
docker build -t my-app:1.0 .

# Chạy
docker run -p 3000:3000 my-app:1.0
```

## Kết luận

Docker giúp bạn:
- ✅ **"Works on my machine"** → **"Works everywhere"**
- ✅ Deploy nhanh và nhất quán
- ✅ Isolated environments cho từng project
- ✅ Nền tảng để học Kubernetes sau này

Bài tiếp theo tôi sẽ viết về **Docker Compose** — cách chạy nhiều containers cùng lúc.
