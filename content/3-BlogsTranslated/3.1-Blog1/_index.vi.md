---
title: "Blog 1"
date: 2026-07-07
weight: 1
chapter: false
pre: " <b> 3.1. </b> "
---


{{% notice note %}}
📌 **Infor:** Blog 1 - Amazon VPC Lattice
{{% /notice %}}

# Amazon VPC Lattice - Khi microservices không còn phải đi vòng để giao tiếp với nhau

Chào mọi người, hôm nay mình chia sẻ nhanh một case study từ AWS về cách **Insurance Australia Group (IAG)** dùng **Amazon VPC Lattice** để cải thiện giao tiếp giữa các service trong kiến trúc serverless.

IAG là một công ty bảo hiểm lớn tại Úc và New Zealand, vận hành nhiều hệ thống phục vụ khách hàng như mua bảo hiểm, quản lý hợp đồng và các dịch vụ liên quan. Họ xây dựng nền tảng trên AWS theo hướng serverless với nhiều microservices chạy bằng **AWS Lambda**. Khi số lượng service tăng lên, việc các service gọi qua lại bắt đầu gây ra vấn đề về hiệu năng và độ phức tạp.

---

## Vấn đề trước đây

Trong kiến trúc cũ, khi một Lambda gọi sang service khác, request không đi trực tiếp mà phải vòng qua nhiều lớp như **Transit Gateway**, **Egress VPC**, proxy, Internet rồi mới tới **API Gateway** và service đích.

Dù service vẫn nằm trong AWS, request lại phải đi một vòng khá dài. Điều này làm tăng độ trễ, khiến kiến trúc phức tạp hơn và khó quản lý. Khi một service gọi tiếp nhiều service khác, độ trễ còn bị cộng dồn. Ngoài ra, endpoint thường bị hardcode nên việc thay đổi cũng kém linh hoạt.

---

## Amazon VPC Lattice là gì?

**Amazon VPC Lattice** giúp đơn giản hóa việc kết nối giữa các service trong AWS. Thay vì phải tự xử lý nhiều tầng networking, các service có thể giao tiếp với nhau thông qua một lớp kết nối chung, an toàn và dễ quản lý hơn.

Trong case này, IAG dùng **Lattice Services** để expose các Lambda function, giúp các service giao tiếp trực tiếp trong mạng AWS mà không cần đi qua Internet.

---

## Kiến trúc mới

IAG triển khai VPC Lattice bằng cách tạo các **Service Network** riêng cho từng môi trường như **Development**, **Staging** và **Production**. Các network này được quản lý tập trung và chia sẻ sang các account tương ứng.

Cách làm này giúp tách biệt môi trường rõ ràng nhưng vẫn dễ quản lý. Đồng thời, họ dùng **Auth Policy** để chỉ cho phép traffic từ các VPC hợp lệ, tăng thêm một lớp kiểm soát bảo mật.

---

## Luồng giao tiếp mới

Sau khi dùng VPC Lattice, request giữa các service đi ngắn hơn rất nhiều. Lambda chỉ cần gọi đến domain nội bộ, **Route 53** sẽ map sang Lattice service, rồi request được chuyển trực tiếp đến Lambda của service đích.

Nhờ vậy, traffic không còn phải đi qua Internet hay nhiều lớp trung gian, giúp giảm độ trễ và tăng tính bảo mật.

---

## Kết quả

Sau khi triển khai, IAG ghi nhận độ trễ giữa các service giảm từ **46% đến 83%**, với **P95 latency** cải thiện từ **15% đến 92%**. Đây là mức cải thiện khá lớn, đặc biệt với hệ thống có nhiều service gọi qua lại.

Ngoài ra, kiến trúc cũng gọn hơn, dễ vận hành hơn và giảm phụ thuộc vào các thành phần networking phức tạp.

---

## Lợi ích chính

VPC Lattice giúp giảm latency rõ rệt, đơn giản hóa kiến trúc mạng và cải thiện bảo mật vì traffic không cần đi ra Internet. Việc tách môi trường cũng rõ ràng hơn, phù hợp với hệ thống nhiều account. Đặc biệt, nó rất hợp với kiến trúc serverless dùng Lambda.

Các lợi ích chính có thể tóm tắt như sau:

* Giảm độ trễ khi các service giao tiếp với nhau.
* Đơn giản hóa kiến trúc mạng giữa các microservices.
* Hạn chế việc traffic phải đi qua Internet.
* Tăng khả năng kiểm soát bảo mật bằng Auth Policy.
* Phù hợp với hệ thống nhiều môi trường và nhiều AWS account.
* Hỗ trợ tốt cho kiến trúc serverless sử dụng AWS Lambda.

---

## Một vài lưu ý

Hiện tại IAG vẫn đang dùng **Auth Policy** ở mức Service Network, tức là kiểm soát theo VPC. Trong tương lai, họ muốn kiểm soát chi tiết hơn ở từng service.

Ngoài ra, event format từ VPC Lattice khác với API Gateway nên các team cần cập nhật lại handler để xử lý đúng.

---

## Kết luận

Amazon VPC Lattice giúp IAG giải quyết bài toán quen thuộc trong microservices: giao tiếp nhanh hơn, đơn giản hơn và an toàn hơn. Thay vì phải đi vòng qua nhiều lớp mạng, các service có thể gọi trực tiếp trong AWS, giúp giảm độ trễ đáng kể và làm kiến trúc gọn hơn.

Nếu bạn đang xây dựng hệ thống serverless hoặc microservices trên AWS, đặc biệt khi số lượng service bắt đầu nhiều lên, VPC Lattice là một lựa chọn hay ho rất đáng cân nhắc.

---
## Link tham khảo

https://aws.amazon.com/vi/blogs/networking-and-content-delivery/how-iag-accelerated-service-to-service-communication-with-amazon-vpc-lattice/


---


<img src="/images/Blog/blog1-1.png" style="max-width:100%; margin-bottom:16px;" />

<img src="/images/Blog/blog1-2.png" style="max-width:100%; margin-bottom:16px;" />
