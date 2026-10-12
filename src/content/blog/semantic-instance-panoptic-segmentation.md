---
title: "Semantic, Instance và Panoptic Segmentation khác nhau thế nào?"
description: "Phân biệt ba bài toán phân đoạn ảnh, định dạng nhãn, metric đánh giá và những sai lầm thường gặp khi xây dựng thí nghiệm segmentation."
pubDate: "2026-11-02"
draft: true
tags: ["image segmentation", "computer vision", "deep learning"]
---

Object detection biểu diễn vật thể bằng bounding box. Nhưng box vẫn chứa background và không mô tả hình dạng chính xác. Image segmentation yêu cầu dự đoán ở mức pixel, song “segmentation” thực tế bao gồm nhiều bài toán khác nhau.

![So sánh ảnh gốc, semantic segmentation, instance segmentation và panoptic segmentation](https://www.frontiersin.org/api/ipx/w%3D1200%26f%3Dpng/https%3A/www.frontiersin.org/files/Articles/1453931/frai-07-1453931-HTML-r1/image_m/frai-07-1453931-g001.jpg)
*Cùng một cảnh nhưng ba formulation tạo ba loại đầu ra khác nhau. Nguồn hình: [Frontiers in Artificial Intelligence](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2024.1453931/full), phỏng theo Kirillov et al.*

## 1. Semantic segmentation

Semantic segmentation gán một class label cho mỗi pixel:

$$
f:\mathbb{R}^{H\times W\times C}
\rightarrow
\{1,\ldots,K\}^{H\times W}.
$$

Hai chiếc ô tô đứng cạnh nhau đều nhận nhãn “car”; mô hình không bắt buộc phân biệt chúng thành hai cá thể.

Ứng dụng gồm phân loại mặt đường, vùng tổn thương y tế, land-cover mapping và scene understanding.

![Nhãn semantic segmentation ở mức pixel cho chó, mèo và background](https://classic.d2l.ai/_images/segmentation.svg)
*Khác bounding box, semantic mask mô tả lớp của từng pixel nhưng không cấp định danh riêng cho từng instance cùng lớp. Nguồn: [Dive into Deep Learning](https://classic.d2l.ai/chapter_computer-vision/semantic-segmentation-and-dataset.html).*

## 2. Instance segmentation

Instance segmentation vừa xác định class vừa tách từng object instance. Hai người đứng cạnh nhau phải có hai mask khác nhau.

Đầu ra thường là tập:

$$
\{(m_i,c_i,s_i)\}_{i=1}^{N},
$$

trong đó $m_i$ là binary mask, $c_i$ là lớp và $s_i$ là confidence. Vì đầu ra là một tập có số phần tử thay đổi, metric detection như AP có thể được mở rộng từ box IoU sang mask IoU.

## 3. “Things” và “stuff”

**Thing** là các đối tượng đếm được, có instance riêng như người, xe, chó. **Stuff** là vùng nền liên tục như bầu trời, đường, cỏ.

Instance segmentation thường tập trung vào things; semantic segmentation xử lý tốt cả stuff và thing ở mức lớp. Sự tách rời này dẫn tới panoptic segmentation.

## 4. Panoptic segmentation

Panoptic segmentation yêu cầu mỗi pixel có:

- Semantic class.
- Instance ID nếu pixel thuộc thing.

Mask đầu ra phải tạo thành một phân hoạch nhất quán, không để các instance chồng lấn tùy ý. Mục tiêu là mô tả toàn bộ cảnh: vừa biết vùng nào là đường, trời, cỏ, vừa phân biệt từng người và từng xe.

## 5. Bảng so sánh

| Thuộc tính | Semantic | Instance | Panoptic |
| --- | --- | --- | --- |
| Nhãn mỗi pixel | Có | Có trong mask | Có |
| Phân biệt từng cá thể | Không | Có | Có với thing |
| Bao phủ toàn ảnh | Thường có | Không bắt buộc | Có |
| Output | Dense class map | Tập mask có score | Class + instance ID |
| Metric phổ biến | mIoU, Dice | Mask AP | PQ |

## 6. Metric cho semantic segmentation

Với lớp $c$:

$$
\operatorname{IoU}_c
=
\frac{TP_c}{TP_c+FP_c+FN_c}.
$$

Mean IoU lấy trung bình trên các lớp. Dice coefficient là:

$$
\operatorname{Dice}
=
\frac{2|P\cap G|}{|P|+|G|}.
$$

Pixel accuracy có thể gây hiểu lầm khi background chiếm đa số. Một mô hình dự đoán toàn background vẫn có accuracy cao nhưng vô dụng với lớp hiếm.

## 7. Metric cho panoptic segmentation

Panoptic Quality được phân rã thành segmentation quality và recognition quality:

$$
PQ=
\underbrace{\frac{\sum_{(p,g)\in TP}\operatorname{IoU}(p,g)}{|TP|}}_{SQ}
\times
\underbrace{\frac{|TP|}{|TP|+\frac12|FP|+\frac12|FN|}}_{RQ}.
$$

PQ đồng thời phạt mask kém và lỗi nhận diện. Nó không thể thay thế mọi metric: ứng dụng an toàn có thể vẫn cần recall riêng cho lớp quan trọng.

## 8. Loss và class imbalance

Cross-entropy theo pixel là baseline phổ biến. Với lớp nhỏ hoặc foreground hiếm, có thể dùng weighted cross-entropy, Dice loss, focal loss hoặc kết hợp nhiều loss.

Nhưng thay loss không giải quyết annotation noise. Biên giữa các vùng có thể mơ hồ, nhiều annotator không thống nhất, và resize mask sai interpolation có thể tạo nhãn không hợp lệ. Mask nhãn rời rạc phải dùng nearest-neighbor interpolation khi resize.

## 9. Leakage đặc thù segmentation

- Crop từ cùng một ảnh gốc xuất hiện ở cả train và test.
- Các lát cắt của cùng bệnh nhân bị chia sang nhiều split.
- Frame liền nhau trong video bị xem như mẫu độc lập.
- Tiling ảnh vệ tinh khiến tile lân cận rò rỉ cấu trúc địa lý.

Vì pixel count rất lớn, một test set có vẻ “lớn” vẫn có thể chỉ đến từ vài subject độc lập. Đơn vị thống kê phải là subject, scene hoặc acquisition phù hợp, không mặc định là pixel.

## 10. Chọn bài toán nào?

- Chỉ cần loại bề mặt tại mỗi pixel: semantic segmentation.
- Cần đếm và đo từng vật thể: instance segmentation.
- Cần scene parsing hoàn chỉnh: panoptic segmentation.

Không nên chọn instance segmentation chỉ vì phức tạp hơn. Nếu target thực sự là diện tích tổn thương tổng, semantic mask có thể đơn giản và phù hợp hơn.

## 11. Tổng kết

Ba bài toán khác nhau chủ yếu ở việc có phân biệt instance và có bao phủ toàn cảnh hay không. Metric phải khớp với output và quyết định sử dụng. mIoU tốt không tự động đồng nghĩa boundary chính xác hoặc object-level recall tốt.

Bài tiếp theo phân tích kiến trúc encoder–decoder phổ biến cho dense prediction: [U-Net](/blog/unet-phan-doan-anh/).

---

### Nguồn tham khảo

[1] J. Long, E. Shelhamer, and T. Darrell, [*Fully Convolutional Networks for Semantic Segmentation*](https://openaccess.thecvf.com/content_cvpr_2015/html/Long_Fully_Convolutional_Networks_2015_CVPR_paper.html), CVPR 2015.

[2] K. He et al., [*Mask R-CNN*](https://openaccess.thecvf.com/content_iccv_2017/html/He_Mask_R-CNN_ICCV_2017_paper.html), ICCV 2017.

[3] A. Kirillov et al., [*Panoptic Segmentation*](https://openaccess.thecvf.com/content_CVPR_2019/html/Kirillov_Panoptic_Segmentation_CVPR_2019_paper.html), CVPR 2019.

