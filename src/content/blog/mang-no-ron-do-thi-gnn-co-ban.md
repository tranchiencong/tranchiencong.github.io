---
title: "Tìm hiểu cơ bản về Mạng nơ-ron Đồ thị (Graph Neural Networks - GNN)"
description: "Khám phá Mạng nơ-ron đồ thị (GNN) là gì, tại sao chúng ta cần chúng để xử lý dữ liệu phi cấu trúc và các khái niệm cốt lõi như Message Passing."
pubDate: "2026-09-02"
heroImage: "https://images.unsplash.com/photo-1545670723-196ed09449af?q=80&w=1200&auto=format&fit=crop"
---

Mặc dù Mạng nơ-ron tích chập (CNN) đã cực kỳ thành công trong việc xử lý hình ảnh (như bạn có thể xem lại bài [Tìm hiểu về Convolutional Neural Network](/blog/tim-hieu-ve-cnn-trong-deep-learning/)) và mạng nơ-ron hồi quy (RNN) làm chủ các dạng dữ liệu tuần tự, có một lượng lớn dữ liệu trong thế giới thực không thuộc dạng lưới hay dạng chuỗi. Đó là lúc **Mạng nơ-ron đồ thị (GNN)** xuất hiện.

Bài viết này sẽ đưa bạn đi qua các khái niệm cơ bản về GNN một cách chi tiết, tại sao nó lại là một công cụ mạnh mẽ, cách nó hoạt động qua các ví dụ thực tế và những ứng dụng phổ biến nhất của nó.

## 1. Tại sao chúng ta lại cần GNN?

Các mạng nơ-ron truyền thống như CNN được thiết kế cho dữ liệu có cấu trúc lưới cố định ví dụ như hình ảnh. Trong một bức ảnh, mỗi điểm ảnh luôn có số lượng hàng xóm lân cận cố định và thứ tự không gian từ trái sang phải, từ trên xuống dưới là rất rõ ràng. Tương tự, RNN xử lý văn bản theo một chuỗi tuyến tính.

Tuy nhiên, thế giới thực lại hỗn loạn hơn nhiều. Phần lớn dữ liệu phức tạp lại có cấu trúc đồ thị, nơi các mối quan hệ giữa các thực thể cũng quan trọng không kém gì bản thân các thực thể đó. Ví dụ:
- **Mạng xã hội:** Người dùng được kết nối bởi các mối quan hệ bạn bè. Một người có thể có 5 người bạn, nhưng người khác lại có 5000 người bạn.
- **Cấu trúc phân tử:** Các nguyên tử kết nối bởi các liên kết hóa học phức tạp.
- **Hệ thống giao thông:** Các điểm giao cắt kết nối bằng các đoạn đường dài ngắn khác nhau.
- **Sơ đồ tri thức (Knowledge Graph):** Các thực thể thông tin được kết nối theo ngữ nghĩa đa dạng.

![Minh hoạ cấu trúc đồ thị so với hình ảnh lưới](https://theaisummer.com/static/7b065b7c80568aff60f16267b6bbab17/ee604/gnn-architectures.png)
*(Nguồn ảnh: The AI Summer)*

**Tại sao không dùng thẳng CNN hoặc mạng nơ-ron thông thường cho đồ thị?** 
Nếu bạn cố gắng "làm phẳng" một mạng lưới bạn bè thành một mảng dữ liệu 1 chiều để cho vào mạng nơ-ron truyền thống, bạn sẽ gặp 2 rắc rối lớn:
1. Bạn buộc phải áp đặt một "thứ tự" giả tạo lên các nút, làm hỏng đi bản chất kết nối tự nhiên của đồ thị.
2. Số lượng hàng xóm của mỗi người là khác nhau, trong khi mạng nơ-ron truyền thống yêu cầu đầu vào phải có kích thước cố định.

GNN sinh ra để giải quyết bài toán cốt lõi này: **Học trực tiếp trên cấu trúc không gian tự do của đồ thị**.

## 2. Các khái niệm cốt lõi: GNN hoạt động như thế nào?

Mục tiêu chính của một mạng GNN là tạo ra các **Node Embeddings**. Một Node Embedding tốt không chỉ chứa thông tin cá nhân của nút đó, mà còn phải gói gọn cả thông tin về những nút xung quanh nó. "Gần mực thì đen, gần đèn thì rạng" chính là triết lý của GNN.

Cơ chế sức mạnh đằng sau hầu hết các GNN được gọi là **Message Passing**. Quá trình này diễn ra qua 3 bước chính tại mỗi layer:

1. **Aggregate:** Đối với một nút nhất định, mạng sẽ thu thập thông điệp từ các nút hàng xóm trực tiếp. Vì số lượng hàng xóm là không cố định, hàm Aggregate sẽ giúp gom tất cả thông tin này lại thành một khối vector có kích thước cố định.
2. **Update:** Nút đó sẽ lấy khối thông tin vừa gom được từ hàng xóm, kết hợp với thuộc tính hiện tại của chính nó để cập nhật lại embedding của mình.
3. **Repeat:** Quá trình này được lặp lại qua nhiều layer. Khi đi qua 1 layer, bạn biết thông tin của bạn bè mình. Khi đi qua 2 layer, bạn biết thông tin của "bạn của bạn bè" mình. Khi đi qua $K$ layer, bạn tổng hợp được thông tin từ các nút nằm cách xa $K$ bước nhảy.

![Minh họa quá trình Message Passing giữa các lớp trong GNN](https://uvadlc-notebooks.readthedocs.io/en/latest/_images/torch_geometric_stacking_graphs.png)
*(Nguồn ảnh: UvA Deep Learning Tutorials)*

Đặc tính quan trọng nhất của GNN là tính **Bất biến hoán vị (Permutation Invariance)**. Khác với ảnh nơi các pixel bị cố định vị trí, bạn có thể vẽ một đồ thị trên giấy theo muôn ngàn hình thù khác nhau miễn là các đường nối không đổi. GNN đảm bảo rằng kết quả học được sẽ luôn giống hệt nhau bất kể đồ thị bị xoay hay hoán đổi vị trí hiển thị như thế nào.

## 3. Các bài toán và ví dụ ứng dụng thực tế

GNN cực kỳ đa năng và thường giải quyết ba bài toán chính sau trong Machine Learning. Hãy cùng xem các ví dụ cụ thể để dễ hình dung:

### 3.1 Node Classification
Bài toán: Bạn có một mạng lưới rộng lớn, nhưng chỉ biết nhãn của một số ít các nút. Bạn cần dự đoán nhãn của các nút còn lại dựa trên mối quan hệ của chúng.

**Ví dụ kinh điển: Câu lạc bộ Karate Zachary.** 
Trong bài toán này, các thành viên trong một câu lạc bộ võ thuật có sự tương tác với nhau. Sau một mâu thuẫn, câu lạc bộ chia làm 2 phe: phe của Huấn luyện viên và phe của Chủ tịch. Bằng cách cho GNN học cấu trúc giao tiếp, GNN có thể phân loại cực kỳ chính xác thành viên nào sẽ theo phe nào, kể cả khi chưa từng gặp họ trước đây.

![Minh hoạ phân loại nút](https://stellargraph.readthedocs.io/en/stable/_images/demos_node-classification_gcn-node-classification_66_1.png)
*(Nguồn ảnh: StellarGraph - Các màu sắc thể hiện các cụm nút được GNN phân loại tự động)*

**Ứng dụng công nghiệp:** Xác định tài khoản bot lừa đảo trên mạng xã hội, phân loại thể loại của các bài báo khoa học dựa trên mạng lưới trích dẫn (Citation Network).

### 3.2 Link Prediction
Bài toán: Dự đoán xem liệu giữa hai nút có tồn tại một cạnh kết nối hay không.

**Ví dụ thực tế:** Hệ thống gợi ý (Recommendation System).
Hãy tưởng tượng một đồ thị gồm 2 loại nút: Khách hàng và Sản phẩm. Nếu Khách hàng A từng mua Sản phẩm X, ta vẽ một cạnh nối giữa họ. Nhiệm vụ của GNN là phân tích tổng thể cấu trúc mua sắm của hàng triệu người để dự đoán liên kết mới: Liệu Khách hàng A có khả năng mua Sản phẩm Y hay không?

**Ứng dụng công nghiệp:** Hệ thống gợi ý "Những người bạn có thể biết" trên Facebook, hoặc dự đoán xem hai loại thuốc khi uống cùng nhau có sinh ra phản ứng phụ hay không.

### 3.3 Graph Classification
Bài toán: Đưa ra dự đoán hoặc phân loại cho toàn bộ cấu trúc đồ thị như một thực thể duy nhất.

**Ví dụ thực tế:** Khám phá thuốc (Drug Discovery).
Mỗi phân tử hóa học là một đồ thị nhỏ trong đó nguyên tử là nút và liên kết hóa học là cạnh. GNN sẽ "đọc" toàn bộ hình dáng và cấu trúc của phân tử này để phân loại xem nó có độc tính không, hoặc nó có khả năng tiêu diệt vi khuẩn hay không. MIT đã từng dùng GNN để tìm ra loại thuốc kháng sinh mới mạnh mẽ mang tên Halicin.

## 4. Các kiến trúc phổ biến của GNN

Khi lĩnh vực xử lý đồ thị bùng nổ, nhiều biến thể kiến trúc đã ra đời để tối ưu hóa cho các tác vụ khác nhau:

*   **GCN (Graph Convolutional Networks):** Áp dụng khái niệm tích chập tương tự như CNN trực tiếp lên đồ thị bằng cách lấy trung bình trọng số đặc trưng của các nút lân cận. Nó đơn giản nhưng cực kỳ hiệu quả.
*   **GAT (Graph Attention Networks):** Tích hợp cơ chế Attention tương tự như trong Transformer. Thay vì coi mọi người bạn đều quan trọng như nhau, GAT tự động học xem hàng xóm nào đáng chú ý hơn và ưu tiên lắng nghe thông tin từ người đó.
*   **MPNN (Message Passing Neural Networks):** Một framework tổng quát hóa hỗ trợ truyền đặc trưng cho cả nút và cạnh, cho phép biểu diễn các tương tác hóa học và vật lý phức tạp.

## 5. Tổng kết

Mạng nơ-ron đồ thị (GNN) đã mở ra một kỷ nguyên mới cho Deep Learning, cho phép máy tính hiểu và khai thác triệt để dữ liệu có tính liên kết chằng chịt - thứ trước đây làm khó các kiến trúc truyền thống. Cùng với những kiến trúc tối ưu không gian phi tuyến tính như Mạng nơ-ron không gian Riemann trong học ma trận SPD, GNN chứng minh rằng AI đang ngày càng hoàn thiện khả năng lý luận và xử lý các cấu trúc dữ liệu phức tạp nhất của thế giới thực.

---

### Nguồn tham khảo:

[1] GeeksforGeeks, *Introduction to Graph Neural Networks (GNNs)*, GeeksforGeeks.

[2] TensorTonic, *Understanding Graph Neural Networks Basics: Permutation Invariance* (2023), TensorTonic Blog.

[3] TigerGraph, *Graph Neural Networks for Molecules and Graphs* (2022), DigitalOcean.

[4] Karthick.ai, *Message Passing in Graph Neural Networks* (2023), Karthick.ai.

[5] Distill.pub, *A Gentle Introduction to Graph Neural Networks* (2021), Distill.

[6] DataCamp, *Graph Convolutional Networks and MPNN Architectures* (2023), DataCamp.

[7] Petar Veličković et al., *Graph Attention Networks (GAT)* (2018), ArXiv.

[8] Thomas N. Kipf & Max Welling, *Semi-Supervised Classification with Graph Convolutional Networks* (2017), ArXiv.
