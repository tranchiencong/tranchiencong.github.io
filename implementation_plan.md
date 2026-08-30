# Tech Blog — Kế hoạch lựa chọn công nghệ

Xây dựng một blog cá nhân chia sẻ kiến thức IT, **không cần server/domain riêng**, giao diện minimal, với GitHub Pages + GitHub Actions làm nền tảng hosting & CI/CD.

---

## 🏗️ Static Site Generator (SSG)

### ✅ Lựa chọn đề xuất: **Astro**

| Tiêu chí | Astro | Hugo | Jekyll | Next.js |
|---|---|---|---|---|
| Performance | ⭐⭐⭐⭐⭐ (Zero JS by default) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| GitHub Pages native | ✅ | ✅ | ✅ (native) | ⚠️ (cần config) |
| Hỗ trợ Markdown/MDX | ✅ MDX natively | ✅ | ✅ | ✅ MDX |
| Syntax Highlighting | ✅ Shiki (built-in) | ✅ | ✅ | cần plugin |
| Ecosystem / plugins | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Độ phức tạp | Thấp-Vừa | Thấp | Thấp | Cao |
| RSS / Sitemap | ✅ built-in | ✅ | plugin | plugin |

**Lý do chọn Astro:**
- Output là **pure HTML/CSS** → load cực nhanh, SEO tốt
- Viết bài bằng **Markdown / MDX** (có thể nhúng component vào bài)
- **Shiki** syntax highlighting cực đẹp cho code IT blog
- Có sẵn `@astrojs/sitemap`, RSS feed integration
- Dễ deploy lên GitHub Pages với official GitHub Actions adapter

---

## ✍️ Content Format

### ✅ **Markdown + MDX**

- Bài viết thông thường → `.md`
- Bài cần nhúng chart, demo interactive → `.mdx`
- **Frontmatter** để quản lý metadata: `title`, `description`, `tags`, `pubDate`, `draft`

---

## 🎨 Styling

### ✅ **Tailwind CSS v4 + Typography Plugin**

| Option | Lý do |
|---|---|
| ✅ Tailwind CSS v4 | CSS-first config, nhanh hơn v3, tích hợp tốt với Astro |
| ❌ Bootstrap | Quá opinionated, khó minimal |
| ❌ Vanilla CSS | Cần viết nhiều hơn |

**Design system:**
- **Tailwind CSS v4** — CSS-first configuration (không cần `tailwind.config.js`)
- `@tailwindcss/typography` plugin → prose classes cho bài viết Markdown cực đẹp
- Google Fonts: **Inter** (body) + **JetBrains Mono** (code)
- **Monochrome palette** — đen/trắng thuần, không accent color
- Dark/Light mode via Tailwind `dark:` variant + `localStorage` toggle
- Responsive với Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)

---

## 🌑 Dark Mode

### ✅ **CSS `prefers-color-scheme` + `data-theme` attribute toggle**

- Mặc định theo system preference
- Toggle button lưu vào `localStorage`

---

## 🔍 Search

### ✅ **Pagefind** *(static search, zero server)*

- Tự build search index lúc CI/CD
- Không cần backend, không tốn tiền
- Tích hợp trực tiếp vào Astro

---

## 💬 Comments

### ✅ **Giscus** *(GitHub Discussions as comments)*

- Không cần server, dùng GitHub Discussions API
- Tự động login bằng GitHub
- Phù hợp với audience IT

---

## 📊 Analytics

### ✅ **Umami** (self-hosted) hoặc **Plausible Cloud** (free tier)

> Nếu muốn đơn giản nhất: **Google Analytics 4** (free, không cần server)

---

## 📡 RSS & SEO

- `@astrojs/rss` → tự động generate RSS feed
- `@astrojs/sitemap` → sitemap.xml
- Open Graph meta tags cho social sharing
- Canonical URLs

---

## 🚀 Hosting & CI/CD

### GitHub Pages + GitHub Actions

```
Workflow:
  push to main
    → GitHub Actions trigger
    → npm install & astro build
    → Deploy /dist to gh-pages branch
    → GitHub Pages serve
```

**GitHub Actions workflow:**
- Dùng `withastro/action` (official Astro deploy action)
- Build time ~30-60s
- Free với GitHub Free plan (2000 min/month)

**Domain:**
- Free: `username.github.io/blog-repo`
- Custom domain miễn phí: Thêm CNAME file + cấu hình DNS (nếu có domain sau)

---

## 📁 Cấu trúc thư mục (dự kiến)

```
blog/
├── src/
│   ├── content/
│   │   └── blog/          # Các file .md/.mdx bài viết
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── BlogPost.astro
│   ├── pages/
│   │   ├── index.astro    # Trang chủ
│   │   ├── blog/
│   │   │   └── [...slug].astro
│   │   ├── tags/
│   │   └── rss.xml.js
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ThemeToggle.astro
│   │   └── SearchBar.astro
│   └── styles/
│       └── global.css
├── public/
│   └── favicon.svg
├── astro.config.mjs
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## 📦 Tech Stack tóm tắt

| Layer | Technology | Lý do |
|---|---|---|
| **SSG** | Astro | Nhanh, MDX, Shiki, GitHub Pages ready |
| **Content** | Markdown / MDX | Đơn giản, portable |
| **Styling** | Tailwind CSS v4 + @tailwindcss/typography | Utility-first, prose classes cho Markdown |
| **Font** | Inter + JetBrains Mono | Modern, developer-friendly |
| **Syntax Highlight** | Shiki (via Astro) | Đẹp, nhiều theme |
| **Search** | Pagefind | Static, no server |
| **Comments** | Giscus | GitHub Discussions, free |
| **Analytics** | Google Analytics 4 | Free, dễ setup |
| **RSS** | @astrojs/rss | Built-in |
| **Sitemap** | @astrojs/sitemap | Built-in |
| **Hosting** | GitHub Pages | Free |
| **CI/CD** | GitHub Actions | Free, automated |
| **Dark Mode** | CSS + localStorage | Native, no library |

---

## ✅ Các lựa chọn đã xác nhận

| Câu hỏi | Quyết định |
|---|---|
| **URL / Repo** | `username.github.io` (repo tên `<username>.github.io`) |
| **Comments** | ✅ Giscus (GitHub Discussions) |
| **Analytics** | ✅ Google Analytics 4 |
| **Search** | ✅ Pagefind (static search) |
| **Accent Color** | Monochrome — đen/trắng thuần (minimal nhất) |
| **Tailwind** | v4 (CSS-first, 2025) |

---

## ✅ Verification Plan

Sau khi code, sẽ kiểm tra:
- [ ] Build thành công `astro build`
- [ ] GitHub Actions deploy thành công
- [ ] Bài viết hiển thị đúng với code highlighting
- [ ] Dark/Light mode hoạt động
- [ ] RSS feed hợp lệ
- [ ] Mobile responsive
- [ ] Lighthouse score ≥ 90 (Performance, SEO, Accessibility)
