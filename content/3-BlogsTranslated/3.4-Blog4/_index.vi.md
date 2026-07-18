---
title: "Blog 4"
date: 2026-07-09
weight: 4
chapter: false
pre: " <b> 3.4. </b> "
---

📌 **Infor:** Blog 4 - Amazon EKS Version Rollbacks

# Amazon EKS Version Rollbacks - Vĩnh biệt nỗi lo "sập cụm" mỗi khi nâng cấp Kubernetes

Chào mọi người, hôm nay mình chia sẻ nhanh một tính năng mới cực kỳ "cứu cánh" từ AWS dành cho anh em đang vận hành Kubernetes: **Kubernetes Version Rollbacks** cho **Amazon EKS**. Đây là tính năng hứa hẹn giúp anh em DevOps ngủ ngon hơn mỗi khi đến mùa upgrade cluster.

---

## Vấn đề trước đây: Chiếc "cửa một chiều" đầy rủi ro

Từ trước đến nay, việc nâng cấp mặt phẳng điều khiển (**control plane**) trong Kubernetes mã nguồn mở luôn là một quyết định "một đi không trở lại". Bản chất của K8s không hỗ trợ hạ cấp control plane, nghĩa là một khi đã bấm nút lên đời thì không thể quay xe.

Chính hạn chế này buộc các doanh nghiệp phải tự "vẽ" ra những quy trình kiểm thử cực kỳ cồng kềnh: từ việc tạo thời gian chạy thử (**bake periods**), chia nhóm triển khai so le, cho đến các chu kỳ phê duyệt kéo dài cả tháng trời.

Với tần suất Kubernetes ra mắt 3 phiên bản phụ (**minor version**) mỗi năm, các team quản lý hàng trăm cụm cluster — đặc biệt là trong môi trường tài chính, ngân hàng bị kiểm soát chặt chẽ — thường chọn cách trì hoãn nâng cấp vì sợ sập hệ thống mà không khôi phục được.

Hệ quả là cụm bị kẹt ở bản cũ, thiếu patch bảo mật và dính hạn **End of Support**.

---

## Giải pháp: Nút "Undo" thần kỳ từ Amazon EKS

Để giải quyết bài toán nhức nhối này, AWS vừa chính thức tung ra tính năng hoàn tác phiên bản (**version rollbacks**) cho **Amazon EKS**. Đây chính là "tấm lưới bảo hiểm" giúp anh em đảo ngược quá trình nâng cấp trong vòng **7 ngày** nếu phát hiện ra bất kỳ lỗi xung đột hay tương thích nào, đưa cụm cluster về ngay trạng thái ổn định trước đó.

Khác với các giải pháp mô phỏng (**emulated versions**) của cộng đồng vốn chỉ giữ cụm ở trạng thái chuyển tiếp tạm thời, EKS rollback sẽ đưa hệ thống về đúng phiên bản cũ "xịn" đã được xác thực hoàn toàn từng chạy ổn định trong production.

Ví dụ, từ bản `1.34` lên `1.35` mà dính lỗi tương thích, anh em chỉ cần rollback về lại `1.34` là xong, không cần phải tốn công dựng lại cluster từ đầu hay cuống cuồng fix bug dưới áp lực thời gian.

---

## Cơ chế hoạt động thông minh

**Đánh giá an toàn tự động:** Trước khi cho phép "quay xe", EKS sẽ dùng tính năng **cluster insights** để tự động quét hệ thống, gắn cờ cảnh báo nếu có bất kỳ vấn đề gì về phiên bản node hoặc các phần phụ thuộc của add-on. Nếu anh em đã tự check và muốn làm nhanh, có thể dùng cờ `--force` để bỏ qua.

**Thời gian thực hiện nhanh:** Quá trình rollback control plane chỉ mất khoảng **20 phút**, tương đương một lần nâng cấp tiêu chuẩn, và cụm vẫn hoạt động bình thường trong suốt thời gian này.

---

## Lưu ý đặc biệt cho EKS Auto Mode

Đối với anh em dùng **EKS Auto Mode**, tức là hạ tầng được quản lý hoàn toàn, tính năng này còn xịn hơn vì nó sẽ tự động hoàn tác đồng bộ cả control plane lẫn các managed node cùng nhau.

Tuy nhiên, vì việc rollback node phải tôn trọng cấu hình **Ngân sách gián đoạn Pod** (**Pod Disruption Budgets - PDB**) để đảm bảo ứng dụng không bị sập, quá trình này có thể sẽ mất thời gian hơn.

Để tối ưu trải nghiệm, AWS đã bổ sung thêm một **cancel API** cho phép anh em chủ động dừng quá trình rollback node bất kỳ lúc nào để điều chỉnh lại PDB hoặc đổi chiến thuật xử lý.

---

## Chi phí và tính khả dụng

**HOÀN TOÀN MIỄN PHÍ:** Tính năng này được tặng kèm sẵn, anh em chỉ trả chi phí EKS và compute như bình thường, không tốn thêm bất kỳ khoản phí phát sinh nào cho việc rollback.

Hiện tại tính năng đã khả dụng trên toàn bộ các **AWS Regions thương mại**, hỗ trợ cho cả các cụm EKS đang trong gói hỗ trợ tiêu chuẩn (**standard support**) lẫn hỗ trợ mở rộng (**extended support**).

---

## Kết luận

Tính năng **Kubernetes Version Rollbacks** trên **Amazon EKS** đã giải quyết triệt để nỗi sợ lớn nhất của dân vận hành: nâng cấp lỗi mà không thể quay đầu. Giờ đây việc duy trì bảo mật và cập nhật phiên bản mới cho hệ thống đã trở nên an tâm và dễ dàng hơn rất nhiều.

---

## Link chi tiết bài viết

[Upgrade Amazon EKS clusters with confidence using Kubernetes version rollbacks](https://aws.amazon.com/blogs/aws/upgrade-amazon-eks-clusters-with-confidence-using-kubernetes-version-rollbacks/)

---
![](https://hoaithoai.github.io/images/Blog/blog4.png)