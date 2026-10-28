---
title: "Học chuyển giao với ResNet: Khi nào đóng băng, khi nào tinh chỉnh?"
description: "Cách tận dụng ResNet đã huấn luyện, chọn mức tinh chỉnh phù hợp và đánh giá kết quả mà không để rò rỉ dữ liệu làm sai lệch kết luận."
pubDate: "2026-10-28"
draft: false
tags: ["transfer learning", "resnet", "computer vision"]
---

Giả sử bạn có vài nghìn ảnh lá cây và muốn nhận diện năm loại bệnh. Huấn luyện một mạng lớn từ đầu có thể tốn thời gian, trong khi dữ liệu chưa chắc đủ để mạng học được những đặc trưng thị giác cơ bản. Một cách khởi đầu hợp lý là lấy [ResNet đã huấn luyện trên ImageNet](/blog/tim-hieu-resnet-trong-computer-vision/), thay lớp phân loại cuối và dạy mô hình nhận diện năm loại bệnh đó.

Đó là **học chuyển giao**: tận dụng điều mô hình đã học từ một bài toán để giải bài toán mới. Câu hỏi khó hơn nằm ở bước tiếp theo. Ta nên giữ nguyên các lớp trích xuất đặc trưng, chỉ huấn luyện lớp phân loại mới, hay cho cả ResNet tiếp tục học từ ảnh lá cây? Bài viết này đi từ cách chọn chiến lược đến một ví dụ PyTorch và những phép kiểm tra cần có trước khi tin vào kết quả.

## ResNet mang theo điều gì từ bài toán cũ?

Một ResNet dùng để phân loại ảnh có thể nhìn thành hai phần: **thân mạng** biến ảnh thành đặc trưng và **lớp phân loại** biến đặc trưng thành điểm số cho từng lớp. Khi tải trọng số đã huấn luyện trên ImageNet, cả hai phần đều mang dấu vết của bài toán cũ. Ta thường thay lớp phân loại vì số lớp và ý nghĩa nhãn ở bài toán mới đã khác.

Các lớp đầu thường học những mẫu khá chung như cạnh, màu và kết cấu. Các lớp sâu hơn kết hợp chúng thành những đặc trưng gần với đối tượng cần phân loại. Tuy nhiên, “lớp đầu dùng được ở mọi nơi” không phải quy luật. Ảnh X-quang, ảnh vệ tinh hoặc ảnh hiển vi có cách tạo ảnh rất khác ảnh tự nhiên; ngay cả đặc trưng ở đầu mạng cũng có thể cần thích nghi. Nghiên cứu của [Yosinski và cộng sự](https://proceedings.neurips.cc/paper_files/paper/2014/hash/532a2f85b6977104bc93f8580abbb330-Abstract.html) cho thấy khả năng chuyển giao thường giảm khi hai bài toán cách xa nhau, nhưng đặc trưng chuyển từ bài toán cũ vẫn có thể hữu ích hơn đặc trưng khởi tạo ngẫu nhiên.

Vì thế, số lượng ảnh không phải yếu tố duy nhất để quyết định cách huấn luyện. Ta còn phải xem ảnh mới giống ảnh dùng để huấn luyện ban đầu đến đâu, nhãn mới đòi hỏi những chi tiết nào, và kết quả trên tập kiểm định thay đổi ra sao.

## Ba mức độ thích nghi

Hãy hình dung thân mạng ResNet gồm các tầng liên tiếp, từ tầng xử lý ảnh ban đầu đến `layer4` gần lớp phân loại. Có ba cách dùng phổ biến:

![So sánh cách giữ nguyên phần trích xuất đặc trưng và cách tinh chỉnh các tầng của mô hình](https://raw.githubusercontent.com/mrdbourke/tensorflow-deep-learning/main/images/05-transfer-learning-feature-extraction-vs-fine-tuning.png)

*Hai cách tận dụng mô hình đã huấn luyện: giữ nguyên phần trích xuất đặc trưng hoặc tiếp tục cập nhật một số tầng. Nguồn: [TensorFlow Deep Learning](https://github.com/mrdbourke/tensorflow-deep-learning).*

**Chỉ huấn luyện lớp phân loại.** Ta đóng băng thân mạng và học lại lớp cuối. Cách này nhanh, ít tốn bộ nhớ và là phép thử đầu tiên tốt khi dữ liệu ít. Nếu nó đã cho kết quả ổn định, việc mở thêm hàng triệu tham số có thể không mang lại lợi ích đáng kể. Điểm yếu là những đặc trưng có sẵn không thể điều chỉnh theo ảnh mới.

**Tinh chỉnh một phần.** Sau khi lớp phân loại đã học được tín hiệu ban đầu, ta mở `layer4` để các đặc trưng cấp cao thích nghi với nhãn mới. Nếu kết quả kiểm định còn cải thiện, có thể thử mở thêm `layer3`. Thứ tự này là điểm khởi đầu thực dụng, không phải công thức đúng cho mọi bộ dữ liệu.

**Tinh chỉnh toàn bộ.** Mọi tầng của ResNet đều được cập nhật. Cách này cho mô hình nhiều khả năng thích nghi nhất, nhưng cũng tốn tài nguyên hơn và dễ khớp quá sát dữ liệu huấn luyện khi tập ảnh nhỏ. Trọng số đã học có thể bị thay đổi quá mạnh nếu tốc độ học đặt quá lớn.

Một lộ trình hợp lý là bắt đầu từ cách đơn giản nhất, rồi chỉ mở thêm tầng khi kết quả trên tập kiểm định cho thấy lợi ích rõ ràng. Khi so sánh, cần dùng cùng cách chia dữ liệu, cách xử lý ảnh và ngân sách thử nghiệm tương đương; nếu một phương án được chỉnh tham số kỹ hơn hẳn, phép so sánh sẽ thiếu công bằng.

## Thử với ResNet-50 trong PyTorch

TorchVision cung cấp các bộ trọng số gắn với cách xử lý ảnh tương ứng. Trong ví dụ dưới đây, `IMAGENET1K_V2` chỉ rõ phiên bản trọng số được dùng; `trong_so.transforms()` tạo phép biến đổi phù hợp cho ảnh kiểm định và ảnh dự đoán. Ảnh tăng cường khi huấn luyện có thể dùng cách cắt, lật khác, nhưng vẫn cần chuẩn hóa đầu vào phù hợp với bộ trọng số đã chọn.

```python
from torch import nn
from torch.optim import AdamW
from torchvision.models import ResNet50_Weights, resnet50

so_lop = 5
trong_so = ResNet50_Weights.IMAGENET1K_V2
model = resnet50(weights=trong_so)

for tham_so in model.parameters():
    tham_so.requires_grad = False

model.fc = nn.Linear(model.fc.in_features, so_lop)
optimizer = AdamW(model.fc.parameters(), lr=1e-3, weight_decay=1e-4)
phep_bien_doi_kiem_dinh = trong_so.transforms()
```

Đoạn mã mới chuẩn bị mô hình và bộ tối ưu; nó chưa bao gồm vòng lặp huấn luyện, cách đọc dữ liệu hay phép đánh giá. Sau khi lớp phân loại đã ổn định, ta có thể mở tầng cuối và đặt tốc độ học cho tầng này thấp hơn lớp phân loại mới:

```python
for tham_so in model.layer4.parameters():
    tham_so.requires_grad = True

optimizer = AdamW(
    [
        {"params": model.layer4.parameters(), "lr": 1e-4},
        {"params": model.fc.parameters(), "lr": 1e-3},
    ],
    weight_decay=1e-4,
)
```

Hai tốc độ học trên chỉ là giá trị để bắt đầu thử nghiệm. Khi mở thêm tầng, hãy theo dõi sai số trên cả tập huấn luyện và tập kiểm định. Nếu sai số huấn luyện tiếp tục giảm nhưng kết quả kiểm định xấu đi, việc mở thêm tầng có thể đang làm mô hình học quá sát dữ liệu sẵn có.

Có một chi tiết dễ bỏ sót: **đóng băng tham số không đồng nghĩa đóng băng lớp chuẩn hóa theo lô (Batch Normalization)**. `requires_grad = False` ngăn cập nhật trọng số và độ lệch, nhưng các thống kê trung bình và phương sai vẫn có thể thay đổi khi mô hình ở chế độ huấn luyện. Nếu muốn giữ nguyên chúng, sau mỗi lần gọi `model.train()` trong vòng lặp huấn luyện, hãy đặt các lớp chuẩn hóa theo lô về chế độ đánh giá:

```python
def co_dinh_thong_ke_batch_norm(model: nn.Module) -> None:
    for lop in model.modules():
        if isinstance(lop, nn.BatchNorm2d):
            lop.eval()

# Gọi hai dòng này ở đầu mỗi lượt huấn luyện.
model.train()
co_dinh_thong_ke_batch_norm(model)
```

Việc giữ thống kê cũ cũng không luôn tốt hơn: với ảnh rất khác ImageNet, chúng có thể không còn phù hợp. Hãy ghi rõ lựa chọn này và kiểm tra trên tập kiểm định, nhất là khi mỗi lần huấn luyện chỉ có ít ảnh. Tài liệu [PyTorch về BatchNorm2d](https://docs.pytorch.org/docs/stable/generated/torch.nn.BatchNorm2d.html) mô tả sự khác biệt giữa chế độ huấn luyện và đánh giá.

## Đánh giá sao cho kết quả đáng tin

Trước khi so sánh các mức tinh chỉnh, hãy chia dữ liệu theo **đơn vị độc lập thực sự**. Nếu nhiều ảnh lá đến từ cùng một cây, việc đưa ảnh của cây đó vào cả tập huấn luyện và tập kiểm tra có thể làm kết quả lạc quan quá mức. Với ảnh y tế, đơn vị chia thường là bệnh nhân; với video, các khung hình gần nhau cần ở cùng một phía của phép chia. Tập kiểm định dùng để chọn tốc độ học, số tầng mở và thời điểm dừng. Tập kiểm tra chỉ nên dùng để đánh giá phương án đã chọn.

Tiếp theo, hãy so sánh ít nhất ba mốc: ResNet khởi tạo ngẫu nhiên, ResNet chỉ học lớp phân loại và ResNet được tinh chỉnh. Giữ cách chia dữ liệu, cách tăng cường ảnh và công sức chỉnh tham số tương đương. Nếu bản đã huấn luyện trước thắng bản khởi tạo ngẫu nhiên, ta mới có bằng chứng rằng việc chuyển giao đã giúp ích trong thiết lập này. Với dữ liệu nhỏ, nên lặp lại thí nghiệm ở vài hạt giống ngẫu nhiên để xem kết quả có ổn định không.

Chỉ số đánh giá cần theo mục tiêu sử dụng. Tỷ lệ dự đoán đúng có thể đủ khi các lớp cân bằng; nếu bệnh hiếm hoặc bỏ sót một lớp gây hậu quả lớn, hãy xem thêm khả năng nhận diện từng lớp, độ chính xác trên các dự đoán dương tính và ma trận nhầm lẫn. Một con số tổng hợp không cho biết mô hình đang sai ở đâu.

Cuối cùng, nếu mô hình đã huấn luyện trước cho kết quả kém bất thường, hãy kiểm tra phép chuẩn hóa ảnh, thứ tự kênh màu, độ phân giải và cách chia dữ liệu trước khi kết luận rằng học chuyển giao không phù hợp. Với ảnh một kênh, việc lặp kênh thành ba kênh hoặc thay lớp tích chập đầu là hai lựa chọn khác nhau; cả hai đều cần được kiểm chứng thay vì mặc định tương đương.

## Khi nào nên dừng tinh chỉnh?

Nếu chỉ huấn luyện lớp phân loại đã đạt mục tiêu và mở thêm tầng không cải thiện kết quả kiểm định, có thể dừng ở mô hình đơn giản hơn. Nếu mở `layer4` giúp ích nhưng mở toàn bộ làm kết quả dao động mạnh giữa các lần chạy, tinh chỉnh một phần là lựa chọn có cơ sở hơn. Ngược lại, khi ảnh mới khác xa ImageNet và có đủ dữ liệu, tinh chỉnh sâu hơn đáng để thử.

Đôi khi ResNet khởi tạo ngẫu nhiên lại cho kết quả tốt hơn. Đó là dấu hiệu cần xem lại mức tương đồng giữa hai bộ dữ liệu, cách xử lý ảnh và quy trình huấn luyện. Học chuyển giao là một giả thuyết có thể kiểm tra bằng thực nghiệm, không phải lời bảo đảm rằng mô hình đã huấn luyện trước sẽ luôn thắng.

Điểm cần nhớ là: **đóng băng để có mốc so sánh nhanh, mở thêm tầng khi có bằng chứng cải thiện, và chỉ tin vào kết quả khi phép đánh giá không bị rò rỉ dữ liệu**. Từ một thân mạng ResNet dùng cho phân loại, ta cũng có thể đi tiếp sang bài toán dự đoán theo từng điểm ảnh trong [phân đoạn ngữ nghĩa, phân đoạn đối tượng và phân đoạn toàn cảnh](/blog/semantic-instance-panoptic-segmentation/).

---

### Tài liệu tham khảo

[1] J. Yosinski và cộng sự, [*How Transferable Are Features in Deep Neural Networks?*](https://proceedings.neurips.cc/paper_files/paper/2014/hash/532a2f85b6977104bc93f8580abbb330-Abstract.html), NeurIPS 2014.

[2] [Hướng dẫn học chuyển giao cho thị giác máy tính](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html), PyTorch Tutorials.

[3] [Tài liệu về mô hình và trọng số đã huấn luyện](https://docs.pytorch.org/vision/stable/models.html), TorchVision.
