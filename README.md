# Voice-Driven Construction Management System

Hệ thống quản lý công trình gồm ba vai trò:

- **Admin:** quản trị người dùng, toàn bộ dự án, báo cáo và giám sát chat.
- **Manager:** quản lý dự án của chính mình, giao việc và xem báo cáo thuộc dự án đó.
- **Engineer:** xem công việc được giao và gửi báo cáo tiến độ.

Ứng dụng gồm frontend React/Vite trong thư mục FE, backend Express/MySQL/Socket.IO trong BE.

## Tích hợp Amazon Web Services

- **Amazon S3:** tài liệu dự án mới được lưu private với mã hóa SSE-S3; tải xuống vẫn đi qua API kiểm tra quyền. Khi chưa cấu hình bucket, hệ thống dùng ổ đĩa local.
- **Amazon SES:** ưu tiên gửi email xác thực và khôi phục mật khẩu qua SES; nếu chưa cấu hình sẽ dùng Resend hoặc email outbox.
- **Amazon Transcribe:** Engineer có thể ghi âm báo cáo và chuyển tiếng Việt/Anh thành văn bản qua backend; Web Speech API vẫn là phương án dự phòng.
- Admin xem cấu hình và kiểm tra kết nối tại `/admin/aws`. Không API nào trả access key hoặc secret ra frontend.

Thiết lập các biến `AWS_*` trong `BE/.env` theo [BE/.env.example](BE/.env.example). Policy IAM của backend tham khảo tại [docs/aws-iam-policy.example.json](docs/aws-iam-policy.example.json). Nếu dùng `AWS_TRANSCRIBE_ROLE_ARN`, tạo data role với [trust policy](docs/aws-transcribe-role-trust.example.json) và [S3 read policy](docs/aws-transcribe-data-policy.example.json). Bucket S3 và Transcribe phải đặt cùng region. Với SES sandbox, địa chỉ gửi/nhận phải được xác thực trước khi demo.

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
