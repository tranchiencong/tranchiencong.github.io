---
title: "Mạng Riemann ứng dụng cho học Ma trận SPD"
description: "Review về bài báo giới thiệu một kiến trúc mạng neural sâu mới hoạt động trên các đa tạp Riemann cho dữ liệu dạng ma trận Đối xứng Xác định Dương."
pubDate: 2026-08-30
tags: ["machine learning", "deep learning", "computer vision", "math"]
---

Hôm nay mình sẽ chia sẻ với các bạn một bài báo rất thú vị về Deep Learning và Toán học: **"A Riemannian Network for SPD Matrix Learning"** của tác giả Zhiwu Huang và Luc Van Gool, được công bố tại hội nghị AAAI 2017.

Bài báo giải quyết một vấn đề cực kỳ hóc búa, đó là làm thế nào để áp dụng sức mạnh của Deep Learning lên các dữ liệu phức tạp không nằm trong không gian vector phẳng Euclidean, cụ thể là các ma trận Đối xứng Xác định Dương hay còn gọi là ma trận SPD.

Bạn có thể tham khảo bài báo gốc tại đây: [arXiv:1608.04233](https://arxiv.org/abs/1608.04233).

---

## 1. Bối cảnh và Vấn đề

Trong lĩnh vực Thị giác máy tính và Phân tích hình ảnh y tế, dữ liệu thường được biểu diễn dưới dạng ma trận hiệp phương sai hoặc ma trận tensor khuếch tán. Ví dụ, chúng ta có thể trích xuất các đặc trưng của một bức ảnh và tính ma trận hiệp phương sai của chúng để làm đại diện phân loại cho bức ảnh đó. Đặc điểm chung của các ma trận này là chúng luôn mang tính chất Đối xứng Xác định Dương.

Vấn đề cốt lõi nằm ở chỗ các ma trận SPD không tồn tại trong một không gian vector phẳng thông thường. Thay vào đó, chúng tạo thành một bề mặt cong toán học gọi là đa tạp Riemann. Nếu chúng ta cố tình đưa các ma trận này trực tiếp vào một mạng nơ-ron tích chập truyền thống, cấu trúc hình học ban đầu của ma trận sẽ bị phá vỡ hoàn toàn, dẫn đến hiện tượng sai lệch dữ liệu nghiêm trọng như việc các tensor khuếch tán bị phình to bất thường.

Trước đây, giới nghiên cứu thường giải quyết bằng cách dùng hàm Log-Euclidean để "làm phẳng" đa tạp cong này thành không gian phẳng, sau đó mới cho vào các mô hình máy học nông. Tuy nhiên, cách làm này vẫn chưa tận dụng được triệt để khả năng trích xuất đặc trưng sâu của Deep Learning.

---

## 2. Kiến trúc giải pháp: SPDNet

Để giải quyết bài toán trên, nhóm tác giả đề xuất mạng **SPDNet**, một mạng nơ-ron sâu được thiết kế chuyên biệt để nhận đầu vào là các ma trận SPD. Điều đặc biệt của kiến trúc này là nó bảo toàn tính chất SPD của dữ liệu qua từng lớp mạng. Dữ liệu từ đầu vào cho đến các lớp trung gian luôn được duy trì trên đa tạp cong tương ứng.

Họ đã thiết kế lại ba thành phần cốt lõi của một mạng nơ-ron để tương thích với hình học Riemann, đi kèm với những tính toán toán học rất chặt chẽ:

### BiMap Layer

Thay vì sử dụng phép nhân tuyến tính thông thường giữa ma trận trọng số và đầu vào, SPDNet sử dụng phép ánh xạ song tuyến tính để chuyển đổi dữ liệu. Công thức tính toán ở lớp thứ $k$ được định nghĩa như sau:

$$
X_k = W_k X_{k-1} W_k^T
$$

Ở đây, ma trận trọng số $W_k$ bị ràng buộc là một ma trận bán trực giao và nó nằm trên một đa tạp Stiefel nhỏ gọn. Phép biến đổi song tuyến tính này giúp ánh xạ một ma trận SPD ở không gian ban đầu sang một ma trận SPD khác có số chiều nhỏ gọn hơn nhưng lại chứa nhiều thông tin mang tính phân biệt cao hơn.

### ReEig Layer

Trong mạng nơ-ron truyền thống, chúng ta dùng hàm ReLU để tạo ra tính phi tuyến. Đối với dữ liệu ma trận SPD, tác giả giới thiệu một cơ chế tương tự mang tên Rectified Eigenvalues. Cơ chế này hoạt động bằng cách phân tích giá trị riêng của ma trận đầu vào:

$$
X_{k-1} = U_{k-1} \Sigma_{k-1} U_{k-1}^T
$$

Sau đó, một hàm lọc phi tuyến tính sẽ được áp dụng trực tiếp lên ma trận đường chéo chứa các giá trị riêng $\Sigma_{k-1}$. Hàm này giữ nguyên các giá trị riêng lớn và ép các giá trị riêng quá bé lên một ngưỡng dương $\epsilon$ nhất định:

$$
X_k = U_{k-1} \max(\epsilon I, \Sigma_{k-1}) U_{k-1}^T
$$

Mục đích của bước này là đảm bảo ma trận sau khi đi qua lớp phi tuyến vẫn duy trì tính chất Xác định Dương vững chắc và tuyệt đối không bị suy biến thành các ma trận chứa giá trị âm hoặc bằng không.

### LogEig Layer

Đây là lớp xử lý cuối cùng trước khi đưa dữ liệu vào các hàm tính toán mất mát hoặc bộ phân loại thông thường như Softmax. Chức năng của lớp này là ánh xạ ma trận SPD từ đa tạp Riemann cong xuống không gian tiếp tuyến phẳng Euclidean. 

Quá trình này sử dụng toán tử logarit ma trận. Nó thực hiện phân tích giá trị riêng tương tự lớp ReEig, nhưng thay vì cắt ngưỡng, nó sẽ tính logarit tự nhiên của các giá trị riêng:

$$
X_k = \log(X_{k-1}) = U_{k-1} \log(\Sigma_{k-1}) U_{k-1}^T
$$

Một khi ma trận đã được đưa về không gian phẳng thành công, chúng ta hoàn toàn có thể áp dụng các thuật toán Deep Learning kinh điển ở phần đầu ra.

---

## 3. Thách thức Toán học: Lan truyền ngược trên Đa tạp cong

Điểm đột phá và cũng là phần toán học đồ sộ nhất của nghiên cứu này không nằm ở luồng dữ liệu tiến mà nằm ở cách tối ưu hoá mô hình thông qua thuật toán Lan truyền ngược. Vì dữ liệu và trọng số đều nằm trên bề mặt đa tạp cong, việc cập nhật gradient theo cách cộng trừ truyền thống sẽ làm các ma trận trọng số văng ra khỏi bề mặt chuẩn của chúng.

Nhóm nghiên cứu đã giải quyết bài toán này qua hai bước căn bản:

**Bước 1: Cập nhật trọng số trên đa tạp Stiefel.** 
Ở lớp BiMap, gradient của hàm mất mát đối với trọng số $W_k$ trong không gian phẳng sẽ được tính toán đầu tiên. Nhưng thay vì trừ trực tiếp độ dốc này vào $W_k$, hệ thống sẽ tính toán và trừ đi thành phần pháp tuyến để chiếu vector gradient này lên không gian tiếp tuyến của đa tạp Stiefel, từ đó hình thành gradient Riemann. Sau khi di chuyển một bước dọc theo phương tiếp tuyến này, thuật toán áp dụng toán tử co rút để kéo ma trận trọng số mới cập nhật quay ngược trở lại bám sát vào bề mặt đa tạp.

**Bước 2: Tính toán đạo hàm qua phép phân tích giá trị riêng.** 
Ở lớp ReEig và LogEig, mạng nơ-ron phải liên tục thực hiện phân tích giá trị riêng. Để lan truyền ngược được tín hiệu sai số đi qua thao tác này, quy tắc chuỗi đạo hàm thông thường trở nên vô dụng. Nhóm tác giả đã vận dụng một mô hình giải tích ma trận rất sâu, cho phép biểu diễn biến phân của ma trận đầu vào thông qua biến phân của các vector riêng và giá trị riêng. Bằng việc kết hợp các tích vô hướng Hadamard, thuật toán dọn đường cho dòng tín hiệu đạo hàm truyền ngược mượt mà qua các lớp phi tuyến tính, đảm bảo mô hình có thể được huấn luyện hoàn toàn khép kín.

---

## 4. Kết quả Thực nghiệm

SPDNet đã được kiểm chứng tính hiệu quả trên ba bài toán nhận dạng thị giác máy tính, vốn là sân nhà của dữ liệu hiệp phương sai:
- Phân loại cảm xúc khuôn mặt trên video thông qua bộ dữ liệu AFEW.
- Nhận diện hành động con người bằng dữ liệu tọa độ khớp xương 3D trên bộ dữ liệu HDM05.
- Xác thực khuôn mặt trên tập dữ liệu PaSC.

Kết quả thu được chứng minh rằng SPDNet cải thiện độ chính xác rõ rệt so với các phương pháp máy học nông truyền thống áp dụng trên không gian Riemann cũng như các kiến trúc mạng nơ-ron hiện đại khác. Hơn nữa, thực nghiệm còn chỉ ra rằng việc xếp chồng liên tiếp nhiều khối BiMap và ReEig thực sự khai thác được sức mạnh phân cấp thông tin, mang lại mức hiệu năng phân loại cao hơn nhiều.

---

## Tổng kết

- Đóng góp lớn nhất của tác giả là đưa dữ liệu ma trận SPD nguyên bản vào kiến trúc Deep Learning mà không hề làm mất đi cấu trúc hình học không gian cong quý giá của chúng.
- Giải pháp cốt lõi mang tên SPDNet sử dụng các lớp biến đổi song tuyến tính và các lớp phi tuyến tính dựa trên thao tác cắt ngưỡng giá trị riêng. Cách tiếp cận này mô phỏng hoàn hảo các thành phần tích chập và ReLU kinh điển nhưng hoạt động trong không gian Riemann.
- Bài báo thành công trong việc xây dựng một hệ thống tính toán đạo hàm ma trận tổng quát và tối ưu hoá trực tiếp trên đa tạp Stiefel, phá vỡ rào cản lớn nhất khi huấn luyện các mô hình học sâu phi tuyến.

Nghiên cứu này dù chứa hàm lượng giải tích và toán học ma trận rất lớn, nhưng nó đã đặt một nền móng vững chắc cho hướng đi Deep Learning Hình học, mở ra cơ hội thiết kế các kiến trúc học máy cho nhiều dạng cấu trúc dữ liệu không gian phức tạp khác trong tương lai.
