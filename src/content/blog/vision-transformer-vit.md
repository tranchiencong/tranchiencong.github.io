---
title: "Vision Transformer: Biến ảnh thành chuỗi patch như thế nào?"
description: "Tìm hiểu patch embedding, positional embedding, class token và self-attention trong Vision Transformer, cùng chi phí và giới hạn của ViT."
pubDate: "2026-11-25"
draft: true
tags: ["vision transformer", "transformer", "computer vision"]
---

CNN xây dựng feature bằng convolution cục bộ và weight sharing. Vision Transformer (ViT) chọn một cách biểu diễn khác: chia ảnh thành các patch, biến mỗi patch thành một token rồi xử lý chuỗi token bằng Transformer encoder.

Paper ViT cho thấy một Transformer gần với kiến trúc NLP có thể đạt kết quả rất mạnh cho image classification khi được pretrain trên dữ liệu đủ lớn rồi transfer sang benchmark nhỏ hơn. Điều kiện về dữ liệu là phần quan trọng của kết luận, không phải chi tiết phụ.

![Kiến trúc Vision Transformer từ patch embedding qua Transformer encoder đến classification head](https://www.d2l.ai/_images/vit.svg)
*Ảnh được chia thành patch, chiếu thành token, thêm class token và đi qua nhiều Transformer encoder block. Nguồn: [Dive into Deep Learning—Vision Transformer](https://www.d2l.ai/chapter_attention-mechanisms-and-transformers/vision-transformer.html).*

## 1. Từ ảnh thành patch

Với ảnh kích thước $H\times W\times C$ và patch vuông $P\times P$, số patch là:

$$
N=\frac{HW}{P^2}.
$$

Mỗi patch được flatten thành vector độ dài $P^2C$, sau đó chiếu tuyến tính vào embedding dimension $D$:

$$
\mathbf{z}_0=
[\mathbf{x}_{\mathrm{class}};
\mathbf{x}_p^1E;
\ldots;
\mathbf{x}_p^NE]
+E_{\mathrm{pos}}.
$$

Trong thực thi, patch embedding có thể được viết thành convolution kernel $P$, stride $P$. Điều này tạo đúng các patch không chồng lấn và projection trong một phép toán.

## 2. Patch size là một trade-off

Patch nhỏ tạo chuỗi dài hơn và giữ chi tiết tốt hơn. Patch lớn giảm số token nhưng có thể làm mất vật thể nhỏ hoặc boundary.

Ví dụ với ảnh $224\times224$:

- Patch $16\times16$: $N=196$ token ảnh.
- Patch $8\times8$: $N=784$ token ảnh.

Self-attention tiêu chuẩn có ma trận attention $N\times N$, nên giảm patch size làm chi phí attention tăng nhanh.

## 3. Vì sao cần positional embedding?

Self-attention tự thân không biết patch nào ở góc trái hay góc phải. Positional embedding được cộng vào token để cung cấp thông tin vị trí.

ViT gốc sử dụng learned one-dimensional positional embeddings. Khi fine-tune ở resolution khác, positional embeddings có thể được nội suy. Nội suy là lựa chọn triển khai cần được báo cáo vì nó ảnh hưởng transfer.

## 4. Class token

Một token học được $[\mathrm{CLS}]$ được thêm vào đầu chuỗi. Sau nhiều Transformer block, representation của token này được đưa vào classification head.

Class token không phải lựa chọn bắt buộc về mặt nguyên lý. Global average pooling trên patch tokens là một biến thể khả dĩ. Khi so sánh, cần tách ảnh hưởng của pooling choice khỏi backbone tổng thể.

## 5. Multi-head self-attention

Từ input $X$, mô hình tạo query, key và value:

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V.
$$

Scaled dot-product attention:

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d_k}}
\right)V.
$$

Mỗi patch có thể tổng hợp thông tin từ mọi patch khác ngay trong một block. Multi-head attention cho phép nhiều không gian projection học các quan hệ khác nhau.

![Cơ chế multi-head attention gồm nhiều attention head hoạt động song song](https://www.d2l.ai/_images/multi-head-attention.svg)
*Mỗi head dùng projection riêng cho query, key và value; kết quả các head được concatenate rồi chiếu về output. Nguồn: [Dive into Deep Learning—Multi-Head Attention](https://www.d2l.ai/chapter_attention-mechanisms-and-transformers/multihead-attention.html).*

Không nên diễn giải attention weight trực tiếp như lời giải thích nhân quả. Một heatmap đẹp không chứng minh feature đó là nguyên nhân của prediction.

## 6. Transformer encoder block

Mỗi block gồm Layer Normalization, multi-head self-attention, MLP và residual connection:

$$
\mathbf{z}'_l=
\operatorname{MSA}(\operatorname{LN}(\mathbf{z}_{l-1}))
+\mathbf{z}_{l-1},
$$

$$
\mathbf{z}_l=
\operatorname{MLP}(\operatorname{LN}(\mathbf{z}'_l))
+\mathbf{z}'_l.
$$

Đây là pre-normalization. Residual connection liên hệ trực tiếp với ý tưởng đã gặp trong [ResNet](/blog/tim-hieu-resnet-trong-computer-vision/), dù phép biến đổi bên trong block khác nhau.

## 7. ViT-B/16 có nghĩa gì?

- **B**: cấu hình Base.
- **16**: patch size $16\times16$.

Các cấu hình Base, Large và Huge khác embedding dimension, số layer và số attention head. So sánh chỉ bằng tên model có thể sai nếu resolution và pretraining dataset khác nhau.

## 8. Inductive bias

CNN có locality và translation equivariance được mã hóa trong convolution. ViT thuần có inductive bias không gian yếu hơn; quan hệ giữa patch chủ yếu được học từ dữ liệu và positional encoding.

Điều này mang lại flexibility nhưng thường khiến ViT gốc nhạy hơn với data scale và training recipe. DeiT cho thấy augmentation, regularization và distillation có thể huấn luyện image Transformer hiệu quả hơn trên ImageNet-1K mà không cần external pretraining như trong thiết lập ViT ban đầu.

## 9. Chi phí và giới hạn

Attention toàn cục có độ phức tạp theo số token khoảng:

$$
\mathcal{O}(N^2D).
$$

Với ảnh resolution cao hoặc dense prediction, $N$ lớn gây áp lực memory. Window attention, hierarchical Transformer và token reduction là các hướng giảm chi phí, nhưng chúng thay đổi kiến trúc so với ViT gốc.

Patchification cũng tạo ranh giới nhân tạo. Mô hình có thể cần nhiều dữ liệu hoặc cơ chế đa tỷ lệ để xử lý tốt cấu trúc cục bộ và vật thể nhỏ.

## 10. Đánh giá ViT đúng cách

- So sánh cùng pretraining data và compute.
- Ghi rõ resolution, patch size và augmentation.
- Không trộn checkpoint supervised với self-supervised mà không nêu rõ.
- Báo throughput, latency và peak memory, không chỉ parameter count.
- Kiểm tra robustness và domain shift thay vì chỉ in-distribution accuracy.

## 11. Tổng kết

ViT biến ảnh thành chuỗi patch embedding, thêm vị trí rồi dùng Transformer encoder để học quan hệ toàn cục. Thành công của nó đến từ cả kiến trúc, quy mô pretraining và training recipe. Vì vậy câu hỏi phù hợp không phải “ViT có thay thế CNN không?”, mà là “inductive bias và resource profile nào phù hợp với dữ liệu của ta?”.

Bài tiếp theo phân tích trực tiếp: [CNN và Vision Transformer khác nhau thế nào?](/blog/cnn-va-vision-transformer/)

---

### Nguồn tham khảo

[1] A. Dosovitskiy et al., [*An Image Is Worth 16×16 Words: Transformers for Image Recognition at Scale*](https://arxiv.org/abs/2010.11929), ICLR 2021.

[2] A. Vaswani et al., [*Attention Is All You Need*](https://proceedings.neurips.cc/paper/7181-attention-is-all-you-need), NeurIPS 2017.

[3] H. Touvron et al., [*Training Data-Efficient Image Transformers & Distillation Through Attention*](https://proceedings.mlr.press/v139/touvron21a.html), ICML 2021.

