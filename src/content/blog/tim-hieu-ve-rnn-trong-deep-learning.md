---
title: "Tìm hiểu về Recurrent Neural Networks (RNN) trong Deep Learning"
description: "Bài viết này giúp bạn hiểu chi tiết về Mạng nơ-ron hồi quy (RNN), cách chúng làm chủ các dạng dữ liệu tuần tự (như văn bản, âm thanh) và khái niệm 'trí nhớ' trong Học sâu."
pubDate: "2026-09-20"
heroImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1200&auto=format&fit=crop"
---

Nếu như Mạng nơ-ron tích chập (CNN) là "vị vua" trong thế giới xử lý hình ảnh (bạn có thể đọc lại bài viết [Tìm hiểu về Convolutional Neural Network](/blog/tim-hieu-ve-cnn-trong-deep-learning/)), thì khi đối mặt với dữ liệu văn bản, giọng nói, hay dự báo chuỗi thời gian, kiến trúc CNN lại tỏ ra lúng túng.

Lý do là vì một bức ảnh có thể được xem xét toàn bộ trong cùng một lúc, nhưng một câu văn hay một bản nhạc thì phải được "đọc" từ trái sang phải, từ nốt này sang nốt khác. Nghĩa là thứ tự của dữ liệu đóng vai trò cực kỳ quan trọng. Để giải bài toán này, **Mạng nơ-ron hồi quy (RNN)** đã ra đời. Bài viết này sẽ phân tích chi tiết cách RNN hoạt động, các biến thể kiến trúc và cách nó giải quyết giới hạn của các mạng nơ-ron truyền thống.

## 1. Dữ liệu tuần tự là gì?

Dữ liệu tuần tự là loại dữ liệu mà ở đó, các phần tử có tính thứ tự và phụ thuộc lẫn nhau. Nếu bạn xáo trộn thứ tự, ý nghĩa của dữ liệu sẽ hoàn toàn thay đổi hoặc trở nên vô nghĩa.
- **Văn bản:** "Tôi ăn cơm" khác hoàn toàn với "Cơm ăn tôi". Ngữ nghĩa của từ "cơm" phụ thuộc rất lớn vào chữ "Tôi" và chữ "ăn" đi trước nó.
- **Chuỗi thời gian:** Giá cổ phiếu hôm nay phụ thuộc một phần vào giá của những ngày trước đó. Việc dự đoán thời tiết ngày mai đòi hỏi ta phải biết dữ liệu nhiệt độ của 7 ngày vừa qua theo đúng trình tự.
- **Âm thanh, Video:** Các khung hình/tín hiệu âm thanh liên tiếp nhau tạo thành một video/bản nhạc hoàn chỉnh. Nếu xáo trộn các khung hình, video sẽ mất đi tính chuyển động.

Các mạng Feed-forward Neural Networks thông thường xử lý từng dữ liệu đầu vào một cách hoàn toàn độc lập. Nó không có khái niệm về "thời gian" hay "thứ tự", và không thể nhớ được từ trước đó khi đang xử lý từ hiện tại. Nếu bạn đưa cho mạng nơ-ron thẳng một câu văn dài 10 từ, nó sẽ coi 10 từ này là 10 cá thể độc lập không liên quan gì đến nhau.

## 2. Giải pháp của RNN: Trí nhớ 

Sự khác biệt cốt lõi và làm nên sức mạnh của RNN nằm ở **Hidden State** — đóng vai trò như một bộ nhớ ngắn hạn, lưu trữ thông tin của quá khứ.

Thay vì chỉ có một hướng đi từ Input đến Output, RNN có một vòng lặp phản hồi bên trong nó. Vòng lặp này cho phép thông tin được lưu truyền từ bước này sang bước khác. Để dễ hình dung quá trình huấn luyện, các nhà khoa học thường vẽ đồ thị RNN dưới dạng **trải phẳng** theo thời gian:

![Cấu trúc RNN trải phẳng qua các bước thời gian](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/RNN-unrolled.png)
*(Nguồn ảnh: Blog của Christopher Olah - Visualization kinh điển về RNN unrolled)*

Hãy nhìn vào sơ đồ bên trên, tại mỗi bước thời gian $t$, cơ chế hoạt động diễn ra như sau:
1. Mạng nhận đầu vào hiện tại $X_t$, ví dụ là từ "ăn".
2. Mạng **đồng thời nhận** trạng thái ẩn từ bước ngay trước đó là $h_{t-1}$. Vector này đang mang theo thông tin của từ "Tôi" đã đọc trước đó.
3. RNN sử dụng một hàm kích hoạt, điển hình là hàm `tanh`, để kết hợp $X_t$ và $h_{t-1}$ thông qua các ma trận trọng số. Kết quả là nó tạo ra trạng thái ẩn mới $h_t$ và sinh ra đầu ra dự đoán $Y_t$.

Trạng thái ẩn $h_t$ này lại tiếp tục được truyền sang bước thời gian $t+1$. Quá trình này lặp lại cho đến hết chuỗi. Bằng cách này, giống như khi bạn đọc một cuốn sách, bạn hiểu từ hiện tại dựa trên ngữ cảnh của những từ bạn vừa đọc xong.

## 3. Các loại kiến trúc RNN đa dạng

Nhờ tính linh hoạt của vòng lặp thời gian, RNN có thể được thiết kế theo nhiều kiểu dáng khác nhau tùy vào đặc thù của Input và Output. Chúng ta không bị gò bó trong việc Input và Output phải có cùng độ dài.

![Các kiến trúc RNN đa dạng](https://stanford.edu/~shervine/teaching/cs-230/illustrations/architecture-rnn-ltr.png)
*(Nguồn ảnh: Khóa học CS230 - Đại học Stanford, Shervine Amidi)*

Dưới đây là 4 biến thể kiến trúc phổ biến nhất:

*   **One-to-One:** Đây thực chất là mạng nơ-ron truyền thống không có vòng lặp. Nhận một ảnh đầu vào cố định và trả ra một nhãn cố định.
*   **One-to-Many:** Có một đầu vào duy nhất nhưng sinh ra một chuỗi đầu ra. 
    *   *Ứng dụng:* Bài toán Image Captioning. Đầu vào là 1 bức ảnh thường đi qua mạng CNN để lấy đặc trưng, sau đó đưa vào RNN để sinh ra một chuỗi các từ mô tả ảnh đó.
*   **Many-to-One:** Đưa vào một chuỗi thông tin nhưng chỉ lấy kết quả ở bước cuối cùng.
    *   *Ứng dụng:* Bài toán Sentiment Analysis. Bạn đưa vào 1 câu review dài 50 từ, mạng sẽ đọc từ đầu đến cuối và chỉ trả về 1 kết quả duy nhất là: Tích cực hay Tiêu cực.
*   **Many-to-Many:** Đây là kiến trúc phức tạp và mạnh mẽ nhất, chia làm 2 dạng:
    *   *Dạng Sequence-to-Sequence:* Dùng cho bài toán Machine Translation. Mạng sẽ đọc hết toàn bộ câu tiếng Việt để lấy bối cảnh, sau đó mới bắt đầu sinh ra từng từ tiếng Anh.
    *   *Dạng Sync:* Dùng trong phân tích Video, nơi mỗi khung hình là một đầu vào và hệ thống phải lập tức trả ra phân loại hành động tương ứng cho khung hình đó ở thời gian thực.

## 4. "Gót chân Achilles" của RNN: Vanishing Gradient

Mặc dù ý tưởng về vòng lặp bộ nhớ là vô cùng hoàn hảo trên lý thuyết, RNN truyền thống gặp một vấn đề toán học lớn khi triển khai thực tế với các chuỗi dữ liệu dài. Thuật toán dùng để huấn luyện RNN gọi là **Backpropagation Through Time (BPTT)**.

Khi chuỗi dữ liệu quá dài, thuật toán BPTT phải nhân liên tiếp các ma trận đạo hàm lại với nhau theo quy tắc Chain Rule từ bước $t=100$ lùi về $t=1$. Nếu các giá trị đạo hàm này nhỏ hơn 1, việc nhân hàng chục số nhỏ hơn 1 lại với nhau sẽ khiến kết quả tụt dốc không phanh. Hiện tượng này gọi là **Vanishing Gradient**.

Khi gradient tiến về 0, các trọng số của các bước thời gian đầu tiên sẽ không được cập nhật. Hậu quả là RNN trở thành một cỗ máy "não cá vàng" — nó hoàn toàn quên mất các thông tin ở đầu đoạn văn khi đang đọc đến cuối đoạn. 
*Ví dụ:* Nếu câu có nội dung *"Tôi sống ở nước Pháp... [50 từ khác] ... Hiện tại tôi nói thông thạo tiếng ___"*. Một RNN cơ bản sẽ không thể nhớ được chữ "Pháp" ở đầu câu để dự đoán điền chữ "Pháp" vào chỗ trống.

## 5. Tổng kết

Mạng nơ-ron hồi quy (RNN) là một cột mốc vĩ đại trong lịch sử Deep Learning. Chúng là kiến trúc đầu tiên dạy cho máy móc cách hiểu được khái niệm về thời gian, trình tự và ngữ cảnh trong thế giới dữ liệu muôn màu. 

Tuy nhiên, vì nhược điểm Vanishing Gradient quá lớn, RNN cơ bản hầu như không bao giờ được sử dụng trong thực tế. Để khắc phục vấn đề này, các nhà khoa học đã tạo ra những biến thể tế bào tinh vi hơn, tiêu biểu nhất là mạng **Long Short-Term Memory (LSTM)**. 

Mời bạn đọc tiếp phần 2 để khám phá xem biến thể này đã giải quyết chứng "não cá vàng" thiên tài như thế nào tại bài viết: **[Tìm hiểu về mạng LSTM trong Deep Learning](/blog/tim-hieu-ve-lstm-trong-deep-learning/)**.

---

### Nguồn tham khảo:

[1] Stanford University, *Recurrent Neural Networks Cheatsheet*, CS230 Deep Learning.

[2] IBM, *What are recurrent neural networks?*, IBM Topics.

[3] Towards Data Science, *A Beginner’s Guide on Recurrent Neural Networks* (2020), Medium.

[4] Dive into Deep Learning, *Recurrent Neural Networks*, D2L.ai.
