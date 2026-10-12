---
title: "Object Detection là gì? Hiểu IoU, NMS và mAP"
description: "Tìm hiểu bài toán phát hiện vật thể, cách biểu diễn bounding box và ba khái niệm quan trọng khi đánh giá detector: IoU, NMS và mAP."
pubDate: "2026-10-12"
draft: false
tags: ["object detection", "computer vision", "deep learning"]
---

Trong image classification, mô hình trả lời câu hỏi: **ảnh này chứa đối tượng gì?** Object detection khó hơn vì phải đồng thời trả lời: **có những đối tượng nào và chúng nằm ở đâu?**

Bài toán này là bước tiếp theo tự nhiên sau [CNN](/blog/tim-hieu-ve-cnn-trong-deep-learning/) và [ResNet](/blog/tim-hieu-resnet-trong-computer-vision/). Một backbone có thể trích xuất feature map tốt, nhưng detector còn cần định vị, phân loại nhiều vật thể và loại bỏ các dự đoán trùng lặp.

## 1. Đầu ra của object detector

Với mỗi vật thể, detector thường dự đoán:

$$
(x_1,y_1,x_2,y_2,c,s),
$$

trong đó $(x_1,y_1)$ và $(x_2,y_2)$ là hai góc của bounding box, $c$ là lớp và $s$ là confidence score. Một cách biểu diễn khác là $(x_c,y_c,w,h)$ gồm tâm, chiều rộng và chiều cao.

Không có cách biểu diễn nào tự động tốt hơn trong mọi trường hợp. Điều quan trọng là quá trình encode, decode và chuẩn hóa tọa độ phải nhất quán giữa nhãn, loss và inference.

### Tọa độ tuyệt đối và tọa độ chuẩn hóa

Tọa độ tuyệt đối được đo bằng pixel. Tọa độ chuẩn hóa chia $x$ cho chiều rộng ảnh và $y$ cho chiều cao ảnh, đưa giá trị về khoảng $[0,1]$. Chuẩn hóa thuận tiện khi ảnh có kích thước khác nhau, nhưng cần chuyển đổi chính xác sau resize, crop, letterbox hoặc padding.

Một lỗi triển khai phổ biến là augment ảnh nhưng không biến đổi box tương ứng. Horizontal flip phải thay đổi tọa độ $x$; crop phải cắt và có thể loại box; resize không bảo toàn aspect ratio sẽ làm thay đổi cả hình dạng vật thể.

## 2. Classification, localization và detection

| Bài toán | Số đối tượng | Đầu ra |
| --- | ---: | --- |
| Image classification | Thường giả định một nhãn chính | Nhãn ảnh |
| Classification + localization | Thường một đối tượng chính | Nhãn và một box |
| Object detection | Không cố định | Nhiều nhãn, box và score |
| Instance segmentation | Không cố định | Nhãn và mask cho từng instance |

Object detection không đơn thuần là chạy classifier trên mọi crop. Số crop khả dĩ quá lớn, vật thể có nhiều tỷ lệ, và các box chồng lấn tạo ra rất nhiều dự đoán lặp.

## 3. Intersection over Union — IoU

IoU đo mức độ chồng lấn giữa box dự đoán $B_p$ và ground-truth box $B_g$:

$$
\operatorname{IoU}(B_p,B_g)
=
\frac{|B_p\cap B_g|}{|B_p\cup B_g|}.
$$

IoU bằng 0 khi hai box không giao nhau và bằng 1 khi trùng khít. Nếu diện tích giao là 60 và diện tích hợp là 100 thì IoU bằng 0.6.

![Minh họa Intersection over Union giữa prediction và ground-truth bounding box](https://doc.edgefirst.ai/test/models/assets/metrics/iou_visualization.png)
*IoU lấy diện tích phần giao chia cho diện tích phần hợp của hai bounding box. Nguồn: [EdgeFirst Studio Documentation](https://doc.edgefirst.ai/test/models/validation/metrics/detection/classifications/).*

Với hai box ở dạng góc, kích thước phần giao được tính bằng:

$$
w_I=\max\left(0,\min(x_2^p,x_2^g)-\max(x_1^p,x_1^g)\right),
$$

$$
h_I=\max\left(0,\min(y_2^p,y_2^g)-\max(y_1^p,y_1^g)\right).
$$

Diện tích giao là $A_I=w_Ih_I$. Phép `max(0, ·)` rất quan trọng: nếu hai box không giao nhau, chiều rộng hoặc chiều cao không thể mang diện tích âm.

Các công thức trên xem tọa độ box là tọa độ liên tục. Một số codebase cũ dùng chỉ số pixel bao hàm cả hai đầu và xuất hiện số hạng `+1` khi tính chiều rộng, chiều cao. Hai convention đều có thể dùng, nhưng không được trộn lẫn giữa encode, decode và evaluator.

Tại một ngưỡng IoU đánh giá cố định, prediction đúng lớp và được ghép với ground truth chưa sử dụng có thể trở thành true positive. Confidence score quyết định thứ tự prediction trên đường precision–recall; một score threshold cố định chủ yếu phục vụ pre-filter hoặc lựa chọn operating point khi triển khai. Vì vậy, nói mô hình “đúng lớp” vẫn chưa đủ: box quá lệch có thể bị tính là false positive.

IoU cũng có giới hạn. Hai box không giao nhau đều cho IoU bằng 0 dù khoảng cách giữa chúng khác nhau. Các loss như GIoU, DIoU và CIoU được đề xuất để cung cấp tín hiệu tối ưu hữu ích hơn, nhưng metric đánh giá và loss huấn luyện không nhất thiết phải giống nhau.

## 4. Vì sao cần Non-Maximum Suppression?

Một detector thường tạo nhiều box quanh cùng một vật thể. Non-Maximum Suppression (NMS) là bước hậu xử lý phổ biến:

1. Loại sớm các box có score quá thấp nếu cần kiểm soát chi phí.
2. Chọn box có confidence cao nhất.
3. Giữ box đó làm kết quả.
4. Loại các box cùng lớp có IoU với nó lớn hơn ngưỡng NMS.
5. Lặp lại với các box còn lại.

NMS giải quyết dự đoán trùng, nhưng có thể loại nhầm khi hai vật thể cùng lớp đứng sát nhau. Soft-NMS giảm score thay vì xóa cứng; các detector khác có thể dùng biến thể learned NMS hoặc thiết kế set prediction để giảm phụ thuộc vào NMS.

![Các bước sắp xếp score, tính IoU và loại box trùng trong Non-Maximum Suppression](https://miro.medium.com/v2/resize%3Afit%3A4048/1%2A4IO0iUac6htIsBWI1CexJg.png)
*Minh họa quy trình NMS dựa trên confidence và IoU. Nguồn: [Distance-IoU Loss Explained](https://medium.com/@jacksonchou/distance-iou-loss-faster-and-better-learning-for-box-regression-9df8fc627e8).*

Pseudo-code tối giản:

```python
keep = []
boxes = sort_by_score_descending(boxes)

while boxes:
    best = boxes.pop(0)
    keep.append(best)
    boxes = [
        box for box in boxes
        if box.class_id != best.class_id
        or iou(box, best) <= nms_threshold
    ]
```

Trong hệ thống nhiều lớp, NMS thường chạy độc lập theo lớp. Class-agnostic NMS có thể giảm duplicate giữa các lớp nhưng cũng có thể xóa nhầm hai vật thể khác lớp chồng lên nhau.

Ba threshold sau có ý nghĩa khác nhau:

| Threshold | Vai trò |
| --- | --- |
| Score threshold | Loại prediction có độ tin cậy thấp khi inference hoặc deployment |
| NMS IoU threshold | Quyết định hai prediction có bị xem là trùng nhau hay không |
| Evaluation IoU threshold | Quyết định prediction có định vị đủ tốt để ghép với ground truth hay không |

Với detector dùng NMS, evaluator thường nhận các detection đã hậu xử lý. Vì vậy NMS có thể làm thay đổi precision–recall và AP. Khi so sánh mô hình, cần giữ nhất quán cả score pre-filter, NMS variant và `max detections`.

## 5. Precision và Recall trong detection

Sau khi ghép prediction với ground truth theo lớp và ngưỡng IoU:

$$
\mathrm{Precision}=\frac{TP}{TP+FP},\qquad
\mathrm{Recall}=\frac{TP}{TP+FN}.
$$

- Giảm confidence threshold thường tăng recall nhưng cũng tạo thêm false positive.
- Tăng threshold thường tăng precision nhưng có thể bỏ sót vật thể.

Do detector tạo ra các prediction có score khác nhau, chỉ báo cáo precision tại một threshold tùy ý là chưa đủ. Để tính AP, evaluator sắp prediction theo score và tạo đường precision–recall khi lần lượt chấp nhận thêm prediction.

### Ghép prediction với ground truth

Việc đếm $TP$, $FP$, $FN$ cần một matching protocol. Phiên bản đơn giản hóa thường được mô tả như sau:

1. Xét riêng từng lớp.
2. Sắp prediction theo confidence giảm dần.
3. Ghép prediction với ground truth chưa được ghép có IoU lớn nhất.
4. Nếu IoU vượt threshold, đánh dấu true positive.
5. Prediction trùng với ground truth đã được ghép vẫn là false positive.

Quy tắc “mỗi ground truth chỉ ghép một lần” ngăn detector nhận thưởng vì dự đoán cùng vật thể nhiều lần.

Evaluator chính thức có thể thêm các quy tắc về annotation `ignore`, vùng `crowd`, phạm vi diện tích và số detection tối đa trên mỗi ảnh. Do đó, quy trình trên giúp hiểu nguyên lý nhưng không thay thế implementation chính thức của benchmark.

## 6. Average Precision và mAP

Average Precision (AP) tóm tắt đường precision–recall của một lớp tại một ngưỡng IoU. Cách interpolation và lấy mẫu recall phụ thuộc evaluator. Mean Average Precision lấy trung bình AP trên các lớp:

$$
\mathrm{mAP}=\frac{1}{C}\sum_{c=1}^{C}\mathrm{AP}_c.
$$

Nhưng “mAP” không phải một con số có định nghĩa duy nhất:

- **AP50** hoặc $AP^{IoU=.50}$: AP tại IoU $0.50$, thường gắn với protocol PASCAL VOC.
- **AP75** hoặc $AP^{IoU=.75}$: tiêu chuẩn localization nghiêm ngặt hơn.
- **AP@[.50:.95]**: trung bình AP trên 10 ngưỡng IoU từ $0.50$ đến $0.95$ với bước $0.05$; đây là metric chính của COCO.
- **AP small/medium/large**: AP theo phạm vi diện tích vật thể do evaluator định nghĩa.

Vì vậy, hai con số “mAP = 50” có thể không so sánh được nếu dùng protocol khác nhau. Một báo cáo nghiêm túc phải ghi rõ dataset, split, IoU range, kích thước ảnh và single-scale hay multi-scale testing.

![Minh họa đường precision–recall và cách Average Precision tóm tắt chất lượng detector](https://doc.edgefirst.ai/test/models/assets/metrics/mAP.png)
*Với một IoU threshold cố định, prediction được xếp theo confidence để tạo precision–recall curve; AP tóm tắt đường cong và mAP lấy trung bình theo lớp, đồng thời có thể lấy trung bình thêm theo nhiều IoU threshold. Nguồn: [EdgeFirst Object Detection Metrics](https://doc.edgefirst.ai/test/models/validation/metrics/detection/).*

### AP không chỉ là trung bình precision

AP được tính từ đường precision–recall sau khi sắp prediction theo score. Các benchmark có thể dùng interpolation khác nhau. PASCAL VOC 2007 từng dùng 11 recall points; COCO evaluator lấy precision đã nội suy tại 101 recall thresholds, đồng thời áp dụng các thiết lập như IoU range, area range và `maxDets`.

Vì vậy, không nên tự viết vài dòng tính “mAP” rồi so trực tiếp với leaderboard nếu chưa tái hiện đúng evaluator chính thức. Cách an toàn là dùng evaluation code của benchmark và pin version.

## 7. One-stage và two-stage detector

**Two-stage detector** trước tiên tạo region proposal, sau đó phân loại và tinh chỉnh từng vùng. R-CNN family là ví dụ điển hình.

**One-stage detector** dự đoán box và lớp trực tiếp trên feature map trong một pipeline thống nhất. YOLO là đại diện nổi tiếng.

Đây không phải phân chia tuyệt đối giữa “chậm nhưng chính xác” và “nhanh nhưng kém”. Kết quả còn phụ thuộc backbone, input resolution, implementation, hardware và training recipe. Chỉ so sánh tên họ mô hình là không đủ.

## 8. Đọc thêm: loss cho bounding-box regression

Tối ưu trực tiếp $L_1$ hoặc Smooth $L_1$ trên tọa độ không hoàn toàn khớp với metric IoU. Hai box có sai số tọa độ tương tự có thể có IoU rất khác nếu kích thước vật thể khác nhau.

Các IoU-based loss tối ưu hình học box trực tiếp hơn:

- **GIoU** bổ sung vùng bao nhỏ nhất khi hai box không giao nhau.
- **DIoU** thêm khoảng cách giữa tâm hai box.
- **CIoU** còn xét aspect ratio.

Không có loss nào mặc định tối ưu cho mọi detector. Cần so dưới cùng assignment rule và training schedule.

## 9. Thiết kế thí nghiệm detection đúng cách

Một thí nghiệm nên kiểm soát:

- Cùng train/validation/test split.
- Không tune confidence hay NMS threshold trên test set.
- Cùng input size và augmentation budget khi so sánh.
- Báo cáo latency với batch size, phần cứng và precision rõ ràng.
- Tách kết quả theo lớp và kích thước vật thể.
- Phân tích false positive do localization, classification và background.

Nếu chỉ báo cáo một mAP tổng, ta khó biết mô hình thực sự tiến bộ ở đâu.

## 10. Error analysis có cấu trúc

Sau evaluation, nên lấy mẫu false positive và false negative theo nhóm:

| Nhóm lỗi | Ví dụ | Hướng kiểm tra |
| --- | --- | --- |
| Classification | Box đúng vị trí nhưng sai lớp | Confusion matrix, label ambiguity |
| Localization | Đúng lớp nhưng IoU thấp | Box loss, resolution, annotation quality |
| Duplicate | Nhiều box cho một vật thể | NMS threshold, score calibration |
| Background | Texture nền bị nhận thành vật thể | Hard-negative mining, domain bias |
| Missed small object | Không có prediction | Feature scale, input resolution, tiling |

Error taxonomy giúp tránh phản ứng máy móc như tăng model size khi vấn đề thật sự là annotation hoặc threshold.

## 11. Ví dụ tính nhanh

Giả sử một lớp có 3 ground truths và detector tạo 4 prediction theo thứ tự score. Sau matching, chuỗi kết quả là $[TP, FP, TP, TP]$. Precision tích lũy lần lượt là $[1, 1/2, 2/3, 3/4]$, recall là $[1/3,1/3,2/3,1]$.

AP được tính từ toàn bộ đường cong này theo evaluator tương ứng, không phải chỉ lấy precision cuối $3/4$. Ví dụ nhỏ cho thấy score ordering ảnh hưởng AP dù tập box cuối giống nhau.

## 12. Tổng kết

Object detection kết hợp hai nhiệm vụ: nhận diện và định vị. IoU đo độ khớp không gian, precision–recall mô tả đánh đổi khi thay threshold, AP/mAP tổng hợp chất lượng detection, còn NMS loại dự đoán trùng lặp.

Bài tiếp theo sẽ đi qua quá trình tiến hóa của detector hai giai đoạn: [R-CNN, Fast R-CNN và Faster R-CNN](/blog/r-cnn-fast-r-cnn-faster-r-cnn/).

---

### Nguồn tham khảo

[1] M. Everingham et al., [*The PASCAL Visual Object Classes Challenge*](http://host.robots.ox.ac.uk/pascal/VOC/), IJCV.

[2] T.-Y. Lin et al., [*Microsoft COCO: Common Objects in Context*](https://arxiv.org/abs/1405.0312), ECCV 2014.

[3] N. Bodla et al., [*Soft-NMS — Improving Object Detection With One Line of Code*](https://openaccess.thecvf.com/content_iccv_2017/html/Bodla_Soft-NMS_--_Improving_ICCV_2017_paper.html), ICCV 2017.

[4] COCO Consortium, [*COCO Detection Evaluation*](https://cocodataset.org/dataset/detection-eval.htm) và [implementation `COCOeval`](https://github.com/cocodataset/cocoapi/blob/master/PythonAPI/pycocotools/cocoeval.py).

[5] H. Rezatofighi et al., [*Generalized Intersection Over Union: A Metric and a Loss for Bounding Box Regression*](https://openaccess.thecvf.com/content_CVPR_2019/html/Rezatofighi_Generalized_Intersection_Over_Union_A_Metric_and_a_Loss_for_CVPR_2019_paper.html), CVPR 2019.

[6] Z. Zheng et al., [*Distance-IoU Loss: Faster and Better Learning for Bounding Box Regression*](https://ojs.aaai.org/index.php/AAAI/article/view/6999), AAAI 2020.

