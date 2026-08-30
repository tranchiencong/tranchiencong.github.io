---
title: "Cách tạo SSH key và sử dụng nó với GitHub"
description: "Hướng dẫn chi tiết cách tạo SSH key, thêm vào GitHub và sử dụng SSH để clone, push code an toàn hơn khi làm việc với Git."
pubDate: 2026-06-30
tags: ["git", "github", "ssh", "security", "devops"]
---

Nếu bạn đang làm việc với Git và GitHub, việc sử dụng SSH key là một trong những best practice để cải thiện quy trình làm việc. Nó giúp bạn xác thực một cách an toàn, tiện lợi và nhanh chóng hơn rất nhiều so với việc phải nhập username/password (hoặc personal access token) mỗi lần push code.

Trong bài viết này, mình sẽ hướng dẫn các bạn từng bước tạo SSH Key và thiết lập nó với GitHub một cách dễ hiểu nhất!

---

## 1. SSH Key là gì?

Về cơ bản, SSH key là một cơ chế xác thực sử dụng một **cặp khóa (key pair)**:
- **Private key:** Được lưu trữ bảo mật trên máy tính của bạn (máy local) và tuyệt đối không chia sẻ cho bất kỳ ai.
- **Public key:** Được upload lên các server mà bạn muốn kết nối (như GitHub, GitLab, server Linux).

**Cách hoạt động:**
Khi bạn thực hiện một thao tác với GitHub (như `git push`), GitHub sẽ yêu cầu chứng thực bằng public key. Trình quản lý `ssh-agent` dưới máy local của bạn sẽ dùng private key để giải mã và xác nhận. Khi hai chìa khoá khớp nhau, hệ thống sẽ mở khóa mà không cần mật khẩu.

> **Mẹo nhỏ:** Bạn có thể bảo vệ private key bằng một *passphrase* (mật khẩu phụ) để tăng cường sự bảo mật trong trường hợp máy tính bị xâm nhập.

---

## 2. Hướng dẫn sinh SSH Key

### Bước 1: Kiểm tra xem máy bạn đã có SSH key nào chưa

Mở cửa sổ dòng lệnh (Terminal/Git Bash/PowerShell) và chạy lệnh:

```bash
ls -al ~/.ssh
```

Lệnh trên sẽ kiểm tra trong thư mục `.ssh` (nằm ở thư mục gốc của user bạn đang đăng nhập, ví dụ `C:\Users\username\.ssh` trên Windows hoặc `~/.ssh` trên Linux/macOS). Theo mặc định, các ssh key thường có dạng:

```text
id_rsa
id_rsa.pub
```

Trong đó, file có đuôi `.pub` là **public key**, file không có đuôi là **private key**. 
- Nếu bạn đã có cặp key này, bạn có thể bỏ qua **Bước 2** và chuyển thẳng sang **Bước 3**.
- Nếu chưa có, hãy tiếp tục.

### Bước 2: Sinh một SSH key mới

Chạy lệnh sau trên terminal:

```bash
ssh-keygen -t rsa -b 4096 -C "email_cua_ban@example.com"
```
*(Bạn cũng có thể dùng `ssh-keygen -t rsa` cho ngắn gọn, nhưng khuyến khích thêm độ dài bit 4096 và email để quản lý dễ hơn).*

Hệ thống sẽ hỏi bạn muốn lưu key ở đâu. Để tránh phiền phức, bạn nên nhấn **Enter** để chọn đường dẫn mặc định:

```text
Enter file in which to save the key (/root/.ssh/id_rsa): [Nhấn Enter]
```

Tiếp theo, hệ thống sẽ yêu cầu bạn nhập mật khẩu (passphrase) bảo vệ key:

```text
Enter passphrase (empty for no passphrase): [Nhập mật khẩu của bạn]
Enter same passphrase again: [Nhập lại mật khẩu]
```

> **Lưu ý:** Khi bạn gõ mật khẩu trên terminal, các ký tự sẽ **không** hiển thị (ngay cả dấu `*`). Đây là tính năng bảo mật bình thường, bạn cứ gõ xong và nhấn Enter. Bạn cũng có thể để trống (nhấn Enter 2 lần) nếu không muốn dùng mật khẩu phụ, nhưng việc đặt mật khẩu sẽ an toàn hơn.

Sau khi hoàn tất, bạn sẽ nhận được thông báo tạo thành công kèm theo fingerprint:

```text
Your identification has been saved in /home/congtc/.ssh/id_rsa.
Your public key has been saved in /home/congtc/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:UzqZZeMSpoaHrmviS6CEqtGfejnuj7008IUDRew congtc@congtc
```

### Bước 3: Thêm key của bạn vào ssh-agent

`ssh-agent` là một trình nền giúp quản lý các SSH key của bạn trong suốt phiên làm việc.

Đầu tiên, hãy đảm bảo rằng ssh-agent đang chạy:

```bash
eval "$(ssh-agent -s)"
# Agent pid 6980
```

Sau đó, thêm SSH private key của bạn vào ssh-agent:

```bash
ssh-add ~/.ssh/id_rsa
```

*(Lưu ý: Nếu ở Bước 2 bạn đã đặt tên file key khác, hãy thay `id_rsa` bằng tên tương ứng).*

### Bước 4: Thêm SSH Public Key lên GitHub

Bây giờ, bạn cần lấy nội dung của public key để dán lên GitHub. Dùng lệnh `cat` để hiển thị nội dung file:

```bash
cat ~/.ssh/id_rsa.pub
```

**Thao tác trên GitHub:**
1. Copy toàn bộ đoạn text vừa được in ra trên terminal.
2. Truy cập vào **[Settings > SSH and GPG keys](https://github.com/settings/profile)** trên GitHub của bạn.
3. Click vào nút **New SSH Key**.
4. Điền **Title** (ví dụ: `Laptop Work`, `PC Home` để dễ nhớ).
5. Dán đoạn nội dung vừa copy vào phần **Key**.
6. Click **Add SSH Key** để hoàn tất.

### Bước 5: Kiểm tra lại kết nối

Để xác nhận mọi thứ hoạt động trơn tru, hãy ping thử đến GitHub bằng SSH:

```bash
ssh -T git@github.com
```

Nếu đây là lần đầu tiên kết nối, bạn có thể nhận được một thông báo xác nhận độ tin cậy của host:

```text
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4fUvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Hãy gõ `yes` và nhấn Enter. Cuối cùng, nếu bạn thấy dòng thông báo chào mừng sau:

```text
Hi tranchiencongtd! You've successfully authenticated, but GitHub does not provide shell access.
```

OK, đến đây là bạn đã có thể sử dụng link SSH rồi.