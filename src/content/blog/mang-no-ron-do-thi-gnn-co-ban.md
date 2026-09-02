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

Mục tiêu chính của một mạng GNN là tạo ra các **Node Embeddings** — các vector số đại diện cho từng nút trong đồ thị. Một Node Embedding tốt không chỉ chứa thông tin cá nhân của riêng nút đó, mà còn phải gói gọn cả cấu trúc không gian và ngữ cảnh xung quanh nó. Triết lý của GNN gói gọn trong câu: *"Hãy cho tôi biết những người bạn xung quanh bạn, tôi sẽ cho bạn biết bạn là ai"*.

Để làm được điều này, GNN sử dụng cơ chế cốt lõi mang tên **Message Passing** (Truyền thông điệp).

### 2.1 Cây tính toán (Computation Graph) và luồng dữ liệu

Hãy tưởng tượng bạn muốn cập nhật thông tin cho một Nút $A$. Nút $A$ kết nối trực tiếp với các hàng xóm $B, C, D$. Đến lượt mình, $B, C, D$ lại có những người bạn riêng của họ.

Khi đưa qua một mô hình GNN, mỗi nút sẽ tự động mở ra một **Cây tính toán (Computation Graph)** riêng biệt dựa trên các mối liên kết xung quanh nó:

![Mô hình cây tính toán và gom nhóm hàng xóm trong GNN](https://snap-stanford.github.io/cs224w-notes/assets/img/aggregate_neighbors.png)
*(Nguồn ảnh: Khóa học CS224W - Đại học Stanford: Cấu trúc cây tính toán để xác định cách thông tin lan truyền về nút mục tiêu)*

### 2.2 Ba bước vận hành trong mỗi tầng Message Passing

Tại mỗi tầng (Layer) của mạng GNN, thông tin được truyền và cập nhật qua 3 bước toán học chính:

1. **Tính toán thông điệp (Message Computation):** Mỗi nút hàng xóm $u$ sẽ lấy vector đặc trưng hiện tại của nó $h_u$ và đưa qua một biến đổi tuyến tính để tạo ra một "gói thông điệp" gửi sang các nút lân cận.
2. **Gom nhóm thông điệp (Aggregation):** Đây là bước giải quyết bài toán hóc búa nhất của đồ thị: một người có 2 bạn, nhưng người khác lại có 500 bạn. Hàm Aggregation sẽ gom tất cả các gói thông điệp từ mọi hàng xóm lại thành một vector duy nhất có kích thước cố định.
   * Để đảm bảo tính chất **Permutation Invariance** (không phụ thuộc vào thứ tự liệt kê các nút), hàm gom nhóm thường là các phép toán đối xứng như `Sum` (Tổng), `Mean` (Trung bình), hoặc `Max` (Lớn nhất).
3. **Cập nhật trạng thái (Update):** Nút đích nhận vector thông điệp vừa gom được từ hàng xóm, kết hợp với vector đặc trưng cũ của chính nó thông qua một mạng nơ-ron nhỏ (MLP) kèm hàm kích hoạt phi tuyến tính như `ReLU` để sinh ra vector đặc trưng mới $h_v^{(k)}$.

![Minh họa quá trình Message Passing giữa các lớp trong GNN](https://uvadlc-notebooks.readthedocs.io/en/latest/_images/torch_geometric_stacking_graphs.png)
*(Nguồn ảnh: UvA Deep Learning Tutorials - Quá trình mở rộng vùng quan sát qua từng tầng)*

### 2.3 Xếp chồng nhiều tầng và hiện tượng Over-smoothing

Khi xếp chồng $K$ tầng GNN liên tiếp nhau, vùng quan sát của mỗi nút sẽ lan rộng tương tự như trường tiếp nhận (Receptive Field) trong mạng CNN:
- **Tầng 1 (1-hop):** Nút chỉ nắm được thông tin của những người bạn trực tiếp.
- **Tầng 2 (2-hop):** Nút học thêm thông tin của "bạn của bạn bè".
- **Tầng $K$ ($K$-hop):** Thông tin từ các nút cách xa $K$ bước nhảy đã được tổng hợp về nút gốc.

> **Lưu ý kỹ thuật quan trọng:** Khác với CNN hay Transformer có thể xếp chồng hàng chục đến hàng trăm tầng, GNN thông thường chỉ dùng từ 2 đến 4 tầng. Nếu xếp chồng quá sâu, mạng sẽ gặp hiện tượng **Over-smoothing** — khi đó thông tin từ toàn bộ đồ thị bị trộn lẫn vào nhau, khiến mọi nút đều có vector đặc trưng gần như giống hệt nhau và mô hình mất khả năng phân biệt.

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

**Ví dụ thực tế:** Hệ thống gợi ý Recommendation System trên Spotify.
Hãy tưởng tượng hệ thống của Spotify là một đồ thị khổng lồ gồm 2 loại nút: Người dùng và Bài hát. Nếu bạn là Người dùng A và lưu Bài hát X, một cạnh kết nối sẽ được tạo ra. Nhiệm vụ của GNN là phân tích cấu trúc nghe nhạc của hàng triệu người. Nếu phát hiện bạn và Người dùng B có chung nhiều bài hát như X, Z, GNN sẽ truyền thông tin và dự đoán bạn cũng sẽ thích Bài hát Y mà Người dùng B vừa nghe, từ đó dự đoán một liên kết mới giữa bạn và Bài hát Y.

**Ứng dụng công nghiệp:** Gợi ý bài hát và playlist trên Spotify, tính năng "Những người bạn có thể biết" trên Facebook, hoặc dự đoán xem hai loại thuốc khi uống cùng nhau có sinh ra phản ứng phụ hay không.

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

[9] Stanford University, *Machine Learning with Graphs*, CS224W.
