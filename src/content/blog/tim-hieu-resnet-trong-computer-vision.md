---
title: "Tìm hiểu ResNet: Vì sao kết nối tắt giúp huấn luyện CNN rất sâu?"
description: "Tìm hiểu bài toán degradation, residual learning, shortcut connection và cách các kiến trúc ResNet-18, ResNet-34, ResNet-50 hoạt động trong Computer Vision."
pubDate: "2026-09-30"
tags: ["resnet", "cnn", "deep learning", "computer vision"]
---

Trong bài viết về [Convolutional Neural Network (CNN)](/blog/tim-hieu-ve-cnn-trong-deep-learning/), chúng ta đã thấy cách các lớp tích chập học đặc trưng từ ảnh: những lớp đầu thường phản ứng với cạnh và màu sắc, còn các lớp sâu hơn có thể kết hợp chúng thành bộ phận hoặc vật thể phức tạp.

Một suy luận tưởng như rất tự nhiên xuất hiện: **nếu mạng sâu giúp học đặc trưng phức tạp hơn, chỉ cần tiếp tục xếp thêm nhiều lớp là mô hình sẽ tốt hơn**. Tuy nhiên, thực nghiệm cho thấy một mạng CNN 56 lớp có thể có cả training error lẫn test error cao hơn mạng 20 lớp. Đây không chỉ là overfitting, vì ngay cả dữ liệu huấn luyện cũng không được khớp tốt hơn.

Năm 2015, Kaiming He, Xiangyu Zhang, Shaoqing Ren và Jian Sun đề xuất **Deep Residual Network (ResNet)**. Thay vì bắt một nhóm layer học trực tiếp toàn bộ ánh xạ mong muốn, ResNet cho chúng học phần sai khác cần bổ sung vào đầu vào. Thay đổi có vẻ nhỏ này đã giúp việc tối ưu các mạng rất sâu trở nên khả thi hơn và có ảnh hưởng lâu dài tới nhiều kiến trúc Deep Learning sau đó.

## 1. Tại sao chúng ta muốn CNN sâu hơn?

Mỗi convolutional layer chỉ quan sát một vùng cục bộ của feature map. Khi nhiều layer được xếp chồng, receptive field hiệu dụng mở rộng và mô hình có thể xây dựng biểu diễn theo cấp bậc:

- Các layer đầu phát hiện cạnh, góc hoặc sự thay đổi màu sắc.
- Các layer giữa kết hợp chúng thành texture và bộ phận của vật thể.
- Các layer sâu hơn tổng hợp những bộ phận đó thành biểu diễn phục vụ phân loại.

Về mặt biểu diễn, thêm layer không nhất thiết phải làm mạng kém đi. Giả sử một mạng nông đã tìm được hàm phù hợp. Các layer được thêm vào một mạng sâu hơn, về nguyên tắc, chỉ cần học **identity mapping**:

$$
H(\mathbf{x}) = \mathbf{x}.
$$

Khi đó mạng sâu có thể tái tạo lời giải của mạng nông rồi học thêm nếu cần. Nhưng “có tồn tại một bộ trọng số tốt” không đồng nghĩa thuật toán tối ưu sẽ tìm được bộ trọng số đó trong thời gian hữu hạn.

## 2. Degradation không phải là overfitting

Khi độ sâu tăng, CNN truyền thống thường gặp ba vấn đề dễ bị đánh đồng:

| Hiện tượng | Dấu hiệu | Nguyên nhân điển hình |
| --- | --- | --- |
| Vanishing/exploding gradient | Gradient quá nhỏ hoặc quá lớn khi lan truyền qua nhiều layer | Tích liên tiếp các đạo hàm/Jacobian |
| Overfitting | Training error thấp nhưng validation/test error cao | Mô hình khớp quá sát dữ liệu huấn luyện |
| Degradation | Mạng sâu hơn có **training error cao hơn** mạng nông hơn | Bài toán tối ưu trở nên khó hơn |

Batch Normalization và cách khởi tạo trọng số phù hợp đã giảm đáng kể khó khăn do gradient. Tuy nhiên, nhóm tác giả ResNet quan sát thấy plain network sâu hơn vẫn có training error cao hơn. Vì vậy, degradation không thể chỉ được giải thích bằng overfitting, và cũng không hoàn toàn đồng nhất với vanishing gradient.

Đây là điểm xuất phát của ResNet: thay vì tiếp tục thay optimizer hoặc chỉ tăng dữ liệu, hãy **đổi cách tham số hóa hàm mà mỗi nhóm layer phải học**.

## 3. Residual learning: Học phần cần thay đổi

Giả sử một nhóm layer cần học ánh xạ mong muốn $H(\mathbf{x})$. Trong plain network, các layer phải xấp xỉ trực tiếp:

$$
H(\mathbf{x}).
$$

ResNet định nghĩa một residual function:

$$
\mathcal{F}(\mathbf{x}) = H(\mathbf{x}) - \mathbf{x}.
$$

Suy ra ánh xạ ban đầu có thể được viết lại thành:

$$
H(\mathbf{x}) = \mathcal{F}(\mathbf{x}) + \mathbf{x}.
$$

Nhánh chính gồm các convolutional layer học $\mathcal{F}(\mathbf{x})$. Một nhánh tắt đưa trực tiếp $\mathbf{x}$ tới phép cộng ở cuối block:

![So sánh một block thông thường với residual block có shortcut connection](https://d2l.ai/_images/residual-block.svg)
*So sánh regular block và residual block. Nguồn: [Dive into Deep Learning](https://d2l.ai/chapter_convolutional-modern/resnet.html).*

Nếu các layer mới không cần thay đổi biểu diễn, nghiệm mong muốn chỉ là:

$$
\mathcal{F}(\mathbf{x}) \approx \mathbf{0}.
$$

Nhóm tác giả **đưa ra giả thuyết và cung cấp bằng chứng thực nghiệm** rằng tối ưu residual mapping trong tình huống này dễ hơn bắt một chuỗi layer phi tuyến học lại identity mapping từ đầu. Đây là một lập luận về optimization, không phải định lý bảo đảm mọi residual network đều huấn luyện thành công.

### “Residual” thực sự có nghĩa là gì?

Trong ngữ cảnh này, residual không phải sai số giữa nhãn thật và dự đoán cuối cùng. Nó là **phần thay đổi mà một block cần thêm vào biểu diễn hiện có**.

Ví dụ, nếu đầu vào của block đã biểu diễn cạnh và texture khá tốt, block không cần xây dựng một biểu diễn hoàn toàn mới. Nó chỉ cần học phần hiệu chỉnh hữu ích rồi cộng phần đó vào đầu vào.

## 4. Shortcut connection giúp gradient đi như thế nào?

Xét một residual block đơn giản:

$$
\mathbf{y} = \mathcal{F}(\mathbf{x}, W) + \mathbf{x}.
$$

Với loss $L$, gradient truyền về đầu vào có dạng:

$$
\frac{\partial L}{\partial \mathbf{x}}
=
\frac{\partial L}{\partial \mathbf{y}}
\left(
I + \frac{\partial \mathcal{F}}{\partial \mathbf{x}}
\right),
$$

trong đó $I$ là identity matrix. Thành phần $I$ tạo ra một đường truyền trực tiếp cho tín hiệu gradient, thay vì buộc gradient chỉ đi qua toàn bộ chuỗi phép biến đổi trong $\mathcal{F}$.

Điều này giúp giải thích vì sao shortcut connection hỗ trợ tối ưu mạng sâu. Tuy nhiên, cần diễn đạt thận trọng: residual connection **không bảo đảm** gradient sẽ không bao giờ biến mất hoặc bùng nổ. Hành vi thực tế còn phụ thuộc vào activation, normalization, initialization, optimizer và kiến trúc tổng thể.

Một identity shortcut không có tham số và gần như không tạo thêm chi phí tính toán đáng kể. Phần tốn chi phí vẫn nằm ở các convolutional layer trên nhánh residual.

## 5. Khi nào có thể cộng $\mathcal{F}(\mathbf{x})$ với $\mathbf{x}$?

Phép cộng theo từng phần tử yêu cầu hai tensor có cùng shape. Nếu:

$$
\mathbf{x} \in \mathbb{R}^{H \times W \times C},
$$

thì đầu ra của nhánh residual cũng phải có kích thước $H \times W \times C$.

Khi chiều cao, chiều rộng hoặc số channel thay đổi, ResNet sử dụng một **projection shortcut**, thường là convolution $1\times1$:

$$
\mathbf{y} = \mathcal{F}(\mathbf{x}, W) + W_s\mathbf{x}.
$$

Ví dụ, để chuyển tensor từ $56\times56\times64$ thành $28\times28\times128$, nhánh residual có thể dùng stride 2. Nhánh shortcut đồng thời dùng convolution $1\times1$, stride 2 để tạo tensor cùng shape trước khi cộng.

Convolution $1\times1$ ở đây không quan sát thêm vùng không gian xung quanh. Nó chủ yếu chiếu vector channel tại mỗi vị trí sang số chiều mới và, nếu có stride lớn hơn 1, thực hiện downsampling.

## 6. Basic block và bottleneck block

Không phải mọi phiên bản ResNet đều dùng cùng một loại block.

### 6.1 Basic block

ResNet-18 và ResNet-34 sử dụng basic block gồm hai convolution $3\times3$:

![Residual block khi giữ nguyên kích thước và khi dùng convolution 1 nhân 1 để thay đổi shape](https://d2l.ai/_images/resnet-block.svg)
*Residual block khi giữ nguyên shape và khi dùng convolution $1\times1$ trên shortcut. Nguồn: [Dive into Deep Learning](https://d2l.ai/chapter_convolutional-modern/resnet.html).*

Nếu đầu vào và đầu ra cùng shape, shortcut là identity. Nếu shape thay đổi, shortcut có thể dùng projection.

### 6.2 Bottleneck block

ResNet-50, ResNet-101 và ResNet-152 dùng bottleneck block gồm ba convolution:

$$
1\times1 \rightarrow 3\times3 \rightarrow 1\times1.
$$

![So sánh basic block và bottleneck block trong ResNet](https://miro.medium.com/v2/resize%3Afit%3A1400/1%2A5zjekWLfWyP3g3O1lMrX1g.png)
*So sánh basic block và bottleneck block. Nguồn: [The ResNet Revolution](https://medium.com/nextgenllm/the-resnet-revolution-how-microsoft-solved-deep-learnings-biggest-problem-5264747592d9).*

- Convolution $1\times1$ đầu tiên giảm số channel để giảm chi phí cho phép tích chập $3\times3$.
- Convolution $3\times3$ xử lý quan hệ không gian.
- Convolution $1\times1$ cuối cùng mở rộng số channel trở lại trước phép cộng.

Tên “bottleneck” chỉ phần biểu diễn trung gian có số channel nhỏ hơn, giống như cổ chai. Cấu trúc này cho phép tăng độ sâu mà vẫn kiểm soát số phép tính tốt hơn so với việc dùng toàn bộ convolution $3\times3$ ở số channel lớn.

## 7. ResNet-18, 34, 50, 101 và 152 khác nhau thế nào?

Sau convolution đầu vào, ResNet thường tổ chức thành bốn stage. Trong mỗi stage, các block duy trì cùng độ phân giải; khi chuyển stage, độ phân giải không gian thường giảm còn số channel tăng.

| Kiến trúc | Loại block | Số block ở bốn stage | Đặc điểm |
| --- | --- | --- | --- |
| ResNet-18 | Basic | $[2,2,2,2]$ | Nhẹ, phù hợp làm baseline hoặc thử nghiệm nhanh |
| ResNet-34 | Basic | $[3,4,6,3]$ | Sâu hơn nhưng vẫn dùng hai convolution mỗi block |
| ResNet-50 | Bottleneck | $[3,4,6,3]$ | Dùng block ba layer, phổ biến cho transfer learning |
| ResNet-101 | Bottleneck | $[3,4,23,3]$ | Stage thứ ba sâu hơn đáng kể |
| ResNet-152 | Bottleneck | $[3,8,36,3]$ | Phiên bản rất sâu trong bài báo gốc |

Con số 50 trong “ResNet-50” là số layer có trọng số theo quy ước của bài báo, không phải số residual block. Vì bottleneck block có ba convolution, ResNet-50 có thể dùng cùng cấu hình số block $[3,4,6,3]$ như ResNet-34 nhưng vẫn có tổng số layer lớn hơn.

Không nên mặc định phiên bản sâu hơn luôn tốt hơn cho mọi bài toán. Lựa chọn còn phụ thuộc vào kích thước dữ liệu, độ phân giải ảnh, latency, bộ nhớ và việc mô hình có được pretrain hay không.

## 8. Một residual block tối giản bằng PyTorch

Đoạn mã dưới đây minh họa basic block khi input và output có cùng số channel và cùng kích thước không gian:

```python
import torch
from torch import nn


class BasicBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.residual = nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
        )
        self.activation = nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.activation(self.residual(x) + x)
```

Có ba chi tiết đáng chú ý:

1. `padding=1` với kernel $3\times3$ và stride 1 giúp giữ nguyên $H$ và $W$.
2. Số channel đầu vào và đầu ra giống nhau nên có thể cộng trực tiếp với `x`.
3. Đây là minh họa cho **post-activation block** trong ResNet gốc. Những biến thể pre-activation về sau thay đổi thứ tự Batch Normalization, ReLU và convolution.

Đoạn mã này giúp hiểu cơ chế, nhưng chưa phải triển khai hoàn chỉnh của ResNet. Một mô hình đầy đủ còn cần projection shortcut, downsampling giữa các stage, initialization và classification head.

## 9. ResNet đã chứng minh điều gì?

Trong bài báo gốc, nhóm tác giả so sánh plain network với residual network trên ImageNet và CIFAR-10. Kết quả thực nghiệm cho thấy:

- Plain network sâu hơn có thể chịu degradation: training error tăng khi thêm layer.
- Residual formulation giúp các mạng rất sâu dễ tối ưu hơn trong thiết lập được thử nghiệm.
- Biểu diễn học được từ ResNet chuyển sang các tác vụ detection, localization và segmentation có hiệu quả tốt.
- ResNet-152 sâu hơn VGG nhưng có độ phức tạp tính toán thấp hơn VGG-16 theo phép đo FLOPs được báo cáo trong bài báo.

Các kết quả trên là **empirical evidence**, không phải chứng minh rằng residual connection luôn là lựa chọn tối ưu cho mọi dataset và kiến trúc.

## 10. ResNet không giải quyết mọi vấn đề

Residual connection là một thiết kế mạnh, nhưng vẫn có giới hạn:

- Mạng sâu tiếp tục tiêu tốn bộ nhớ và thời gian tính toán.
- Batch Normalization có thể không ổn định khi batch size quá nhỏ nếu không điều chỉnh phù hợp.
- Tăng độ sâu không bảo đảm cải thiện khi dữ liệu ít hoặc bài toán đơn giản.
- Shortcut giúp optimization nhưng không tự ngăn overfitting, data leakage hay phân phối dữ liệu bị lệch.
- Accuracy cao hơn chưa chắc phù hợp nếu hệ thống bị ràng buộc bởi latency hoặc năng lượng.

Vì vậy, một thí nghiệm nghiêm túc nên so sánh ResNet với baseline đơn giản hơn dưới cùng preprocessing, augmentation, training budget và protocol đánh giá. Chỉ so sánh các con số lấy từ những bài báo khác nhau thường không đủ để kết luận kiến trúc nào tốt hơn.

## 11. Ảnh hưởng của residual connection

Ý tưởng cộng đầu vào với một phép biến đổi học được không chỉ tồn tại trong image classification. Residual connection xuất hiện rộng rãi trong object detection, semantic segmentation, generative models và Transformer.

Tuy nhiên, việc nhiều kiến trúc cùng dùng phép cộng tắt không có nghĩa chúng giống ResNet ở mọi khía cạnh. Vị trí normalization, activation, cách thay đổi số chiều và mục tiêu của từng block có thể rất khác nhau.

Nghiên cứu tiếp theo của chính nhóm tác giả về **identity mappings** đề xuất pre-activation residual unit, trong đó Batch Normalization và ReLU được đặt trước convolution. Kết quả này cho thấy residual connection không phải một công thức bất biến; cách tổ chức đường truyền tín hiệu quanh shortcut cũng ảnh hưởng đáng kể tới khả năng tối ưu.

## 12. Tổng kết

Đóng góp cốt lõi của ResNet không đơn thuần là xây dựng một CNN có thật nhiều layer. Điểm quan trọng hơn là **đổi bài toán từ học trực tiếp $H(\mathbf{x})$ sang học phần residual $\mathcal{F}(\mathbf{x}) = H(\mathbf{x})-\mathbf{x}$**, đồng thời duy trì một đường identity để truyền biểu diễn và gradient.

Ba ý cần ghi nhớ là:

1. Degradation được nhận diện qua training error và không đồng nghĩa với overfitting.
2. Shortcut connection giúp tối ưu mạng sâu nhưng không bảo đảm loại bỏ mọi vấn đề về gradient.
3. Basic block và bottleneck block phục vụ các mức độ sâu và chi phí tính toán khác nhau.

ResNet là cầu nối phù hợp giữa CNN cơ bản và các hệ thống Computer Vision phức tạp hơn. Từ nền tảng này, chúng ta có thể tiếp tục tìm hiểu cách backbone ResNet được sử dụng trong **object detection**, nơi mô hình không chỉ trả lời “trong ảnh có gì?” mà còn phải xác định “vật thể nằm ở đâu?”.

---

### Nguồn tham khảo

[1] K. He, X. Zhang, S. Ren, and J. Sun, [*Deep Residual Learning for Image Recognition*](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html), CVPR 2016, pp. 770–778.

[2] K. He, X. Zhang, S. Ren, and J. Sun, [*Identity Mappings in Deep Residual Networks*](https://arxiv.org/abs/1603.05027), ECCV 2016.

