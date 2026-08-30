---
title: "Git rebase vs merge: Khi nào dùng cái nào?"
description: "Hiểu rõ sự khác biệt giữa git rebase và git merge, và cách chọn đúng chiến lược cho từng tình huống."
pubDate: 2026-08-28
tags: ["git", "devops", "tips"]
---

Trong quá trình làm việc với Git, một trong những câu hỏi gây tranh cãi và phổ biến nhất đối với các lập trình viên (đặc biệt là người mới) là: **Nên sử dụng `git merge` hay `git rebase`?** 

Cả hai lệnh này đều phục vụ một mục đích chung là tích hợp các thay đổi từ nhánh này sang nhánh khác, nhưng cách chúng hoạt động bên dưới lại hoàn toàn khác nhau. Việc chọn đúng chiến lược không chỉ giúp quản lý source code tốt hơn mà còn tránh được những rắc rối không đáng có cho cả team.

---

## 1. Tóm tắt nhanh

Dưới đây là bảng so sánh nhanh giữa hai phương pháp:

| Tiêu chí | `git merge` | `git rebase` |
| :--- | :---: | :---: |
| **Giữ nguyên lịch sử (History)** | ✓ | ✕ (Viết lại) |
| **Lịch sử tuyến tính, sạch sẽ** | ✕ | ✓ |
| **An toàn với Shared Branch** | ✓ | ✕ |
| **Xử lý Conflict** | Một lần duy nhất | Từng commit một |

---

## 2. Git Merge: Lựa chọn an toàn

Lệnh `merge` hoạt động bằng cách tạo ra một **merge commit** mới để kết hợp lịch sử của hai nhánh lại với nhau.

### Cách sử dụng

```bash
git checkout main
git merge feature/my-feature
```

### Hình dung sự thay đổi (Commit History)

Giả sử cả 2 nhánh đều có commit mới. Khi gộp bằng `merge`, lịch sử sẽ rẽ nhánh và hợp nhất lại:

- **Nhánh `main`:** Đang có sẵn commit `chore: update deps`.
- **Nhánh `feature`:** Có các commit `feat: thêm chức năng X` và `fix: sửa bug Y`.
- **Sau khi Merge:** Git tạo thêm một **Merge commit** hoàn toàn mới ở trên cùng của `main` để nối 2 nhánh lại với nhau.

Lịch sử phát triển của nhánh `feature` vẫn được giữ nguyên vẹn và tồn tại song song với `main`.

### Đánh giá

- **Ưu điểm:** Lịch sử được giữ nguyên vẹn và trung thực. Không có thông tin nào bị mất đi. Cực kỳ an toàn khi làm việc trên các nhánh được chia sẻ (shared branches) với nhiều người.
- **Nhược điểm:** Nếu team có nhiều nhánh feature gộp vào liên tục, lịch sử commit sẽ trở nên rối rắm (thường được gọi là *spaghetti history*), gây khó khăn cho việc theo dõi log hoặc revert sau này.

---

## 3. Git Rebase: Lựa chọn cho sự hoàn hảo

Thay vì tạo ra một merge commit, `rebase` sẽ "bốc" toàn bộ các commit mới của nhánh hiện tại và đắp lên đầu của nhánh mục tiêu. Về bản chất, nó đang **viết lại lịch sử** (rewrite history).

### Cách sử dụng

```bash
git checkout feature/my-feature
git rebase main
```

### Hình dung sự thay đổi (Commit History)

Khi dùng `rebase`, sẽ không có "Merge commit" nào được tạo ra. Toàn bộ lịch sử rẽ nhánh bị viết lại thành một đường thẳng duy nhất (tính từ commit mới nhất xuống cũ nhất):

1. **`feat: thêm chức năng X`** *(của nhánh feature)*
2. **`fix: sửa bug Y`** *(của nhánh feature)*
3. **`chore: update deps`** *(của nhánh main)*
4. **`init commit`** *(commit gốc ban đầu)*

Về bản chất, Git đã tháo các commit của nhánh `feature` ra và đắp chúng lên ngay sau commit mới nhất của nhánh `main`.

### Đánh giá

- **Ưu điểm:** Lịch sử commit dạng tuyến tính, vô cùng sạch sẽ và dễ dàng theo dõi (đặc biệt hữu ích khi cần dùng `git bisect` để debug).
- **Nhược điểm:** Bị thay đổi commit hash. Xử lý conflict có thể mệt mỏi hơn vì bạn phải giải quyết ở từng commit một. **Tuyệt đối không** sử dụng với các nhánh dùng chung như `main` hay `develop`.

---

## 4. Quy tắc vàng trong Git

> **CẢNH BÁO:** Đừng bao giờ rebase các shared branches (nhánh dùng chung).

Nếu bạn rebase một nhánh mà người khác cũng đang làm việc trên đó, bạn sẽ thay đổi toàn bộ lịch sử mà họ đang có. Khi họ thử pull hoặc push, Git sẽ không hiểu chuyện gì đang xảy ra và tạo ra những conflict "địa ngục". Chỉ sử dụng rebase cho nhánh cá nhân (local branch) của riêng bạn.

---

## 5. Workflow thực tế được khuyên dùng

Một workflow rất phổ biến tại các công ty công nghệ lớn, giúp kết hợp được sức mạnh của cả hai lệnh là **Rebase local, Merge to main**:

```bash
# 1. Tạo feature branch mới từ main để làm việc
git checkout -b feature/login

# 2. Quá trình code và tạo các commit trên nhánh feature/login...

# 3. Trước khi merge, kéo code mới nhất và sync bằng rebase
git fetch origin
git rebase origin/main

# 4. Merge vào main (sử dụng fast-forward hoặc squash)
git checkout main
git merge --squash feature/login
git commit -m "feat: implement login function"
```

Cách làm này giúp bạn luôn có một nhánh `main` sạch sẽ, gọn gàng, đồng thời không vi phạm quy tắc viết lại lịch sử của các nhánh dùng chung.

---

## Tổng kết

- Dùng **`git merge`** khi bạn đang làm việc với shared branches hoặc khi bạn muốn bảo toàn lịch sử thực tế của project.
- Dùng **`git rebase`** trên nhánh local của bạn để cập nhật code mới nhất từ `main` trước khi tạo Pull Request.
- Cân nhắc dùng **`squash merge`** khi gộp code để biến toàn bộ các commit lẻ tẻ của feature thành một commit duy nhất rõ ràng trên nhánh `main`.
