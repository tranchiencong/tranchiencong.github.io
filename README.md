# tranchiencong.github.io

Blog cá nhân chia sẻ kiến thức về Công nghệ Thông tin.

🌐 **Live:** https://tranchiencong.github.io

## Tech Stack

| Layer | Technology |
|---|---|
| Static Site Generator | [Astro](https://astro.build) v7 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + @tailwindcss/typography |
| Content | Markdown / MDX |
| Syntax Highlighting | Shiki (built-in Astro) |
| Search | [Pagefind](https://pagefind.app) |
| Comments | [Giscus](https://giscus.app) (GitHub Discussions) |
| Analytics | Google Analytics 4 |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Cấu trúc dự án

```
src/
├── content/
│   └── blog/          # Bài viết (.md / .mdx)
├── layouts/
│   ├── BaseLayout.astro
│   └── BlogPost.astro
├── pages/
│   ├── index.astro    # Trang chủ
│   ├── about.astro
│   ├── search.astro
│   ├── blog/
│   │   ├── index.astro
│   │   └── [...slug].astro
│   ├── tags/
│   │   ├── index.astro
│   │   └── [tag].astro
│   └── rss.xml.js
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── PostCard.astro
│   ├── TagBadge.astro
│   └── Giscus.astro
└── styles/
    └── global.css
```

## Phát triển locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # build + pagefind index
npm run preview    # preview production build
```

## Viết bài mới

Tạo file `.md` hoặc `.mdx` trong `src/content/blog/`:

```markdown
---
title: "Tiêu đề bài viết"
description: "Mô tả ngắn về bài viết"
pubDate: 2026-01-01
tags: ["tag1", "tag2"]
draft: false
---

Nội dung bài viết...
```

## Cấu hình cần thiết sau khi clone

### 1. Google Analytics 4
Trong `src/layouts/BaseLayout.astro`, thay `G-XXXXXXXXXX` bằng Measurement ID thực của bạn.

### 2. Giscus Comments
1. Vào https://giscus.app
2. Điền repo `tranchiencong/tranchiencong.github.io`
3. Bật GitHub Discussions trong repo settings
4. Copy `data-repo-id` và `data-category-id` vào `src/components/Giscus.astro`

### 3. GitHub Pages
1. Push code lên repo `tranchiencong.github.io`
2. Vào Settings → Pages → Source: **GitHub Actions**
3. Push lên `main` sẽ tự động deploy

## Deploy

Deploy tự động qua GitHub Actions khi push lên `main`:

```
push to main → Build Astro → Pagefind index → Deploy to GitHub Pages
```
