# Blog Post Formatting Rules

Khi tạo mới hoặc định dạng lại các bài viết blog (.md, .mdx) trong thư mục `src/content/blog/`, bạn (AI) PHẢI luôn tuân thủ các quy tắc trình bày chuyên nghiệp sau:

1. **Cấu trúc & Phân cấp (Hierarchy):**
   - Phải chia các phần lớn của bài viết rõ ràng, cách nhau bởi thẻ horizontal rule (`---`).
   - Sử dụng thẻ Heading 2 (`##`) có đánh số thứ tự cho các luận điểm chính (vd: `## 1. Tóm tắt nhanh`).
   - Sử dụng thẻ Heading 3 (`###`) cho các mục con chi tiết bên trong.

2. **Typography & Định dạng (Formatting):**
   - Đóng khung inline-code bằng dấu backtick (`) cho các thuật ngữ kỹ thuật, tên biến, tên command (vd: `merge`, `rebase`).
   - In đậm (`**text**`) các từ khoá, tiêu đề bảng hoặc các ý quan trọng cần nhấn mạnh.
   - Khi so sánh hay tạo danh sách ưu/nhược điểm, tuyệt đối **không** dùng các icon emoji (như ✅, ❌). Hãy thay thế bằng danh sách gạch đầu dòng (`-`) kết hợp với in đậm (ví dụ: `- **Ưu điểm:**`). Trong các bảng so sánh, sử dụng ký hiệu text chuẩn (như `✓` và `✕`).

3. **Code Blocks & Output:**
   - Các đoạn mã hoặc câu lệnh terminal phải được đặt trong code block có ngôn ngữ phù hợp (vd: `bash`, `javascript`, `python`).
   - Những đoạn hiển thị output của terminal, cấu trúc thư mục, hoặc sơ đồ lịch sử git (ASCII art) phải được đặt trong code block với ngôn ngữ là `text` (vd: ````text ````) thay vì để trống.
   - Thêm chú thích hoặc đánh số (nếu cần) vào các comment trong code block để hướng dẫn từng bước.

4. **Callouts (Blockquotes):**
   - Sử dụng blockquote chuẩn của Markdown kết hợp in đậm để tạo các ghi chú, mẹo hoặc cảnh báo nổi bật.
   - Ví dụ: `> **Lưu ý:** Nội dung...` hoặc `> **CẢNH BÁO:** Nội dung...`.

5. **Văn phong:**
   - Viết mở bài trực tiếp, mạch lạc, dẫn dắt tự nhiên vào vấn đề.
   - Luôn có phần `## Tổng kết` (hoặc Kết luận) ở cuối bài viết để đúc kết lại các ý chính một cách ngắn gọn, súc tích (thường sử dụng bullet points).
   - Ngôn từ mang tính chia sẻ kinh nghiệm, chuyên nghiệp, giống như bài đăng trên các nền tảng kỹ thuật uy tín (Viblo, Dev.to, Medium).
