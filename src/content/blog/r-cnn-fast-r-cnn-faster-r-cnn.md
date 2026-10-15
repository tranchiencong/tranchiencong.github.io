---
title: "Từ R-CNN đến Faster R-CNN: Detector hai giai đoạn tiến hóa như thế nào?"
description: "Phân tích R-CNN, Fast R-CNN và Faster R-CNN, từ region proposal thủ công đến Region Proposal Network dùng chung feature map."
pubDate: "2026-10-15"
draft: false
tags: ["r-cnn", "object detection", "computer vision"]
---

Sau khi hiểu [IoU, NMS và mAP](/blog/object-detection-iou-nms-map/), chúng ta có thể xem cách một trong những họ detector quan trọng nhất được hình thành. Ba cái tên R-CNN, Fast R-CNN và Faster R-CNN nghe gần giống nhau, nhưng mỗi mô hình loại bỏ một bottleneck cụ thể của mô hình trước.

$$
\text{R-CNN}
\rightarrow
\text{Fast R-CNN}
\rightarrow
\text{Faster R-CNN}.
$$

![So sánh pipeline R-CNN, Fast R-CNN và Faster R-CNN](https://user-images.githubusercontent.com/70505378/129832501-7f24ec73-98d6-45df-add5-47be90a6faf6.png)
*Ba thế hệ khác nhau chủ yếu ở vị trí tính CNN feature và cách tạo proposal. Nguồn: [Computer Vision — Faster R-CNN](https://wowo0709.github.io/ai/computervision/Computer-Vision-5%283%29.-%EA%B0%95%EB%A0%A5%ED%95%9C-%EA%B0%9D%EC%B2%B4-%ED%83%90%EC%A7%80-%EB%AA%A8%EB%8D%B8-Faster-R-CNN/).*

## 1. Ý tưởng chung: nhận diện dựa trên vùng

Thay vì kiểm tra mọi cửa sổ có thể có trong ảnh, region-based detector thực hiện hai bước:

1. Đề xuất một tập vùng có khả năng chứa vật thể.
2. Phân loại và tinh chỉnh bounding box của từng vùng.

Cách phân rã này tập trung tài nguyên vào những vị trí hứa hẹn. Đổi lại, pipeline có thêm bài toán proposal và phải phối hợp nhiều thành phần.

Region proposal cần có recall cao: nếu proposal stage bỏ sót vật thể, detection head phía sau không có cơ hội sửa. Nhưng proposal quá nhiều làm tăng compute và duplicate. Vì vậy số proposal là một trade-off giữa recall và latency.

## 2. R-CNN: CNN cho từng region proposal

R-CNN sử dụng một thuật toán như Selective Search để tạo khoảng 2.000 region proposals. Mỗi vùng được crop/warp về kích thước cố định, chạy riêng qua CNN để trích xuất feature, sau đó:

- Linear SVM phân loại vùng.
- Bounding-box regressor hiệu chỉnh tọa độ.
- NMS loại kết quả trùng lặp.

Điểm mạnh lịch sử của R-CNN là cho thấy feature học bằng CNN kết hợp region proposal có thể vượt đáng kể pipeline dựa trên handcrafted feature trong thiết lập PASCAL VOC được báo cáo.

Nhưng chi phí rất lớn: nếu có 2.000 proposals, CNN cũng phải forward khoảng 2.000 lần cho một ảnh. Các vùng chồng lấn khiến phần lớn phép tính bị lặp. Pipeline huấn luyện nhiều giai đoạn và phải lưu feature ra đĩa.

### Selective Search làm gì?

Selective Search khởi tạo các vùng nhỏ từ phân đoạn ảnh rồi lặp lại việc gộp vùng dựa trên độ tương đồng về màu, texture, kích thước và mức độ lấp đầy. Nó không được học end-to-end với detector.

Ưu điểm là class-agnostic và không cần detection label để sinh vùng. Nhược điểm là chậm, khó tối ưu trên GPU và proposal quality bị tách khỏi objective cuối.

## 3. Fast R-CNN: tính feature map một lần

Fast R-CNN đảo thứ tự tính toán:

1. Chạy toàn bộ ảnh qua backbone đúng một lần.
2. Chiếu mỗi proposal lên feature map chung.
3. Dùng RoI Pooling biến vùng kích thước khác nhau thành feature cố định.
4. Một head chung dự đoán class distribution và box regression.

Multi-task loss có dạng khái quát:

$$
L = L_{\mathrm{cls}} + \lambda [u\ge1]L_{\mathrm{loc}},
$$

trong đó classification loss áp dụng cho mọi RoI, còn localization loss chỉ áp dụng cho RoI foreground.

Fast R-CNN chia sẻ convolutional computation và huấn luyện classification cùng box regression trong một network. Tuy nhiên, proposal vẫn đến từ Selective Search chạy bên ngoài. Khi CNN đã nhanh hơn, proposal generation trở thành bottleneck mới.

Fast R-CNN còn sử dụng sampling RoI trong mỗi mini-batch để kiểm soát tỷ lệ foreground/background. Nếu lấy ngẫu nhiên mọi RoI, background dễ áp đảo loss.

## 4. RoI Pooling giải quyết vấn đề gì?

Các proposal có kích thước khác nhau, nhưng fully connected layer yêu cầu đầu vào cố định. RoI Pooling chia một RoI trên feature map thành lưới $H\times W$, rồi max-pool trong từng ô.

Phép lượng tử hóa biên có thể gây lệch không gian. Về sau, RoI Align trong Mask R-CNN bỏ rounding thô và dùng bilinear interpolation, đặc biệt quan trọng khi cần mask chính xác theo pixel.

## 5. Faster R-CNN: học cả region proposal

Faster R-CNN thay Selective Search bằng **Region Proposal Network (RPN)**. RPN trượt một network nhỏ trên feature map dùng chung với detection head và dự đoán tại mỗi vị trí:

- Objectness: vùng này có chứa vật thể không?
- Bounding-box offsets: cần dịch và co giãn anchor thế nào?

RPN tạo proposal; detection head tiếp tục phân loại chi tiết và tinh chỉnh box. Vì backbone feature được chia sẻ, proposal generation trở thành một phần có thể học của hệ thống.

![Sự tiến hóa từ proposal bên ngoài tới Region Proposal Network chia sẻ feature](https://www.jkst.or.kr/media/sites/kst/2022-040-06/N0210400610/images/kst_2022_406_908_F4.jpg)
*R-CNN chạy CNN theo vùng, Fast R-CNN dùng feature map chung, còn Faster R-CNN học proposal bằng RPN. Nguồn: [Journal of the Korea Society of Computer and Information](https://www.jkst.or.kr/articles/xml/rVaD/).*

### RPN loss

RPN tối ưu objectness và box regression:

$$
L_{RPN}=
\frac{1}{N_{cls}}\sum_i L_{cls}(p_i,p_i^*)
+\lambda\frac{1}{N_{reg}}\sum_i p_i^*L_{reg}(t_i,t_i^*).
$$

$p_i^*$ bằng 1 cho positive anchor và 0 cho negative anchor. Hệ số $p_i^*$ bảo đảm regression loss chỉ áp dụng cho anchor foreground.

## 6. Anchor box

Trong Faster R-CNN gốc, mỗi vị trí feature map gắn với nhiều anchor có scale và aspect ratio khác nhau. RPN dự đoán offset so với anchor:

$$
t_x=\frac{x-x_a}{w_a},\quad
t_y=\frac{y-y_a}{h_a},\quad
t_w=\log\frac{w}{w_a},\quad
t_h=\log\frac{h}{h_a}.
$$

Anchor cung cấp điểm tham chiếu thuận tiện, nhưng kéo theo nhiều lựa chọn thiết kế và mất cân bằng foreground/background. Các detector anchor-free về sau cho thấy anchor không phải điều kiện bắt buộc của object detection.

### Gán nhãn anchor

Anchor thường được gán positive nếu có IoU cao với ground truth, negative nếu IoU thấp và ignored ở khoảng giữa. Threshold chính xác phụ thuộc implementation.

Nếu vật thể nhỏ không có anchor nào đủ IoU, RPN nhận rất ít positive signal. Đây là lý do anchor scale, feature stride và input resolution phải được xem xét cùng nhau.

## 7. So sánh ba thế hệ

| Thành phần | R-CNN | Fast R-CNN | Faster R-CNN |
| --- | --- | --- | --- |
| Feature extraction | Mỗi proposal một lần | Một lần cho cả ảnh | Một lần và chia sẻ |
| Proposal | Selective Search | Selective Search | RPN học được |
| Classifier | SVM riêng | Softmax head | Detection head |
| Huấn luyện | Nhiều giai đoạn | Gần end-to-end | Proposal và detection cùng hệ thống |
| Bottleneck chính | CNN lặp lại | Proposal bên ngoài | Chi phí two-stage tổng thể |

“Faster” là so với thế hệ trước trong điều kiện của paper gốc, không phải cam kết rằng nó nhanh hơn mọi detector hiện đại.

## 8. RoI Pooling và RoI Align

RoI Pooling lượng tử hóa tọa độ proposal khi ánh xạ lên feature map. Với classification, sai lệch nhỏ có thể chấp nhận được; với mask prediction, nó làm biên mask lệch.

RoI Align giữ tọa độ liên tục và dùng bilinear interpolation tại các sampling point. Đây là thay đổi cốt lõi trong Mask R-CNN. Faster R-CNN implementation hiện đại có thể dùng RoI Align dù paper Fast/Faster R-CNN ban đầu mô tả RoI Pooling; cần ghi rõ implementation.

## 9. Tại sao two-stage detector vẫn quan trọng?

Hai giai đoạn cho phép proposal lọc không gian trước khi classification chi tiết. Thiết kế này hữu ích khi localization chính xác hoặc vật thể nhỏ quan trọng. Faster R-CNN cũng là nền tảng để hiểu FPN và Mask R-CNN.

Tuy nhiên, latency phụ thuộc vào số proposal, backbone và implementation. Với hệ thống real-time hoặc edge device, one-stage detector có thể phù hợp hơn.

## 10. Luồng inference của Faster R-CNN

1. Resize và normalize ảnh.
2. Backbone tạo feature map, có thể kết hợp FPN.
3. RPN dự đoán objectness và offsets cho anchors.
4. Decode anchors, clip box và chạy NMS để tạo proposals.
5. RoI Align trích feature cố định cho từng proposal.
6. Detection head dự đoán class và refined box.
7. Chạy thresholding và NMS lần cuối.

Faster R-CNN vì vậy thường có NMS ở cả proposal stage và final detection stage. Khi benchmark latency, phải tính cả hai nếu mục tiêu là end-to-end deployment.


## 11. Tổng kết

R-CNN đưa CNN vào pipeline region proposal. Fast R-CNN chia sẻ feature map cho mọi proposal. Faster R-CNN học proposal bằng RPN và chia sẻ backbone với detection head. Chuỗi tiến hóa này là một ví dụ tốt về nghiên cứu hệ thống: mỗi công trình xác định bottleneck thực nghiệm của công trình trước rồi loại bỏ nó.

Bài tiếp theo chuyển sang detector một giai đoạn: [YOLO hoạt động như thế nào?](/blog/yolo-object-detection/)

---

### Nguồn tham khảo

[1] R. Girshick et al., [*Rich Feature Hierarchies for Accurate Object Detection and Semantic Segmentation*](https://openaccess.thecvf.com/content_cvpr_2014/html/Girshick_Rich_Feature_Hierarchies_2014_CVPR_paper.html), CVPR 2014.

[2] R. Girshick, [*Fast R-CNN*](https://openaccess.thecvf.com/content_iccv_2015/html/Girshick_Fast_R-CNN_ICCV_2015_paper.html), ICCV 2015.

[3] S. Ren et al., [*Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks*](https://proceedings.neurips.cc/paper/2015/hash/14bfa6bb14875e45bba028a21ed38046-Abstract.html), NeurIPS 2015.

