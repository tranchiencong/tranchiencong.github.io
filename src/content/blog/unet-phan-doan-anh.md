---
title: "U-Net: Kiến trúc encoder–decoder cho phân đoạn ảnh"
description: "Tìm hiểu contracting path, expanding path và skip connection trong U-Net, cùng các lưu ý về loss, dữ liệu và đánh giá segmentation."
pubDate: "2026-11-10"
draft: true
tags: ["u-net", "image segmentation", "computer vision"]
---

[Semantic segmentation](/blog/semantic-instance-panoptic-segmentation/) cần vừa hiểu **đối tượng là gì** vừa giữ được **vị trí pixel chính xác**. Đây là một mâu thuẫn thiết kế: feature sâu có semantic mạnh nhưng resolution thấp; feature nông giữ chi tiết nhưng semantic yếu.

U-Net giải quyết bằng kiến trúc encoder–decoder đối xứng và skip connection giữa các mức resolution tương ứng.

![Kiến trúc U-Net với contracting path, bottleneck, expanding path và skip connection](https://lmb.informatik.uni-freiburg.de/people/ronneber/u-net/u-net-architecture.png)
*Sơ đồ U-Net gốc: encoder ở bên trái, decoder ở bên phải và các feature map được copy qua skip connection. Nguồn: [University of Freiburg—U-Net](https://lmb.informatik.uni-freiburg.de/people/ronneber/u-net/).*

## 1. Bối cảnh của U-Net

U-Net được Ronneberger, Fischer và Brox giới thiệu cho biomedical image segmentation năm 2015. Kiến trúc được thiết kế trong bối cảnh dữ liệu gán nhãn hạn chế và sử dụng augmentation mạnh.

Thành công về sau của U-Net trên nhiều domain không chứng minh rằng nó luôn tối ưu. Đóng góp quan trọng là một pattern kiến trúc rõ ràng cho dense prediction.

## 2. Contracting path — encoder

Encoder lặp lại các block convolution và downsampling:

$$
(H,W,C)
\rightarrow
\left(\frac H2,\frac W2,2C\right).
$$

Khi đi xuống:

- Spatial resolution giảm.
- Receptive field tăng.
- Số channel thường tăng.
- Representation chuyển từ chi tiết cục bộ sang context trừu tượng.

Encoder có thể được xây từ đầu hoặc thay bằng backbone pretrained như ResNet. Thay backbone làm thay đổi capacity, normalization và resolution hierarchy, nên cần xem đó là một biến thể chứ không còn đúng nguyên bản U-Net.

## 3. Expanding path — decoder

Decoder tăng dần resolution bằng transposed convolution hoặc upsampling kết hợp convolution. Mục tiêu là biến feature map thô thành prediction $H\times W\times K$.

Upsampling chỉ khôi phục kích thước tensor, không tự phục hồi thông tin chi tiết đã mất. Vì vậy U-Net cần skip connection.

## 4. Skip connection trong U-Net

Feature từ encoder được chuyển sang decoder ở cùng scale và **concatenate** theo chiều channel:

$$
\mathbf{z}^{(l)}_{mathrm{dec}}
=
\operatorname{Concat}
\left(
\operatorname{Up}(\mathbf{z}^{(l+1)}_{mathrm{dec}}),
\mathbf{z}^{(l)}_{mathrm{enc}}
\right).
$$

Điều này khác residual connection trong [ResNet](/blog/tim-hieu-resnet-trong-computer-vision/), nơi hai nhánh thường được cộng. U-Net skip truyền spatial detail; ResNet shortcut chủ yếu thay đổi cách tham số hóa và đường tối ưu.

## 5. Vì sao hình chữ U?

Sơ đồ kiến trúc có encoder ở trái, bottleneck phía dưới và decoder ở phải. Các skip connection nối ngang tạo hình chữ U. Tên gọi mô tả bố cục chứ không phải một phép toán mới.

U-Net gốc dùng valid convolution nên feature encoder phải crop trước khi concatenate. Nhiều implementation hiện đại dùng padding để giữ kích thước. Hai implementation vì vậy có thể cho output shape và border behavior khác nhau.

## 6. Output head và loss

Với $K$ lớp loại trừ nhau, head thường tạo $K$ logits mỗi pixel rồi dùng softmax cross-entropy. Với multi-label mask, sigmoid theo channel phù hợp hơn.

Loss phổ biến:

$$
L=\lambda_{CE}L_{CE}+\lambda_D L_{Dice}.
$$

Dice loss giúp xử lý foreground nhỏ, còn cross-entropy giữ supervision theo pixel. Tuy nhiên, weight loss phải được chọn trên validation data, không dựa vào test performance.

![Ví dụ semantic mask được chồng lên ảnh đầu vào](https://docs.pytorch.org/vision/main/_images/sphx_glr_plot_visualization_utils_008.png)
*Một semantic segmentation pipeline trả về score theo lớp tại mỗi pixel rồi chuyển thành mask để trực quan hóa. Hình này minh họa dạng đầu ra, không phải kết quả riêng của U-Net. Nguồn: [Torchvision visualization utilities](https://docs.pytorch.org/vision/main/auto_examples/others/plot_visualization_utils.html).*

## 7. Transposed convolution có phải deconvolution?

Transposed convolution không phải phép nghịch đảo thực sự của convolution. Nó là linear operator có cấu trúc liên quan đến chuyển vị của ma trận convolution.

Nếu kernel và stride không phối hợp tốt, output có thể xuất hiện checkerboard artifact. Resize-convolution là một lựa chọn khác, nhưng không có phương pháp nào mặc định tốt hơn trong mọi dataset.

## 8. Dữ liệu ít không có nghĩa U-Net chắc chắn tốt

Paper gốc nhấn mạnh augmentation để tận dụng annotation ít. Nhưng một vài ảnh không đủ nếu variation giữa bệnh nhân hoặc thiết bị lớn.

Cần phân biệt:

- Nhiều patch lấy từ ít ảnh.
- Nhiều ảnh từ ít subject.
- Nhiều subject độc lập.

Số patch lớn không làm tăng độc lập thống kê tương ứng. Split phải thực hiện trước patch extraction.

## 9. Đánh giá U-Net

Ngoài Dice và mIoU, có thể cần:

- Boundary F-score hoặc Hausdorff distance khi biên quan trọng.
- Sensitivity cho vùng tổn thương.
- Object-level recall nếu cần đếm instance.
- Calibration nếu probability map đi vào quyết định tiếp theo.
- Kết quả theo scanner, site hoặc subgroup.

Nên báo mean và uncertainty trên đơn vị độc lập như subject, không chỉ gộp mọi pixel.

## 10. Các biến thể

U-Net++, Attention U-Net, 3D U-Net và nnU-Net mở rộng các khía cạnh khác nhau. Không nên coi danh sách biến thể là bằng chứng cải thiện. Một so sánh công bằng cần giữ split, augmentation, backbone và training budget nhất quán.

Đặc biệt, nnU-Net là framework tự cấu hình pipeline dựa trên dataset, không đơn thuần là một block kiến trúc.

## 11. Tổng kết

U-Net kết hợp context từ encoder với localization detail từ các skip connection. Điểm mạnh của nó là decomposition rõ ràng và phù hợp dense prediction; điểm yếu nằm ở chi phí feature map độ phân giải cao và sensitivity với protocol dữ liệu.

Ở detection, một ý tưởng multi-scale liên quan nhưng khác mục tiêu là [Feature Pyramid Network](/blog/feature-pyramid-network-fpn/).

---

### Nguồn tham khảo

[1] O. Ronneberger, P. Fischer, and T. Brox, [*U-Net: Convolutional Networks for Biomedical Image Segmentation*](https://arxiv.org/abs/1505.04597), MICCAI 2015.

[2] J. Long, E. Shelhamer, and T. Darrell, [*Fully Convolutional Networks for Semantic Segmentation*](https://openaccess.thecvf.com/content_cvpr_2015/html/Long_Fully_Convolutional_Networks_2015_CVPR_paper.html), CVPR 2015.

[3] F. Isensee et al., [*nnU-Net: A Self-configuring Method for Deep Learning-based Biomedical Image Segmentation*](https://www.nature.com/articles/s41592-020-01008-z), Nature Methods, 2021.

