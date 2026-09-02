---
title: "Tìm hiểu về mạng LSTM trong Deep Learning"
description: "Khám phá cấu trúc bên trong của mạng LSTM, cách nó giải quyết triệt để vấn đề Vanishing Gradient của RNN bằng cơ chế băng chuyền và các cổng thông minh."
pubDate: "2026-09-30"
heroImage: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=1200&auto=format&fit=crop"
---

Trong bài viết trước về [Mạng nơ-ron hồi quy RNN](/blog/tim-hieu-ve-rnn-trong-deep-learning/), chúng ta đã đi sâu vào lý do tại sao các kiến trúc Feed-forward truyền thống không thể xử lý dữ liệu tuần tự, và cách RNN mang đến khái niệm "trí nhớ" để giải quyết vấn đề này. Tuy nhiên, ở cuối bài, chúng ta cũng đã nhận ra rào cản tử huyệt của RNN: hiện tượng **Vanishing Gradient**. Khi câu văn hay chuỗi thời gian quá dài, mô hình RNN cơ bản sẽ hoàn toàn "quên sạch" thông tin ở những bước đầu tiên.

Để vượt qua giới hạn vật lý này, vào năm 1997, hai nhà nghiên cứu Sepp Hochreiter và Jürgen Schmidhuber đã giới thiệu một kiến trúc đột phá mang tên **Long Short-Term Memory (LSTM)**. Trải qua hơn hai thập kỷ, LSTM đã vươn lên trở thành tiêu chuẩn vàng trong mọi tác vụ xử lý chuỗi của Deep Learning trước khi kỷ nguyên Transformer xuất hiện.

Bài viết này sẽ "mổ xẻ" thật chi tiết từng bộ phận bên trong LSTM để bạn hiểu rõ tại sao nó lại được coi là một kiệt tác của ngành trí tuệ nhân tạo.

## 1. Triết lý thiết kế của LSTM: Cell State 

Nếu như một tế bào RNN tiêu chuẩn chỉ có một tầng nơ-ron đơn giản mang hàm kích hoạt `tanh`, thì một tế bào LSTM chứa tới 4 tầng mạng nơ-ron tương tác với nhau theo một cách cực kỳ tinh vi.

Sự khác biệt vĩ đại nhất của LSTM so với RNN nằm ở khái niệm **Cell State**, hay còn gọi là Trạng thái tế bào.

![Cấu trúc phức tạp bên trong một cell LSTM](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-chain.png)
*(Nguồn ảnh: Blog của Christopher Olah - Toàn cảnh cấu trúc LSTM)*

Bạn hãy nhìn vào đường thẳng chạy ngang ngay phía trên cùng của sơ đồ. Đó chính là Cell State. Nó hoạt động y hệt như một chiếc băng chuyền chạy xuyên suốt qua toàn bộ chuỗi các tế bào từ đầu đến cuối.

Trong RNN thông thường, thông tin bị biến đổi liên tục qua mỗi bước thời gian bằng phép nhân ma trận, khiến nó hao mòn rất nhanh. Nhưng trong LSTM, Cell State chạy thẳng tuột qua các tế bào và chỉ phải chịu một vài tương tác tuyến tính rất nhẹ, chủ yếu là phép cộng và phép nhân đơn giản. Nhờ chiếc "đường cao tốc" này, thông tin quan trọng có thể dễ dàng đi từ bước $t=1$ đến tận bước $t=1000$ mà không hề bị suy hao, giải quyết tận gốc hiện tượng Vanishing Gradient.

## 2. Hệ thống cổng thông minh 

Dĩ nhiên, nếu băng chuyền chỉ đơn thuần giữ lại mọi thông tin, mô hình sẽ nhanh chóng bị quá tải bởi những dữ liệu rác không cần thiết. Để kiểm soát luồng thông tin, LSTM sử dụng một cơ chế gọi là **Cổng** hay Gates.

Cổng là cách LSTM lựa chọn để cho phép hoặc ngăn chặn thông tin đi qua. Mỗi cổng được cấu tạo bởi một tầng nơ-ron sử dụng hàm kích hoạt Sigmoid kết hợp với phép nhân từng phần tử. 
Tại sao lại là hàm Sigmoid? Bởi vì đầu ra của Sigmoid luôn nằm trong khoảng từ 0 đến 1:
- Số 0 mang ý nghĩa đóng cửa hoàn toàn, không cho thứ gì lọt qua.
- Số 1 mang ý nghĩa mở cửa hoàn toàn, cho phép mọi thứ đi qua.

LSTM sở hữu 3 chiếc cổng với 3 nhiệm vụ chuyên biệt: Forget Gate, Input Gate và Output Gate. Dưới đây là cách chúng phối hợp với nhau theo từng bước.

### Bước 1: Quyết định loại bỏ thông tin cũ bằng Forget Gate

Khi bước vào một tế bào LSTM, việc đầu tiên mạng cần làm là xem xét xem có khối thông tin nào từ quá khứ đã trở nên vô giá trị và cần bị vứt bỏ hay không. Nhiệm vụ "dọn dẹp" này được giao cho **Forget Gate**.

![Cơ chế hoạt động của Forget Gate](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-focus-f.png)
*(Nguồn ảnh: Blog của Christopher Olah - Forget Gate)*

Cổng này sẽ thu thập trạng thái ẩn từ bước trước $h_{t-1}$ và đầu vào của bước hiện tại $X_t$. Sau đó, nó áp dụng hàm Sigmoid để xuất ra một vector chứa các giá trị từ 0 đến 1. Vector này sẽ được nhân trực tiếp với Cell State cũ $C_{t-1}$.

*Ví dụ thực tế:* Giả sử mạng đang đọc một văn bản. Cell State đang lưu trữ giới tính của nhân vật chính là "Nam" để sử dụng đúng đại từ "Anh ấy". Khi văn bản chuyển sang nói về một nhân vật mới là "Cô ấy", Forget Gate sẽ nhận diện được sự thay đổi này và lập tức xuất ra giá trị 0 cho vị trí lưu trữ giới tính "Nam" cũ, qua đó xóa sạch nó khỏi băng chuyền để dọn chỗ cho dữ liệu mới.

### Bước 2: Chuẩn bị thông tin mới bằng Input Gate

Sau khi đã dọn dẹp băng chuyền, bước tiếp theo là quyết định xem thông tin mới nào từ hiện tại xứng đáng được lưu vào trí nhớ dài hạn. Quá trình này gồm hai nhánh phối hợp với nhau:

![Cơ chế hoạt động của Input Gate](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-focus-i.png)
*(Nguồn ảnh: Blog của Christopher Olah - Input Gate)*

1.  **Nhánh Sigmoid tức Input Gate:** Hoạt động như một bộ lọc, quyết định xem vị trí nào trong Cell State sẽ được cập nhật bằng cách xuất ra giá trị từ 0 đến 1.
2.  **Nhánh Tanh:** Đóng vai trò như một bộ đề xuất. Nó đọc dữ liệu hiện tại và tạo ra một vector chứa tất cả các giá trị ứng viên mới $\tilde{C}_t$. Sở dĩ dùng hàm `tanh` là để dữ liệu trải đều từ -1 đến 1, cho phép mạng có thể thêm vào giá trị dương hoặc bớt đi giá trị âm trên Cell State.

Tiếp tục ví dụ trước, sau khi Forget Gate đã xóa giới tính "Nam", nhánh Tanh sẽ đề xuất giới tính mới là "Nữ", và Input Gate sẽ xuất ra giá trị 1 để mở cửa cho phép ghi đè thông tin "Nữ" này chuẩn bị được đưa lên băng chuyền.

### Bước 3: Cập nhật chiếc băng chuyền Cell State

Bây giờ là lúc mạng LSTM chính thức thực thi các quyết định từ Bước 1 và Bước 2 để tạo ra **Cell State mới** $C_t$.

![Quá trình cập nhật Cell State](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-focus-C.png)
*(Nguồn ảnh: Blog của Christopher Olah - Quá trình cập nhật trạng thái tế bào)*

Quy trình diễn ra vô cùng mạch lạc:
Nó lấy Cell State cũ nhân với kết quả của Forget Gate để quên đi những thứ cần quên. Sau đó, nó lấy kết quả của Input Gate nhân với vector ứng viên Tanh để chắt lọc lấy những thứ cần nhớ. Cuối cùng, cộng hai kết quả này lại với nhau. Chiếc băng chuyền lúc này đã được cập nhật thành công và sẵn sàng truyền đi thông tin mới nhất cho các tế bào tiếp theo.

### Bước 4: Đưa ra quyết định hiển thị bằng Output Gate

Mặc dù Cell State đã chứa đầy đủ thông tin chuẩn xác, nhưng LSTM không bao giờ chia sẻ toàn bộ Cell State ra bên ngoài một cách hớ hênh. Nó chỉ chọn lọc những phần thông tin thực sự hữu ích cho bước hiện tại để xuất ra dưới dạng **Hidden State** $h_t$. Quyết định này do **Output Gate** đảm nhận.

![Cơ chế hoạt động của Output Gate](https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-focus-o.png)
*(Nguồn ảnh: Blog của Christopher Olah - Output Gate)*

Đầu tiên, Output Gate lại dùng một hàm Sigmoid để đánh giá xem nó muốn hiển thị phần nào của Cell State.
Sau đó, băng chuyền Cell State sẽ được đưa qua một hàm `tanh` nhằm nén các giá trị về chuẩn -1 đến 1 và nhân trực tiếp với kết quả của Output Gate. 

*Ví dụ:* Nếu đầu vào hiện tại là một danh từ số nhiều, Output Gate có thể hiểu rằng từ tiếp theo rất có thể là một động từ chia ở số nhiều. Nó sẽ trích xuất thông tin "số nhiều" từ Cell State và đưa ra Hidden State để chuẩn bị cho tế bào tiếp theo dự đoán động từ.

## 3. Lời kết

Nếu không có sự ra đời của cơ chế cổng thông minh từ LSTM, có lẽ ngành Học sâu dành cho dữ liệu tuần tự đã giậm chân tại chỗ ở thập niên 90. Nhờ khả năng nắm bắt được những ngữ cảnh trải dài hàng ngàn bước thời gian, LSTM đã trở thành trái tim của hàng loạt các ứng dụng thay đổi thế giới như Google Translate thời kỳ đầu, trợ lý ảo Siri/Alexa, và các hệ thống dự báo tài chính phức tạp. 

Dù trong những năm gần đây, kiến trúc Transformer đang chiếm sóng toàn tập nhờ khả năng xử lý song song, các tư tưởng về cổng kiểm soát thông tin của LSTM vẫn là nền tảng cốt lõi được kế thừa trong hàng loạt thuật toán hiện đại.

---

### Nguồn tham khảo:

[1] Sepp Hochreiter & Jürgen Schmidhuber, *Long Short-Term Memory* (1997), Neural Computation.

[2] Christopher Olah, *Understanding LSTM Networks* (2015), colah's blog.

[3] Dive into Deep Learning, *Long Short-Term Memory (LSTM) and GRU*, D2L.ai.

[4] Stanford University, *Natural Language Processing with Deep Learning*, CS224n.
