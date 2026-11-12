---
title: "YOLO: Nhìn một phát, biết hết"
description: "Giải thích tư duy cốt lõi của YOLO — từ ý tưởng chia lưới, dự đoán khung bao, độ tin cậy, đến hàm mất mát, triệt tiêu không cực đại và cách đánh giá bộ phát hiện công bằng."
pubDate: "2026-11-12"
draft: false
tags: ["yolo", "object detection", "computer vision"]
---

Ở bài trước, chúng ta đã đi qua [họ R-CNN](/blog/r-cnn-fast-r-cnn-faster-r-cnn/) — luồng xử lý hai giai đoạn, tách bước đề xuất vùng và bước phân loại thành hai khối riêng biệt. Cách tiếp cận đó mạnh mẽ nhưng chậm, vì mỗi vùng đề xuất cần chạy qua bộ phân loại riêng. Năm 2016, Joseph Redmon và nhóm nghiên cứu đặt một câu hỏi khác: **liệu một mạng duy nhất có thể nhìn toàn bộ ảnh một lần rồi dự đoán thẳng tất cả khung bao cùng xác suất lớp hay không?**

Câu trả lời là YOLO — viết tắt của **You Only Look Once**. Điều quan trọng nhất không phải một phiên bản mã nguồn cụ thể, mà là **cách đặt lại bài toán**: biến phát hiện vật thể từ luồng nhiều bước thành một bài toán hồi quy thống nhất trên toàn ảnh.

![Kiến trúc YOLOv1 từ ảnh đầu vào tới tensor dự đoán 7 nhân 7 nhân 30](https://seunghan96.github.io/assets/img/cv/cv74.png)
*YOLOv1 tạo toàn bộ khung bao và dự đoán lớp chỉ trong một lượt truyền xuôi. Nguồn: [YOLO v1 Architecture Review](https://seunghan96.github.io/dl/cv/cv-YOLO-v1/).*

---

## 1. YOLOv1 đã thay đổi cách đặt bài toán

### Ý tưởng chia lưới

Hãy tưởng tượng bạn phủ một lưới ô vuông lên bức ảnh. YOLOv1 chia ảnh đầu vào thành lưới $S \times S$ (bài báo gốc dùng $S = 7$, tức 49 ô). Nếu **tâm** của một vật thể rơi vào ô nào, ô đó chịu trách nhiệm dự đoán vật thể.

Mỗi ô dự đoán $B$ khung bao (bài báo gốc dùng $B = 2$). Mỗi khung bao gồm năm giá trị:

$$
(x, y, w, h, \text{confidence}).
$$

Trong đó $(x, y)$ là toạ độ tâm tương đối so với ô lưới, $(w, h)$ là chiều rộng và chiều cao tương đối so với toàn ảnh, còn $\text{confidence}$ phản ánh mức độ tin tưởng rằng khung chứa vật thể và khung đó khớp với nhãn thật.

### Độ tin cậy (confidence)

Độ tin cậy được thiết kế để gộp hai yếu tố — xác suất có vật thể và mức khớp giữa khung dự đoán với khung thật:

$$
\text{confidence} = \Pr(\text{Object}) \times \operatorname{IoU}^{\text{truth}}_{\text{pred}}.
$$

Nếu ô không chứa vật thể, giá trị mục tiêu bằng 0. Nếu chứa, giá trị mục tiêu chính là IoU giữa khung dự đoán và khung thật. Nhờ vậy mô hình vừa học "có hay không" vừa học "khớp đến đâu" trong cùng một đại lượng.

### Tensor đầu ra

Ngoài khung bao, mỗi ô còn dự đoán $C$ xác suất lớp (dùng chung cho mọi khung trong ô). Với bộ dữ liệu PASCAL VOC có $C = 20$ lớp, tensor đầu ra có kích thước:

$$
S \times S \times (B \cdot 5 + C) = 7 \times 7 \times 30.
$$

Mỗi ô sinh ra 30 con số: 10 cho hai khung bao và 20 cho xác suất lớp. Toàn bộ được tạo trong **một lượt truyền xuôi** duy nhất.

> **Lưu ý:** Con số $7 \times 7 \times 30$ chỉ là chi tiết cụ thể của YOLOv1. Các phiên bản sau tổ chức đầu ra hoàn toàn khác, không nên dùng tensor này để mô tả "YOLO" nói chung.

Tại lúc suy luận (inference), xác suất lớp được nhân với độ tin cậy của từng khung để ra điểm riêng cho từng lớp. Sau đó, ngưỡng hoá loại bỏ khung điểm thấp, và triệt tiêu không cực đại (NMS — Non-Maximum Suppression) giữ lại khung tốt nhất cho mỗi vật thể.

---

## 2. Vì sao một giai đoạn có thể nhanh?

Ở luồng hai giai đoạn như Faster R-CNN, bước đầu tạo ra hàng trăm vùng đề xuất, rồi mỗi vùng được cắt và đưa qua phần đầu nhận diện riêng. YOLO bỏ hoàn toàn bước đề xuất. Toàn bộ ảnh đi qua một mạng duy nhất và xuất ra tất cả dự đoán cùng lúc; phần lớn phép tích chập được chia sẻ cho mọi vị trí nên chi phí tính toán tăng rất ít khi số vật thể tăng.

Tuy nhiên, "một giai đoạn" không có nghĩa chỉ có một tầng hay không cần hậu xử lý. Một hệ thống YOLO thực tế vẫn gồm:

- **Trục chính (backbone)** — mạng tích chập trích đặc trưng từ ảnh (VD: Darknet, CSPDarknet).
- **Cổ nối (neck)** — ghép đặc trưng đa tỷ lệ, thường theo tư tưởng kim tự tháp đặc trưng (FPN — Feature Pyramid Network).
- **Đầu phát hiện (head)** — tạo dự đoán lớp, điểm có vật thể và hồi quy khung bao.
- **Giải mã + NMS** — chuyển đầu ra thô thành toạ độ khung thật và loại khung trùng.

Phân tách này hữu ích khi phân tích nút thắt: đổi trục chính thay đổi biểu diễn đặc trưng; đổi cổ nối ảnh hưởng ghép đa tỷ lệ; đổi đầu hoặc hàm mất mát ảnh hưởng cách gán mục tiêu.

---

## 3. Nhìn toàn ảnh mang lại gì?

Vì mỗi dự đoán được tạo từ đặc trưng của **toàn bộ ảnh** chứ không chỉ một vùng nhỏ, YOLO có thể tận dụng ngữ cảnh toàn cục (global context). Ví dụ, một vùng trông giống mặt người nhưng nằm giữa bức tranh sơn dầu — ngữ cảnh xung quanh giúp mô hình hiểu đó là tranh, không phải người thật.

Bài báo YOLOv1 cho thấy mô hình ít nhầm nền thành vật thể hơn Fast R-CNN, nhưng đổi lại lỗi định vị (khung bao lệch) nhiều hơn. Điều này hợp lý: nhìn toàn ảnh ở độ phân giải thấp ($7 \times 7$) giúp nắm bối cảnh tốt nhưng khó chính xác từng chi tiết.

Kết luận trên thuộc thí nghiệm cụ thể của YOLOv1 năm 2016. Các phiên bản hiện đại đã thay đổi rất nhiều nên phân bố lỗi cũng khác — đừng khái quát rằng "YOLO luôn định vị kém".

---

## 4. Hàm mất mát: tối ưu nhiều mục tiêu cùng lúc

Bộ phát hiện phải đồng thời làm tốt ba việc: định vị chính xác, phân biệt có/không có vật thể, và phân loại đúng lớp. Hàm mất mát tổng hợp phản ánh điều này:

$$
L = \lambda_{\mathrm{box}} L_{\mathrm{box}} + \lambda_{\mathrm{obj}} L_{\mathrm{obj}} + \lambda_{\mathrm{cls}} L_{\mathrm{cls}}.
$$

Trong đó $L_{\mathrm{box}}$ đo sai lệch vị trí và kích thước, $L_{\mathrm{obj}}$ đo khả năng phân biệt có/không vật thể, $L_{\mathrm{cls}}$ đo sai lệch phân loại lớp. Các trọng số $\lambda$ kiểm soát mức ưu tiên từng thành phần.

### Mất cân bằng nền–vật thể

Trên lưới $7 \times 7$, hầu hết ô **không chứa** vật thể. Nếu hàm mất mát đối xử bình đẳng, gradient bị chi phối bởi các ô nền, đẩy mô hình về phía "dự đoán không có gì ở khắp nơi". YOLOv1 xử lý bằng cách tăng trọng số định vị ($\lambda_{\mathrm{coord}} = 5$) và giảm trọng số ô không chứa vật thể ($\lambda_{\mathrm{noobj}} = 0.5$).

Các bộ phát hiện hiện đại dùng cách tinh vi hơn: mất mát phân loại kiểu Focal Loss (giảm trọng số mẫu dễ, tập trung mẫu khó), mất mát khung bao dựa trên IoU (GIoU, DIoU, CIoU) thay vì bình phương sai số. Đây là thay đổi lớn ảnh hưởng trực tiếp đến chất lượng huấn luyện.

---

## 5. Từ lưới đơn tới dự đoán đa tỷ lệ

YOLOv1 dùng một lưới $7 \times 7$ duy nhất. Nếu hai vật thể nhỏ có tâm rơi vào cùng ô, mô hình chỉ dự đoán được một. Vật thể rất nhỏ thì đặc trưng tại ô không đủ chi tiết; vật thể rất lớn thì trải nhiều ô nhưng chỉ một ô chịu trách nhiệm.

Từ YOLOv2 trở đi, các phiên bản cải tiến bằng cách:

1. **Dự đoán trên nhiều lưới** (VD: 13×13, 26×26, 52×52) — lưới thô phát hiện vật lớn, lưới mịn phát hiện vật nhỏ.
2. **Kim tự tháp đặc trưng (FPN)** — ghép đặc trưng ngữ nghĩa từ tầng sâu với chi tiết không gian từ tầng nông.
3. **Nhiều neo (anchor) mỗi vị trí** — mỗi điểm trên bản đồ đặc trưng dự đoán nhiều khung với tỷ lệ khác nhau.

Tên "YOLO" hiện bao phủ rất nhiều dòng triển khai với thiết kế, giấy phép và tác giả khác nhau. Khi viết báo cáo hoặc so sánh, **phải ghi rõ** phiên bản, kho mã nguồn, trọng số, kích thước đầu vào.

---

## 6. Có neo và không neo (anchor-based vs anchor-free)

**Đầu có neo** gắn một tập khung mẫu (anchor) với kích thước và tỷ lệ đã định sẵn vào mỗi vị trí trên bản đồ đặc trưng. Mô hình dự đoán độ lệch so với neo chứ không dự đoán toạ độ trực tiếp. Neo cung cấp điểm khởi đầu tốt nhưng thêm nhiều siêu tham số cần chỉnh.

**Đầu không neo** bỏ khung mẫu, dự đoán thẳng tâm vật thể và khoảng cách tới bốn biên khung. Thiết kế đơn giản hơn, ít siêu tham số hơn, nhưng vẫn phải giải bài toán gán mục tiêu: vị trí nào chịu trách nhiệm cho vật thể nào. Các phương pháp như SimOTA hay TaskAlignedAssigner giải quyết vấn đề này.

Không thể suy ra độ chính xác hay tốc độ chỉ từ nhãn "có neo" hay "không neo" — cách triển khai và chiến lược huấn luyện cụ thể thường quan trọng hơn.

---

## 7. Triệt tiêu không cực đại (NMS)

Dự đoán dày đặc (dense prediction) tạo ra hàng trăm khung chồng lấn cho cùng một vật thể. NMS giữ khung điểm cao nhất và loại các khung cùng lớp có IoU vượt ngưỡng.

![Luồng hậu xử lý YOLO từ khung thô qua ngưỡng độ tin cậy và NMS](https://airoads.org/img/course/ch10-yolo-threshold-nms-map.webp)
*Ngưỡng hoá và NMS biến hàng nghìn dự đoán thô thành tập phát hiện cuối cùng. Nguồn: [AI Roads — YOLO Series](https://airoads.org/zh-cn/ch10-computer-vision/ch03-detection/03-yolo-series/).*

Hai ngưỡng quan trọng:

1. **Ngưỡng độ tin cậy** — loại khung điểm thấp trước khi chạy NMS. Ngưỡng thấp giữ nhiều khung (độ phủ cao nhưng chính xác thấp), ngưỡng cao thì ngược lại.
2. **Ngưỡng IoU của NMS** — nếu hai khung cùng lớp có IoU trên ngưỡng này, khung điểm thấp hơn bị loại.

> **Cảnh báo:** Nếu thử nhiều giá trị ngưỡng trên tập kiểm tra rồi chọn cái đẹp nhất, bạn đang khớp quá mức vào tập kiểm tra. Nên chọn ngưỡng trên **tập xác thực** và báo cả đường precision–recall.

**NMS theo lớp** chỉ so khung cùng lớp; **NMS bất kể lớp** so mọi khung. Loại sau có thể xoá khung trùng bị gán nhầm hai lớp, nhưng cũng có thể xoá sai khi hai vật thể khác lớp thật sự chồng nhau. Lựa chọn phụ thuộc vào kiểu nhầm lẫn trên tập xác thực.

---

## 8. Đo tốc độ đúng cách

Khi đọc "YOLO chạy 150 FPS", hãy hỏi ngay: **điều kiện đo là gì?**

| Yếu tố | Vì sao quan trọng |
| --- | --- |
| GPU/CPU và phiên bản trình điều khiển | Phần cứng khác nhau cho tốc độ khác nhau |
| Kích thước lô (batch size) | Lô lớn tăng thông lượng nhưng không giảm độ trễ đơn ảnh |
| Độ chính xác số: FP32, FP16 hay INT8 | Lượng tử hoá có thể tăng tốc 2–4 lần |
| Có tính tiền xử lý, truyền dữ liệu CPU ↔ GPU, NMS không | Bỏ sót bước nào thì tốc độ báo cáo không phản ánh thực tế |
| Kích thước đầu vào | 640×640 nhanh hơn 1280×1280 rất nhiều |

Điểm thường bị nhầm: **thông lượng cao với lô lớn không có nghĩa độ trễ thấp cho một ảnh**. Trong ứng dụng camera thời gian thực, bạn quan tâm đến độ trễ mỗi ảnh, không phải thông lượng xử lý hàng loạt. Ngoài trung vị, nên báo thêm phân vị 95 hoặc 99 để thấy trường hợp xấu nhất.

---

## 9. Khi nào YOLO phù hợp?

YOLO phù hợp khi cần luồng xử lý gọn và thông lượng cao: phân tích video, robot, triển khai biên (edge). Nhưng cần kiểm tra thêm:

- **Vật thể rất nhỏ?** — Kiểm tra AP theo kích thước; có thể cần chia ảnh thành mảnh nhỏ (tiling) hoặc tăng độ phân giải đầu vào.
- **Sai sót có chi phí cao?** (y tế, lái xe tự hành) — Cần hiệu chuẩn xác suất (calibration) và phân tích lỗi chi tiết theo từng lớp.
- **Thiết bị hạn chế tài nguyên?** — Kích thước mô hình chưa đủ; cần đo bộ nhớ RAM, bộ nhớ kích hoạt và năng lượng tiêu thụ trên thiết bị thật.
- **Dữ liệu khác miền huấn luyện?** — YOLO được huấn luyện trước trên COCO (ảnh đời thường). Với ảnh vệ tinh, ảnh y tế hay ảnh công nghiệp, cần đánh giá độ lệch miền (domain shift).

---

## 10. Gán mục tiêu và chất lượng nhãn

### Bài toán gán mục tiêu (assignment)

Bộ phát hiện dày đặc cần gán mỗi nhãn thật cho một hoặc nhiều vị trí dự đoán. Gán quá hẹp thì ít mẫu dương, mô hình khó học. Gán quá rộng thì dự đoán trùng lặp, mất mát mâu thuẫn. Các phương pháp hiện đại như SimOTA hay TaskAlignedAssigner cân bằng bằng hàm chi phí kết hợp điểm phân loại và IoU.

### Chất lượng nhãn — yếu tố thường bị coi nhẹ

- **Khung bao quá lỏng** → hồi quy khung học không nhất quán.
- **Vật thể bị bỏ sót khi gán nhãn** → mô hình dự đoán đúng nhưng bị đánh là dương tính giả → mất mát mâu thuẫn.
- **Quy ước che khuất/cắt xén không rõ ràng** → nhiễu trong nhãn thật.
- **Phân cấp lớp mơ hồ** → "xe tải" và "xe container" có phải cùng lớp không? Nếu không nhất quán, mất mát phân loại mâu thuẫn.

> **Mẹo thực tế:** Trước khi thay mô hình, hãy hiển thị vài chục lô ngẫu nhiên sau tăng cường dữ liệu (augmentation) — xem ảnh đã biến đổi và khung bao tương ứng có hợp lý không. Rất nhiều lỗi ẩn trong luồng dữ liệu được phát hiện ở bước này.

---

## 11. So sánh bộ phát hiện một cách công bằng

Khi muốn so YOLO với Faster R-CNN hay bất kỳ bộ phát hiện nào, cần đảm bảo:

1. Cùng tập dữ liệu, cách chia và nhãn.
2. Kích thước ảnh đầu vào và chiến lược tăng cường tương đương.
3. Báo đầy đủ AP (trung bình qua IoU 0.5–0.95), AP50, AP75 và AP theo kích thước.
4. Đo độ trễ trên cùng phần cứng, cùng kích thước lô, cùng độ chính xác số.
5. Lặp nhiều hạt giống ngẫu nhiên (random seed) nếu tập dữ liệu nhỏ.
6. Phân tích precision–recall và ma trận nhầm lẫn (confusion matrix) theo từng lớp.

Nếu một mô hình nhanh hơn 3 lần nhưng giảm 15% độ phủ cho lớp "người đi bộ" trong ứng dụng lái xe tự hành, nó **không** "tốt hơn" — trừ khi bạn chấp nhận rủi ro đó.

---

## 12. Các kiểu lỗi phổ biến

| Dấu hiệu | Nguyên nhân khả dĩ | Cách kiểm tra |
| --- | --- | --- |
| Bỏ sót vật thể nhỏ | Bước nhảy đặc trưng (stride) quá lớn hoặc ảnh đầu vào nhỏ | Xem AP-small; thử tăng kích thước đầu vào hoặc chia ảnh |
| Khung đúng vị trí nhưng điểm thấp | Hiệu chuẩn kém hoặc mất cân bằng lớp | Vẽ biểu đồ độ tin cậy, kiểm tra phân bố điểm |
| Nhiều khung trùng cho cùng vật thể | Ngưỡng NMS hoặc chiến lược gán mục tiêu | Quét ngưỡng NMS trên tập xác thực |
| Nhầm lẫn giữa lớp tương tự | Nhãn mơ hồ hoặc đặc trưng chưa đủ phân biệt | Ma trận nhầm lẫn; kiểm tra lại nhãn |
| Huấn luyện tốt, kiểm tra kém | Khớp quá mức hoặc lệch miền | So sánh mất mát train/val; đánh giá theo điều kiện |

---

## 13. Danh sách kiểm tra khả năng tái lập

Một kết quả không thể tái lập nếu chỉ ghi "dùng YOLO". Cần lưu và báo cáo: phiên bản mã nguồn (URL + mã commit), cấu hình mô hình (trục chính, cổ nối, đầu, số lớp), trọng số huấn luyện trước, kích thước đầu vào, chiến lược tăng cường dữ liệu, bộ tối ưu và lịch trình học, hạt giống ngẫu nhiên, thiết lập trung bình trượt hàm mũ (EMA), huấn luyện nửa chính xác (FP16) hay không, ngưỡng độ tin cậy và ngưỡng NMS khi đánh giá, và công cụ đánh giá đã dùng.

---

## 14. Tổng kết

YOLO đã thay đổi cách nhìn nhận phát hiện vật thể: từ luồng xử lý phức tạp nhiều bước trở thành một bài toán hồi quy thống nhất, xử lý toàn ảnh trong một lượt truyền xuôi.

Đóng góp nền tảng của YOLOv1 không nằm ở kiến trúc mạng cụ thể (vốn đã lỗi thời), mà ở **cách đặt bài toán** — cách tiếp cận một giai đoạn và khả năng suy luận thời gian thực trong bối cảnh mà Faster R-CNN cần hàng trăm mili giây mỗi ảnh. Những phiên bản sau cải tiến liên tục trục chính, cổ nối, đầu phát hiện, hàm mất mát, chiến lược gán mục tiêu — và phải được ghi nhận cụ thể từng phiên bản.

Trước khi áp dụng bộ phát hiện vào tập dữ liệu riêng, bài tiếp theo sẽ trình bày: [Học chuyển giao với ResNet](/blog/transfer-learning-voi-resnet/) — cách tận dụng mạng đã huấn luyện để giảm thời gian và dữ liệu cần thiết.

---

### Nguồn tham khảo

[1] J. Redmon et al., [*You Only Look Once: Unified, Real-Time Object Detection*](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html), CVPR 2016.

[2] J. Redmon and A. Farhadi, [*YOLO9000: Better, Faster, Stronger*](https://openaccess.thecvf.com/content_cvpr_2017/html/Redmon_YOLO9000_Better_Faster_CVPR_2017_paper.html), CVPR 2017.

[3] J. Redmon and A. Farhadi, [*YOLOv3: An Incremental Improvement*](https://arxiv.org/abs/1804.02767), arXiv 2018.

[4] A. Bochkovskiy et al., [*YOLOv4: Optimal Speed and Accuracy of Object Detection*](https://arxiv.org/abs/2004.10934), arXiv 2020.

[5] Z. Ge et al., [*YOLOX: Exceeding YOLO Series in 2021*](https://arxiv.org/abs/2107.08430), arXiv 2021.

[6] Z. Zheng et al., [*Distance-IoU Loss: Faster and Better Learning for Bounding Box Regression*](https://arxiv.org/abs/1911.08287), AAAI 2020.

[7] T.-Y. Lin et al., [*Focal Loss for Dense Object Detection*](https://openaccess.thecvf.com/content_ICCV_2017/html/Lin_Focal_Loss_for_ICCV_2017_paper.html), ICCV 2017.
