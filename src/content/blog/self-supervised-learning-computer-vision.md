---
title: "Self-Supervised Learning trong Computer Vision: SimCLR, DINO và MAE"
description: "Tìm hiểu cách học biểu diễn từ ảnh không nhãn qua contrastive learning, self-distillation và masked image modeling."
pubDate: "2026-12-02"
draft: true
tags: ["self-supervised learning", "representation learning", "computer vision"]
---

Gán nhãn ảnh—đặc biệt bounding box và segmentation mask—rất tốn kém. Self-Supervised Learning (SSL) tận dụng chính dữ liệu chưa gán nhãn để tạo tín hiệu huấn luyện, sau đó chuyển representation sang downstream task.

“Self-supervised” không có nghĩa không cần dữ liệu, compute hay đánh giá bằng nhãn. Nhãn được bỏ khỏi giai đoạn pretraining, nhưng downstream evaluation thường vẫn cần annotation.

## 1. Mục tiêu representation learning

Ta muốn encoder:

$$
\mathbf{z}=f_\theta(\mathbf{x})
$$

học feature giữ thông tin hữu ích cho nhiều task. Sau pretraining, chất lượng được đánh giá bằng:

- Linear probing: đóng băng encoder, học linear classifier.
- Fine-tuning: cập nhật encoder cho target task.
- k-NN evaluation.
- Transfer sang detection hoặc segmentation.

Linear probe cao không bảo đảm fine-tuning hoặc dense transfer tốt; mỗi protocol đo một thuộc tính khác nhau.

## 2. Pretext task

SSL tạo bài toán mà target có thể suy ra từ input:

- Dự đoán quan hệ giữa hai augmentation.
- Khôi phục patch bị che.
- Dự đoán rotation hoặc transformation.
- Self-distillation giữa nhiều view.

Nếu pretext task quá dễ, mô hình học shortcut. Nếu augmentation phá hủy semantic cần giữ, representation cũng có thể mất thông tin quan trọng.

## 3. SimCLR và contrastive learning

SimCLR tạo hai view $\tilde{x}_i,\tilde{x}_j$ từ cùng ảnh bằng augmentation. Encoder và projection head tạo representation; contrastive loss kéo positive pair lại gần và đẩy các sample khác ra xa.

![Pipeline SimCLR với hai augmented views, encoder, projection head và contrastive objective](https://1.bp.blogspot.com/--vH4PKpE9Yo/Xo4a2BYervI/AAAAAAAAFpM/vaFDwPXOyAokAC8Xh852DzOgEs22NhbXwCLcBGAsYHQ/s1600/image4.gif)
*Hai augmentation của cùng ảnh tạo positive pair; projection head phục vụ contrastive objective và được bỏ khi chuyển sang downstream task. Nguồn: [Google Research—SimCLR repository](https://github.com/google-research/simclr).*

Một dạng NT-Xent loss:

$$
\ell_{i,j}=-\log
\frac{
\exp(\operatorname{sim}(z_i,z_j)/\tau)
}{
\sum_{k\ne i}
\exp(\operatorname{sim}(z_i,z_k)/\tau)
}.
$$

$\tau$ là temperature. Augmentation composition, projection head, batch size và training duration đều ảnh hưởng mạnh. Vì vậy “chỉ cần contrastive loss” là mô tả thiếu.

## 4. Positive và negative không hoàn toàn đúng nghĩa

Hai crop từ cùng ảnh được coi là positive dù có thể chứa hai vật thể khác nhau. Hai ảnh khác được coi là negative dù có thể cùng semantic class. Đây là label noise do cách tạo cặp.

Large batch cung cấp nhiều negative nhưng tăng compute. Memory bank, momentum encoder hoặc phương pháp không cần explicit negative là những hướng khác.

## 5. DINO: self-distillation không nhãn

DINO huấn luyện student khớp distribution của teacher trên nhiều view. Teacher được cập nhật bằng exponential moving average của student, kết hợp centering và sharpening để tránh collapse.

Với Vision Transformer, DINO paper quan sát self-attention map có thể làm nổi bật object region dù không dùng segmentation label. Đây là empirical observation thú vị, nhưng attention map không phải ground-truth explanation và không thay thế đánh giá segmentation chuẩn.

## 6. MAE: masked image modeling

Masked Autoencoder che tỷ lệ lớn patch, đưa phần patch nhìn thấy vào encoder rồi dùng decoder nhẹ để tái tạo pixel bị che.

Hai đặc điểm cốt lõi:

- Encoder chỉ xử lý visible patches, giảm compute trong pretraining.
- Decoder bị loại bỏ sau pretraining.

Paper MAE sử dụng masking ratio cao, chẳng hạn 75%, vì ảnh có redundancy không gian lớn. Nhưng ratio tối ưu có thể phụ thuộc domain và patch size.

![Masked Autoencoder khôi phục các patch ảnh bị che](https://user-images.githubusercontent.com/11435359/146857310-f258c86c-fde6-48e8-9cee-badd2b21bd2c.png)
*MAE chỉ đưa các patch nhìn thấy vào encoder rồi dùng decoder nhẹ để tái tạo phần bị che. Nguồn: [Meta Research—MAE repository](https://github.com/facebookresearch/mae).*

## 7. So sánh ba hướng

| Phương pháp | Tín hiệu chính | Thành phần nhạy cảm |
| --- | --- | --- |
| SimCLR | So sánh các view | Augmentation, negative, batch size |
| DINO | Student–teacher consistency | Teacher momentum, centering, multi-crop |
| MAE | Khôi phục patch bị che | Mask ratio, decoder, reconstruction target |

Không thể kết luận phương pháp nào tốt nhất chỉ bằng ImageNet linear probe. Downstream task, compute và data domain quyết định lựa chọn.

## 8. Representation collapse

Một nghiệm suy biến là encoder ánh xạ mọi ảnh về cùng vector. Khi đó consistency loss có thể nhỏ nhưng representation vô dụng.

Contrastive methods dùng negative để chống collapse. Non-contrastive methods dựa vào asymmetry, stop-gradient, teacher momentum, normalization hoặc các cơ chế kết hợp. Cơ chế chính xác cần được phân tích theo từng phương pháp; không nên nói “EMA tự động ngăn collapse” như một định luật chung.

## 9. Data curation vẫn quan trọng

Dữ liệu không nhãn có thể chứa:

- Duplicate và near-duplicate.
- Thông tin riêng tư.
- Bias theo nguồn thu thập.
- Nội dung ngoài domain.
- Test-set contamination.

Quy mô lớn không sửa được distribution bias. SSL có thể học và khuếch đại shortcut tồn tại trong dữ liệu.

## 10. Protocol thực nghiệm

Một nghiên cứu SSL nên có:

1. Random-init baseline.
2. Supervised-pretraining baseline nếu có.
3. Linear probe và full fine-tuning.
4. Cùng encoder capacity và downstream recipe.
5. Pretraining compute được báo cáo rõ.
6. Ablation augmentation/masking.
7. Transfer tới nhiều data regime và domain.
8. Nhiều seed cho downstream dataset nhỏ.

Nếu SSL dùng compute gấp nhiều lần supervised baseline, cần báo trade-off thay vì chỉ so accuracy.

## 11. Khi nào SSL đáng theo đuổi?

SSL đặc biệt hợp lý khi có nhiều dữ liệu không nhãn cùng domain nhưng annotation ít. Một cheap falsification test là pretrain trên subset nhỏ rồi so linear probe và fine-tuning với ImageNet pretrained hoặc random initialization.

Nếu lợi ích không xuất hiện ở pilot có kiểm soát, chưa nên mở rộng pretraining tốn kém. Ngược lại, nếu representation cải thiện rõ ở low-label regime, đây là bằng chứng để tăng quy mô.

## 12. Tổng kết

SimCLR học bằng contrastive views, DINO dùng self-distillation, còn MAE khôi phục patch bị che. Cả ba đều biến cấu trúc của dữ liệu thành supervision, nhưng dựa trên giả định khác nhau và có failure mode khác nhau.

SSL không loại bỏ nhu cầu về thiết kế thí nghiệm. Giá trị của representation chỉ được chứng minh khi nó transfer tốt dưới protocol công bằng và trên distribution thực sự quan tâm.

---

### Nguồn tham khảo

[1] T. Chen et al., [*A Simple Framework for Contrastive Learning of Visual Representations*](https://proceedings.mlr.press/v119/chen20j.html), ICML 2020.

[2] M. Caron et al., [*Emerging Properties in Self-Supervised Vision Transformers*](https://openaccess.thecvf.com/content/ICCV2021/html/Caron_Emerging_Properties_in_Self-Supervised_Vision_Transformers_ICCV_2021_paper.html), ICCV 2021.

[3] K. He et al., [*Masked Autoencoders Are Scalable Vision Learners*](https://openaccess.thecvf.com/content/CVPR2022/html/He_Masked_Autoencoders_Are_Scalable_Vision_Learners_CVPR_2022_paper.html), CVPR 2022.

