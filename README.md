# Voice-Driven Construction Management System

Hệ thống quản lý công trình gồm ba vai trò:

- **Admin:** quản trị người dùng, toàn bộ dự án, báo cáo và giám sát chat.
- **Manager:** quản lý dự án của chính mình, giao việc và xem báo cáo thuộc dự án đó.
- **Engineer:** xem công việc được giao và gửi báo cáo tiến độ.

Ứng dụng gồm frontend React/Vite trong thư mục FE, backend Express/MySQL/Socket.IO trong BE.

## Bảo mật phiên đăng nhập

- Access token JWT chỉ tồn tại 15 phút và được lưu trong cookie `HttpOnly`, `SameSite=Lax`; production bắt buộc cờ `Secure`.
- Refresh token tồn tại 7 ngày, chỉ gửi đến `/api/auth`, được lưu dạng SHA-256 trong MySQL và xoay vòng sau mỗi lần làm mới.
- Frontend không lưu access/refresh token trong `localStorage`; API và Socket.IO xác thực bằng cookie.
- Đăng xuất, đổi mật khẩu và đặt lại mật khẩu sẽ thu hồi refresh session tương ứng.
- Backend vẫn chấp nhận Bearer token Cognito ở giai đoạn dual-auth.

## Tích hợp Amazon Web Services

- **Amazon S3:** tài liệu dự án, file và ghi âm chat được lưu private với mã hóa SSE-S3; tài liệu đi qua API kiểm tra quyền, media chat dùng URL ký tạm thời. Khi chưa cấu hình bucket, hệ thống dùng ổ đĩa local.
- **Amazon SES:** ưu tiên gửi email xác thực và khôi phục mật khẩu qua SES; nếu chưa cấu hình sẽ dùng Resend hoặc email outbox.
- **Amazon Transcribe:** Engineer có thể ghi âm báo cáo và chuyển tiếng Việt/Anh thành văn bản qua backend; Web Speech API vẫn là phương án dự phòng.
- **Amazon SQS:** tách request ghi âm khỏi Transcribe worker, có retry và dead-letter queue.
- **Amazon RDS MySQL:** database production nằm trong private subnet và bắt buộc TLS.
- **Amazon EC2 + ALB:** backend chạy bằng systemd trong private subnet, ALB kiểm tra `/health`.
- **Amazon CloudFront:** host frontend S3 private và chuyển tiếp API/Socket.IO bằng cùng một HTTPS origin.
- **Amazon Cognito:** User Pool, MFA TOTP và group vai trò; backend hỗ trợ chuyển đổi dần từ JWT cũ.
- **AWS WAF + Amazon VPC:** bảo vệ ALB/Cognito và cô lập public, application, database subnet.
- Admin xem cấu hình và kiểm tra kết nối tại `/admin/aws`. Không API nào trả access key hoặc secret ra frontend.

Thiết lập các biến `AWS_*` trong `BE/.env` theo [BE/.env.example](BE/.env.example). Policy IAM của backend tham khảo tại [docs/aws-iam-policy.example.json](docs/aws-iam-policy.example.json). Nếu dùng `AWS_TRANSCRIBE_ROLE_ARN`, tạo data role với [trust policy](docs/aws-transcribe-role-trust.example.json) và [S3 read policy](docs/aws-transcribe-data-policy.example.json). Bucket S3 và Transcribe phải đặt cùng region. Với SES sandbox, địa chỉ gửi/nhận phải được xác thực trước khi demo.

Hạ tầng production nằm tại [infra/cloudformation/vdcms-production.yml](infra/cloudformation/vdcms-production.yml). Xem kiến trúc, chi phí và cách triển khai trong [docs/aws-architecture.md](docs/aws-architecture.md); script triển khai là [infra/deploy-aws.ps1](infra/deploy-aws.ps1).

### Tài liệu kiến trúc và kiểm thử

- Sơ đồ AWS chỉnh sửa được: [docs/architecture/vdcms-aws-architecture.drawio](docs/architecture/vdcms-aws-architecture.drawio)
- Bản SVG để chèn báo cáo: [docs/architecture/vdcms-aws-architecture.svg](docs/architecture/vdcms-aws-architecture.svg)
- Hướng dẫn vẽ và giải thích từng số: [docs/architecture/HUONG-DAN-VE-KIEN-TRUC-AWS.md](docs/architecture/HUONG-DAN-VE-KIEN-TRUC-AWS.md)
- Hướng dẫn thực hành theo đúng nhóm và tên icon có sẵn trong draw.io: [docs/architecture/HUONG-DAN-THUC-HANH-DRAWIO.md](docs/architecture/HUONG-DAN-THUC-HANH-DRAWIO.md)
- Danh sách từ khóa tìm icon AWS trong draw.io và file SVG dự phòng: [docs/architecture/DANH-SACH-ICON-AWS.md](docs/architecture/DANH-SACH-ICON-AWS.md)
- Danh sách chính xác icon AWS cần dùng: [docs/architecture/DANH-SACH-ICON-AWS.md](docs/architecture/DANH-SACH-ICON-AWS.md)
- Checklist 224 test case: [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md)
- Hướng dẫn triển khai kiểm thử từng dịch vụ AWS và dọn chi phí: [docs/AWS-TESTING-GUIDE.md](docs/AWS-TESTING-GUIDE.md)
- Danh mục thư viện/công nghệ: [docs/THU-VIEN-SU-DUNG.md](docs/THU-VIEN-SU-DUNG.md)
- Hồ sơ nộp gồm Worklog, Proposal, Project và Workshop AWS: [docs/submission/README.md](docs/submission/README.md)

## Nghiệp vụ hiện trường

- Engineer có bảng điều khiển riêng, lịch hạn công việc, checklist, chi tiết và dòng thời gian cập nhật.
- Báo cáo tiến độ được tự động lưu bản nháp trên thiết bị; PWA giữ giao diện khả dụng khi mất mạng và không cache API/token.
- Engineer có thể gửi đề nghị gia hạn, báo vướng mắc và báo cáo sự cố an toàn kèm ảnh/toạ độ.
- Manager/Admin duyệt yêu cầu, theo dõi xử lý sự cố và quản lý tài liệu dự án theo phiên bản.
- Tài liệu được tải xuống qua API có xác thực; file tải lên được giới hạn dung lượng, MIME và chữ ký nội dung.

### Không gian điều hành Manager

- Dashboard tập trung dự án, việc quá hạn, báo cáo/yêu cầu chờ duyệt và sự cố ưu tiên.
- Manager được chỉnh dự án thuộc quyền nhưng không được đổi người quản lý, xóa hoặc tự mở lại dự án đã hoàn thành.
- Công việc có thể điều chỉnh hạn, ưu tiên, trạng thái và kỹ sư phụ trách; mọi thay đổi bắt buộc có lý do và được ghi timeline.
- Không gian dự án gom công việc, kỹ sư, báo cáo, sự cố và tài liệu vào các tab nghiệp vụ.
- Lịch deadline, bảng tải kỹ sư và báo cáo KPI hỗ trợ xuất CSV hoặc in/lưu PDF.
- Sự cố có người phụ trách, hạn xử lý, nguyên nhân gốc, biện pháp khắc phục và ảnh minh chứng sau xử lý.

## Chạy local

1. Tạo database MySQL và nạp schema local.
2. Sao chép BE/.env.example thành BE/.env, sau đó điền thông tin database và JWT secret.
3. Sao chép FE/.env.example thành FE/.env.local.
4. Cài dependency và chạy:

   - Backend: cd BE, npm install, npm start
   - Frontend: cd FE, npm install, npm run dev

CORS_ORIGINS nhận danh sách origin phân tách bằng dấu phẩy, ví dụ:

    CORS_ORIGINS=http://localhost:5173,https://app.example.com

## Kiểm tra

- Backend: npm test
- Frontend lint: npm run lint
- Frontend build: npm run build

## Quy tắc bảo mật quan trọng

- Đăng ký công khai luôn tạo tài khoản engineer; quyền manager/admin phải được cấp qua luồng quản trị.
- Tài khoản bị khóa sẽ mất quyền gọi API và bị ngắt Socket đang hoạt động.
- Manager chỉ được thao tác trên dự án có manager_id của mình.
- File thoại được giới hạn dung lượng, tần suất, loại MIME và chữ ký nội dung.
- Không commit .env, file upload hoặc database dump có dữ liệu người dùng.

File smart_construction_db.sql được giữ local và bị Git bỏ qua vì đang chứa dữ liệu mẫu. Trước khi triển khai đa môi trường, nên chuyển phần schema sang migration và seed đã ẩn danh.
