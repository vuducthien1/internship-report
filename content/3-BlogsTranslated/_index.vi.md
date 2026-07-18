---
title: "Các Bài Blogs Đã Dịch"
date: 2024-01-01
weight: 3
chapter: false
pre: " <b> 3. </b> "
---

{{% notice note %}}
📌 **Infor:** Tổng hợp 4 bài blog kỹ thuật AWS đã dịch trong thời gian thực tập, xoay quanh các chủ đề networking, database, storage và container.
{{% /notice %}}


---

### [Blog 1 - Amazon VPC Lattice: Tăng tốc giao tiếp giữa các microservices](3.1-Blog1/)

Bài viết tóm tắt case study của **Insurance Australia Group (IAG)** ứng dụng **Amazon VPC Lattice** để giải quyết bài toán độ trễ cao khi các Lambda function gọi qua lại trong kiến trúc serverless. Nhờ VPC Lattice, traffic không còn đi vòng qua Internet mà được route trực tiếp trong mạng AWS, giúp giảm P95 latency từ **15% đến 92%**.

---

### [Blog 2 - Logical Replication trong Amazon RDS for PostgreSQL 18](3.2-Blog2/)

Bài viết giới thiệu các cải tiến quan trọng của **logical replication** trong **PostgreSQL 18** khi chạy trên Amazon RDS: hỗ trợ replicate STORED generated columns, theo dõi conflict rõ ràng hơn qua `pg_stat_subscription_stats`, parallel streaming mặc định để giảm replication lag, thay đổi two-phase commit linh hoạt và tự xử lý replication slot bị idle.

---

### [Blog 3 - Private NAT Gateway: Giải pháp cạn kiệt IP của United Airlines](3.3-Blog3/)

Bài viết phân tích cách **United Airlines** dùng **Private NAT Gateway** để xử lý bài toán thiếu IPv4 trong môi trường hybrid AWS khi workload cần scale đột biến. Bằng cách chuyển compute workload sang dải `100.64.0.0/10` (RFC 6598) và dùng Private NAT Gateway làm lớp dịch địa chỉ, United đã tách việc scale compute khỏi giới hạn IP routable mà không cần thay đổi hệ thống đích.

---

### [Blog 4 - Amazon EKS Version Rollbacks: Nâng cấp Kubernetes không còn "một chiều"](3.4-Blog4/)

Bài viết giới thiệu tính năng **Kubernetes Version Rollbacks** trên **Amazon EKS** — cho phép hoàn tác nâng cấp control plane trong vòng 7 ngày nếu phát hiện lỗi tương thích. Tính năng này giúp các team vận hành Kubernetes tự tin nâng cấp phiên bản mà không sợ "một đi không trở lại", đặc biệt hữu ích với các môi trường production có yêu cầu kiểm soát chặt chẽ.
