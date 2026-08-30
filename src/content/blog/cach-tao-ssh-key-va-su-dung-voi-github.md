---
title: "Cách tạo SSH key và sử dụng nó với GitHub"
description: "Hướng dẫn chi tiết cách tạo SSH key, thêm vào GitHub và sử dụng SSH để clone, push code an toàn hơn khi làm việc với Git."
pubDate: 2026-08-30
tags: ["git", "github", "ssh", "security", "devops"]
---

Hôm nay mình sẽ hướng dẫn các bạn tạo SSH Key cho Github!   

## SSH là gì? 

Bạn sẽ có 2 key: public key và private key. Bạn sẽ gửi public key của mình cho git server của bạn. Public key có thể được đặt ở bất kỳ server nào ( ở đây là github ). Sau đó mở khóa bằng cách kết nối với máy client đã có private key. Khi cả hai đã khớp nhau, hệ thống sẽ mở khóa mà không cần mật khẩu. Ta còn có thể bảo vệ private key bằng một passphrase để tăng cường sự bảo mật. 

Xong ssh-agent sẽ làm tất cả những việc còn lại cho bạn. Mỗi lần bạn push, ssh-agent sẽ tự gửi kèm các thông tin chứng thực đi, github sẽ nhận diện ra bạn, và bạn không cần phải nhập mật khẩu nữa. 

## Sinh SSH Key 

### Bước 1: Kiểm tra xem máy bạn có ssh key nào chưa 

Mở cửa sổ dòng lệnh (terminal) và chạy lệnh:  
```bash
$ ls -al ~/.ssh
```

Lệnh trên sẽ kiểm tra trong thư mục .ssh (nằm ở thư mục gốc của user bạn đang đăng nhập vào máy, Vd trên Ubuntu: /home/.ssh) có ssh key nào chưa, mặc định, các ssh key thường sẽ có dạng:  
```bash
id_rsa
id_rsa.pub
```

public key sẽ có đuôi .pub (id_rsa.pub), private key thì không có đuôi (id_rsa) Nếu có một cặp ssh key nào trong thư mục này (giả sử là id_rsa và id_rsa.pub), bạn có thể bỏ qua Bước 2 và chuyển thẳng sang Bước 3. 

### Bước 2: Sinh một SSH key mới 

Chạy lệnh sau trên terminal:  
```bash
ssh-keygen -t rsa -b 4096 -C "email_cua_ban@example.com" 
```

Để ngắn gọn hơn bạn có thể sử dụng lệnh này:  
```bash
ssh-keygen -t rsa
```

Để tránh phiền phức sau này, mình khuyên bạn nên để các cài đặt ở mặc định, như lần này, ssh-agent hỏi bạn muốn lưu key của mình ở đâu thì bạn cứ thế mà Enter thôi:  
```bash
Enter file in which to save the key (/root/.ssh/id_rsa): [Press enter]
```

Nếu bạn muốn tạo một tên ssh-key khác thì hãy nhập đường dẫn cần lưu vào đây (Vd: /home/.ssh/id_rsa) 

Tiếp đến thì nhập mật khẩu cho key của bạn:  
```bash
Enter file in which to save the key (/home/congtc/.ssh/id_rsa): [Type a passphrase]# Enter same passphrase again: [Type passphrase again]
```

Lưu ý: mật khẩu khi bạn gõ vào nó sẽ không hiển thị mấy dấu *** như bình thường, nhưng bạn cứ gõ xong rồi Enter thôi. Thêm nữa, bạn nên chọn một mật khẩu ĐỦ MẠNH cho mình. Bạn có thể để trống và Enter để tiếp tục. Nếu có mật khẩu thì sẽ bảo mật hơn. 

Sau khi nhập mật khẩu, bạn sẽ nhận được thông báo về việc mật khẩu đã lưu vào địa chỉ lúc nãy bạn chỉ định:  
```bash
Your identification has been saved in /home/congtc/.ssh/id_rs.
#Your public key has been saved in /home/congtc/.ssh/id_rsa.pub
#The key fingerprint is:
#SHA256:UzqZZeMSpoaHrmviS6CEqtGfejnuj7008IUDRew congtc@congtc
```

### Bước 3: Thêm key của bạn vào ssh-agent 

ssh-agent là trình quản lý ssh key của bạn, công việc của nó thì nãy mình có nói qua ở trên rồi đó. 

Đảm bảo rằng ssh-agent đã được kích hoạt bằng lệnh:  
```bash
eval "$(ssh-agent -s)"
# Agent pid 6980
```

Add ssh key của bạn vào ssh-agent:  
```bash
ssh-add ~/.ssh/id_rsa
```

Lưu ý: id_rsa chính là private key của bạn, nếu ở bước 2, bạn có key khác thì thay tên key tương ứng vào. 

### Bước 4: Thêm ssh public key vào tài khoản trên server của bạn (github…) 

Bạn có thể dùng lệnh sau để show nội dung file ssh-key và tiến hành copy nó.  
```bash
cat ~/.ssh/id_rsa.pub
```

Đối với Github:
1. Truy cập vào địa chỉ: https://github.com/settings/profile
2. Click chọn SSH and GPG keys > New SSH Key 
3. Phần Tittle chỉ là để đặt tên thôi nên bạn muốn để là gì cũng được. Phần Key hãy nhập nội dung mà bạn copy hồi nãy nào 
4. Sau đó click nút Add SSH Key là xong thôi 

### Bước 5: Kiếm tra lại kết nối  
```bash
ssh -T git@github.com
```

Có thể bạn sẽ nhận được thông báo về việc thêm host github vào danh sách tin cậy:  
```bash
The authenticity of host 'github.com (20.205.243.166)' can't be established
# Are you sure you want to continue connecting (yes/no)?
```

Bạn chỉ việc gõ yes vào terminal rồi Enter là được. Và bạn sẽ nhận được dòng thông báo thành công:  
```bash
Hi tranchiencongtd! You've successfully authenticated, but GitHub does not provide shell access.
```

OK, đến đây là bạn đã có thể sử dụng link SSH rồi.