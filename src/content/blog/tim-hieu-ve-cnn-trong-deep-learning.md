---
title: "Tìm hiểu về Convolutional Neural Network (CNN) trong Deep Learning"
description: "Bài viết này sẽ giúp bạn hiểu rõ về Mạng nơ-ron tích chập (CNN), tại sao nó lại quan trọng và cách hoạt động của nó trong xử lý ảnh."
pubDate: "2026-08-31"
heroImage: "https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*XbuW8WuRrAY5pC4t-9DZAQ.jpg"
---

Trong lĩnh vực Trí tuệ nhân tạo và Học sâu, **Mạng nơ-ron tích chập (viết tắt là CNN)** là một trong những kiến trúc mạng học sâu phổ biến và mang tính đột phá nhất. Kể từ khi ra đời, kiến trúc này đã tạo ra một cuộc cách mạng thực sự, đặc biệt là trong các tác vụ liên quan đến xử lý dữ liệu hình ảnh và thị giác máy tính. 

Con người có thể nhìn vào một bức ảnh và ngay lập tức nhận ra một con chó, một chiếc ô tô hay một cái cây một cách vô thức. Tuy nhiên, đối với máy tính, việc hiểu được nội dung của một bức ảnh là một thách thức khổng lồ. Vậy mạng CNN là gì và nó đã lấy cảm hứng từ hệ thống thị giác của con người như thế nào? Tại sao chúng ta lại cần đến một kiến trúc đặc biệt như CNN thay vì chỉ sử dụng các mạng nơ-ron thông thường? Hãy cùng đi sâu vào thế giới của mạng nơ-ron tích chập thông qua bài viết này.

## Tại sao không sử dụng Mạng Neural thông thường?

Một trong những ứng dụng thú vị nhất của mạng neural là phân loại hình ảnh. Tuy nhiên, để làm được điều này, một mạng neural kết nối đầy đủ thông thường sẽ gặp phải hai vấn đề lớn:

**1. Yêu cầu quá lớn về sức mạnh tính toán:**
Máy tính không nhìn hình ảnh giống như con người. Chúng nhìn nhận hình ảnh dưới dạng một ma trận các con số, trong đó mỗi con số tương ứng với giá trị của một điểm ảnh. Ví dụ: Một bức ảnh màu kích thước 256x256x3 là một ma trận gồm 3 lớp tương ứng với ba màu Đỏ, Xanh lá, Xanh dương, trong đó mỗi lớp chứa 256x256 giá trị.

![Ma trận điểm ảnh](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*fKoD7p6dVWZJshERXigBSg.png)

Trong mạng nơ-ron thông thường, để máy tính có thể xử lý, chúng ta sẽ phải biến đổi toàn bộ ma trận dữ liệu hai chiều này thành một vector một chiều bằng cách duỗi thẳng các hàng nối tiếp nhau để làm dữ liệu đầu vào. Thử làm một phép tính nhỏ: Một bức ảnh màu kích thước 256x256 có tổng cộng $256 \times 256 \times 3 = 196,608$ giá trị đầu vào. Nếu mạng của chúng ta chỉ cần 1.000 đơn vị ẩn ở lớp ẩn đầu tiên, số lượng tham số trọng số cần huấn luyện sẽ lên tới khoảng 196 triệu (chưa tính đến các hệ số chênh lệch). 

Số lượng tham số khổng lồ này đòi hỏi tài nguyên bộ nhớ và sức mạnh tính toán cực kỳ lớn. Nếu chúng ta nâng độ phân giải lên ảnh Full HD hoặc 4K, con số này sẽ phình to ra tới hàng tỷ tham số. Hệ quả là mạng sẽ cực kỳ chậm chạp, tốn kém và gần như không thể huấn luyện được với phần cứng thông thường. Đồng thời, nguy cơ xảy ra hiện tượng học vẹt, tức là mô hình ghi nhớ máy móc thay vì học được quy luật chung, là rất cao vì mô hình có quá nhiều tham số so với lượng dữ liệu.

![Flatten hình ảnh](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*cWzJfSy13RXYdv8HQmzp4A.png)

**2. Mất đi các đặc trưng cục bộ không gian:**
Khi phân tích hình ảnh, bản chất của một vật thể được định hình bởi mối quan hệ không gian giữa các điểm ảnh liền kề. Ví dụ, khi muốn nhận diện một con mèo, hệ thống cần nhận diện được các đoạn thẳng liền kề nhau tạo thành đường viền, hoặc các điểm ảnh màu sắc tương tự hội tụ lại thành khuôn mặt hoặc đôi tai. 

Tuy nhiên, việc kéo dài ma trận hai chiều thành một vector một chiều đã vô tình phá vỡ toàn bộ cấu trúc không gian hình học này. Các điểm ảnh vốn nằm ngay trên và dưới nhau trong ảnh gốc giờ đây lại bị đẩy ra cách xa nhau hàng ngàn vị trí trong vector một chiều. Điều này làm mất đi vị trí tương đối của các điểm ảnh liền kề, khiến cho việc trích xuất các đặc trưng và hình khối trở nên hoàn toàn bất khả thi. Mạng sẽ chỉ nhìn thấy một chuỗi số vô nghĩa thay vì một bức ảnh có cấu trúc.

Để giải quyết triệt để vấn đề này, các nhà khoa học đã tạo ra một kỹ thuật gọi là **Tích chập (Convolution)**.

---

## Phép Tích chập (Convolution) hoạt động như thế nào?

Đối với ảnh màu, ma trận biểu diễn bức ảnh sẽ có độ sâu là 3, tương ứng với 3 kênh màu cơ bản: Đỏ, Xanh lá, Xanh dương.

![Ảnh màu RGB](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*54zmClILVMMQ8Igw02euTQ.png)

Phép toán tích chập sẽ nhận vào hai đầu vào:
1. Một ma trận ảnh với kích thước là $h \times w \times d$.
2. Một bộ lọc kích thước $f_h \times f_w \times d$.

Và kết quả sinh ra sẽ là một ma trận đầu ra có kích thước $(h - f_h + 1) \times (w - f_w + 1) \times 1$.

![Quá trình Tích chập](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*7cY06VeyivjEC77OZvvMdw.png)

Cách tính toán đầu ra của phép tích chập như sau:
1. "Đặt" ma trận bộ lọc lên góc trên cùng bên trái của ảnh đầu vào sao cho bao trùm một vùng có cùng kích thước.
2. Tính tích của từng phần tử tương ứng giữa bộ lọc và các điểm ảnh nằm trong vùng bị che phủ.
3. Cộng tổng tất cả các tích lại với nhau để tạo ra một giá trị duy nhất đại diện cho pixel đầu ra đầu tiên.

Ý nghĩa đằng sau phép tính này rất trực quan: Bộ lọc hoạt động giống như một chiếc kính lúp đang đi tìm kiếm một hình mẫu cụ thể. Nếu vùng ảnh gốc đang xét có đường nét hoặc màu sắc trùng khớp với bộ lọc, tổng các tích sẽ cho ra một giá trị rất lớn để báo hiệu sự xuất hiện của đặc trưng đó. Ngược lại, nếu vùng ảnh không có gì liên quan, kết quả sẽ xấp xỉ bằng 0.

![Tính toán tích chập](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*42ybc0lXQ6WIQqlfxy10_Q.png)

Tiếp theo, ta dịch chuyển bộ lọc sang phải một khoảng nhất định và lặp lại thao tác tính toán tương tự cho điểm tiếp theo.

![Dịch chuyển bộ lọc](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*R-v4W6T8uyFvE24BAaiUdg.png)

Ta cứ tiếp tục quét từ trái sang phải, từ trên xuống dưới cho đến khi bao phủ toàn bộ bức ảnh. Quá trình này tạo ra một bản đồ chứa các đặc trưng mới được trích xuất. 

Nhờ vào quá trình quét qua lại toàn bộ ảnh, hệ thống tự động trích xuất các đặc trưng quan trọng bất kể vị trí của chúng. Các bộ lọc ở những lớp đầu tiên thường tìm kiếm các đặc trưng cơ bản như các đường viền thẳng, góc cạnh, hay sự thay đổi màu sắc. Ở các lớp sâu hơn, chúng sẽ kết hợp các đường nét cơ bản này để nhận diện các họa tiết phức tạp hơn như hình tròn, bánh xe, hoặc toàn bộ khuôn mặt.

---

## Các thành phần chính trong CNN

Một mạng CNN hoàn chỉnh sẽ được cấu tạo bởi nhiều lớp học sâu kết hợp với nhau:

### 1. Lớp tích chập (Convolutional Layer)
Lớp này bao gồm rất nhiều bộ lọc. Mỗi bộ lọc đóng vai trò như một cảm biến để nhận diện một đặc trưng cụ thể. Đầu ra của lớp này thường được đưa qua một hàm kích hoạt (như hàm ReLU) để biến đổi các giá trị âm thành 0, giúp mạng học được các mối quan hệ phức tạp và hội tụ nhanh hơn trong quá trình huấn luyện.

![Convolutional Layer](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*VR5lji2I8T_yUKa2f5qxPA.png)

Sử dụng phép tích chập giải quyết triệt để hai vấn đề lớn đã nêu ở trên:
- **Giảm số lượng tham số cần thiết:** Thay vì học trọng số cho mọi điểm ảnh như mạng thông thường, ta chỉ cần học các trọng số của bộ lọc. Trọng số này cũng được dùng chung trên toàn bộ bức ảnh giúp tối ưu chi phí tính toán.
- **Bảo toàn tính cục bộ:** Bằng việc sử dụng cửa sổ quét trượt, các điểm ảnh gần nhau vẫn giữ được mối quan hệ không gian chặt chẽ.

### 2. Đệm thêm viền (Padding) và Bước trượt (Strides)
Trong quá trình tích chập, ta có thể điều chỉnh cách quét của bộ lọc thông qua hai thông số quan trọng:
- **Đệm thêm phần viền (Padding):** Khi sử dụng bộ lọc quét qua ảnh, các điểm ảnh ở rìa mép thường ít được quét qua hơn so với các điểm ở trung tâm, dẫn đến mất mát thông tin viền. Hơn nữa, kích thước ảnh đầu ra sẽ bị thu hẹp dần đi sau mỗi lớp. Để giải quyết điều này, ta chèn thêm một lớp viền chứa toàn các giá trị 0 xung quanh ảnh gốc trước khi quét. Cách này giúp bảo toàn được thông tin ở rìa ảnh và giữ cho kích thước đầu ra luôn bằng với kích thước ban đầu mà không lo bị thu hẹp.

![Đệm thêm phần viền](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*ORfMLOC5qv53qxKt7uSbng.png)

- **Bước trượt (Strides):** Là số điểm ảnh mà bộ lọc dịch chuyển sau mỗi lần tính toán. Thay vì dịch chuyển từng điểm ảnh một, ta có thể cài đặt bước trượt bằng 2 hoặc 3. Bước trượt càng lớn thì kích thước của bản đồ đặc trưng đầu ra sẽ càng bị thu nhỏ mạnh. Việc này có ích khi ta muốn nhanh chóng giảm bớt dung lượng dữ liệu ở những vùng ảnh có màu sắc quá đồng nhất mà không cần quét quá kỹ.

![Bước trượt của bộ lọc](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*eOsGoosprg2wh0fOfm_Zqg.png)

### 3. Lớp gộp (Pooling Layer)
Sau khi trích xuất được các đặc trưng, Lớp gộp được sử dụng để giảm kích thước theo chiều rộng và chiều cao của dữ liệu, từ đó giảm đáng kể số lượng tham số và khối lượng tính toán, đồng thời giúp mô hình tổng quát hóa tốt hơn, tránh việc ghi nhớ máy móc. 

Phương pháp phổ biến và hiệu quả nhất là **Lấy giá trị lớn nhất (Max Pooling)**, trong đó mạng chỉ chọn ra và giữ lại giá trị cao nhất trong mỗi vùng (ví dụ vùng $2 \times 2$) mà bộ lọc quét qua. Tại sao lại lấy giá trị lớn nhất? Vì giá trị càng lớn chứng tỏ đặc trưng tại vùng đó càng nổi bật (ví dụ một cạnh sắc nét). Việc lấy giá trị lớn nhất đảm bảo rằng dù kích thước ảnh bị thu nhỏ lại, thông tin về sự tồn tại của các đặc trưng quan trọng vẫn được lưu giữ chắc chắn. Một phương pháp khác ít dùng hơn là Lấy giá trị trung bình (Average Pooling).

![Lớp gộp](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*iv7fsvgvJ5eBv--iabxqkA.png)

### 4. Lớp kết nối đầy đủ (Fully Connected Layer)
Có thể xem toàn bộ các Lớp tích chập và Lớp gộp trước đó đóng vai trò là Bộ trích xuất đặc trưng vô cùng ưu việt. Sau khi đã trích xuất được những thông tin cốt lõi nhất dưới dạng ma trận dữ liệu đã bị thu nhỏ, ma trận này sẽ được duỗi thẳng thành một vector một chiều.

Vector này sẽ được truyền vào các lớp mạng nơ-ron kết nối đầy đủ thông thường để làm nhiệm vụ Bộ phân loại cuối cùng. Lớp này sẽ đánh giá và học cách kết hợp các đặc điểm tầm cao (ví dụ: "có bánh xe", "có cửa kính") lại với nhau. Cuối cùng, mạng sẽ đưa ra một bảng phân bố xác suất để kết luận: "Có 90% khả năng đây là ô tô, 8% là xe tải, và 2% là xe máy".

---

## Tổng kết về kiến trúc CNN

Để dễ hình dung, quá trình xử lý của CNN sẽ diễn ra như sau:

![CNN Recap](https://s3.ap-southeast-1.amazonaws.com/datawow/uploader/blogs/1*XbuW8WuRrAY5pC4t-9DZAQ.jpg)

1. Cung cấp dữ liệu ảnh đầu vào.
2. Dữ liệu sẽ lần lượt đi qua nhiều tổ hợp các Lớp Tích chập (Convolutional Layer) kết hợp với Lớp Gộp (Pooling Layer) để liên tục trích xuất từ các đặc trưng cơ bản như cạnh hay dải màu đến các khối phức tạp hơn như bộ phận vật thể.
3. Duỗi thẳng dữ liệu thành dạng vector một chiều và đưa qua Lớp kết nối đầy đủ (Fully Connected Layer).
4. Đưa ra kết quả phân loại phân lớp cuối cùng.

## Ứng dụng thực tiễn
- **Phân loại hình ảnh:** Nhận diện khuôn mặt, phân loại các đồ vật, động vật.
- **Phát hiện đối tượng trong khung hình:** Đây là công nghệ cốt lõi trong hệ thống xe tự lái để nhận diện các biển báo, người đi bộ và các phương tiện tham gia giao thông.
- **Xử lý tín hiệu âm thanh:** Mặc dù được thiết kế ban đầu để xử lý ảnh, cấu trúc tích chập vẫn tỏ ra rất hiệu quả trong việc xử lý tín hiệu âm thanh liên tục.
- **Phân tích hình ảnh y tế:** Hỗ trợ bác sĩ phân tích các hình ảnh X-quang, MRI để phát hiện các tế bào ác tính hoặc các dấu hiệu bệnh lý bất thường.

Hi vọng qua bài viết này, bạn đã có một cái nhìn trực quan và dễ hiểu hơn về Convolutional Neural Network (CNN).

*Tài liệu tham khảo:*
- [MathWorks - What Is a Convolutional Neural Network?](https://www.mathworks.com/discovery/convolutional-neural-network.html)
- [DataWow - Interns Explain CNN](https://www.datawow.io/blogs/interns-explain-cnn-8a669d053f8b)
- [Ujjwal Karn - Intuitive Explanation of ConvNets](https://ujjwalkarn.me/2016/08/11/intuitive-explanation-convnets/)
