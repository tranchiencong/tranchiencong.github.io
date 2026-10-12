---
title: "Transfer Learning với ResNet: Khi nào nên đóng băng hay fine-tune?"
description: "Hướng dẫn tư duy sử dụng ResNet pretrained, phân biệt feature extraction và fine-tuning, đồng thời kiểm soát leakage và domain shift."
pubDate: "2026-10-28"
draft: true
tags: ["transfer learning", "resnet", "computer vision"]
---

Huấn luyện một mô hình thị giác từ đầu thường cần nhiều dữ liệu, compute và thời gian. Transfer Learning tái sử dụng representation đã học từ source task để giải quyết target task mới. Với [ResNet](/blog/tim-hieu-resnet-trong-computer-vision/), ta thường thay classification head rồi huấn luyện trên dataset riêng.

Nhưng “dùng pretrained model” không tự động bảo đảm kết quả tốt. Lợi ích phụ thuộc mức tương đồng giữa hai domain, lượng dữ liệu đích và protocol fine-tuning.

![So sánh feature extraction và fine-tuning trong Transfer Learning](https://raw.githubusercontent.com/mrdbourke/tensorflow-deep-learning/main/images/05-transfer-learning-feature-extraction-vs-fine-tuning.png)
*Feature extraction giữ cố định phần lớn encoder, còn fine-tuning cập nhật thêm các layer pretrained. Nguồn: [TensorFlow Deep Learning](https://github.com/mrdbourke/tensorflow-deep-learning).*

## 1. Source task và target task

Gọi encoder pretrained là:

$$
\mathbf{z}=f_{\theta}(\mathbf{x}),
$$

và head cho tác vụ mới là:

$$
\hat{\mathbf{y}}=g_{\phi}(\mathbf{z}).
$$

Ta khởi tạo $\theta$ từ source task và khởi tạo mới $\phi$. Hai chiến lược phổ biến khác nhau ở việc có cập nhật $\theta$ hay không.

Source và target có thể khác nhau trên nhiều trục:

- **Input distribution:** ảnh tự nhiên, X-quang, ảnh vệ tinh hoặc ảnh kính hiển vi.
- **Label space:** 1.000 lớp ImageNet so với một số lớp chuyên ngành.
- **Task:** classification, detection hay segmentation.
- **Resolution và số channel:** ảnh RGB ba channel so với ảnh grayscale hoặc multispectral.
- **Acquisition process:** camera, scanner, bệnh viện hoặc điều kiện ánh sáng khác nhau.

Khoảng cách này thường được gọi chung là **domain gap**. Không có một con số duy nhất đo domain gap hoàn hảo; nó phải được đánh giá bằng cả hiểu biết về quy trình tạo dữ liệu và bằng chứng transfer thực nghiệm.

## 2. Ba chế độ huấn luyện cần phân biệt

| Chế độ | Encoder | Head mới | Chi phí | Khi nên dùng làm baseline |
| --- | --- | --- | --- | --- |
| Linear probe/feature extraction | Đóng băng | Huấn luyện | Thấp | Dataset nhỏ, kiểm tra nhanh chất lượng representation |
| Partial fine-tuning | Mở một số stage cuối | Huấn luyện | Trung bình | Cần thích nghi semantic cấp cao |
| Full fine-tuning | Cập nhật toàn bộ | Huấn luyện | Cao | Có đủ dữ liệu và cần thích nghi mạnh |

Ba chế độ này phải được so sánh dưới cùng split và evaluation protocol. Nếu full fine-tuning được tune kỹ hơn feature extraction, kết luận về chiến lược sẽ bị lẫn với chênh lệch tuning budget.

## 3. Feature extraction

Trong feature extraction, encoder bị đóng băng:

$$
\theta \leftarrow \theta_{\mathrm{pretrained}},\qquad
\nabla_{\theta}L=0.
$$

Chỉ head mới được huấn luyện. Cách này nhanh, ít tốn memory và giảm số tham số cần ước lượng. Nó là baseline tốt khi dataset nhỏ hoặc domain gần dữ liệu pretraining.

Điểm yếu là representation không thích nghi. Nếu target là ảnh X-quang, ảnh vệ tinh hoặc ảnh công nghiệp khác xa ảnh tự nhiên, feature cố định có thể bỏ qua tín hiệu quan trọng.

Feature extraction cũng là phép kiểm tra rẻ cho checkpoint. Nếu linear head không vượt được baseline đơn giản, mở toàn bộ encoder ngay lập tức chưa chắc là lựa chọn tốt; trước hết nên kiểm tra preprocessing, label noise và domain gap.

## 4. Fine-tuning

Fine-tuning cập nhật một phần hoặc toàn bộ encoder. Learning rate cho backbone thường nhỏ hơn head:

$$
\eta_{\mathrm{backbone}} < \eta_{\mathrm{head}}.
$$

Có thể unfreeze dần từ stage cuối về stage đầu. Đây là heuristic, không phải quy luật. Lựa chọn cần được kiểm chứng trên validation set dưới cùng compute budget.

Fine-tuning có khả năng thích nghi cao hơn nhưng tăng nguy cơ overfitting hoặc làm mất representation hữu ích nếu learning rate quá lớn.

### Partial fine-tuning

Với ResNet, ta có thể chỉ mở `layer4`, rồi lần lượt `layer3`, `layer2`. Stage cuối thường gần task-specific representation hơn, nên đây là thứ tự thử nghiệm hợp lý. Tuy nhiên, đây vẫn chỉ là heuristic.

### Full fine-tuning

Toàn bộ model nhận gradient. Full fine-tuning cho flexibility cao nhất nhưng cần regularization, scheduler và checkpoint selection cẩn thận. Nếu target dataset rất nhỏ, số tham số hiệu dụng lớn có thể làm variance giữa các seed tăng mạnh.

### Discriminative learning rate

Một optimizer có thể dùng nhiều parameter group:

$$
\eta_{\mathrm{early}}
<
\eta_{\mathrm{late}}
<
\eta_{\mathrm{head}}.
$$

Layer đầu thay đổi chậm để giữ feature tổng quát; head học nhanh vì được khởi tạo mới. Tỷ lệ giữa các learning rate phải được xem là hyperparameter, không phải hằng số phổ quát.

## 5. Các tầng có mức transferability khác nhau

Nghiên cứu của Yosinski và cộng sự cho thấy các layer đầu thường học feature tổng quát hơn, trong khi layer cao chuyên biệt hơn với source task. Transferability giảm khi source và target xa nhau.

Không nên biến điều này thành khẩu hiệu “layer đầu luôn universal”. Dữ liệu y tế, multispectral hoặc microscopy có thống kê đầu vào khác đáng kể; ngay cả stem convolution cũng có thể cần thích nghi.

Kornblith và cộng sự quan sát mối liên hệ mạnh giữa ImageNet accuracy và transfer accuracy trong nhiều thiết lập classification họ khảo sát. Nhưng kết quả đó không chứng minh ImageNet accuracy luôn dự đoán tốt transfer tới mọi domain hoặc dense task. Khi source–target khác xa, lựa chọn pretraining objective và dữ liệu có thể quan trọng hơn vài điểm accuracy trên source benchmark.

## 6. Preprocessing phải khớp với checkpoint

Pretrained weights được học dưới một pipeline cụ thể: color space, resize, crop, interpolation và normalization. Thay pipeline mà không kiểm tra có thể làm feature distribution lệch ngay từ input.

TorchVision gắn preprocessing vào weight enum. Ví dụ `ResNet50_Weights.IMAGENET1K_V2.transforms()` trả về inference transform tương ứng. Khi cần training augmentation, ta có thể thay random crop/flip nhưng vẫn phải duy trì normalization đúng với checkpoint.

Với ảnh grayscale có ba lựa chọn thường gặp:

1. Lặp một channel thành ba channel để giữ nguyên stem pretrained.
2. Thay convolution đầu vào thành một channel và khởi tạo từ trung bình weight RGB.
3. Thay stem và học lại từ đầu.

Không có lựa chọn nào mặc định thắng. Chúng làm thay đổi lượng kiến thức thực sự được transfer và cần được ablate nếu đóng góp nghiên cứu phụ thuộc vào chúng.

## 7. Batch Normalization là trường hợp đặc biệt

Đặt parameter ở trạng thái không nhận gradient chưa chắc đã cố định running mean và variance. Trong training mode, BatchNorm có thể tiếp tục cập nhật statistics.

Vì vậy cần quyết định rõ:

- Freeze cả affine parameters và running statistics.
- Cập nhật statistics nhưng giữ weight/bias.
- Fine-tune toàn bộ BatchNorm.
- Thay normalization nếu batch quá nhỏ.

Sai khác này có thể làm kết quả thay đổi dù code đều được mô tả là “freeze backbone”.

Trong PyTorch, đặt `requires_grad=False` chỉ ngăn gradient cập nhật affine parameters; nó không tự ngăn running statistics thay đổi khi module ở training mode. Nếu muốn cố định BatchNorm, cần đưa các module này về `eval()` sau mỗi lần gọi `model.train()`:

```python
from torch import nn


def freeze_batch_norm_statistics(model: nn.Module) -> None:
    for module in model.modules():
        if isinstance(module, nn.BatchNorm2d):
            module.eval()
```

Với batch nhỏ, running statistics nhiễu có thể làm validation dao động. Nhưng dùng frozen statistics từ ImageNet cũng có thể không phù hợp domain mới. Đây là một quyết định thực nghiệm cần báo cáo.

## 8. Cài đặt feature extraction bằng PyTorch

Ví dụ dưới đây dùng weight enum cụ thể thay vì `DEFAULT`. Alias `DEFAULT` có thể trỏ tới weight khác khi thư viện cập nhật, còn `IMAGENET1K_V2` mô tả checkpoint xác định rõ hơn.

```python
from torch import nn
from torch.optim import AdamW
from torchvision.models import resnet50, ResNet50_Weights


num_classes = 5
weights = ResNet50_Weights.IMAGENET1K_V2
model = resnet50(weights=weights)

# Đóng băng toàn bộ backbone trước khi thay head.
for parameter in model.parameters():
    parameter.requires_grad = False

in_features = model.fc.in_features
model.fc = nn.Linear(in_features, num_classes)

# Chỉ head mới được optimizer cập nhật.
optimizer = AdamW(
    model.fc.parameters(),
    lr=1e-3,
    weight_decay=1e-4,
)

# Transform xác định đi cùng checkpoint cho validation/inference.
validation_transform = weights.transforms()
```

Sau khi head hội tụ, có thể mở `layer4` và dùng hai learning rate:

```python
for parameter in model.layer4.parameters():
    parameter.requires_grad = True

optimizer = AdamW(
    [
        {"params": model.layer4.parameters(), "lr": 1e-4},
        {"params": model.fc.parameters(), "lr": 1e-3},
    ],
    weight_decay=1e-4,
)
```

Các giá trị learning rate chỉ là điểm khởi đầu. Chúng không thay thế quá trình tuning có validation protocol rõ ràng.

![Kết quả phân loại kiến và ong bằng ResNet18 sau Transfer Learning](https://docs.pytorch.org/tutorials/_images/sphx_glr_transfer_learning_tutorial_002.png)
*Dự đoán trên validation images trong tutorial Transfer Learning chính thức. Nguồn: [PyTorch Tutorials](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html).*

## 9. Pipeline thực nghiệm được khuyến nghị

### Giai đoạn 1: baseline rẻ

1. Khởi tạo ResNet pretrained.
2. Thay classification head.
3. Freeze encoder.
4. Tune learning rate và regularization trên validation set.

### Giai đoạn 2: fine-tuning có kiểm soát

1. Unfreeze stage cuối.
2. Dùng discriminative learning rates.
3. Theo dõi training/validation loss và calibration.
4. Chỉ unfreeze thêm nếu validation evidence ủng hộ.

### Giai đoạn 3: đối chứng

So sánh với cùng kiến trúc huấn luyện từ random initialization. Nếu không có baseline này, chưa thể biết lợi ích đến từ transfer hay chỉ từ kiến trúc và augmentation.

### Giai đoạn 4: kiểm tra độ bền

1. Lặp lại trên nhiều seed.
2. Báo mean và độ phân tán.
3. Đánh giá theo subgroup hoặc source site.
4. Kiểm tra calibration và confidence distribution.
5. Nếu có temporal hoặc geographic shift, dùng external test set phù hợp.

Một experiment matrix tối thiểu có thể là:

| Khởi tạo | Trainable layers | Mục đích |
| --- | --- | --- |
| Random | Toàn bộ | Baseline không transfer |
| Pretrained | Head | Đo chất lượng feature cố định |
| Pretrained | `layer4` + head | Đo lợi ích thích nghi một phần |
| Pretrained | Toàn bộ | Đo full fine-tuning |

Giữ augmentation và optimization budget tương đương giúp tách ảnh hưởng của initialization khỏi các yếu tố khác.

## 10. Leakage trong transfer learning

Các rủi ro phổ biến:

- Một subject xuất hiện ở cả train và test qua nhiều ảnh.
- Pretraining dataset có ảnh trùng target test set.
- Chọn checkpoint dựa trên test performance.
- Fit normalization hoặc augmentation policy trên toàn dataset.
- Dùng test set để quyết định số layer unfreeze.

Trong ảnh y tế, split theo ảnh thay vì bệnh nhân có thể tạo kết quả rất lạc quan. Trong video, các frame gần nhau phải được nhóm trước khi chia split.

### Pretraining contamination

Với checkpoint công khai, đôi khi không thể chứng minh hoàn toàn source dataset không chứa near-duplicate của target test set. Ít nhất cần ghi rõ source dataset được công bố và kiểm tra duplicate trong dữ liệu do mình kiểm soát. Nếu target benchmark phổ biến xuất hiện trên Internet, contamination risk phải được thảo luận thay vì mặc định bằng không.

### Model selection leakage

Test set chỉ dành cho đánh giá cuối. Số epoch, layer được unfreeze, threshold và checkpoint đều phải chọn bằng train/validation. Xem test score nhiều lần rồi sửa pipeline là một dạng thích nghi với test set dù không backpropagate trực tiếp trên nó.

## 11. Khi pretraining có thể không giúp

Transfer có thể yếu hoặc gây negative transfer khi:

- Source và target domain rất khác.
- Target dataset đủ lớn để học từ đầu.
- Resolution hoặc số channel khác biệt mạnh.
- Nhãn source khuyến khích feature không liên quan.
- Training recipe từ đầu tốt hơn baseline yếu được chọn.

Do đó, “pretrained tốt hơn random initialization” là giả thuyết thực nghiệm, không phải fact áp dụng cho mọi dataset.

### Cheap falsification test

Trước khi chạy full fine-tuning tốn kém:

1. Trích feature cố định cho train và validation.
2. Huấn luyện linear classifier.
3. So với handcrafted/simple baseline và random encoder.
4. Vẽ learning curve theo 10%, 25%, 50% và 100% nhãn.

Nếu pretrained feature không mang lại lợi ích ở bất kỳ data regime nào, cần kiểm tra preprocessing và domain gap trước khi tăng compute. Nếu chỉ có lợi ở low-data regime, contribution phù hợp có thể là data efficiency chứ không phải final accuracy.

## 12. Metric nào phù hợp?

Accuracy phù hợp với lớp cân bằng và cost tương đương. Với imbalance hoặc quyết định rủi ro cao, cần thêm:

- Macro F1 hoặc balanced accuracy.
- Per-class sensitivity và specificity.
- AUROC và precision–recall curve.
- Expected Calibration Error hoặc Brier score.
- Confidence interval trên đơn vị độc lập.

Một pretrained model có thể tăng accuracy nhưng calibration xấu hơn. Nếu confidence được dùng để từ chối mẫu hoặc ưu tiên kiểm tra thủ công, calibration là phần của mục tiêu chứ không phải phân tích phụ.

## 13. Cần báo cáo gì để tái lập?

- Tên và nguồn checkpoint.
- Phiên bản library và preprocessing gắn với weights.
- Layer nào được freeze/unfreeze.
- Trạng thái BatchNorm.
- Learning rate cho từng parameter group.
- Split, seed và early-stopping rule.
- Augmentation, resolution và class weighting.
- Hardware và mixed precision.

Ngoài ra nên lưu:

- Hash hoặc tên chính xác của weights, ví dụ `IMAGENET1K_V2`.
- Best-checkpoint criterion.
- Số lần thử hyperparameter.
- Training time và peak memory.
- Kết quả từng seed, không chỉ seed tốt nhất.

## 14. Các failure mode thường gặp

| Failure mode | Dấu hiệu | Cách kiểm tra |
| --- | --- | --- |
| Learning rate backbone quá lớn | Validation giảm ngay khi unfreeze | So gradient norm và thử LR nhỏ hơn |
| Head overfit | Train tốt, validation kém khi encoder frozen | Regularization, augmentation, learning curve |
| BatchNorm lệch domain | Train/validation thay đổi mạnh giữa `train()` và `eval()` | Ablate BN frozen và cập nhật statistics |
| Sai preprocessing | Pretrained baseline bất thường thấp | Dùng transform gắn với weight enum |
| Split leakage | Validation gần hoàn hảo nhưng external test kém | Group split theo subject/scene |
| Negative transfer | Random initialization tốt hơn ổn định | So nhiều seed và cùng training budget |

Failure analysis nên được thực hiện trước khi đổi sang kiến trúc phức tạp hơn. Nhiều lỗi transfer learning đến từ pipeline chứ không phải thiếu capacity.

## 15. Tổng kết

Feature extraction rẻ và là baseline hợp lý; fine-tuning linh hoạt hơn nhưng phải kiểm soát optimization và overfitting. Chiến lược tốt nhất không được quyết định chỉ bằng kích thước dataset mà còn bởi domain gap, metric mục tiêu và compute budget.

Sau classification và detection, chuỗi bài chuyển sang dự đoán theo pixel: [Semantic, Instance và Panoptic Segmentation](/blog/semantic-instance-panoptic-segmentation/).

---

### Nguồn tham khảo

[1] J. Yosinski et al., [*How Transferable Are Features in Deep Neural Networks?*](https://proceedings.neurips.cc/paper_files/paper/2014/hash/532a2f85b6977104bc93f8580abbb330-Abstract.html), NeurIPS 2014.

[2] A. Kornblith, J. Shlens, and Q. V. Le, [*Do Better ImageNet Models Transfer Better?*](https://openaccess.thecvf.com/content_CVPR_2019/html/Kornblith_Do_Better_ImageNet_Models_Transfer_Better_CVPR_2019_paper.html), CVPR 2019.

[3] K. He et al., [*Deep Residual Learning for Image Recognition*](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html), CVPR 2016.

