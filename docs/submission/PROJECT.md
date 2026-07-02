# Project — VDCMS trên AWS

Tài liệu này là trang bàn giao sản phẩm sau khi triển khai. Chỉ thay các ô `[BỔ SUNG SAU DEPLOY]` bằng dữ liệu thật; không ghi URL hoặc kết quả giả.

## 1. Thông tin sản phẩm

| Trường | Giá trị |
|---|---|
| Tên hệ thống | Voice-Driven Construction Management System (VDCMS) |
| Production URL | `[BỔ SUNG SAU DEPLOY — CloudFront ApplicationUrl]` |
| AWS Region | `ap-southeast-1` hoặc region thực tế `[XÁC NHẬN]` |
| CloudFormation Stack | `vdcms-prod` hoặc tên thực tế `[XÁC NHẬN]` |
| Repository URL | `[BỔ SUNG GITHUB URL]` |
| Branch/Commit triển khai | `[BỔ SUNG COMMIT SHA]` |
| Ngày triển khai | `[BỔ SUNG]` |
| Người triển khai | `[BỔ SUNG]` |
| Trạng thái hiện tại | **Chưa provision AWS thật** |

## 2. Thành phần bàn giao

| Thành phần | Vị trí/trạng thái |
|---|---|
| Frontend React/Vite | `FE/` — build thành công local |
| Backend Express/Socket.IO | `BE/` — test thành công local |
| Database schema/migration | `BE/config/initCoreSchema.js`, `initApplication.js`, `initChat.js` |
| Transcribe worker | `BE/workers/transcriptionWorker.js` |
| CloudFormation | `infra/cloudformation/vdcms-production.yml` |
| Script deploy | `infra/deploy-aws.ps1` |
| Kiến trúc | `docs/architecture/vdcms-aws-architecture.drawio` |
| Test checklist | `docs/TEST-CHECKLIST.md` |
| Workshop | `docs/submission/WORKSHOP-AWS.md` |

## 3. Kiến trúc triển khai

![Kiến trúc AWS VDCMS](../architecture/vdcms-aws-architecture.svg)

Luồng chính:

1. Người dùng truy cập CloudFront bằng HTTPS.
2. CloudFront đọc frontend React từ S3 private qua OAC.
3. API/Socket.IO đi qua WAF và ALB đến EC2 private.
4. EC2 truy cập RDS MySQL bằng TLS và lưu file vào S3 Data private.
5. Audio Transcribe được đưa vào SQS, worker xử lý và lưu transcript vào RDS.
6. Cognito hỗ trợ JWT chuyển tiếp; SES gửi email; IAM/Secrets/SSM/CloudWatch hỗ trợ bảo mật và vận hành.

## 4. Tài khoản demo

Không ghi mật khẩu thật vào repository. Gửi mật khẩu cho giảng viên bằng kênh riêng hoặc tạo tài khoản demo tạm.

| Vai trò | Username/email | Phạm vi demo | Mật khẩu |
|---|---|---|---|
| Admin | `[BỔ SUNG]` | Toàn hệ thống | Gửi riêng |
| Manager | `[BỔ SUNG]` | Project demo | Gửi riêng |
| Engineer | `[BỔ SUNG]` | Task demo | Gửi riêng |

## 5. Kịch bản demo đề xuất

1. Guest xem trang giới thiệu, đổi ngôn ngữ/theme và đăng nhập.
2. Admin tạo/kiểm tra dự án, giao assignment cho Manager và quản lý user.
3. Manager mở workspace dự án, giao task có checklist cho Engineer.
4. Engineer nhận notification, mở task, tick checklist và gửi cập nhật.
5. Engineer ghi âm/chuyển thành văn bản, gửi report kèm file.
6. Manager duyệt report và xem KPI/lịch deadline.
7. Engineer báo sự cố có ảnh/tọa độ; Manager cập nhật xử lý.
8. Hai user chat text/voice/image; Admin mở monitor và thử khóa chat.
9. Admin xem AWS Services/health và activity log.
10. Admin xóa mềm một user demo rồi khôi phục để chứng minh dữ liệu lịch sử còn giữ.

## 6. Tiêu chí xác nhận deployment thành công

| Đã đạt | Hạng mục | Kết quả cần có |
|---|---|---|
| [ ] | CloudFormation | Stack `CREATE_COMPLETE` hoặc `UPDATE_COMPLETE` |
| [ ] | CloudFront | Production URL trả trang chủ HTTPS |
| [ ] | SPA routing | Refresh `/admin/dashboard`, `/manager/projects`, `/engineer/tasks` không lỗi 403 S3 |
| [ ] | ALB | Target healthy qua `/health` |
| [ ] | EC2 | API và worker ở trạng thái active trong systemd |
| [ ] | RDS | Backend kết nối TLS; RDS không public |
| [ ] | S3 | Frontend/Data bucket private; Block Public Access bật |
| [ ] | Chat | Socket.IO, text và media hoạt động qua CloudFront |
| [ ] | Transcribe | Job qua SQS hoàn tất và trả transcript |
| [ ] | SES | Email xác minh/reset gửi được hoặc ghi rõ sandbox |
| [ ] | Cognito | Token hợp lệ được backend xác minh trong test chuyển tiếp |
| [ ] | WAF | Request bình thường qua; rate/managed rule có metric |
| [ ] | Role/403 | Ba tài khoản demo chỉ vào đúng vùng của mình |
| [ ] | Test | Critical/High trong checklist đạt |

## 7. Lệnh kiểm tra sau deploy

```powershell
# URL lấy từ CloudFormation outputs
$ApplicationUrl = 'https://[BỔ-SUNG].cloudfront.net'
$BackendLoadBalancerDns = '[BỔ-SUNG].elb.amazonaws.com'

Invoke-WebRequest "$ApplicationUrl/" -UseBasicParsing
Invoke-RestMethod "http://$BackendLoadBalancerDns/health"
```

Kiểm tra source trước khi deploy:

```powershell
cd BE
npm ci
npm test

cd ..\FE
npm ci
npm run lint
npm run build
```

## 8. Ảnh sản phẩm bắt buộc

Sau khi triển khai, chèn ảnh thật từ `docs/submission/images/project/`:

| Ảnh | Nội dung |
|---|---|
| `project-01-home.png` | Trang chủ trên CloudFront URL |
| `project-02-admin-dashboard.png` | Dashboard Admin |
| `project-03-manager-workspace.png` | Workspace dự án Manager |
| `project-04-engineer-task.png` | Task/checklist Engineer |
| `project-05-voice-report.png` | Voice-to-text và báo cáo |
| `project-06-chat.png` | Chat voice/file/image |
| `project-07-incident.png` | Sự cố và minh chứng |
| `project-08-aws-health.png` | Trang AWS Services của Admin |

### Vị trí chèn ảnh

> `[CHÈN ẢNH project-01-home.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-02-admin-dashboard.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-03-manager-workspace.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-04-engineer-task.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-05-voice-report.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-06-chat.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-07-incident.png SAU KHI DEPLOY]`

> `[CHÈN ẢNH project-08-aws-health.png SAU KHI DEPLOY]`

## 9. Hạn chế đã biết

- Auto Scaling giới hạn một EC2 đến khi Socket.IO có Redis adapter dùng chung.
- Cognito ở chế độ dual-auth, chưa thay hoàn toàn form đăng nhập hiện tại.
- Ảnh sự cố và file report cũ còn local storage; document và media chat mới đã hỗ trợ S3.
- Bundle frontend còn cảnh báo lớn hơn 500 kB; nên code-split trong phiên bản sau.
- NAT Gateway, ALB, RDS và WAF phát sinh chi phí ngay cả khi ít traffic.

## 10. Kết luận nghiệm thu

```text
Ngày nghiệm thu: ______________________
Production URL: _______________________
Commit SHA: ___________________________
Người kiểm thử: _______________________
Kết quả: Đạt / Chưa đạt
Ghi chú: ______________________________
```
