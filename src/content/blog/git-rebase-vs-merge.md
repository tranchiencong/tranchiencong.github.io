---
title: "Git rebase vs merge: Khi nào dùng cái nào?"
description: "Hiểu rõ sự khác biệt giữa git rebase và git merge, và cách chọn đúng chiến lược cho từng tình huống."
pubDate: 2026-08-28
tags: ["git", "devops", "tips"]
---

Đây là một trong những câu hỏi phổ biến nhất với developer mới: **nên dùng `git merge` hay `git rebase`?**

## Tóm tắt nhanh

| | `merge` | `rebase` |
|---|---|---|
| Giữ nguyên history | ✅ | ❌ (viết lại) |
| History sạch | ❌ | ✅ |
| An toàn với shared branch | ✅ | ❌ |
| Conflict xử lý | Một lần | Từng commit |

## Git merge

`merge` tạo ra một **merge commit** để kết hợp hai nhánh:

```bash
git checkout main
git merge feature/my-feature
```

**History trông như thế này:**

```
*   Merge branch 'feature/my-feature'
|\
| * feat: thêm chức năng X
| * fix: sửa bug Y
* | chore: update deps
|/
* init commit
```

✅ **Ưu điểm:** History trung thực, không mất thông tin, an toàn với branches được chia sẻ.

❌ **Nhược điểm:** History lộn xộn khi có nhiều branches.

## Git rebase

`rebase` **di chuyển** toàn bộ feature branch lên đầu target branch, viết lại history:

```bash
git checkout feature/my-feature
git rebase main
```

**History trông như thế này:**

```
* feat: thêm chức năng X
* fix: sửa bug Y
* chore: update deps
* init commit
```

✅ **Ưu điểm:** History tuyến tính, sạch, dễ đọc.

❌ **Nhược điểm:** Viết lại commit hash — **KHÔNG** dùng với branches được chia sẻ (`main`, `develop`).

## Quy tắc vàng

> **Đừng bao giờ rebase shared branches.**

Nếu ai đó đang làm việc trên cùng branch với bạn và bạn rebase, họ sẽ gặp conflict địa ngục.

## Workflow thực tế

```bash
# 1. Tạo feature branch từ main
git checkout -b feature/login

# 2. Làm việc, commit

# 3. Trước khi merge, sync với main bằng rebase
git fetch origin
git rebase origin/main

# 4. Merge vào main (fast-forward hoặc squash)
git checkout main
git merge --squash feature/login
git commit -m "feat: implement login"
```

Cách này giữ được history sạch trên `main` nhưng không viết lại history trên shared branches.

## Kết luận

- **Dùng `merge`** khi làm việc với shared branches hoặc muốn giữ nguyên history đầy đủ
- **Dùng `rebase`** để sync local feature branch với main trước khi merge
- **Dùng `squash merge`** để gộp feature thành 1 commit gọn trên main
