---
title: "CNN và Vision Transformer: Khác nhau ở inductive bias nào?"
description: "So sánh CNN và Vision Transformer về locality, equivariance, data efficiency, computational cost và cách thiết kế thí nghiệm công bằng."
pubDate: "2026-11-28"
draft: true
tags: ["cnn", "vision transformer", "computer vision"]
---

CNN và Vision Transformer không chỉ khác nhau ở phép convolution và self-attention. Chúng mã hóa các giả định khác nhau về cấu trúc ảnh. Những giả định này—inductive bias—ảnh hưởng tới data efficiency, optimization và khả năng mở rộng.

Bài viết giả định bạn đã đọc [CNN cơ bản](/blog/tim-hieu-ve-cnn-trong-deep-learning/) và [Vision Transformer](/blog/vision-transformer-vit/).

![Phép cross-correlation hai chiều với kernel cục bộ trong CNN](https://d2l.ai/_images/correlation.svg)
*Convolution dùng một kernel nhỏ trượt trên lưới ảnh, qua đó mã hóa locality và weight sharing ngay trong phép toán. Nguồn: [Dive into Deep Learning—Convolutions for Images](https://en.d2l.ai/chapter_convolutional-neural-networks/conv-layer.html).*

## 1. So sánh nhanh

| Khía cạnh | CNN | ViT thuần |
| --- | --- | --- |
| Phép toán chính | Convolution | Self-attention + MLP |
| Tương tác ban đầu | Cục bộ | Toàn cục giữa token |
| Weight sharing | Theo kernel không gian | Theo projection của token |
| Translation equivariance | Mạnh hơn về kiến trúc | Không được mã hóa cùng cách |
| Thông tin vị trí | Cấu trúc lưới | Positional embedding |
| Chi phí theo token/pixel | Gần tuyến tính với spatial size cho kernel cố định | Attention chuẩn bậc hai theo số token |
| Data requirement | Thường hiệu quả hơn khi dữ liệu hạn chế | ViT gốc hưởng lợi mạnh từ pretraining lớn |

Bảng này mô tả khuynh hướng, không phải định luật. ConvNet hiện đại có attention; Vision Transformer phân cấp có locality và windowing.

## 2. Locality

Kernel $3\times3$ của CNN chỉ tương tác với vùng lân cận. Global context hình thành dần khi xếp nhiều layer. Đây là giả định rằng pattern cục bộ như cạnh và texture có giá trị.

Self-attention cho phép token tương tác toàn cục ngay từ block đầu. Nhưng khả năng kết nối toàn cục không bảo đảm mô hình sẽ học quan hệ hữu ích; nó chỉ mở rộng không gian hàm và tăng yêu cầu tối ưu.

![Vision Transformer xử lý ảnh dưới dạng chuỗi patch token](https://www.d2l.ai/_images/vit.svg)
*ViT thay cửa sổ convolution cục bộ bằng chuỗi patch token và self-attention; positional embedding phải mang thông tin về bố cục không gian. Nguồn: [Dive into Deep Learning—Vision Transformer](https://www.d2l.ai/chapter_attention-mechanisms-and-transformers/vision-transformer.html).*

## 3. Translation equivariance

Một convolution lý tưởng có tính equivariant với phép tịnh tiến: dịch input dẫn tới feature map dịch tương ứng. Pooling hoặc stride có thể làm tính chất này chỉ còn xấp xỉ.

ViT dùng patch partition và positional embedding nên không có cùng bias. Dịch ảnh vài pixel có thể thay đổi patch membership. Augmentation và thiết kế position encoding giúp giảm vấn đề nhưng không biến ViT thành CNN.

## 4. Data efficiency

Inductive bias mạnh giới hạn hypothesis space, thường hữu ích khi dữ liệu ít và giả định phù hợp. CNN không phải học locality từ đầu.

ViT linh hoạt hơn nhưng paper gốc đạt kết quả nổi bật khi pretrain ở quy mô lớn. DeiT cho thấy training recipe và distillation có thể giảm data requirement. Vì vậy tuyên bố “Transformer luôn cần nhiều dữ liệu hơn” là quá tuyệt đối.

## 5. Receptive field và attention

CNN sâu có receptive field lý thuyết lớn nhưng effective receptive field có thể tập trung ở vùng nhỏ hơn. ViT có global attention, song attention score không đồng nghĩa mọi token đóng góp ngang nhau.

Khi cần dense prediction resolution cao, attention $N^2$ trở nên đắt. Window-based hoặc hierarchical Transformer thu hẹp tương tác để kiểm soát chi phí—tức là đưa locality trở lại thiết kế.

## 6. Compute không thể so bằng parameter count

Hai model cùng số parameter có thể có:

- FLOPs khác nhau.
- Activation memory khác nhau.
- Mức tận dụng GPU khác nhau.
- Latency khác theo batch size.
- Chi phí preprocessing khác.

CNN có kernel được tối ưu rất tốt trên nhiều phần cứng. Attention có thể đạt throughput cao trên accelerator nhưng gặp memory bottleneck với chuỗi dài. Benchmark phải chạy trên target hardware.

## 7. Robustness và shape–texture bias

Một số nghiên cứu ghi nhận khác biệt về texture, shape và robustness giữa architecture/training recipe. Nhưng khó quy toàn bộ cho convolution hay attention vì augmentation, dataset scale và pretraining objective đồng thời thay đổi.

Để kết luận kiến trúc gây ra robustness, cần factorial design hoặc ablation kiểm soát các yếu tố này. Chỉ so một pretrained ResNet với một pretrained ViT từ nguồn khác không đủ.

## 8. Khi nên bắt đầu với CNN?

- Dataset nhỏ hoặc trung bình.
- Hạn chế compute.
- Cần baseline dễ huấn luyện.
- Deployment trên phần cứng tối ưu convolution.
- Spatial locality phù hợp bài toán.

ResNet là baseline mạnh vì hệ sinh thái, checkpoint và hành vi tối ưu đã được hiểu khá rõ.

## 9. Khi nên thử ViT?

- Có pretrained checkpoint phù hợp domain.
- Dữ liệu hoặc pretraining đủ lớn.
- Cần scale model và compute.
- Quan hệ toàn cục có thể quan trọng.
- Hệ thống downstream đã dùng Transformer representation.

Đây là điều kiện để thử, không phải bảo đảm ViT thắng.

## 10. Thiết kế thí nghiệm công bằng

1. Dùng cùng train/validation/test split.
2. So cả pretrained và from-scratch nếu claim liên quan kiến trúc.
3. Match training compute, không chỉ số epoch.
4. Tune mỗi họ với budget tương đương.
5. Báo accuracy, calibration, latency và memory.
6. Dùng nhiều seed.
7. Phân tích learning curve theo lượng dữ liệu.

Một thí nghiệm đặc biệt có giá trị là huấn luyện với 1%, 10%, 50% và 100% dữ liệu. Nó cho thấy kiến trúc nào hiệu quả ở từng data regime thay vì chỉ cho một điểm cuối.

## 11. Kết luận

CNN mã hóa locality và weight sharing mạnh; ViT ưu tiên cơ chế tương tác token linh hoạt và global. Không có kiến trúc thống trị độc lập với dữ liệu, pretraining, metric và phần cứng.

Trong thực hành, câu hỏi khoa học tốt là: **với cùng evidence budget, inductive bias nào giúp tổng quát hóa tốt hơn trên target distribution?**

Bài cuối của series xem cách representation có thể được học từ ảnh không nhãn: [Self-Supervised Learning trong Computer Vision](/blog/self-supervised-learning-computer-vision/).

---

### Nguồn tham khảo

[1] A. Dosovitskiy et al., [*An Image Is Worth 16×16 Words*](https://arxiv.org/abs/2010.11929), ICLR 2021.

[2] H. Touvron et al., [*Training Data-Efficient Image Transformers & Distillation Through Attention*](https://proceedings.mlr.press/v139/touvron21a.html), ICML 2021.

[3] S. d'Ascoli et al., [*ConViT: Improving Vision Transformers with Soft Convolutional Inductive Biases*](https://proceedings.mlr.press/v139/d-ascoli21a.html), ICML 2021.

