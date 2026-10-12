---
title: "Feature Pyramid Network: Phát hiện vật thể ở nhiều kích thước"
description: "Giải thích bottom-up pathway, top-down pathway và lateral connection trong FPN, cùng vai trò của feature pyramid trong object detection."
pubDate: "2026-11-20"
draft: true
tags: ["fpn", "object detection", "computer vision"]
---

Một người ở gần camera có thể chiếm nửa ảnh; cùng người đó ở xa chỉ còn vài chục pixel. Scale variation là thách thức cốt lõi của object detection. Feature Pyramid Network (FPN) xây dựng các feature map vừa có semantic mạnh vừa có nhiều resolution.

![So sánh featurized image pyramid, một feature map duy nhất, pyramidal feature hierarchy và Feature Pyramid Network](https://static.wikidocs.net/images/page/162467/13_FPN.png)
*Bốn chiến lược xử lý scale: FPN tái sử dụng hierarchy của backbone rồi bổ sung đường top-down, thay vì chạy backbone nhiều lần trên image pyramid. Nguồn nội dung: [FPN paper, CVPR 2017](https://openaccess.thecvf.com/content_cvpr_2017/html/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.html).*

## 1. Vì sao một feature map là chưa đủ?

Layer nông của CNN có resolution cao nhưng semantic yếu. Layer sâu có semantic mạnh nhưng resolution thấp. Nếu chỉ dự đoán trên layer cuối:

- Vật thể lớn có thể được biểu diễn tốt.
- Vật thể nhỏ dễ biến mất sau nhiều lần downsampling.

Một image pyramid truyền thống resize ảnh thành nhiều scale rồi chạy feature extractor nhiều lần. Cách này hữu ích nhưng tốn compute và memory.

## 2. Ý tưởng của FPN

FPN tận dụng chính hierarchy sẵn có trong backbone. Nó gồm:

1. **Bottom-up pathway:** forward pass bình thường của CNN.
2. **Top-down pathway:** upsample feature semantic mạnh từ tầng sâu.
3. **Lateral connection:** kết hợp feature top-down với feature cùng resolution từ bottom-up.

Kết quả là các mức $P_2,P_3,P_4,P_5$ có resolution khác nhau nhưng đều nhận semantic cấp cao.

![Bottom-up pathway, top-down pathway và lateral connections trong FPN](https://noisrucer.github.io/assets/img/paper/fpn/fpn1.png)
*Feature sâu được upsample và cộng với feature cùng scale qua lateral connection để tạo pyramid giàu semantic. Nguồn sơ đồ: [Noisrucer—Feature Pyramid Networks](https://noisrucer.github.io/posts/FPN/); kiến trúc gốc: [Lin et al.](https://openaccess.thecvf.com/content_cvpr_2017/html/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.html).*

## 3. Bottom-up pathway

Với ResNet, thường lấy output của các stage $C_2,C_3,C_4,C_5$. Mỗi stage giảm resolution khoảng một nửa so với stage trước.

Các feature này đã tồn tại trong backbone nên không cần chạy ảnh nhiều lần. Tuy nhiên, $C_2$ có chi tiết tốt nhưng chưa giàu semantic như $C_5$.

## 4. Top-down và lateral connection

Từ mức sâu nhất:

$$
P_l = \operatorname{Conv}_{1\times1}(C_l)
+ \operatorname{Up}(P_{l+1}).
$$

Convolution $1\times1$ điều chỉnh số channel; upsampling đưa feature sâu về cùng spatial size. Sau phép cộng, convolution $3\times3$ thường được dùng để giảm aliasing từ upsampling.

Lateral connection ở đây là phép cộng giữa hai feature cùng scale, không giống concatenation trong U-Net gốc.

## 5. Gán vật thể cho pyramid level

Các vật thể nhỏ được dự đoán trên feature map resolution cao; vật thể lớn ở mức resolution thấp hơn. Trong region-based detector, RoI có thể được gán mức dựa trên kích thước:

$$
k=\left\lfloor k_0+log_2\left(\frac{\sqrt{wh}}{224}\right)\right\rfloor,
$$

sau đó clamp về phạm vi level hợp lệ. Công thức cụ thể phụ thuộc implementation.

Trực giác là giữ kích thước biểu diễn của object trên feature map trong phạm vi hợp lý.

## 6. FPN không chỉ dành cho Faster R-CNN

FPN là một feature extractor đa tỷ lệ tổng quát. Nó được sử dụng trong:

- Region Proposal Network.
- Detection head của two-stage detector.
- One-stage detector.
- Instance segmentation.
- Keypoint estimation và dense prediction.

Tên các biến thể như PANet hoặc BiFPN thay đổi hướng fusion, số lần kết hợp và trọng số giữa các scale. Không nên đánh đồng chúng với FPN gốc.

## 7. FPN giải quyết được small-object detection chưa?

FPN cải thiện representation đa tỷ lệ nhưng không loại bỏ hoàn toàn khó khăn:

- Vật thể có thể chỉ gồm vài pixel, thiếu thông tin nhận diện.
- Annotation của vật thể nhỏ thường không ổn định.
- Resize và compression có thể phá hủy tín hiệu.
- Positive sample assignment có thể quá ít.
- NMS có thể loại nhầm vật thể gần nhau.

Nếu small-object AP thấp, chỉ thêm FPN chưa đủ; cần phân tích data resolution, tiling, assignment và loss.

## 8. Chi phí tính toán

FPN tái sử dụng backbone nên rẻ hơn chạy image pyramid độc lập, nhưng không miễn phí. Các feature map resolution cao tiêu tốn activation memory; detection head chạy trên nhiều level tăng compute.

Khi triển khai edge device, cần đo latency và peak memory end-to-end thay vì chỉ FLOPs của backbone.

## 9. Ablation cần thiết

Để chứng minh FPN hữu ích trên dataset riêng:

1. So sánh detector cùng backbone có và không FPN.
2. Giữ training schedule và augmentation giống nhau.
3. Báo AP small/medium/large.
4. Kiểm tra số parameter, FLOPs, latency và memory.
5. Phân tích từng pyramid level nhận bao nhiêu positive sample.

Nếu chỉ mAP tổng tăng, chưa đủ kết luận cải thiện đến từ vật thể nhỏ.

## 10. Tổng kết

FPN kết hợp spatial detail của layer nông với semantic của layer sâu bằng top-down pathway và lateral connections. Nó biến hierarchy tự nhiên của CNN thành feature pyramid có thể dự đoán ở nhiều scale với chi phí bổ sung tương đối nhỏ so với image pyramid đầy đủ.

Từ đây, chuỗi bài chuyển sang một họ kiến trúc khác: [Vision Transformer](/blog/vision-transformer-vit/).

---

### Nguồn tham khảo

[1] T.-Y. Lin et al., [*Feature Pyramid Networks for Object Detection*](https://openaccess.thecvf.com/content_cvpr_2017/html/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.html), CVPR 2017.

[2] S. Ren et al., [*Faster R-CNN*](https://proceedings.neurips.cc/paper/2015/hash/14bfa6bb14875e45bba028a21ed38046-Abstract.html), NeurIPS 2015.

[3] K. He et al., [*Mask R-CNN*](https://openaccess.thecvf.com/content_iccv_2017/html/He_Mask_R-CNN_ICCV_2017_paper.html), ICCV 2017.

