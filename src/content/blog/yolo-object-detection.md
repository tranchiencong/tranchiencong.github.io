---
title: "YOLO hoạt động như thế nào? Tư duy one-stage object detection"
description: "Giải thích tư duy cốt lõi của YOLO, từ grid prediction và confidence đến loss, NMS, ưu điểm, giới hạn và cách đánh giá công bằng."
pubDate: "2026-10-26"
draft: true
tags: ["yolo", "object detection", "computer vision"]
---

[R-CNN family](/blog/r-cnn-fast-r-cnn-faster-r-cnn/) tách detection thành proposal và phân loại. YOLO đặt câu hỏi khác: liệu một network có thể nhìn toàn bộ ảnh một lần và dự đoán trực tiếp các bounding box cùng class probability hay không?

YOLO là viết tắt của **You Only Look Once**. Ý tưởng quan trọng không phải một phiên bản thư viện cụ thể, mà là cách nhìn object detection như một bài toán dự đoán thống nhất trên toàn ảnh.

![Kiến trúc YOLOv1 từ ảnh đầu vào tới tensor dự đoán 7 nhân 7 nhân 30](https://seunghan96.github.io/assets/img/cv/cv74.png)
*YOLOv1 tạo toàn bộ box và class predictions trong một forward pass. Nguồn: [YOLO v1 Architecture Review](https://seunghan96.github.io/dl/cv/cv-YOLO-v1/).*

## 1. YOLOv1 đã thay đổi cách đặt bài toán

YOLOv1 chia ảnh thành lưới $S\times S$. Nếu tâm của một vật thể nằm trong cell nào, cell đó chịu trách nhiệm dự đoán vật thể. Mỗi cell dự đoán $B$ box, confidence và class probabilities.

Một box gồm:

$$
(x,y,w,h,\text{confidence}).
$$

Trong paper gốc, confidence được thiết kế để phản ánh cả xác suất có object và độ khớp IoU:

$$
\Pr(\text{Object})\times
\operatorname{IoU}^{\text{truth}}_{\text{pred}}.
$$

Tại inference, class probability và box confidence được kết hợp thành class-specific score, sau đó thresholding và NMS tạo kết quả cuối.

Với PASCAL VOC có $C=20$, $S=7$ và $B=2$, output có kích thước:

$$
7\times7\times(B\cdot5+C)=7\times7\times30.
$$

Con số này thuộc YOLOv1. Các phiên bản sau dùng nhiều feature scale và cách tổ chức head khác, nên không nên dùng tensor $7\times7\times30$ để mô tả mọi YOLO.

## 2. Vì sao one-stage có thể nhanh?

YOLO tránh pipeline proposal bên ngoài và không chạy classifier riêng trên từng region. Toàn ảnh đi qua một network, phần lớn phép tính convolution được chia sẻ.

Nhưng “one-stage” không có nghĩa đúng một layer hay không có hậu xử lý. Một hệ thống thực tế vẫn có backbone, neck, detection head, decode và thường có NMS.

### Backbone, neck và head

- **Backbone** trích feature từ ảnh.
- **Neck** kết hợp feature đa tỷ lệ, thường theo tư tưởng feature pyramid.
- **Head** tạo class, objectness và box predictions.

Phân chia này hữu ích để phân tích bottleneck. Thay backbone làm thay đổi representation; thay neck ảnh hưởng multi-scale fusion; thay head/loss ảnh hưởng assignment và decoding.

## 3. Nhìn toàn ảnh mang lại gì?

Vì prediction được tạo từ feature của toàn ảnh, YOLO có thể sử dụng global context. Paper YOLOv1 báo cáo ít nhầm background thành object hơn Fast R-CNN trong phân tích lỗi của họ, nhưng lại có nhiều lỗi localization hơn.

Kết luận này thuộc thiết lập thực nghiệm lịch sử, không nên khái quát rằng mọi YOLO hiện đại luôn có cùng profile lỗi.

## 4. Loss của detector gồm nhiều mục tiêu

Detector phải tối ưu đồng thời:

$$
L = \lambda_{\mathrm{box}}L_{\mathrm{box}}
+ \lambda_{\mathrm{obj}}L_{\mathrm{obj}}
+ \lambda_{\mathrm{cls}}L_{\mathrm{cls}}.
$$

- $L_{\mathrm{box}}$ đo sai lệch vị trí và kích thước.
- $L_{\mathrm{obj}}$ học objectness/confidence.
- $L_{\mathrm{cls}}$ học lớp của đối tượng.

Tỷ trọng các loss ảnh hưởng mạnh tới training. Background location áp đảo foreground nên detector cần cơ chế cân bằng; nếu không, nghiệm dự đoán “không có vật thể” ở mọi nơi có thể chi phối gradient.

YOLOv1 dùng sum-squared error cho nhiều thành phần và tăng trọng số localization đồng thời giảm trọng số no-object. Detector hiện đại thường dùng BCE/focal-style classification/objectness loss và IoU-based box loss. Đây là thay đổi quan trọng, không chỉ là điều chỉnh kỹ thuật nhỏ.

## 5. Từ grid cell tới multi-scale prediction

YOLOv1 có giới hạn khi nhiều vật thể nhỏ có tâm rơi vào cùng cell. Các thế hệ detector về sau phát triển multi-scale feature, anchor-based hoặc anchor-free prediction, feature pyramid và loss tốt hơn.

Không nên mô tả toàn bộ “YOLO” bằng chi tiết của YOLOv1. Tên YOLO hiện bao phủ nhiều dòng implementation có thiết kế và giấy phép khác nhau. Khi báo cáo nghiên cứu phải ghi rõ phiên bản, repository, checkpoint, input size và commit.

## 6. Anchor-based và anchor-free

**Anchor-based head** dự đoán offset quanh các prior box. Anchor shapes có thể được thiết kế thủ công hoặc fit từ dataset.

**Anchor-free head** dự đoán trực tiếp tâm, khoảng cách tới biên hoặc distribution của box. Anchor-free giảm số hyperparameter anchor nhưng không loại bỏ assignment problem: vẫn phải quyết định location nào chịu trách nhiệm cho ground truth.

Không thể suy ra accuracy hay tốc độ chỉ từ nhãn anchor-free. Implementation và training recipe thường quan trọng hơn phân loại này.

## 7. NMS vẫn quan trọng

Dense prediction tạo nhiều box gần nhau. NMS giữ box score cao và loại box cùng lớp có IoU vượt ngưỡng. Hai tham số thường bị dùng sai là confidence threshold và NMS IoU threshold.

Nếu điều chỉnh chúng trên test set, kết quả bị test-set tuning. Nên chọn threshold trên validation set và báo cả precision–recall thay vì một operating point thuận lợi.

![Luồng hậu xử lý YOLO từ raw boxes qua confidence threshold và NMS](https://airoads.org/img/course/ch10-yolo-threshold-nms-map.webp)
*Thresholding và NMS biến dense predictions thành tập detection cuối. Nguồn: [AI Roads — YOLO Series](https://airoads.org/zh-cn/ch10-computer-vision/ch03-detection/03-yolo-series/).*

### Class-aware hay class-agnostic NMS?

Class-aware NMS chỉ so box cùng lớp; class-agnostic NMS so mọi box. Class-agnostic có thể xóa duplicate được gán hai lớp khác nhau, nhưng có nguy cơ xóa hai vật thể khác lớp chồng nhau. Lựa chọn phải dựa trên confusion pattern của validation data.

## 8. Tốc độ phải được đo thế nào?

FPS không có ý nghĩa nếu thiếu:

- GPU/CPU và phiên bản runtime.
- Batch size.
- FP32, FP16 hay INT8.
- Có tính preprocessing, data transfer và NMS hay không.
- Kích thước đầu vào.
- Warm-up và số lần lặp.

Một benchmark chỉ đo forward pass trên GPU không đại diện đầy đủ cho latency end-to-end của camera application.

Ngoài median latency, nên báo p95 hoặc p99 nếu ứng dụng real-time. Throughput cao với batch lớn không đồng nghĩa một frame đơn lẻ có latency thấp.

## 9. Khi nào YOLO phù hợp?

YOLO-style detector phù hợp khi cần pipeline gọn và throughput cao: video analytics, robotics hoặc edge deployment. Nhưng lựa chọn phải dựa trên constraint thực tế:

- Nếu vật thể rất nhỏ, cần kiểm tra AP theo scale.
- Nếu sai sót có chi phí cao, cần calibration và error analysis.
- Nếu thiết bị hạn chế, model size chưa đủ; cần đo RAM, activation memory và năng lượng.
- Nếu dữ liệu khác domain pretraining, cần đánh giá domain shift.

## 10. Data assignment và label quality

Dense detector cần gán mỗi ground truth cho một hoặc nhiều prediction locations. Assignment quá hẹp tạo ít positive; quá rộng tạo prediction trùng và conflict.

Label quality đặc biệt quan trọng:

- Box quá lỏng làm box regression học không nhất quán.
- Vật thể không được annotate biến prediction đúng thành false positive trong evaluation.
- Quy ước occlusion/truncation không thống nhất tạo noise.
- Class hierarchy mơ hồ làm classification loss mâu thuẫn.

Trước khi đổi model, nên visualize random batch sau augmentation cùng transformed boxes.

## 11. Một protocol so sánh hợp lý

Để so YOLO với Faster R-CNN:

1. Dùng cùng dataset split và annotation.
2. Giữ input resolution và augmentation budget càng tương đương càng tốt.
3. Báo COCO-style AP, AP50, AP75 và AP theo scale.
4. Đo latency trên cùng phần cứng và pipeline.
5. Lặp nhiều seed nếu dataset nhỏ.
6. Phân tích precision–recall và confusion theo lớp.

Nếu một mô hình nhanh hơn nhưng giảm mạnh recall cho lớp quan trọng, “tốt hơn” còn phụ thuộc mục tiêu hệ thống.

## 12. Failure modes

| Dấu hiệu | Nguyên nhân khả dĩ | Kiểm tra |
| --- | --- | --- |
| Bỏ sót vật thể nhỏ | Feature stride hoặc resolution | AP-small, tăng input/tiling pilot |
| Box đúng nhưng score thấp | Calibration hoặc class imbalance | Reliability diagram, score histogram |
| Nhiều box trùng | NMS/assignment | Sweep NMS trên validation |
| Sai lớp tương tự | Label ambiguity | Confusion matrix và audit annotation |
| Train tốt, external test kém | Domain shift | Đánh giá theo site/camera/time |

## 13. Reproducibility checklist

Cần lưu phiên bản code, model config, pretrained weights, image size, augmentation, optimizer, schedule, seed, EMA setting, mixed precision, confidence/NMS threshold và evaluator. Chỉ ghi “dùng YOLO” là không đủ để tái lập.

## 14. Tổng kết

YOLO thống nhất localization và classification trong một mạng xử lý toàn ảnh. Đóng góp nền tảng của YOLOv1 là formulation one-stage và khả năng suy luận real-time trong bối cảnh lúc đó. Những phiên bản sau thay đổi đáng kể cách dự đoán, backbone và loss, nên phải được định danh chính xác.

Trước khi áp dụng detector vào dataset riêng, bài tiếp theo trình bày một kỹ thuật thực dụng: [Transfer Learning với ResNet](/blog/transfer-learning-voi-resnet/).

---

### Nguồn tham khảo

[1] J. Redmon et al., [*You Only Look Once: Unified, Real-Time Object Detection*](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html), CVPR 2016.

[2] J. Redmon and A. Farhadi, [*YOLO9000: Better, Faster, Stronger*](https://openaccess.thecvf.com/content_cvpr_2017/html/Redmon_YOLO9000_Better_Faster_CVPR_2017_paper.html), CVPR 2017.

[3] Z. Zheng et al., [*Distance-IoU Loss: Faster and Better Learning for Bounding Box Regression*](https://arxiv.org/abs/1911.08287), AAAI 2020.

