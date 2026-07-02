# Worklog — Voice-Driven Construction Management System

## 1. Thông tin

| Trường | Nội dung |
|---|---|
| Tên đề tài | Voice-Driven Construction Management System — VDCMS |
| Nhóm/Lớp | `[BỔ SUNG]` |
| Giảng viên | `[BỔ SUNG]` |
| Thành viên | Bùi Thanh Phước theo Git author; bổ sung các thành viên khác nếu có |
| Repository | `[BỔ SUNG URL GITHUB]` |
| Thời gian | 15/06/2026 đến nay |

## 2. Nguyên tắc ghi nhận

- Các dòng bên dưới được dựng từ commit Git và file trong repository.
- Không tự gán người thực hiện hoặc số giờ cho thành viên không có bằng chứng.
- Nhóm cần bổ sung **người thực hiện**, **thời lượng thực tế** và các ngày làm việc chưa commit.
- Mỗi ngày nên kèm commit, pull request, ảnh hoặc file đầu ra để giảng viên kiểm tra được.

## 3. Nhật ký đã xác minh

| Ngày | Người thực hiện | Công việc trong ngày | Kết quả/đầu ra | Bằng chứng | Giờ thực tế | Trạng thái |
|---|---|---|---|---|---:|---|
| 15/06/2026 | Bùi Thanh Phước | Khởi tạo Backend; xây cấu trúc router/controller; kết nối MySQL; làm API đăng ký, đăng nhập và xác thực | Backend Express/MySQL chạy được, có API Auth ban đầu | Commit `b03fa8d` | `[BỔ SUNG]` | Hoàn thành |
| 17/06/2026 | Bùi Thanh Phước | Xây bộ khung Frontend; màn hình đăng nhập/đăng ký; layout riêng theo role | React/Vite có Guest/Admin/Manager/Engineer layout | Commit `1c0436a` | `[BỔ SUNG]` | Hoàn thành |
| 17/06/2026 | Bùi Thanh Phước | Hoàn thiện module giao việc và báo cáo tiến độ ở Backend/Frontend | Admin/Manager giao việc; Engineer xem task và gửi report | Commit `cb489ef` | `[BỔ SUNG]` | Hoàn thành |
| 01/07/2026 | Bùi Thanh Phước và thành viên liên quan `[XÁC NHẬN]` | Hoàn thiện giao diện và nghiệp vụ: dashboard theo role, dự án/workspace, task/checklist/timeline, report review, yêu cầu gia hạn/vướng mắc, sự cố, tài liệu, tài khoản/cài đặt, xóa mềm user, assignment cho Manager | 154 file thay đổi; chức năng chính của hệ thống hoàn chỉnh | Commit `fc134d2` | `[BỔ SUNG]` | Hoàn thành |
| 01/07/2026 | Bùi Thanh Phước và thành viên liên quan `[XÁC NHẬN]` | Bổ sung chat Socket.IO, gửi text/voice/file/ảnh, notification realtime, Admin monitor/lock chat | Chat hai chiều, media upload, notification và phân quyền realtime | Commit `fc134d2` | `[BỔ SUNG]` | Hoàn thành |
| 01/07/2026 | Bùi Thanh Phước và thành viên liên quan `[XÁC NHẬN]` | Bổ sung DataTable, tìm kiếm/sort/phân trang, dark/light, Việt/Anh, route 403, PWA và responsive | Trải nghiệm dùng chung nhất quán cho toàn hệ thống | Commit `fc134d2` | `[BỔ SUNG]` | Hoàn thành |
| 01/07/2026 | Bùi Thanh Phước và thành viên liên quan `[XÁC NHẬN]` | Tăng cường bảo mật: validation Joi, Helmet/CORS/rate limit, bcrypt/JWT, giới hạn và kiểm tra chữ ký file, kiểm tra quyền theo DB | Có test validator và lớp bảo vệ API/upload | Commit `fc134d2` | `[BỔ SUNG]` | Hoàn thành |
| 02/07/2026 | Bùi Thanh Phước | Tích hợp AWS vào ứng dụng: S3, SES, Transcribe, SQS worker, RDS TLS, Cognito dual-auth, CloudFront, EC2/ALB, WAF và VPC | Backend sẵn sàng AWS; media chat S3 private; Transcribe bất đồng bộ | Commit `ee68bd3` | `[BỔ SUNG]` | Hoàn thành mã nguồn |
| 02/07/2026 | Bùi Thanh Phước | Viết Infrastructure as Code và script triển khai | CloudFormation production và `infra/deploy-aws.ps1` | Commit `ee68bd3` | `[BỔ SUNG]` | Hoàn thành mã nguồn |
| 02/07/2026 | `[BỔ SUNG THÀNH VIÊN]` | Vẽ kiến trúc AWS, đánh số 1–13; lập hướng dẫn draw.io và danh sách icon AWS | File `.drawio`, `.svg`, hướng dẫn và map icon | `docs/architecture/*` | `[BỔ SUNG]` | Hoàn thành |
| 02/07/2026 | `[BỔ SUNG THÀNH VIÊN]` | Lập checklist test toàn hệ thống và tài liệu thư viện | 224 test case; tài liệu dependency FE/BE/AWS | `docs/TEST-CHECKLIST.md`, `docs/THU-VIEN-SU-DUNG.md` | `[BỔ SUNG]` | Hoàn thành |
| 02/07/2026 | `[BỔ SUNG THÀNH VIÊN]` | Chuẩn bị Worklog, Proposal, Project và Workshop AWS | Bộ hồ sơ trong `docs/submission` | Các file tài liệu hiện tại | `[BỔ SUNG]` | Hoàn thành bản nháp |

## 4. Công việc còn lại trước khi nộp

| Đã xong | Công việc | Người phụ trách | Hạn | Bằng chứng cần có |
|---|---|---|---|---|
| [ ] | Xác nhận tên nhóm, lớp, giảng viên và danh sách thành viên | `[BỔ SUNG]` | `[BỔ SUNG]` | Trang bìa hồ sơ |
| [ ] | Bổ sung số giờ/người thực hiện thật vào Worklog | `[BỔ SUNG]` | `[BỔ SUNG]` | Nhật ký nhóm |
| [ ] | Tạo AWS Budget/cảnh báo chi phí | `[BỔ SUNG]` | Trước deploy | Ảnh AWS Budgets |
| [ ] | Deploy CloudFormation lên AWS account của nhóm | `[BỔ SUNG]` | `[BỔ SUNG]` | Stack `CREATE_COMPLETE` |
| [ ] | Build và upload frontend lên S3/CloudFront | `[BỔ SUNG]` | `[BỔ SUNG]` | CloudFront URL mở được |
| [ ] | Chạy smoke test và role test trên URL AWS | `[BỔ SUNG]` | `[BỔ SUNG]` | Test checklist có chữ ký/ngày |
| [ ] | Chụp và che thông tin nhạy cảm cho Workshop | `[BỔ SUNG]` | `[BỔ SUNG]` | Bộ ảnh trong `images/workshop` |
| [ ] | Điền URL production/stack/region vào PROJECT.md | `[BỔ SUNG]` | `[BỔ SUNG]` | PROJECT.md hoàn chỉnh |
| [ ] | Quay video demo hoặc chuẩn bị kịch bản bảo vệ | `[BỔ SUNG]` | `[BỔ SUNG]` | Link video/kịch bản |

## 5. Mẫu ghi thêm mỗi ngày

Sao chép dòng sau vào bảng khi có ngày làm mới:

```text
| DD/MM/YYYY | Họ tên | Việc đã làm cụ thể | File/chức năng tạo ra | Commit/ảnh/link | Số giờ thật | Hoàn thành/Đang làm/Bị chặn |
```

Một dòng tốt cần trả lời được: **ai làm, ngày nào, làm gì, tạo ra kết quả gì và kiểm chứng ở đâu**.

