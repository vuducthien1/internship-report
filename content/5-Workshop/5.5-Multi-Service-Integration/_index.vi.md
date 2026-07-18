---
title: "Xác minh tài nguyên sau khi triển khai"
date: 2024-01-01
weight: 5
chapter: false
pre: " <b> 5.5. </b> "
---


#### Mục đích
Xác minh rằng các dịch vụ cốt lõi được cung cấp bởi CloudFormation đã được tạo theo kiến ​​trúc bảo mật dự kiến.

#### Các dịch vụ thực tế cần xác minh trên Bảng điều khiển AWS

| Dịch vụ | Tên tài nguyên đã được tạo | Trạng thái |
|:--|:--|:--|
| Amazon S3 | `vdcms-prod-frontendbucket-eltg7i7qejwf` (Giao diện người dùng) & `vdcms-prod-databucket-fd8alu3qezcr` (Dữ liệu) | Tạo |
| Amazon EC2 | `vdcms-prod-backend` (t3.small) | Đang chạy |
| Amazon RDS | `vdcms-prod-database` (Công cụ: MySQL Community / Aurora) | Có sẵn |
| Amazon CloudFront | Phân bổ `E1R0G8NW5808J0` | Đã bật |
| Amazon SQS | `vdcms-prod-TranscribeQueue` & `vdcms-prod-TranscribeDeadLetterQueue` | Tạo |
| Amazon Cognito | Nhóm người dùng `vdcms-prod-users` với các nhóm: `admin`,`manager`,`engineer` | Tạo |
| Trình quản lý bí mật AWS | `DatabaseServer-Secret...`,`JwtSecret-...` | Được lưu trữ an toàn |
| AWS WAF & Shield | `vdcms-prod-regional-waf` (4 bộ quy tắc) | Đã áp dụng |
| Amazon CloudWatch | Nhóm nhật ký (lịch sử tham số RDS TLS) | Có sẵn |

- **Amazon S3:** Xác nhận có hai bucket: `vdcms-prod-frontendbucket-eltg7i7qejwf` bao gồm giao diện người dùng tĩnh (static Frontend), và `vdcms-prod-databucket-fd8alu3qezcr` Lưu trữ các tệp âm thanh và ghi lại nội dung.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-3.png)

- **Amazon EC2:** Trong bảng điều khiển EC2, hãy xác nhận phiên bản `vdcms-prod-backend` (t3.small) đang ở trạng thái Đang **chạy**.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5.png)

- **Amazon RDS:** Trong bảng điều khiển RDS/Aurora, hãy xác minh cụm cơ sở dữ liệu `vdcms-prod-database` (Cộng đồng MySQL) đã **có sẵn**.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-5.png)

- **Amazon CloudFront:** Đảm bảo phân phối `E1R0G8NW5808J0` Đã **được kích hoạt**.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-2.png)

- **Amazon SQS:** Xác minh hàng đợi `vdcms-prod-TranscribeQueue` Và `vdcms-prod-TranscribeDeadLetterQueue` Tồn tại và đang hoạt động.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-4.png)

- **Amazon Cognito:** Kiểm tra nhóm người dùng `vdcms-prod-users` và các nhóm của nó; xác nhận `admin`, `manager`, `engineer` hiện hữu.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-8.png)

- **AWS Secrets Manager:** Xác minh các bí mật như `DatabaseServer-Secret...` Và `JwtSecret-...` Chúng hiện có và được lưu trữ một cách an toàn.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-7.png)

- **AWS WAF & Shield:** Xác nhận WAF khu vực `vdcms-prod-regional-waf` đã được áp dụng và các nhóm quy tắc bảo vệ chống bot/IP/tấn công từ chối dịch vụ/phần mềm độc hại đang hoạt động.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-6.png)

- **Amazon CloudWatch:** Kiểm tra các nhóm nhật ký và xem lại nhật ký RDS để tìm lịch sử tham số TLS và các sự kiện khởi tạo khác.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-1.png)
