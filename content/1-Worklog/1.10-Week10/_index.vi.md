---
title: "Worklog Tuần 10"
date: 2024-01-01
weight: 2
chapter: false
pre: " <b> 1.10. </b> "
---



### Mục tiêu tuần 10:

* Kiểm thử xác thực người dùng qua AWS Cognito.
* Kểm thử lưu luợng bất đồng bộ và tích hợp JWT, SQS, Transcribe.

### Các công việc cần triển khai trong tuần này:
| Ngày | Nội dung công việc | Ngày bắt đầu | Ngày hoàn thành |
| --- | --- | --- | --- |
| Toàn tuần | Kiểm thử AWS Cognito, JWT, SQS, Transcribe, CloudFront, RDS replication | 22/06/2026 | 28/06/2026 |


### Kết quả đạt được tuần 10:

* Nghiên cứu và kiểm thử thành công luồng xác thực người dùng (Authentication) qua AWS Cognito.

* Kiểm thử thành công quá trình lấy token JWT và xác thực tính bảo mật.

* Kiểm thử luồng xử lý bất đồng bộ (Asynchronous): upload audio, tạo task vào SQS, xử lý và gửi Transcribe.

* Đánh giá bảo mật thế WAF, tốc độ CloudFront, và đồng bộ RDS.

* Kiểm thử tính toàn vẹn dữ liệu và replication giữa Availability Zones. 
  * Compute
  * Storage
  * Networking 
  * Database
  * ...

* Đã tạo và cấu hình AWS Free Tier account thành công.

* Làm quen với AWS Management Console và biết cách tìm, truy cập, sử dụng dịch vụ từ giao diện web.

* Cài đặt và cấu hình AWS CLI trên máy tính bao gồm:
  * Access Key
  * Secret Key
  * Region mặc định
  * ...

* Sử dụng AWS CLI để thực hiện các thao tác cơ bản như:

  * Kiểm tra thông tin tài khoản & cấu hình
  * Lấy danh sách region
  * Xem dịch vụ EC2
  * Tạo và quản lý key pair
  * Kiểm tra thông tin dịch vụ đang chạy
  * ...

* Có khả năng kết nối giữa giao diện web và CLI để quản lý tài nguyên AWS song song.
* ...


