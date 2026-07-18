---
title : "Chi tiết cấu hình xác thực Email"
date : 2024-01-01
weight : 3
chapter : false
pre : " <b> 5.3. </b> "
---

#### Mục đích
Đảm bảo hệ thống có một kênh truyền thông tin cậy để tự động gửi thông báo đăng ký tài khoản hoặc nhắc nhở phê duyệt công việc.

#### Quy trình thực hiện chi tiết

1. Người thực hiện truy cập bảng điều khiển AWS tại khu vực Singapore (`ap-southeast-1`), tìm kiếm dịch vụ Amazon Simple Email Service (SES).
2. Tại thanh menu bên trái, chọn mục **Identities** và nhấn **Create Identity**.
3. Chọn Identity type là **Email address**. Tại trường dữ liệu, tiến hành nhập địa chỉ **[admin.vdcms@gmail.com](mailto:admin.vdcms@gmail.com)** rồi nhấn nút **Create Identity** ở góc dưới. Trạng thái ban đầu của Identity này sẽ hiển thị là **Verification pending** (Chờ xác thực).
4. Người thực hiện đăng nhập vào hộp thư Gmail cá nhân, mở email gửi đến từ hệ thống Amazon Web Services – Email Address Verification Request và nhấp chọn đường link URL xác nhận thời hạn 24 giờ do AWS cung cấp để hoàn tất xác thực.
5. Quay trở lại giao diện SES Console, tải lại trang để xác nhận cột **Identity status** đã chuyển sang trạng thái tích xanh **Verified** (Đã xác thực).

![SES verification](/images/5-Workshop/5.3-Amazon-SES/5-3.png)
